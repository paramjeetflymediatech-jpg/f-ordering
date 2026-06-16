import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { Order, OrderItem, MenuItem, RestaurantTable, Payment, User } from '../../../../models';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;

    const orders = await Order.findAll({
      where: {
        store_id,
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
          model: Payment,
          as: 'payments',
          attributes: ['payment_method', 'amount', 'transaction_status', 'transaction_reference', 'createdAt'],
        },
        {
          model: User,
          as: 'cashier',
          attributes: ['name'],
        }
      ],
      order: [['createdAt', 'DESC']],
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error('Fetch Order History Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch order history.', error: error.message },
      { status: 500 }
    );
  }
}
