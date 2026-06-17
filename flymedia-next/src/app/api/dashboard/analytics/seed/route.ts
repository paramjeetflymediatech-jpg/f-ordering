import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import {
  sequelize,
  Order,
  Payment,
  Reservation,
  Customer,
  RestaurantTable,
} from '../../../../../models';

export async function POST() {
  const transaction = await sequelize.transaction();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id, organization_id } = session.user as any;

    // 1. Fetch tables, or create them if none exist
    let tables = await RestaurantTable.findAll({ where: { store_id }, transaction });
    if (tables.length === 0) {
      const tableData = [
        { organization_id, store_id, table_number: 'Table 1', seating_capacity: 2, status: 'available', qr_code_token: 't1_token_' + Date.now() },
        { organization_id, store_id, table_number: 'Table 2', seating_capacity: 4, status: 'available', qr_code_token: 't2_token_' + Date.now() },
        { organization_id, store_id, table_number: 'Table 3', seating_capacity: 4, status: 'available', qr_code_token: 't3_token_' + Date.now() },
        { organization_id, store_id, table_number: 'Table 4', seating_capacity: 6, status: 'available', qr_code_token: 't4_token_' + Date.now() },
        { organization_id, store_id, table_number: 'Table 5', seating_capacity: 8, status: 'available', qr_code_token: 't5_token_' + Date.now() },
      ];
      tables = await RestaurantTable.bulkCreate(tableData, { transaction, returning: true });
    }

    // 2. Clear old demo data for clean seeding
    const orderIds = (await Order.findAll({ where: { store_id }, attributes: ['id'], transaction })).map((o) => o.id);
    if (orderIds.length > 0) {
      await Payment.destroy({ where: { order_id: orderIds }, transaction });
      await Order.destroy({ where: { store_id }, transaction });
    }
    await Reservation.destroy({ where: { store_id }, transaction });

    // 3. Create Sample Customers
    const customerNames = [
      { name: 'John Doe', phone: '+1 555-9001', email: 'john@example.com' },
      { name: 'Alice Smith', phone: '+1 555-9002', email: 'alice@example.com' },
      { name: 'Bob Johnson', phone: '+1 555-9003', email: 'bob@example.com' },
      { name: 'Charlie Brown', phone: '+1 555-9004', email: 'charlie@example.com' },
      { name: 'David Miller', phone: '+1 555-9005', email: 'david@example.com' },
      { name: 'Emma Davis', phone: '+1 555-9006', email: 'emma@example.com' },
      { name: 'Frank Wilson', phone: '+1 555-9007', email: 'frank@example.com' },
      { name: 'Grace Lee', phone: '+1 555-9008', email: 'grace@example.com' },
      { name: 'Henry Taylor', phone: '+1 555-9009', email: 'henry@example.com' },
      { name: 'Isabella Moore', phone: '+1 555-9010', email: 'isabella@example.com' },
    ];

    const customers: any[] = [];
    for (const c of customerNames) {
      const [customer] = await Customer.findOrCreate({
        where: { phone: c.phone },
        defaults: {
          organization_id,
          name: c.name,
          email: c.email,
          loyalty_points: Math.floor(Math.random() * 150),
        },
        transaction,
      });
      customers.push(customer);
    }

    // 4. Generate Historical Orders and Payments
    const now = new Date();
    const paymentMethods = ['cash', 'card', 'upi', 'wallet'];
    const orderTypes = ['dine_in', 'takeaway', 'delivery', 'qr_order'];

    for (let i = 0; i < 80; i++) {
      const orderDate = new Date();
      // Distribute randomly across the last 18 months
      const randomDaysAgo = Math.floor(Math.random() * 500);
      orderDate.setDate(now.getDate() - randomDaysAgo);
      orderDate.setHours(Math.floor(Math.random() * 12) + 10, Math.floor(Math.random() * 60));

      const subtotal = Math.floor(Math.random() * 80) + 15;
      const tax = Math.round(subtotal * 0.0825 * 100) / 100;
      const discount = Math.random() > 0.8 ? Math.floor(Math.random() * 10) : 0;
      const total = subtotal + tax - discount;

      const randomCust = customers[Math.floor(Math.random() * customers.length)];
      const randomTable = tables[Math.floor(Math.random() * tables.length)];
      const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)];
      const orderNumber = `ORD-${String(i + 1).padStart(5, '0')}`;

      const order = await Order.create(
        {
          organization_id,
          store_id,
          table_id: orderType === 'dine_in' ? randomTable.id : null,
          cashier_id: null,
          customer_id: randomCust.id,
          order_number: orderNumber,
          order_type: orderType,
          status: 'completed',
          subtotal,
          tax_amount: tax,
          discount_amount: discount,
          total_amount: total,
          createdAt: orderDate,
          updatedAt: orderDate,
        },
        { transaction }
      );

      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      await Payment.create(
        {
          order_id: order.id,
          payment_method: paymentMethod,
          amount: total,
          transaction_status: 'success',
          transaction_reference: `SEED-TX-${Date.now()}-${i}`,
          createdAt: orderDate,
          updatedAt: orderDate,
        },
        { transaction }
      );
    }

    // 5. Generate Table Reservations
    const reservationStatuses = ['confirmed', 'seated', 'cancelled', 'pending'];
    for (let i = 0; i < 20; i++) {
      const resDate = new Date();
      const offsetDays = Math.floor(Math.random() * 44) - 30; // -30 to +14 days
      resDate.setDate(now.getDate() + offsetDays);
      resDate.setHours(12 + Math.floor(Math.random() * 8), 0, 0, 0);

      const randomCust = customers[Math.floor(Math.random() * customers.length)];
      const randomTable = tables[Math.floor(Math.random() * tables.length)];

      let resStatus = reservationStatuses[Math.floor(Math.random() * reservationStatuses.length)];
      if (resDate < now && resStatus === 'pending') {
        resStatus = 'seated';
      }

      await Reservation.create(
        {
          store_id,
          customer_id: randomCust.id,
          table_id: randomTable.id,
          reservation_time: resDate,
          guest_count: Math.floor(Math.random() * 6) + 2,
          notes: Math.random() > 0.6 ? 'Window table preferred, birthday celebration.' : null,
          status: resStatus,
          createdAt: new Date(resDate.getTime() - 24 * 60 * 60 * 1000),
          updatedAt: now,
        },
        { transaction }
      );
    }

    await transaction.commit();

    return NextResponse.json({
      success: true,
      message: 'Demo analytics data seeded successfully!',
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error('Seeding Analytics Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
