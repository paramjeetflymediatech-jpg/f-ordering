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

// POST - create a new custom role (restricted to Restaurant Owners & Super Admins)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRoles = (session.user as any).roles || [];
    const isAuthorized = userRoles.includes('Super Admin') || userRoles.includes('Restaurant Owner');
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Prevent creating Super Admin manually
    if (trimmedName.toLowerCase() === 'super admin') {
      return NextResponse.json({ error: 'Cannot create system-reserved roles' }, { status: 400 });
    }

    // Check if role name already exists
    const existing = await Role.findOne({ where: { name: trimmedName } });
    if (existing) {
      return NextResponse.json({ error: 'Role already exists' }, { status: 400 });
    }

    const newRole = await Role.create({
      name: trimmedName,
      description: description || null,
    });

    return NextResponse.json({
      success: true,
      message: `Role "${trimmedName}" created successfully.`,
      role: newRole,
    });
  } catch (error: any) {
    console.error('Create Role Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
