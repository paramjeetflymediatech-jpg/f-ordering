import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { User, Role, Organization } from '../../../../models';
import { getTenantModels } from '../../../../lib/tenant-db';
import bcrypt from 'bcryptjs';

// GET - list all staff belonging to the current restaurant only
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id, organization_id } = session.user as any;

    // Strict scoping: both store_id AND organization_id must match
    const staff = await User.findAll({
      where: { store_id, organization_id },
      include: [
        {
          model: Role,
          through: { attributes: [] },
          attributes: ['id', 'name'],
        },
      ],
      attributes: ['id', 'name', 'email', 'phone', 'status', 'createdAt'],
      order: [['createdAt', 'ASC']],
    });

    return NextResponse.json({ success: true, staff });
  } catch (error: any) {
    console.error('Fetch Staff Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - create a new staff account for this restaurant
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id, organization_id } = session.user as any;
    const body = await request.json();
    const { name, email, phone, password, roleName } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      organization_id,
      store_id,
      name,
      email,
      phone: phone || null,
      password: hashedPassword,
      status: 'active',
    });

    if (roleName) {
      const role = await Role.findOne({ where: { name: roleName } });
      if (role) await (newUser as any).addRole(role);
    }

    // Sync to tenant database
    try {
      const org = await Organization.findByPk(organization_id);
      if (org) {
        const tenantModels = await getTenantModels(org.slug);
        const tenantUser = await tenantModels.User.create({
          id: newUser.id,
          organization_id,
          store_id,
          name,
          email,
          phone: phone || null,
          password: hashedPassword,
          status: 'active',
        });
        
        if (roleName) {
          const tenantRole = await tenantModels.Role.findOne({ where: { name: roleName } });
          if (tenantRole) await (tenantUser as any).addRole(tenantRole);
        }
      }
    } catch (err: any) {
      console.error('Failed to sync created staff to tenant DB:', err.message);
    }

    return NextResponse.json({
      success: true,
      message: `Staff account for "${name}" created successfully.`,
    });
  } catch (error: any) {
    console.error('Create Staff Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - update an existing staff member's details
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id, organization_id } = session.user as any;
    const body = await request.json();
    const { id, name, email, phone, password, roleName, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    // Must belong to this restaurant
    const user = await User.findOne({ where: { id, store_id, organization_id } });
    if (!user) {
      return NextResponse.json({ error: 'Staff account not found in this restaurant.' }, { status: 404 });
    }

    // Prevent editing Super Admin accounts from this panel
    const existingRoles = await (user as any).getRoles();
    const isSuperAdmin = existingRoles.some((r: any) => r.name === 'Super Admin');
    if (isSuperAdmin) {
      return NextResponse.json({ error: 'Super Admin accounts cannot be edited from this panel.' }, { status: 403 });
    }

    // Check new email is not taken by another user
    if (email && email !== user.email) {
      const emailTaken = await User.findOne({ where: { email } });
      if (emailTaken) {
        return NextResponse.json({ error: 'This email address is already in use.' }, { status: 409 });
      }
    }

    const updates: any = {};
    if (name)              updates.name   = name;
    if (email)             updates.email  = email;
    if (phone !== undefined) updates.phone = phone || null;
    if (status)            updates.status = status;
    if (password && password.trim().length >= 6) {
      updates.password = await bcrypt.hash(password, 10);
    }

    await user.update(updates);

    if (roleName) {
      const newRole = await Role.findOne({ where: { name: roleName } });
      if (newRole) await (user as any).setRoles([newRole]);
    }

    // Sync to tenant database
    try {
      const org = await Organization.findByPk(organization_id);
      if (org) {
        const tenantModels = await getTenantModels(org.slug);
        await tenantModels.User.update(updates, { where: { id } });
        
        if (roleName) {
          const tenantUser = await tenantModels.User.findByPk(id);
          const tenantRole = await tenantModels.Role.findOne({ where: { name: roleName } });
          if (tenantUser && tenantRole) {
            await (tenantUser as any).setRoles([tenantRole]);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to sync updated staff to tenant DB:', err.message);
    }

    return NextResponse.json({
      success: true,
      message: `Staff account "${name || user.name}" updated successfully.`,
    });
  } catch (error: any) {
    console.error('Update Staff Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - permanently remove a staff account from this restaurant
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id, organization_id, id: currentUserId } = session.user as any;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }
    if (userId === currentUserId) {
      return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 403 });
    }

    const user = await User.findOne({ where: { id: userId, store_id, organization_id } });
    if (!user) {
      return NextResponse.json({ error: 'Staff account not found in this restaurant.' }, { status: 404 });
    }

    const roles = await (user as any).getRoles();
    const isSuperAdmin = roles.some((r: any) => r.name === 'Super Admin');
    if (isSuperAdmin) {
      return NextResponse.json({ error: 'Super Admin accounts cannot be removed from this panel.' }, { status: 403 });
    }

    await user.destroy();

    // Sync to tenant database
    try {
      const org = await Organization.findByPk(organization_id);
      if (org) {
        const tenantModels = await getTenantModels(org.slug);
        await tenantModels.User.destroy({ where: { id: userId } });
      }
    } catch (err: any) {
      console.error('Failed to sync deleted staff to tenant DB:', err.message);
    }

    return NextResponse.json({ success: true, message: `Staff account "${user.name}" has been removed.` });
  } catch (error: any) {
    console.error('Delete Staff Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
