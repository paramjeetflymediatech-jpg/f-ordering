import { NextResponse } from 'next/server';
import { Op } from 'sequelize';
import { sequelize, Store, Customer, Order, OrderItem, Payment, RestaurantTable, User, Role, Coupon, Reservation } from '../../../../models';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sendEmailReceipt } from '../../../../lib/email';
import { getAdminNotificationEmails } from '../../../../lib/storeEmails';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'supersecretposplatformkeychangeinprod';

/** Generate a short, readable temp password like "ord-4f2a" */
function generateTempPassword(): string {
  return 'ord-' + Math.random().toString(36).slice(2, 6);
}

export async function POST(request: Request) {
  let transaction: any = null;
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
      transactionReference,
    } = body;

    // Prevent duplicate orders for Stripe Checkout redirects
    if (stripePaymentIntentId || transactionReference) {
      const refToCheck = stripePaymentIntentId || transactionReference;
      const existingPayment = await Payment.findOne({
        where: { transaction_reference: refToCheck },
      });
      if (existingPayment) {
        const existingOrder = await Order.findByPk(existingPayment.order_id);
        if (existingOrder) {
          console.log(`[Order API] Duplicate checkout redirect intercepted. Recovering order ${existingOrder.order_number}`);
          return NextResponse.json({
            success: true,
            message: 'Online order placed successfully!',
            order: {
              id: existingOrder.id,
              orderNumber: existingOrder.order_number,
              total: existingOrder.total_amount,
              status: existingOrder.status,
            },
            newAccount: null,
          });
        }
      }
    }

    // Resolve logged in customer early
    const cookieStore = await cookies();
    const token = cookieStore.get('customer_token')?.value;
    let loggedInCustomer: any = null;

    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        loggedInCustomer = await Customer.findByPk(decoded.id);
      } catch (err) {
        // Ignore invalid session token
      }
    }

    // 1. Validations
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    if (!loggedInCustomer) {
      if (!customerName || !customerEmail) {
        return NextResponse.json({ error: 'Name and Email are required for guest checkout' }, { status: 400 });
      }
    } else {
      if (!customerName) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }
    }

    transaction = await sequelize.transaction();

    if (!items || items.length === 0) {
      await transaction.rollback();
      return NextResponse.json({ error: 'Shopping cart is empty' }, { status: 400 });
    }

    const store = await Store.findByPk(storeId);
    if (!store) {
      await transaction.rollback();
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Validate table is not reserved or occupied for QR orders
    if (orderType === 'qr_order' && tableId) {
      // 1. Check reservation
      const activeRes = await Reservation.findOne({
        where: {
          table_id: tableId,
          status: { [Op.in]: ['pending', 'confirmed'] },
        },
        include: [{ model: Customer, as: 'customer', attributes: ['name'] }],
        transaction,
      });

      if (activeRes) {
        await transaction.rollback();
        const resTime = new Date((activeRes as any).reservation_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        const guestName = (activeRes as any).customer?.name || 'a guest';
        return NextResponse.json({
          error: `Table is reserved for ${guestName} at ${resTime}. Please check in at the counter.`,
        }, { status: 409 });
      }

      // 2. Check occupancy (Commented out to allow multi-round ordering / additional items at occupied tables)
      /*
      const table = await RestaurantTable.findByPk(tableId, { transaction });
      if (table && table.status === 'occupied') {
        await transaction.rollback();
        return NextResponse.json({
          error: 'This table is currently occupied. Please scan a different table or check with our staff.',
        }, { status: 409 });
      }
      */
    }

    let customer = loggedInCustomer;
    let guestTempPassword: string | null = null;

    if (!customer) {
      // Find or create customer by email (primary)
      let guestCustomer = await Customer.findOne({
        where: { email: customerEmail.trim() },
        transaction,
      });

      if (!guestCustomer && customerPhone && customerPhone.trim()) {
        guestCustomer = await Customer.findOne({
          where: { phone: customerPhone.trim() },
          transaction,
        });
      }

      if (!guestCustomer) {
        guestCustomer = await Customer.create({
          name: customerName,
          email: customerEmail.trim(),
          phone: customerPhone || null,
          organization_id: store.organization_id,
        }, { transaction });
      } else {
        // Update phone or name if provided
        let changed = false;
        if (customerPhone && !guestCustomer.phone) {
          guestCustomer.phone = customerPhone;
          changed = true;
        }
        if (customerName && guestCustomer.name !== customerName) {
          guestCustomer.name = customerName;
          changed = true;
        }
        if (changed) {
          await guestCustomer.save({ transaction });
        }
      }

      customer = guestCustomer;

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
      // Find the coupon matching code, either store-specific or global
      coupon = await Coupon.findOne({
        where: {
          code: couponCode.trim(),
          is_active: true,
          [Op.or]: [
            { store_id: storeId },
            { store_id: null }
          ]
        },
        transaction,
      });

      if (coupon) {
        // Check coupon usage by email or phone
        let checkCustomer = null;
        if (customerEmail && customerEmail.trim()) {
          checkCustomer = await Customer.findOne({
            where: { email: customerEmail.trim() },
            transaction,
          });
        }
        if (!checkCustomer && customerPhone && customerPhone.trim()) {
          checkCustomer = await Customer.findOne({
            where: { phone: customerPhone.trim() },
            transaction,
          });
        }

        if (checkCustomer) {
          const orderUsed = await Order.findOne({
            where: {
              customer_id: checkCustomer.id,
              coupon_code: coupon.code,
              status: { [Op.ne]: 'cancelled' },
            },
            transaction,
          });
          if (orderUsed) {
            await transaction.rollback();
            return NextResponse.json({ error: 'This coupon code has already been used with this email/mobile number.' }, { status: 400 });
          }
        }

        // Check Day of Week restriction
        const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayName = DAYS[new Date().getDay()];
        const validDays: string[] | null = coupon.valid_days as any;

        if (validDays && Array.isArray(validDays) && validDays.length > 0) {
          const matchDay = validDays.some(d => d.toLowerCase() === currentDayName.toLowerCase());
          if (!matchDay) {
            await transaction.rollback();
            return NextResponse.json({ error: `Coupon code '${coupon.code}' is only valid on ${validDays.join(', ')}.` }, { status: 400 });
          }
        }

        const minAmount = parseFloat(coupon.min_order_amount as any) || 0;
        if (subtotal >= minAmount) {
          let discType = coupon.discount_type;
          let discVal = parseFloat(coupon.discount_value as any) || 0;

          const orderTypeDiscounts: Record<string, number> | null = coupon.order_type_discounts as any;
          if (orderTypeDiscounts && typeof orderTypeDiscounts === 'object') {
            const normalizedOrderType = (orderType || 'takeaway').toLowerCase().replace('-', '_');
            let matchedRate: number | undefined = undefined;
            for (const [key, val] of Object.entries(orderTypeDiscounts)) {
              if (key.toLowerCase().replace('-', '_') === normalizedOrderType) {
                matchedRate = Number(val);
                break;
              }
            }
            if (matchedRate !== undefined) {
              discType = 'percentage';
              discVal = matchedRate;
            }
          }

          if (discType === 'percentage') {
            discountAmount = (subtotal * discVal) / 100;
          } else {
            discountAmount = discVal;
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
    
    // Check for security deposit credit to deduct
    let depositDeducted = 0;
    let reservationToUpdate: any = null;

    if (orderType === 'qr_order' && tableId) {
      reservationToUpdate = await Reservation.findOne({
        where: {
          table_id: tableId,
          status: 'seated',
          booking_charge_paid: { [Op.gt]: 0 },
          deposit_credited: false,
        },
        transaction,
      });

      if (reservationToUpdate) {
        depositDeducted = parseFloat(reservationToUpdate.booking_charge_paid as any) || 0;
      }
    }

    const totalBeforeDeposit = discountedSubtotal + tax;
    const finalTotal = Math.max(0, totalBeforeDeposit - depositDeducted);

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
        total_amount: finalTotal,
        deposit_deducted: depositDeducted,
        coupon_code: coupon ? coupon.code : null,
      },
      { transaction }
    );

    // Update reservation as credited if applicable
    if (reservationToUpdate && depositDeducted > 0) {
      await reservationToUpdate.update({ deposit_credited: true }, { transaction });
    }

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
      bases: item.bases || [],
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
        amount: finalTotal,
        transaction_status: stripePaymentIntentId
          ? 'success'
          : (paymentMethod === 'cash' || paymentMethod === 'upi')
          ? 'pending'
          : 'success',
        transaction_reference: stripePaymentIntentId || transactionReference || `ONL-TX-${Date.now()}`,
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

    // Lookup all Admin, Owner, and Store emails
    let adminEmails: string[] = ['admin@fordering.com'];
    try {
      adminEmails = await getAdminNotificationEmails(storeId, store.organization_id);
    } catch (e) {
      console.error('Failed to query admin emails:', e);
    }

    await transaction.commit();

    try {
      const io = (request as any).io || (global as any).__socketIo;
      if (io && tableId) {
        io.to(storeId).emit('table_status_update', { tableId });
      }
    } catch (_) {}

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
          totalAmount: finalTotal,
          items: receiptItems,
          deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
        },
        payment: {
          method: paymentMethod,
          amount: finalTotal,
          status: payment.transaction_status,
          reference: payment.transaction_reference || `ONL-TX-${Date.now()}`,
        },
        adminEmail: adminEmails,
      });
    } catch (emailErr) {
      console.error('Failed to dispatch simulated email receipt:', emailErr);
    }

    // Emit new_order socket event & dispatch print queue
    try {
      const io = (global as any).__socketIo;
      if (io) {
        io.to(storeId).emit('new_order', { storeId, order });
      }
    } catch (_) {}

    try {
      const { Queue } = require('bullmq');
      const printQueue = new Queue('print-jobs', {
        connection: {
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
        }
      });
      await printQueue.add('print-ticket', {
        orderId: order.id,
        storeId,
      });
      console.log(`[Public API] Print Job dispatched to BullMQ for online order: ${order.order_number}`);
    } catch (err) {
      console.error('[Public API] Failed to enqueue print job:', err);
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
    if (transaction) {
      await transaction.rollback();
    }
    console.error('Online Checkout Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process online order checkout.', error: error.message },
      { status: 500 }
    );
  }
}
