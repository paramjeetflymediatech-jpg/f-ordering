import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { MenuCategory, MenuItem, MenuVariant, MenuAddon, MenuBase } from '../../../models';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id, store_id } = session.user as any;

    const categories = await MenuCategory.findAll({
      where: {
        organization_id,
        store_id,
        is_active: true,
      },
      order: [['sort_order', 'ASC']],
      include: [
        {
          model: MenuItem,
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
    console.error('Fetch Menu Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch menu.', error: error.message },
      { status: 500 }
    );
  }
}
