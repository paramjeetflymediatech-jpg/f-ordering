import { NextResponse } from 'next/server';
import { MenuCategory, MenuItem, MenuVariant, MenuAddon, MenuBase, Organization, Store } from '../../../../models';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const orgSlug = searchParams.get('orgSlug');

    if (!storeId && !orgSlug) {
      return NextResponse.json({ error: 'Store ID or Organization Slug is required' }, { status: 400 });
    }

    let finalStoreId = storeId;

    if (orgSlug) {
      const org = await Organization.findOne({ where: { slug: orgSlug } });
      if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      
      const store = await Store.findOne({ where: { organization_id: org.id } });
      if (!store) {
        return NextResponse.json({ error: 'Store not found' }, { status: 404 });
      }
      finalStoreId = store.id;
    }

    const categories = await MenuCategory.findAll({
      where: {
        store_id: finalStoreId!,
        is_active: true,
      },
      order: [['sort_order', 'ASC']],
      include: [
        {
          model: MenuItem,
          where: { is_available: true },
          required: false,
          include: [
            { model: MenuVariant, as: 'variants' },
            { model: MenuAddon, as: 'addons' },
            { model: MenuBase, as: 'bases' },
          ],
        },
      ],
    });

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    console.error('Fetch Public Menu Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve menu.', error: error.message },
      { status: 500 }
    );
  }
}
