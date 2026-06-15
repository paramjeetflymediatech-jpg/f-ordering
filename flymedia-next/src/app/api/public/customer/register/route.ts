import { NextResponse } from 'next/server';
import { Organization, Customer } from '../../../../../models';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, password, orgSlug } = body;

    if (!name || !phone || !password || !orgSlug) {
      return NextResponse.json({ error: 'Name, phone, password, and orgSlug are required.' }, { status: 400 });
    }

    // Find Organization
    const org = await Organization.findOne({ where: { slug: orgSlug } });
    if (!org) {
      return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if phone already exists
    const existingCustomer = await Customer.findOne({ where: { phone } });

    if (existingCustomer) {
      // If customer exists but has NO password (guest user conversion)
      if (!existingCustomer.password) {
        existingCustomer.password = hashedPassword;
        existingCustomer.name = name;
        if (email) existingCustomer.email = email;
        existingCustomer.organization_id = org.id;
        await existingCustomer.save();

        return NextResponse.json({
          success: true,
          message: 'Account created successfully from your guest profile!',
          customer: {
            id: existingCustomer.id,
            name: existingCustomer.name,
            phone: existingCustomer.phone,
            email: existingCustomer.email,
          }
        });
      } else {
        return NextResponse.json({ error: 'A customer account with this phone number already exists.' }, { status: 400 });
      }
    }

    // Create New Customer
    const newCustomer = await Customer.create({
      organization_id: org.id,
      name,
      email: email || null,
      phone,
      password: hashedPassword,
    });

    return NextResponse.json({
      success: true,
      message: 'Customer registered successfully!',
      customer: {
        id: newCustomer.id,
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
      }
    });

  } catch (error: any) {
    console.error('Customer Registration Error:', error);
    return NextResponse.json({ error: 'Internal server error during customer registration.' }, { status: 500 });
  }
}
