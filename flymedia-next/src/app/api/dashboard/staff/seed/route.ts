import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { User, Role } from '../../../../../models';
import bcrypt from 'bcryptjs';

const DEMO_STAFF = [
  { name: 'Arjun Singh',    jobTitle: 'Head Waiter',     phone: '+61 412 100 001', role: 'Cashier'  },
  { name: 'Priya Sharma',   jobTitle: 'Waitress',         phone: '+61 412 100 002', role: 'Cashier'  },
  { name: 'Ravi Kumar',     jobTitle: 'Delivery Boy',     phone: '+61 412 100 003', role: 'Cashier'  },
  { name: 'Sana Malik',     jobTitle: 'Waitress',         phone: '+61 412 100 004', role: 'Cashier'  },
  { name: 'Deepak Verma',   jobTitle: 'Bar Boy',          phone: '+61 412 100 005', role: 'Cashier'  },
  { name: 'Neha Patel',     jobTitle: 'Cashier',          phone: '+61 412 100 006', role: 'Cashier'  },
  { name: 'Gurpreet Kaur',  jobTitle: 'Kitchen Helper',   phone: '+61 412 100 007', role: 'Cashier'  },
  { name: 'Harpreet Singh', jobTitle: 'Security Guard',   phone: '+61 412 100 008', role: 'Cashier'  },
  { name: 'Mohan Das',      jobTitle: 'Cleaner',          phone: '+61 412 100 009', role: 'Cashier'  },
  { name: 'Anjali Reddy',   jobTitle: 'Hostess',          phone: '+61 412 100 010', role: 'Cashier'  },
  { name: 'Vishal Thakur',  jobTitle: 'Delivery Boy',     phone: '+61 412 100 011', role: 'Cashier'  },
  { name: 'Fatima Noor',    jobTitle: 'Waitress',         phone: '+61 412 100 012', role: 'Cashier'  },
  { name: 'Suresh Babu',    jobTitle: 'Bar Tender',       phone: '+61 412 100 013', role: 'Cashier'  },
  { name: 'Kavita Joshi',   jobTitle: 'Cleaner',          phone: '+61 412 100 014', role: 'Cashier'  },
  { name: 'Rahul Nair',     jobTitle: 'Security Guard',   phone: '+61 412 100 015', role: 'Cashier'  },
];

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id, organization_id } = session.user as any;
    const hashedPassword = await bcrypt.hash('Staff@123', 10);

    // Get the Cashier role
    const cashierRole = await Role.findOne({ where: { name: 'Cashier' } });

    let created = 0;
    let skipped = 0;

    // Build email slug from organization slug-ish
    const orgSlug = organization_id.slice(0, 8);

    for (const s of DEMO_STAFF) {
      const emailHandle = s.name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
      const email = `${emailHandle}.${orgSlug}@staff.demo`;

      // Skip if email already exists
      const existing = await User.findOne({ where: { email } });
      if (existing) { skipped++; continue; }

      const user = await User.create({
        organization_id,
        store_id,
        name: `${s.name} (${s.jobTitle})`,
        email,
        phone: s.phone,
        password: hashedPassword,
        status: 'active',
      });

      if (cashierRole) {
        await (user as any).addRole(cashierRole);
      }
      created++;
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${created} staff member(s). ${skipped > 0 ? `${skipped} already existed and were skipped.` : ''}`,
      defaultPassword: 'Staff@123',
    });
  } catch (error: any) {
    console.error('Seed Staff Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
