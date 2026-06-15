import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { Service, Package } from '../../../../models';

// Helper to check Super Admin authorization
async function checkSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.roles?.includes('Super Admin')) {
    return false;
  }
  return true;
}

// 1. GET: List all services
export async function GET() {
  try {
    const authorized = await checkSuperAdmin();
    if (!authorized) {
      return NextResponse.json({ success: false, message: 'Forbidden: Access denied.' }, { status: 403 });
    }

    const services = await Service.findAll({
      include: [
        {
          model: Package,
          as: 'packages',
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return NextResponse.json({ success: true, services });
  } catch (error: any) {
    console.error('GET Services Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to retrieve services.', error: error.message }, { status: 500 });
  }
}

// 2. POST: Create a new service
export async function POST(request: Request) {
  try {
    const authorized = await checkSuperAdmin();
    if (!authorized) {
      return NextResponse.json({ success: false, message: 'Forbidden: Access denied.' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, icon, color, highlights } = body;

    if (!title || !description) {
      return NextResponse.json({ success: false, message: 'Title and description are required.' }, { status: 400 });
    }

    const service = await Service.create({
      title,
      description,
      icon: icon || 'Sparkles',
      color: color || 'text-orange-500 bg-orange-500/10 border-orange-500/20',
      highlights: highlights || [],
    });

    return NextResponse.json({ success: true, message: 'Service created successfully!', service });
  } catch (error: any) {
    console.error('POST Service Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create service.', error: error.message }, { status: 500 });
  }
}

// 3. PUT: Update a service
export async function PUT(request: Request) {
  try {
    const authorized = await checkSuperAdmin();
    if (!authorized) {
      return NextResponse.json({ success: false, message: 'Forbidden: Access denied.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, title, description, icon, color, highlights } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Service ID is required.' }, { status: 400 });
    }

    const service = await Service.findByPk(id);
    if (!service) {
      return NextResponse.json({ success: false, message: 'Service not found.' }, { status: 404 });
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (icon !== undefined) updates.icon = icon;
    if (color !== undefined) updates.color = color;
    if (highlights !== undefined) updates.highlights = highlights;

    await service.update(updates);

    return NextResponse.json({ success: true, message: 'Service updated successfully!', service });
  } catch (error: any) {
    console.error('PUT Service Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update service.', error: error.message }, { status: 500 });
  }
}

// 4. DELETE: Delete a service
export async function DELETE(request: Request) {
  try {
    const authorized = await checkSuperAdmin();
    if (!authorized) {
      return NextResponse.json({ success: false, message: 'Forbidden: Access denied.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Service ID is required.' }, { status: 400 });
    }

    const service = await Service.findByPk(id);
    if (!service) {
      return NextResponse.json({ success: false, message: 'Service not found.' }, { status: 404 });
    }

    await service.destroy();

    return NextResponse.json({ success: true, message: 'Service deleted successfully!' });
  } catch (error: any) {
    console.error('DELETE Service Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete service.', error: error.message }, { status: 500 });
  }
}
