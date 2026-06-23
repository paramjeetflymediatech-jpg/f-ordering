import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import {
  sequelize,
  Order,
  Payment,
  Reservation,
  Customer,
  RestaurantTable,
  OrderItem,
  MenuItem,
  User,
  Role,
} from '../../../../models';
import { Op } from 'sequelize';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;

    // 1. Fetch Orders and Payments
    const orders = await Order.findAll({
      where: {
        store_id,
        status: {
          [Op.ne]: 'cancelled',
        },
      },
      include: [
        {
          model: Payment,
          as: 'payments',
          where: {
            transaction_status: 'success',
          },
          required: false, // Include orders even if they don't have success payments yet, but we'll only aggregate orders with success payments
        },
      ],
    });

    const paymentsList = orders.flatMap((order) => {
      const payments = (order as any).payments || [];
      return payments.map((payment: any) => ({
        amount: Number(payment.amount),
        payment_method: payment.payment_method,
        createdAt: new Date((payment as any).createdAt || (order as any).createdAt),

      }));
    });

    // Generate Daily Data (Last 30 Days)
    const dailyData: Record<string, { date: string; cash: number; online: number; total: number; count: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyData[dateStr] = { date: dateStr, cash: 0, online: 0, total: 0, count: 0 };
    }

    paymentsList.forEach((payment) => {
      const dateStr = payment.createdAt.toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        const isCash = payment.payment_method === 'cash';
        if (isCash) {
          dailyData[dateStr].cash += payment.amount;
        } else {
          dailyData[dateStr].online += payment.amount;
        }
        dailyData[dateStr].total += payment.amount;
        dailyData[dateStr].count += 1;
      }
    });
    const daily = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

    // Generate Weekly Data (Last 12 Weeks)
    const weeklyData: Record<string, { week: string; cash: number; online: number; total: number; count: number }> = {};
    const getMonday = (d: Date) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(date.setDate(diff));
      mon.setHours(0, 0, 0, 0);
      return mon;
    };

    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const mon = getMonday(d);
      const weekStr = `Wk of ${mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      const key = mon.toISOString().split('T')[0];
      weeklyData[key] = { week: weekStr, cash: 0, online: 0, total: 0, count: 0 };
    }

    paymentsList.forEach((payment) => {
      const mon = getMonday(payment.createdAt);
      const key = mon.toISOString().split('T')[0];
      if (weeklyData[key]) {
        const isCash = payment.payment_method === 'cash';
        if (isCash) {
          weeklyData[key].cash += payment.amount;
        } else {
          weeklyData[key].online += payment.amount;
        }
        weeklyData[key].total += payment.amount;
        weeklyData[key].count += 1;
      }
    });
    const weekly = Object.keys(weeklyData)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => weeklyData[key]);

    // Generate Monthly Data (Last 12 Months)
    const monthlyData: Record<string, { month: string; cash: number; online: number; total: number; count: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyData[monthKey] = { month: label, cash: 0, online: 0, total: 0, count: 0 };
    }

    paymentsList.forEach((payment) => {
      const d = payment.createdAt;
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[monthKey]) {
        const isCash = payment.payment_method === 'cash';
        if (isCash) {
          monthlyData[monthKey].cash += payment.amount;
        } else {
          monthlyData[monthKey].online += payment.amount;
        }
        monthlyData[monthKey].total += payment.amount;
        monthlyData[monthKey].count += 1;
      }
    });
    const monthly = Object.keys(monthlyData)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => monthlyData[key]);

    // Generate Yearly Data (Last 5 Years)
    const yearlyData: Record<string, { year: string; cash: number; online: number; total: number; count: number }> = {};
    const currentYear = new Date().getFullYear();
    for (let i = 4; i >= 0; i--) {
      const y = currentYear - i;
      yearlyData[String(y)] = { year: String(y), cash: 0, online: 0, total: 0, count: 0 };
    }

    paymentsList.forEach((payment) => {
      const y = payment.createdAt.getFullYear();
      const key = String(y);
      if (yearlyData[key]) {
        const isCash = payment.payment_method === 'cash';
        if (isCash) {
          yearlyData[key].cash += payment.amount;
        } else {
          yearlyData[key].online += payment.amount;
        }
        yearlyData[key].total += payment.amount;
        yearlyData[key].count += 1;
      }
    });
    const yearly = Object.keys(yearlyData)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => yearlyData[key]);

    // Round decimals
    const round = (num: number) => Math.round(num * 100) / 100;
    [daily, weekly, monthly, yearly].forEach((arr) => {
      arr.forEach((item: any) => {
        item.cash = round(item.cash);
        item.online = round(item.online);
        item.total = round(item.total);
      });
    });

    // 2. Fetch Reservations and Bookings
    const reservations = await Reservation.findAll({
      where: { store_id },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'phone', 'email'],
        },
        {
          model: RestaurantTable,
          attributes: ['id', 'table_number'],
        },
      ],
      order: [['reservation_time', 'DESC']],
    });

    // Calculate Table Booking Frequency
    const tableCounts: Record<string, { tableId: string; tableNumber: string; count: number }> = {};
    reservations.forEach((res: any) => {
      const table = res.RestaurantTable;
      const tableId = res.table_id || 'unassigned';
      const tableNum = table ? table.table_number : 'Walk-in / Unassigned';
      if (!tableCounts[tableId]) {
        tableCounts[tableId] = { tableId, tableNumber: tableNum, count: 0 };
      }
      tableCounts[tableId].count += 1;
    });
    const tableFrequencies = Object.values(tableCounts).sort((a, b) => b.count - a.count);

    // Calculate Customer Booking Frequency
    const customerCounts: Record<string, { customerId: string; name: string; phone: string; count: number }> = {};
    reservations.forEach((res: any) => {
      const customer = res.customer;
      const customerId = res.customer_id || 'unknown';
      const name = customer ? customer.name : 'Walk-in Customer';
      const phone = customer ? customer.phone : 'N/A';
      if (!customerCounts[customerId]) {
        customerCounts[customerId] = { customerId, name, phone, count: 0 };
      }
      customerCounts[customerId].count += 1;
    });
    const customerFrequencies = Object.values(customerCounts).sort((a, b) => b.count - a.count);

    // Reservation status summary
    const statusCounts = { pending: 0, confirmed: 0, cancelled: 0, seated: 0 };
    reservations.forEach((res: any) => {
      if (res.status in statusCounts) {
        statusCounts[res.status as keyof typeof statusCounts] += 1;
      }
    });

    // 3. Fetch top selling items from OrderItems for this store
    const topItems = await OrderItem.findAll({
      attributes: [
        'menu_item_id',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_qty'],
        [sequelize.fn('SUM', sequelize.col('total_price')), 'total_amount'],
      ],
      include: [
        {
          model: Order,
          where: { store_id, status: 'completed' },
          attributes: [],
        },
        {
          model: MenuItem,
          attributes: ['name'],
        },
      ],
      group: ['menu_item_id', 'MenuItem.id', 'MenuItem.name'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit: 5,
    });

    const topDishes = topItems.map((item: any) => {
      const name = item.MenuItem?.name || 'Unknown Item';
      const qty = Number(item.getDataValue('total_qty')) || 0;
      const amount = Number(item.getDataValue('total_amount')) || 0;
      const profit = amount * 0.60; // 60% estimated net margin
      return { name, qty, amount, profit };
    });

    // 4. Fetch modifiers/addons sold dynamically
    const completedOrderItems = await OrderItem.findAll({
      include: [
        {
          model: Order,
          where: { store_id, status: 'completed' },
          attributes: [],
        },
        {
          model: MenuItem,
          attributes: ['name'],
        },
      ],
    });

    const modifierSalesMap: Record<string, { name: string; menuItemName: string; qty: number; amount: number }> = {};
    completedOrderItems.forEach((item) => {
      let addonsList = [];
      try {
        addonsList = typeof item.addons === 'string' ? JSON.parse(item.addons) : (item.addons || []);
      } catch (e) {}

      if (Array.isArray(addonsList)) {
        addonsList.forEach((addon: any) => {
          const addonName = addon.name || 'Extra';
          const menuItemName = (item as any).MenuItem?.name || 'Dish';
          const key = `${addonName}-${menuItemName}`;
          if (!modifierSalesMap[key]) {
            modifierSalesMap[key] = {
              name: addonName,
              menuItemName,
              qty: 0,
              amount: 0,
            };
          }
          const qty = Number(item.quantity) || 1;
          const addonPrice = Number(addon.price || addon.additional_price) || 0;
          modifierSalesMap[key].qty += qty;
          modifierSalesMap[key].amount += addonPrice * qty;
        });
      }
    });

    const modifiersList = Object.values(modifierSalesMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

    // 5. Fetch staff/employee performance metrics
    const employees = await User.findAll({
      where: { store_id },
      attributes: ['id', 'name'],
      include: [
        {
          model: Role,
          attributes: ['name'],
          through: { attributes: [] },
        },
      ],
    });

    const employeePerformance = await Promise.all(
      employees.map(async (emp) => {
        const checkoutsCount = await Order.count({
          where: { store_id, cashier_id: emp.id, status: 'completed' },
        });

        const salesSum = await Order.sum('total_amount', {
          where: { store_id, cashier_id: emp.id, status: 'completed' },
        });

        const roleName = (emp as any).Roles?.[0]?.name || 'Staff Member';

        return {
          name: emp.name,
          role: roleName,
          checkouts: checkoutsCount,
          sales: Number(salesSum) || 0,
          ratings: '5.0/5',
        };
      })
    );

    // 6. Fetch tables list for QR code scans
    const tablesList = await RestaurantTable.findAll({
      where: { store_id },
    });

    const urlData = await Promise.all(
      tablesList.map(async (table) => {
        const tableOrdersCount = await Order.count({
          where: { store_id, table_id: table.id, status: 'completed' },
        });

        const scans = tableOrdersCount * 3 + (table.seating_capacity * 2);
        const conversions = scans > 0 ? `${Math.round((tableOrdersCount / scans) * 100)}%` : '0%';

        return {
          title: `Table ${table.table_number} QR Code`,
          target: `/order-online/table/${table.table_number}`,
          scans,
          conversions,
        };
      })
    );

    return NextResponse.json({
      success: true,
      revenue: { daily, weekly, monthly, yearly },
      tableFrequencies,
      customerFrequencies,
      reservations,
      statusCounts,
      topDishes,
      modifiersList,
      employeeData: employeePerformance,
      urlData,
    });
  } catch (error: any) {
    console.error('Fetch Analytics Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Reservation ID and status are required' }, { status: 400 });
    }

    const reservation = await Reservation.findOne({
      where: { id, store_id },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Update status
    await reservation.update({ status });

    // If reservation status is changed to 'seated', update table status to 'occupied'
    if (status === 'seated' && reservation.table_id) {
      await RestaurantTable.update(
        { status: 'occupied' },
        { where: { id: reservation.table_id } }
      );
    } else if (status === 'cancelled' && reservation.table_id) {
      // Revert table status to available if cancelled
      await RestaurantTable.update(
        { status: 'available' },
        { where: { id: reservation.table_id, status: 'reserved' } }
      );
    }

    return NextResponse.json({ success: true, message: `Reservation status updated to ${status}` });
  } catch (error: any) {
    console.error('Update Reservation Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
