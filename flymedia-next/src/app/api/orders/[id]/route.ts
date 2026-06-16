import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { Order, OrderItem } from '../../../../models';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;
    const { id } = await params;

    // Delete order items first to ensure foreign key constraint satisfaction in SQLite
    await OrderItem.destroy({ where: { order_id: id } });
    
    const deletedCount = await Order.destroy({
      where: {
        id,
        store_id,
        status: 'on_hold'
      }
    });

    if (deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Held order not found or cannot be deleted.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Held order cancelled successfully.' });
  } catch (error: any) {
    console.error('Delete Held Order Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to cancel held order.', error: error.message },
      { status: 500 }
    );
  }
}
