import { NextResponse } from 'next/server';
import { sequelize, Store, Customer, Order, OrderItem, Payment, RestaurantTable, User, Role, Coupon } from '../../../../models';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sendEmailReceipt } from '../../../../lib/email';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'supersecretposplatformkeychangeinprod';

/** Generate a short, readable temp password like "ord-4f2a" */
function generateTempPassword(): string {
  return 'ord-' + Math.random().toString(36).slice(2, 6);
}

export async function POST(request: Request) {
  const transaction = await sequelize.transaction();

  try {
    const body = await request.json();
    const {
      storeId,
      customerName,
      customerPhone,
      customerEmail,
      items,
      orderType = 'takeaway',
      tableId,
      paymentMethod = 'cash',
      deliveryAddress,
      notes,
      stripePaymentIntentId,
      couponCode,
    } = body;

    // 1. Validations
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }
    if (!customerName || !customerPhone) {
      return NextResponse.json({ error: 'Customer name and phone number are required' }, { status: 400 });
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Shopping cart is empty' }, { status: 400 });
    }

    const store = await Store.findByPk(storeId);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // 2. Find or Create Customer Profile (Support Logged In Sessions)
    const cookieStore = await cookies();
    const token = cookieStore.get('customer_token')?.value;
    let loggedInCustomer: any = null;

    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        loggedInCustomer = await Customer.findByPk(decoded.id, { transaction });
      } catch (err) {
        // Ignore invalid session token and default to guest
      }
    }

    let customer = loggedInCustomer;
    let guestTempPassword: string | null = null;

    if (!customer) {
      const [guestCustomer, wasCreated] = await Customer.findOrCreate({
        where: { phone: customerPhone },
        defaults: {
          name: customerName,
          email: customerEmail || null,
          organization_id: store.organization_id,
        },
        transaction,
      });
      customer = guestCustomer;

      // Update email if missing
      if (customerEmail && !customer.email) {
        customer.email = customerEmail;
      }

      // Auto-create account: if newly created OR existing guest with no password, set a temp password
      if (!customer.password) {
        guestTempPassword = generateTempPassword();
        customer.password = await bcrypt.hash(guestTempPassword, 10);
        await customer.save({ transaction });
      }
    }

    // 3. Calculate Totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * item.quantity;
    }

    let discountAmount = 0;
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        where: {
          store_id: storeId,
          code: couponCode.trim(),
          is_active: true,
        },
        transaction,
      });

      if (coupon) {
        const minAmount = parseFloat(coupon.min_order_amount as any) || 0;
        if (subtotal >= minAmount) {
          const discountVal = parseFloat(coupon.discount_value as any) || 0;
          if (coupon.discount_type === 'percentage') {
            discountAmount = (subtotal * discountVal) / 100;
          } else {
            discountAmount = discountVal;
          }
          if (discountAmount > subtotal) {
            discountAmount = subtotal;
          }
        }
      }
    }

    const taxRate = parseFloat(store.tax_rate as any) || 8.25;
    const discountedSubtotal = subtotal - discountAmount;
    const tax = (discountedSubtotal * taxRate) / 100;
    const total = discountedSubtotal + tax;

    // 4. Generate Order Number
    const orderCount = await Order.count({ where: { store_id: storeId } });
    const orderNumber = `ORD-ONL-${String(orderCount + 1).padStart(5, '0')}`;

    // 5. Create Order
    const order = await Order.create(
      {
        organization_id: store.organization_id,
        store_id: storeId,
        customer_id: customer.id,
        table_id: tableId || null,
        cashier_id: null as any,
        order_number: orderNumber,
        order_type: orderType,
        status: 'pending',
        subtotal,
        tax_amount: tax,
        discount_amount: discountAmount,
        total_amount: total,
      },
      { transaction }
    );

    // 6. Create Order Items
    let finalNotes = notes || '';
    if (orderType === 'delivery' && deliveryAddress) {
      finalNotes = `Delivery Address: ${deliveryAddress}${finalNotes ? ` | Notes: ${finalNotes}` : ''}`;
    }

    const orderItemsPayload = items.map((item: any) => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      variant_id: item.variant?.id || null,
      addons: item.addons || [],
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      notes: item.notes || finalNotes || null,
    }));

    await OrderItem.bulkCreate(orderItemsPayload, { transaction });

    // 7. Create Payment
    const payment = await Payment.create(
      {
        order_id: order.id,
        payment_method: paymentMethod,
        amount: total,
        transaction_status: stripePaymentIntentId
          ? 'success'
          : paymentMethod === 'cash'
          ? 'pending'
          : 'success',
        transaction_reference: stripePaymentIntentId || `ONL-TX-${Date.now()}`,
      },
      { transaction }
    );

    // 8. Update Table Status if QR Table Order
    if (orderType === 'qr_order' && tableId) {
      await RestaurantTable.update(
        { status: 'occupied' },
        { where: { id: tableId }, transaction }
      );
    }

    // Lookup Restaurant Owner email
    let adminEmail = 'admin@fordering.com';
    try {
      const ownerUser = await User.findOne({
        where: { organization_id: store.organization_id },
        include: [
          {
            model: Role,
            where: { name: 'Restaurant Owner' },
          },
        ],
        transaction,
      });
      if (ownerUser) {
        adminEmail = ownerUser.email;
      }
    } catch (e) {
      console.error('Failed to query admin email:', e);
    }

    await transaction.commit();

    // 9. Send Simulated Email Receipt after committing transaction
    try {
      const receiptItems = items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price),
        variantName: item.variant?.name || null,
        addons: (item.addons || []).map((a: any) => ({
          name: a.name,
          price: parseFloat(a.price || 0),
        })),
      }));

      await sendEmailReceipt({
        storeName: store.name,
        customer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email || customerEmail || null,
        },
        order: {
          orderNumber: order.order_number,
          orderType: order.order_type,
          subtotal,
          taxAmount: tax,
          totalAmount: total,
          items: receiptItems,
          deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
        },
        payment: {
          method: paymentMethod,
          amount: total,
          status: payment.transaction_status,
          reference: payment.transaction_reference || `ONL-TX-${Date.now()}`,
        },
        adminEmail,
      });
    } catch (emailErr) {
      console.error('Failed to dispatch simulated email receipt:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Online order placed successfully!',
      order: {
        id: order.id,
        orderNumber: order.order_number,
        total: order.total_amount,
        status: order.status,
      },
      // Returned only for guest orders that just got an account auto-created
      newAccount: guestTempPassword
        ? {
            phone: customer.phone,
            tempPassword: guestTempPassword,
            message: 'Account auto-created! Use your phone number and this temporary password to log in.',
          }
        : null,
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error('Online Checkout Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process online order checkout.', error: error.message },
      { status: 500 }
    );
  }
}
