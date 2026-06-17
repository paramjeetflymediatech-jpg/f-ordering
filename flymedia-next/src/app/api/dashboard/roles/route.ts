import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { Role } from '../../../../models';

// GET - fetch all assignable roles (excludes Super Admin which is system-only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roles = await Role.findAll({
      where: {},
      attributes: ['id', 'name', 'description'],
      order: [['name', 'ASC']],
    });

    // Filter out Super Admin — it should never be assignable from this panel
    const assignable = roles.filter((r) => r.name !== 'Super Admin');

    return NextResponse.json({ success: true, roles: assignable });
  } catch (error: any) {
    console.error('Fetch Roles Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
