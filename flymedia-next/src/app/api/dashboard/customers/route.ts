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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id } = session.user as any;
    const body = await request.json();
    const { name, phone, email, first_name, last_name, company_name, date_of_birth, address, city, state, country, zip_code, loyalty_points, shipping_address, shipping_city, shipping_state, shipping_country, shipping_zip_code } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and Phone number are required' }, { status: 400 });
    }

    // Check if phone number is already registered for this organization
    const existing = await Customer.findOne({ where: { organization_id, phone } });
    if (existing) {
      return NextResponse.json({ error: 'Customer phone number already exists' }, { status: 400 });
    }

    const customer = await Customer.create({
      organization_id,
      name,
      phone,
      email: email || null,
      first_name: first_name || name,
      last_name: last_name || '-',
      company_name: company_name || '-',
      date_of_birth: date_of_birth || '-',
      address: address || '-',
      city: city || '-',
      state: state || '-',
      country: country || '-',
      zip_code: zip_code || '-',
      loyalty_points: parseInt(loyalty_points as any) || 0,
      shipping_address: shipping_address || '-',
      shipping_city: shipping_city || '-',
      shipping_state: shipping_state || '-',
      shipping_country: shipping_country || '-',
      shipping_zip_code: shipping_zip_code || '-',
    });

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    console.error('Create Customer Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, phone, email, first_name, last_name, company_name, date_of_birth, address, city, state, country, zip_code, loyalty_points, shipping_address, shipping_city, shipping_state, shipping_country, shipping_zip_code } = body;

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const customer = await Customer.findByPk(id, {
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

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Update customer fields
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;
    if (company_name !== undefined) updates.company_name = company_name;
    if (date_of_birth !== undefined) updates.date_of_birth = date_of_birth;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;
    if (country !== undefined) updates.country = country;
    if (zip_code !== undefined) updates.zip_code = zip_code;
    if (loyalty_points !== undefined) updates.loyalty_points = parseInt(loyalty_points as any) || 0;
    if (shipping_address !== undefined) updates.shipping_address = shipping_address;
    if (shipping_city !== undefined) updates.shipping_city = shipping_city;
    if (shipping_state !== undefined) updates.shipping_state = shipping_state;
    if (shipping_country !== undefined) updates.shipping_country = shipping_country;
    if (shipping_zip_code !== undefined) updates.shipping_zip_code = shipping_zip_code;

    await customer.update(updates);

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    console.error('Update Customer Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
