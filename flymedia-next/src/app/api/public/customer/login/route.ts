import { NextResponse } from 'next/server';
import { Organization, Customer } from '../../../../../models';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'supersecretposplatformkeychangeinprod';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { loginIdentifier, password, orgSlug } = body;

    if (!loginIdentifier || !password || !orgSlug) {
      return NextResponse.json({ error: 'Phone/Email, password, and orgSlug are required.' }, { status: 400 });
    }

    // Find Organization
    const org = await Organization.findOne({ where: { slug: orgSlug } });
    if (!org) {
      return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
    }

    // Find Customer by phone or email
    let customer = await Customer.findOne({ where: { phone: loginIdentifier } });
    if (!customer) {
      customer = await Customer.findOne({ where: { email: loginIdentifier } });
    }

    if (!customer || !customer.password) {
      return NextResponse.json({ error: 'Invalid credentials or no registered account found.' }, { status: 401 });
    }

    // Compare Password
    const isPasswordCorrect = await bcrypt.compare(password, customer.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        organization_id: org.id,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const response = NextResponse.json({
      success: true,
      message: 'Login successful!',
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      },
    });

    // Save token as HTTP-Only Cookie
    response.cookies.set('customer_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('Customer Login Error:', error);
    return NextResponse.json({ error: 'Internal server error during login.' }, { status: 500 });
  }
}
