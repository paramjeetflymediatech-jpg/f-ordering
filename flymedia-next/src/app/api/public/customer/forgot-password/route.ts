import { NextResponse } from 'next/server';
import { Organization, Customer, User, Role } from '../../../../../models';
import { sendPasswordRecoveryEmail } from '../../../../../lib/email';
import bcrypt from 'bcryptjs';

/** Generate a short, readable temp password like "reset-9c8f" */
function generateTempPassword(): string {
  return 'reset-' + Math.random().toString(36).slice(2, 8);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { loginIdentifier, orgSlug } = body;

    if (!loginIdentifier || !orgSlug) {
      return NextResponse.json({ error: 'Phone or Email and orgSlug are required.' }, { status: 400 });
    }

    // Find Organization
    const org = await Organization.findOne({ where: { slug: orgSlug } });
    if (!org) {
      return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
    }

    // Find Customer by phone or email
    let customer = await Customer.findOne({ 
      where: { 
        phone: loginIdentifier,
        organization_id: org.id
      } 
    });
    if (!customer) {
      customer = await Customer.findOne({ 
        where: { 
          email: loginIdentifier,
          organization_id: org.id
        } 
      });
    }

    if (!customer) {
      return NextResponse.json({ error: 'No registered customer account found with this Phone or Email.' }, { status: 404 });
    }

    // If customer has no password (they are just a guest profile without an account)
    if (!customer.password) {
      return NextResponse.json({ 
        error: 'This phone/email is registered as a guest profile. Please sign up to create a full account.' 
      }, { status: 400 });
    }

    // Generate and Hash temporary password
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Update customer password
    customer.password = hashedPassword;
    await customer.save();

    // Lookup store name
    const storeName = org.name;

    // Lookup Restaurant Owner email
    let adminEmail = 'admin@fordering.com';
    try {
      const ownerUser = await User.findOne({
        where: { organization_id: org.id },
        include: [
          {
            model: Role,
            where: { name: 'Restaurant Owner' },
          },
        ],
      });
      if (ownerUser) {
        adminEmail = ownerUser.email;
      }
    } catch (e) {
      console.error('Failed to query admin email for recovery template:', e);
    }

    // Dispatch recovery email (using simulated handler or if customer has email)
    const emailToUse = customer.email || 'no-email@customer.com';
    await sendPasswordRecoveryEmail({
      storeName,
      adminEmail,
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: emailToUse,
      },
      tempPassword,
    });

    return NextResponse.json({
      success: true,
      message: 'A temporary password has been successfully sent to your email!',
      tempPassword: tempPassword, // returned for easy testing/dev environment accessibility
    });

  } catch (error: any) {
    console.error('Customer Forgot Password Error:', error);
    return NextResponse.json({ error: 'Internal server error during password reset.' }, { status: 500 });
  }
}
