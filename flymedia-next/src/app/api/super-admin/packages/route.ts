import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { Package, Service } from '../../../../models';

// Helper to check Super Admin authorization
async function checkSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.roles?.includes('Super Admin')) {
    return false;
  }
  return true;
}

// 1. GET: List all packages
export async function GET() {
  try {
    const authorized = await checkSuperAdmin();
    if (!authorized) {
      return NextResponse.json({ success: false, message: 'Forbidden: Access denied.' }, { status: 403 });
    }

    const packages = await Package.findAll({
      include: [
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'title'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return NextResponse.json({ success: true, packages });
  } catch (error: any) {
    console.error('GET Packages Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to retrieve packages.', error: error.message }, { status: 500 });
  }
}

// 2. POST: Create a new package
export async function POST(request: Request) {
  try {
    const authorized = await checkSuperAdmin();
    if (!authorized) {
      return NextResponse.json({ success: false, message: 'Forbidden: Access denied.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, price, billing_cycle, features, is_popular, service_id } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ success: false, message: 'Name and price are required.' }, { status: 400 });
    }

    const pkg = await Package.create({
      name,
      price: parseFloat(price),
      billing_cycle: billing_cycle || 'monthly',
      features: features || [],
      is_popular: !!is_popular,
      service_id: service_id || null,
    });

    return NextResponse.json({ success: true, message: 'Package created successfully!', package: pkg });
  } catch (error: any) {
    console.error('POST Package Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create package.', error: error.message }, { status: 500 });
  }
}

// 3. PUT: Update a package
export async function PUT(request: Request) {
  try {
    const authorized = await checkSuperAdmin();
    if (!authorized) {
      return NextResponse.json({ success: false, message: 'Forbidden: Access denied.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, price, billing_cycle, features, is_popular, service_id } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Package ID is required.' }, { status: 400 });
    }

    const pkg = await Package.findByPk(id);
    if (!pkg) {
      return NextResponse.json({ success: false, message: 'Package not found.' }, { status: 404 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = parseFloat(price);
    if (billing_cycle !== undefined) updates.billing_cycle = billing_cycle;
    if (features !== undefined) updates.features = features;
    if (is_popular !== undefined) updates.is_popular = !!is_popular;
    if (service_id !== undefined) updates.service_id = service_id || null;

    await pkg.update(updates);

    return NextResponse.json({ success: true, message: 'Package updated successfully!', package: pkg });
  } catch (error: any) {
    console.error('PUT Package Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update package.', error: error.message }, { status: 500 });
  }
}

// 4. DELETE: Delete a package
export async function DELETE(request: Request) {
  try {
    const authorized = await checkSuperAdmin();
    if (!authorized) {
      return NextResponse.json({ success: false, message: 'Forbidden: Access denied.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Package ID is required.' }, { status: 400 });
    }

    const pkg = await Package.findByPk(id);
    if (!pkg) {
      return NextResponse.json({ success: false, message: 'Package not found.' }, { status: 404 });
    }

    await pkg.destroy();

    return NextResponse.json({ success: true, message: 'Package deleted successfully!' });
  } catch (error: any) {
    console.error('DELETE Package Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete package.', error: error.message }, { status: 500 });
  }
}
