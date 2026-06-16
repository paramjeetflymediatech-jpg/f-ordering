import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { Customer, Order, Payment } from '../../../../models';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id } = session.user as any;

    const customers = await Customer.findAll({
      where: {
        organization_id,
      },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Order,
          include: [
            {
              model: Payment,
              as: 'payments',
            },
          ],
        },
      ],
    });

    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    console.error('Fetch Customers Dashboard Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
