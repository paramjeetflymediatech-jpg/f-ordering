import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { Store } from '../../../../models';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id } = session.user as any;

    const locations = await Store.findAll({
      where: { organization_id },
      order: [['created_at', 'ASC']],
    });

    return NextResponse.json({ success: true, locations });
  } catch (error: any) {
    console.error('Fetch Locations Error:', error);
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
    const {
      name,
      phone,
      email,
      address,
      city,
      state,
      zip_code,
      country,
      category,
      description,
    } = body;

    if (!name || !address || !phone) {
      return NextResponse.json({ error: 'Name, Address, and Phone are required' }, { status: 400 });
    }

    const location = await Store.create({
      organization_id,
      name,
      address,
      phone,
      email: email || null,
      city: city || null,
      state: state || null,
      zip_code: zip_code || null,
      country: country || 'Australia',
      category: category || 'Restaurants',
      description: description || null,
      tax_rate: 5.00,
    });

    return NextResponse.json({ success: true, location });
  } catch (error: any) {
    console.error('Create Location Error:', error);
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
    const {
      id,
      name,
      phone,
      email,
      address,
      city,
      state,
      zip_code,
      country,
      category,
      description,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { organization_id } = session.user as any;

    await Store.update(
      {
        name,
        phone,
        email,
        address,
        city,
        state,
        zip_code,
        country,
        category,
        description,
      },
      { where: { id, organization_id } }
    );

    const io = (request as any).io || (global as any).__socketIo;
    if (io) {
      io.to(id).emit('store_update');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update Location Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { organization_id } = session.user as any;

    // Check if it's the only store
    const count = await Store.count({ where: { organization_id } });
    if (count <= 1) {
      return NextResponse.json({ error: 'Cannot delete the only location of this organization' }, { status: 400 });
    }

    await Store.destroy({ where: { id, organization_id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete Location Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
