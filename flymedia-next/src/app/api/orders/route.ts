import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { sequelize, Order, OrderItem, Payment, RestaurantTable, MenuItem, Customer } from '../../../models';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;

    const heldOrders = await Order.findAll({
      where: {
        store_id,
        status: 'on_hold',
      },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: MenuItem,
              attributes: ['name', 'price'],
            }
          ]
        },
        {
          model: RestaurantTable,
          attributes: ['table_number'],
        },
        {
          model: Customer,
          as: 'customer',
        }
      ],
      order: [['createdAt', 'DESC']],
    });

    return NextResponse.json({ success: true, heldOrders });
  } catch (error: any) {
    console.error('Fetch Held Orders Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch held orders.', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).organization_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organization_id, store_id, id: cashier_id } = session.user as any;
  const transaction = await sequelize.transaction();

  try {
    const body = await request.json();
    const {
      items,
      orderType,
      tableId,
      paymentMethod,
      discountRate = 0,
      discountAmount = 0,
      taxRate = 8.25,
      status = 'completed',
      heldOrderId,
      notes,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      cartRef,
      readyBy,
      stripePaymentIntentId,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Resolve Customer Profile
    let customerId = null;
    if (customerPhone) {
      const [customerObj] = await Customer.findOrCreate({
        where: { phone: customerPhone },
        defaults: {
          organization_id,
          name: customerName || 'POS Guest Customer',
          email: customerEmail || null,
        },
        transaction,
      });
      customerId = customerObj.id;
    } else if (customerName) {
      const customerObj = await Customer.create({
        organization_id,
        name: customerName,
        email: customerEmail || null,
      }, { transaction });
      customerId = customerObj.id;
    }

    // 1. Calculate Prices
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * item.quantity;
    }

    const percentDiscountVal = (subtotal * discountRate) / 100;
    const totalDiscount = percentDiscountVal + discountAmount;
    const taxableAmount = Math.max(0, subtotal - totalDiscount);
    const tax = (taxableAmount * taxRate) / 100;
    
    // Add delivery surcharge if applicable
    const deliverySurcharge = orderType === 'delivery' ? 5.00 : 0.00;
    const total = taxableAmount + tax + deliverySurcharge;

    let order;

    if (heldOrderId) {
      // Complete an existing held order
      order = await Order.findOne({ where: { id: heldOrderId, store_id } });
      if (!order) {
        return NextResponse.json({ error: 'Held order not found' }, { status: 404 });
      }

      // Update Order details
      await order.update(
        {
          table_id: tableId || null,
          cashier_id,
          customer_id: customerId,
          order_type: orderType,
          status: orderType === 'dine_in' ? 'preparing' : 'ready',
          subtotal,
          tax_amount: tax,
          discount_amount: totalDiscount,
          total_amount: total,
        },
        { transaction }
      );

      // Clear old order items
      await OrderItem.destroy({ where: { order_id: order.id }, transaction });
    } else {
      // 2. Generate Order Number
      const orderCount = await Order.count({ where: { store_id } });
      const orderNumber = `ORD-${String(orderCount + 1).padStart(5, '0')}`;

      // 3. Create Order
      order = await Order.create(
        {
          organization_id,
          store_id,
          table_id: tableId || null,
          cashier_id,
          customer_id: customerId,
          order_number: orderNumber,
          order_type: orderType,
          status: status === 'on_hold' ? 'on_hold' : (orderType === 'dine_in' ? 'preparing' : 'ready'),
          subtotal,
          tax_amount: tax,
          discount_amount: totalDiscount,
          total_amount: total,
        },
        { transaction }
      );
    }

    // Consolidate delivery details, cart refs, and ready by times into notes
    let finalNotes = notes || '';
    if (orderType === 'delivery' && deliveryAddress) {
      finalNotes = `Delivery Address: ${deliveryAddress}${finalNotes ? ` | Notes: ${finalNotes}` : ''}`;
    }
    if (readyBy) {
      finalNotes = `Ready By: ${readyBy}${finalNotes ? ` | ${finalNotes}` : ''}`;
    }
    if (orderType !== 'dine_in' && cartRef) {
      finalNotes = `Cart Ref: ${cartRef}${finalNotes ? ` | ${finalNotes}` : ''}`;
    }

    // 4. Create Order Items
    const orderItemsPayload = items.map((item: any) => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      variant_id: item.variant?.id || null,
      addons: item.addons || [],
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      notes: item.notes || finalNotes || null,
    }));

    await OrderItem.bulkCreate(orderItemsPayload, { transaction });

    // 5. Create Payment & Update Table Status (Only if checkout/completed, not on hold)
    if (status !== 'on_hold') {
      await Payment.create(
        {
          order_id: order.id,
          payment_method: paymentMethod,
          amount: total,
          transaction_status: 'success',
          transaction_reference: stripePaymentIntentId || `POS-TX-${Date.now()}`,
        },
        { transaction }
      );

      if (orderType === 'dine_in' && tableId) {
        await RestaurantTable.update(
          { status: 'available' },
          { where: { id: tableId }, transaction }
        );
      }
    } else {
      // If dine_in table is selected and order is on_hold, ensure table remains occupied or reserved
      if (orderType === 'dine_in' && tableId) {
        const tableObj = await RestaurantTable.findByPk(tableId);
        if (tableObj && tableObj.status === 'available') {
          await RestaurantTable.update(
            { status: 'occupied' },
            { where: { id: tableId }, transaction }
          );
        }
      }
    }

    await transaction.commit();

    return NextResponse.json({
      success: true,
      message: status === 'on_hold' ? 'Order held successfully!' : 'Checkout processed successfully!',
      order: {
        id: order.id,
        orderNumber: order.order_number,
        total: order.total_amount,
        subtotal: order.subtotal,
        tax: order.tax_amount,
        discount: order.discount_amount,
        taxRate: taxRate,
        status: order.status,
        Items: items.map((item: any) => ({
          id: item.id || item.menuItemId,
          quantity: item.quantity,
          price: item.price,
          unit_price: item.price,
          MenuItem: {
            name: item.name
          },
          addons: item.addons || [],
          notes: item.notes || null
        }))
      },
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error('Checkout Error:', error);
    return NextResponse.json(
      { success: false, message: 'Checkout transaction failed.', error: error.message },
      { status: 500 }
    );
  }
}
