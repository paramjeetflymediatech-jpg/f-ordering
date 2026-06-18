import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../../lib/auth';
import { Organization } from '../../../../../../models';
import { provisionTenantDatabase } from '../../../../../../lib/tenant-db';

async function checkSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.roles?.includes('Super Admin')) return false;
  return true;
}

/**
 * POST /api/super-admin/organizations/[id]/provision
 * Provisions an isolated MySQL tenant database for the given organization.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authorized = await checkSuperAdmin();
    if (!authorized) {
      return NextResponse.json({ success: false, message: 'Forbidden: Access denied.' }, { status: 403 });
    }

    const { id } = await params;

    const org = await Organization.findByPk(id);
    if (!org) {
      return NextResponse.json({ success: false, message: 'Organization not found.' }, { status: 404 });
    }

    await provisionTenantDatabase(org.slug);

    return NextResponse.json({
      success: true,
      message: `Tenant database provisioned successfully for '${org.name}'.`,
      dbName: `tenant_${org.slug.replace(/-/g, '_')}`,
    });
  } catch (error: any) {
    console.error('Provision Tenant DB Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to provision tenant database.', error: error.message },
      { status: 500 }
    );
  }
}
