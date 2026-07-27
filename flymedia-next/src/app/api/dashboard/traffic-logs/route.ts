import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { Order, Reservation, Customer, RestaurantTable, OrderItem, MenuItem, Payment } from '../../../../models';
import { Op } from 'sequelize';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).store_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;

    // 1. Fetch Orders with IP tracking data
    const orders = await Order.findAll({
      where: {
        store_id,
        customer_ip: { [Op.ne]: null },
      },
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'phone', 'email'] },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: MenuItem, attributes: ['name', 'price'] }]
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['payment_method', 'amount', 'transaction_status', 'transaction_reference']
        }
      ],
      order: [['createdAt', 'DESC']],
    });

    // 2. Fetch Reservations with IP tracking data
    const reservations = await Reservation.findAll({
      where: {
        store_id,
        customer_ip: { [Op.ne]: null },
      },
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'phone', 'email'] },
        { model: RestaurantTable, attributes: ['table_number'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    // 3. Map both to a unified log structure
    const logs: any[] = [];

    for (const o of orders) {
      logs.push({
        id: o.id,
        type: 'order',
        reference: o.order_number,
        customerName: o.customer?.name || 'Guest Customer',
        customerPhone: o.customer?.phone || 'N/A',
        customerEmail: o.customer?.email || 'N/A',
        ipAddress: o.customer_ip,
        device: o.customer_device || 'Unknown',
        address: o.customer_address || 'Unknown Location',
        geo: o.customer_geo || null,
        timestamp: o.createdAt,
        status: o.status,
        subtotal: parseFloat(o.subtotal as any),
        tax: parseFloat(o.tax_amount as any),
        discount: parseFloat(o.discount_amount as any),
        total: parseFloat(o.total_amount as any),
        items: (o as any).items || [],
        payment: o.payments?.[0] || null,
      });
    }

    for (const r of reservations) {
      logs.push({
        id: r.id,
        type: 'booking',
        reference: `RES-${r.table_id ? (r as any).RestaurantTable?.table_number || '' : 'HOLD'}-${new Date(r.reservation_time).getHours()}`,
        customerName: r.customer?.name || 'Guest Customer',
        customerPhone: r.customer?.phone || 'N/A',
        customerEmail: r.customer?.email || 'N/A',
        ipAddress: r.customer_ip,
        device: r.customer_device || 'Unknown',
        address: r.customer_address || 'Unknown Location',
        geo: r.customer_geo || null,
        timestamp: r.createdAt,
        status: r.status,
        reservationTime: r.reservation_time,
        guestCount: r.guest_count,
        tableNumber: (r as any).RestaurantTable?.table_number || 'Unassigned',
        notes: r.notes || '',
        bookingChargePaid: parseFloat(r.booking_charge_paid as any) || 0,
      });
    }

    // 4. Sort combined logs descending by timestamp
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error('Fetch Traffic Logs Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch traffic logs.', error: error.message },
      { status: 500 }
    );
  }
}
