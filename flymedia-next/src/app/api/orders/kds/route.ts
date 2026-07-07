// Force cache-busting compile comment
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { Order, OrderItem, MenuItem, MenuVariant, RestaurantTable, Customer, Payment } from '../../../../models';
import { Op } from 'sequelize';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id, store_id: sessionStoreId } = session.user as any;
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || sessionStoreId;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    // Verify user has access to this store
    if (sessionStoreId && sessionStoreId !== storeId) {
      return NextResponse.json({ error: 'Unauthorized store access' }, { status: 403 });
    }

    // Query active kitchen tickets (pending, accepted, preparing, ready)
    const activeOrders = await Order.findAll({
      where: {
        store_id: storeId,
        status: {
          [Op.in]: ['pending', 'accepted', 'preparing', 'ready'],
        },
      },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: MenuItem,
              attributes: ['name', 'price', 'description'],
            },
            {
              model: MenuVariant,
              as: 'variant',
              attributes: ['name'],
            },
          ],
        },
        {
          model: RestaurantTable,
          attributes: ['table_number'],
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['name', 'phone'],
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'transaction_status'],
        },
      ],
      order: [['createdAt', 'ASC']], // FIFO
    });

    // Query recently completed orders (completed in the last 1 hour, limit 10)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const completedOrders = await Order.findAll({
      where: {
        store_id: storeId,
        status: 'completed',
        updatedAt: {
          [Op.gte]: oneHourAgo,
        },
      },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: MenuItem,
              attributes: ['name', 'price', 'description'],
            },
            {
              model: MenuVariant,
              as: 'variant',
              attributes: ['name'],
            },
          ],
        },
        {
          model: RestaurantTable,
          attributes: ['table_number'],
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['name', 'phone'],
        },
      ],
      order: [['updatedAt', 'DESC']],
      limit: 10,
    });

    return NextResponse.json({
      success: true,
      activeOrders,
      completedOrders,
    });
  } catch (error: any) {
    console.error('Fetch KDS Orders Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch active kitchen orders.', error: error.message },
      { status: 500 }
    );
  }
}
