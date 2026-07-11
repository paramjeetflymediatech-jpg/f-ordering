import { NextResponse } from 'next/server';
import { Printer, Order, Store, RestaurantTable, Customer, OrderItem, MenuItem, Payment } from '../../../../../models';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const apiKey = request.headers.get('x-printer-token');

    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized: Missing API Key' }, { status: 401 });
    }

    const printer = await Printer.findOne({ where: { api_key: apiKey } });
    if (!printer) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    const store = await Store.findByPk(printer.store_id);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Handle test print job payload request
    if (orderId === 'test-print-job-id') {
      return NextResponse.json({
        success: true,
        restaurantName: store.name,
        restaurantAddress: store.address,
        restaurantPhone: store.phone,
        orderNumber: 'TEST-8888',
        date: new Date().toISOString(),
        tableNumber: 'Table 7',
        customerName: 'John Doe (Test)',
        orderType: 'dine_in',
        items: [
          {
            name: 'Test Pizza Margherita',
            quantity: 1,
            price: 18.50,
            notes: 'Extra cheese, crispy base',
            variant: 'Large',
            addons: ['Extra Mushroom', 'Olives'],
          },
          {
            name: 'Test Craft Pale Ale',
            quantity: 2,
            price: 9.00,
            notes: '',
            variant: '',
            addons: [],
          }
        ],
        subtotal: 36.50,
        tax: 1.83,
        total: 38.33,
        paymentMethod: 'cash',
        isTest: true,
      });
    }

    // Retrieve active order from database
    const order = await Order.findOne({
      where: { id: orderId, store_id: printer.store_id },
      include: [
        { model: RestaurantTable },
        { model: Customer, as: 'customer', attributes: ['name', 'phone'] },
        { model: Payment, as: 'payments' },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: MenuItem, attributes: ['name'] }]
        }
      ]
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Map database order to format matching configuration options
    const items = (order.items || []).map((oi: any) => {
      let addonNames = [];
      try {
        const addonsList = typeof oi.addons === 'string' ? JSON.parse(oi.addons) : (oi.addons || []);
        addonNames = addonsList.map((a: any) => a.name || a);
      } catch (e) {}

      return {
        name: oi.MenuItem?.name || 'Dish Item',
        quantity: oi.quantity,
        price: parseFloat(oi.unit_price),
        notes: oi.notes || '',
        variant: oi.variant_id ? 'Standard' : '',
        addons: addonNames,
      };
    });

    const paymentMethod = order.payments && order.payments.length > 0
      ? order.payments[0].payment_method
      : 'unpaid';

    return NextResponse.json({
      success: true,
      restaurantName: store.name,
      restaurantAddress: store.address,
      restaurantPhone: store.phone,
      orderNumber: order.order_number,
      date: order.createdAt,
      tableNumber: order.RestaurantTable?.table_number || null,
      customerName: order.customer?.name || 'Guest Customer',
      orderType: order.order_type,
      items,
      subtotal: parseFloat(order.subtotal),
      tax: parseFloat(order.tax_amount || 0),
      total: parseFloat(order.total_amount),
      paymentMethod,
      isTest: false,
    });
  } catch (error: any) {
    console.error('Fetch Order Print Payload Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
