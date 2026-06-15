import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { sequelize, Order, OrderItem, Payment, RestaurantTable } from '../../../models';

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
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
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
    const total = taxableAmount + tax;

    // 2. Generate Order Number
    const orderCount = await Order.count({ where: { store_id } });
    const orderNumber = `ORD-${String(orderCount + 1).padStart(5, '0')}`;

    // 3. Create Order
    const order = await Order.create(
      {
        organization_id,
        store_id,
        table_id: tableId || null,
        cashier_id,
        order_number: orderNumber,
        order_type: orderType,
        status: orderType === 'dine_in' ? 'preparing' : 'ready', // Immediately prep for kitchen/pickup
        subtotal,
        tax_amount: tax,
        discount_amount: totalDiscount,
        total_amount: total,
      },
      { transaction }
    );

    // 4. Create Order Items
    const orderItemsPayload = items.map((item: any) => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      variant_id: item.variant?.id || null,
      addons: item.addons || [],
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      notes: item.notes || null,
    }));

    await OrderItem.bulkCreate(orderItemsPayload, { transaction });

    // 5. Create Payment
    await Payment.create(
      {
        order_id: order.id,
        payment_method: paymentMethod,
        amount: total,
        transaction_status: 'success',
        transaction_reference: `POS-TX-${Date.now()}`,
      },
      { transaction }
    );

    // 6. Update Table Status if Dine-In
    if (orderType === 'dine_in' && tableId) {
      await RestaurantTable.update(
        { status: 'occupied' },
        { where: { id: tableId }, transaction }
      );
    }

    await transaction.commit();

    return NextResponse.json({
      success: true,
      message: 'Checkout processed successfully!',
      order: {
        id: order.id,
        orderNumber: order.order_number,
        total: order.total_amount,
        status: order.status,
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
