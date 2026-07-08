import { NextResponse } from 'next/server';
import { Store, RestaurantTable, Organization } from '../../../../models';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const orgSlug = searchParams.get('orgSlug');

    if (!storeId && !orgSlug) {
      return NextResponse.json({ error: 'Store ID or Organization Slug is required' }, { status: 400 });
    }

    let store = null;

    if (orgSlug) {
      const org = await Organization.findOne({ where: { slug: orgSlug } });
      if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      
      store = await Store.findOne({
        where: { organization_id: org.id },
        include: [{ model: Organization, attributes: ['name', 'logo'] }]
      });
    } else {
      store = await Store.findByPk(storeId!, {
        include: [{ model: Organization, attributes: ['name', 'logo'] }]
      });
    }

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const tables = await RestaurantTable.findAll({
      where: { store_id: store.id },
      order: [['table_number', 'ASC']],
    });

    return NextResponse.json({
      success: true,
      store,
      tables,
    });
  } catch (error: any) {
    console.error('Fetch Public Store Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve store info.', error: error.message },
      { status: 500 }
    );
  }
}
