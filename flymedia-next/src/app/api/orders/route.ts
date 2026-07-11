import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { Op } from 'sequelize';
import { sequelize, Order, OrderItem, Payment, RestaurantTable, MenuItem, Customer, Reservation } from '../../../models';

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
        status: {
          [Op.in]: ['on_hold', 'pending', 'preparing', 'ready'],
        },
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
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'transaction_status'],
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
      await transaction.rollback();
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Validate table is not reserved for dine-in orders
    if ((orderType === 'dine_in' || orderType === 'qr_order') && tableId) {
      const activeRes = await Reservation.findOne({
        where: {
          table_id: tableId,
          status: { [Op.in]: ['pending', 'confirmed'] },
        },
        include: [{ model: Customer, as: 'customer', attributes: ['name'] }],
        transaction,
      });

      if (activeRes) {
        await transaction.rollback();
        const resTime = new Date((activeRes as any).reservation_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        const guestName = (activeRes as any).customer?.name || 'a guest';
        return NextResponse.json({
          error: `Table is reserved for ${guestName} at ${resTime}. Please seat the reservation in the dashboard first.`,
        }, { status: 409 });
      }
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
          status: status === 'on_hold' ? 'on_hold' : status,
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
          status: status === 'on_hold' ? 'on_hold' : status,
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

      if ((orderType === 'dine_in' || orderType === 'qr_order') && tableId) {
        const activeRes = await Reservation.findOne({
          where: {
            table_id: tableId,
            status: { [Op.in]: ['pending', 'confirmed'] },
          },
          transaction,
        });
        const targetStatus = activeRes ? 'reserved' : 'available';

        await RestaurantTable.update(
          { status: targetStatus },
          { where: { id: tableId }, transaction }
        );
      }
    } else {
      // If dine_in table is selected and order is on_hold, ensure table remains occupied or reserved
      if ((orderType === 'dine_in' || orderType === 'qr_order') && tableId) {
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

    try {
      const io = (request as any).io || (global as any).__socketIo;
      if (io) {
        if (tableId) {
          io.to(store_id).emit('table_status_update', { tableId });
        }
        // Emit new_order event
        io.to(store_id).emit('new_order', { storeId: store_id, order });
      }
    } catch (_) {}

    // Dispatch print job
    try {
      const { Queue } = require('bullmq');
      const printQueue = new Queue('print-jobs', {
        connection: {
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
        }
      });
      await printQueue.add('print-ticket', {
        orderId: order.id,
        storeId: store_id,
      });
      console.log(`[POS API] Print Job dispatched to BullMQ for order: ${order.order_number}`);
    } catch (err) {
      console.error('[POS API] Failed to enqueue print job:', err);
    }

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

export async function DELETE(request: Request) {
  const transaction = await sequelize.transaction();

  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      await transaction.rollback();
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      await transaction.rollback();
      return NextResponse.json({ error: 'Order IDs are required' }, { status: 400 });
    }

    const ids = idsParam.split(',');

    const orders = await Order.findAll({
      where: {
        id: { [Op.in]: ids },
        store_id,
      },
      transaction,
    });

    const affectedTableIds = Array.from(
      new Set(orders.map((o: any) => o.table_id).filter(Boolean))
    ) as string[];

    await Payment.destroy({
      where: {
        order_id: { [Op.in]: ids },
      },
      transaction,
    });

    await OrderItem.destroy({
      where: {
        order_id: { [Op.in]: ids },
      },
      transaction,
    });

    const deletedCount = await Order.destroy({
      where: {
        id: { [Op.in]: ids },
        store_id,
      },
      transaction,
    });

    for (const tableId of affectedTableIds) {
      const activeOrder = await Order.findOne({
        where: {
          table_id: tableId,
          status: { [Op.in]: ['on_hold', 'pending', 'preparing', 'accepted'] },
        },
        transaction,
      });

      if (!activeOrder) {
        const activeRes = await Reservation.findOne({
          where: {
            table_id: tableId,
            status: { [Op.in]: ['pending', 'confirmed', 'seated'] },
          },
          transaction,
        });
        const targetStatus = activeRes ? 'reserved' : 'available';
        await RestaurantTable.update(
          { status: targetStatus },
          { where: { id: tableId }, transaction }
        );
      }
    }

    await transaction.commit();

    try {
      const io = (request as any).io || (global as any).__socketIo;
      if (io && affectedTableIds.length > 0) {
        for (const tableId of affectedTableIds) {
          io.to(store_id).emit('table_status_update', { tableId });
        }
      }
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: `${deletedCount} orders deleted successfully.`,
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error('Delete Orders Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

