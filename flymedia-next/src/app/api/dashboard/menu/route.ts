import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { MenuCategory, MenuItem, MenuVariant, MenuAddon } from '../../../../models';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id, store_id } = session.user as any;
    const body = await request.json();
    const { type, name, categoryId, description, price, imageUrl } = body;

    if (type === 'category') {
      if (!name) {
        return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
      }
      
      const count = await MenuCategory.count({ where: { store_id } });
      const category = await MenuCategory.create({
        organization_id,
        store_id,
        name,
        sort_order: count + 1,
        is_active: true,
      });

      return NextResponse.json({ success: true, category });
    } 
    
    if (type === 'item') {
      if (!name || !categoryId || price === undefined) {
        return NextResponse.json({ error: 'Name, Category, and Price are required' }, { status: 400 });
      }

      const item = await MenuItem.create({
        organization_id,
        store_id,
        category_id: categoryId,
        name,
        description: description || '',
        price: parseFloat(price),
        image_url: imageUrl || null,
        is_available: true,
      });

      return NextResponse.json({ success: true, item });
    }

    return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 });
  } catch (error: any) {
    console.error('Create Menu Asset Error:', error);
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
    const { type, id, name, description, price, imageUrl, isAvailable } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (type === 'category') {
      await MenuCategory.update({ name }, { where: { id } });
      return NextResponse.json({ success: true });
    }

    if (type === 'item') {
      await MenuItem.update(
        {
          name,
          description,
          price: price !== undefined ? parseFloat(price) : undefined,
          image_url: imageUrl,
          is_available: isAvailable,
        },
        { where: { id } }
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid update type' }, { status: 400 });
  } catch (error: any) {
    console.error('Update Menu Asset Error:', error);
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
    const type = searchParams.get('type');

    if (!id || !type) {
      return NextResponse.json({ error: 'ID and Type are required' }, { status: 400 });
    }

    if (type === 'category') {
      await MenuCategory.destroy({ where: { id } });
      return NextResponse.json({ success: true });
    }

    if (type === 'item') {
      await MenuItem.destroy({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid delete type' }, { status: 400 });
  } catch (error: any) {
    console.error('Delete Menu Asset Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
