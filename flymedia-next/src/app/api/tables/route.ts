import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { RestaurantTable } from '../../../models';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id, store_id } = session.user as any;

    const tables = await RestaurantTable.findAll({
      where: {
        organization_id,
        store_id,
      },
      order: [['table_number', 'ASC']],
    });

    return NextResponse.json({ success: true, tables });
  } catch (error: any) {
    console.error('Fetch Tables Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tables.', error: error.message },
      { status: 500 }
    );
  }
}
