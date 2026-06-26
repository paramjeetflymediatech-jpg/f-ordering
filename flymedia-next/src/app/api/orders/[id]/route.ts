import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { Order, OrderItem, Store, Customer, User, Role } from '../../../../models';
import { sendOrderStatusEmail } from '../../../../lib/email';

const VALID_STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled', 'on_hold'];

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).store_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const order = await Order.findOne({ where: { id, store_id } });
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found.' },
        { status: 404 }
      );
    }

    const oldStatus = order.status;
    await order.update({ status });

    // ── Send email notifications asynchronously (non-blocking) ──────────────
    setImmediate(async () => {
      try {
        // Load store + customer details for email
        const store = await Store.findByPk(store_id);
        const customer = order.customer_id
          ? await Customer.findByPk(order.customer_id)
          : null;

        // Get admin email from store owner
        let adminEmail = 'admin@fordering.com';
        try {
          const ownerUser = await User.findOne({
            where: { organization_id: store?.organization_id },
            include: [{ model: Role, where: { name: 'Restaurant Owner' } }],
          });
          if (ownerUser) adminEmail = ownerUser.email;
        } catch (e) {
          console.error('Failed to find admin email:', e);
        }

        if (store) {
          await sendOrderStatusEmail({
            storeName: store.name,
            adminEmail,
            customer: {
              name: customer?.name || order.customer_id || 'Guest',
              phone: customer?.phone || '',
              email: customer?.email || null,
            },
            order: {
              orderNumber: order.order_number,
              total: parseFloat(order.total_amount as any),
              orderType: order.order_type,
            },
            newStatus: status,
            oldStatus,
          });
        }
      } catch (emailErr) {
        console.error('[ORDER STATUS] Email notification failed:', emailErr);
      }
    });

    return NextResponse.json({
      success: true,
      message: `Order status updated to "${status}".`,
      order: { id: order.id, status: order.status },
    });
  } catch (error: any) {
    console.error('Update Order Status Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update order status.', error: error.message },
      { status: 500 }
    );
  }
}
