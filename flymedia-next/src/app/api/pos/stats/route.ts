import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { Order, OrderItem, MenuItem, MenuCategory } from '../../../../models';
import { Op } from 'sequelize';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;

    // 1. Total Orders count
    const totalOrdersCount = await Order.count({ where: { store_id } });

    // 2. Active Orders count (live orders not completed/cancelled)
    const activeOrdersCount = await Order.count({
      where: {
        store_id,
        status: { [Op.notIn]: ['completed', 'cancelled'] }
      }
    });

    // 3. Pending Billing count (on hold)
    const pendingBillingCount = await Order.count({
      where: {
        store_id,
        status: 'on_hold'
      }
    });

    // 4. Today's Sales
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayOrders = await Order.findAll({
      where: {
        store_id,
        createdAt: {
          [Op.between]: [startOfToday, endOfToday]
        }
      }
    });
    const todaySalesVal = todayOrders.reduce((sum, o) => sum + parseFloat(o.total_amount as any), 0);

    // 5. Daily Sales Trend for the last 7 days (including today)
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const salesTrend = [];
    const sparklineSales = [];
    const sparklineOrders = [];
    const sparklinePending = [];

    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOrders = await Order.findAll({
        where: {
          store_id,
          createdAt: {
            [Op.between]: [dayStart, dayEnd]
          }
        }
      });

      const daySalesSum = dayOrders.reduce((sum, o) => sum + parseFloat(o.total_amount as any), 0);

      if (i < 7) {
        salesTrend.push({
          day: daysOfWeek[date.getDay()],
          sales: daySalesSum
        });
      }

      sparklineSales.push(daySalesSum);
      sparklineOrders.push(dayOrders.length);
      sparklinePending.push(dayOrders.filter(o => o.status === 'on_hold').length);
    }

    const hasRealSalesData = salesTrend.some(s => s.sales > 0);
    const displaySalesTrend = hasRealSalesData ? salesTrend : salesTrend.map(s => ({ ...s, sales: 0 }));

    const displaySparklineSales = hasRealSalesData ? sparklineSales : [0, 0, 0, 0, 0, 0, 0, 0];
    const displaySparklineOrders = totalOrdersCount > 0 ? sparklineOrders : [0, 0, 0, 0, 0, 0, 0, 0];
    const displaySparklinePending = sparklinePending.some(p => p > 0) ? sparklinePending : [0, 0, 0, 0, 0, 0, 0, 0];

    // 6. Category Sales Distribution
    const orderItems = await OrderItem.findAll({
      include: [
        {
          model: Order,
          where: { store_id },
          attributes: []
        },
        {
          model: MenuItem,
          include: [
            {
              model: MenuCategory,
              attributes: ['name']
            }
          ],
          attributes: ['name']
        }
      ]
    });

    const categorySalesMap: Record<string, number> = {};
    let totalCategorySales = 0;

    for (const item of orderItems) {
      const categoryName = (item as any).MenuItem?.MenuCategory?.name || 'Others';
      const itemTotal = parseFloat(item.total_price as any) || 0;
      categorySalesMap[categoryName] = (categorySalesMap[categoryName] || 0) + itemTotal;
      totalCategorySales += itemTotal;
    }

    const categoryColors: Record<string, string> = {
      'Main Course': '#f59e0b',
      'Beverages': '#06b6d4',
      'Appetizers': '#10b981',
      'Desserts': '#a855f7',
      'Others': '#64748b'
    };

    const defaultColors = ['#f59e0b', '#06b6d4', '#10b981', '#a855f7', '#64748b'];

    let categorySales = Object.entries(categorySalesMap).map(([name, amount], index) => {
      const percentage = totalCategorySales > 0 ? Math.round((amount / totalCategorySales) * 100) : 0;
      return {
        name,
        percentage,
        color: categoryColors[name] || defaultColors[index % defaultColors.length]
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders: totalOrdersCount,
        activeOrders: activeOrdersCount,
        pendingBilling: pendingBillingCount,
        todaySales: todaySalesVal,
        salesTrend: displaySalesTrend,
        categorySales,
        sparklines: {
          sales: displaySparklineSales,
          orders: displaySparklineOrders,
          pending: displaySparklinePending
        }
      }
    });
  } catch (error: any) {
    console.error('Fetch Stats Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch statistics.', error: error.message },
      { status: 500 }
    );
  }
}
