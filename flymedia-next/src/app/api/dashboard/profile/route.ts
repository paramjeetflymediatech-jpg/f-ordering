import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { Store, Organization } from '../../../../models';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id, organization_id } = session.user as any;

    const store = await Store.findByPk(store_id);
    const organization = await Organization.findByPk(organization_id);

    if (!store) {
      // Return a successful response with empty store data instead of 404 to avoid breaking the dashboard
      return NextResponse.json({
        success: false,
        message: 'Store not found',
        store: null,
        organization,
      });
    }

    return NextResponse.json({
      success: true,
      store,
      organization,
    });
  } catch (error: any) {
    console.error('Fetch Profile Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id, organization_id } = session.user as any;
    const body = await request.json();

    const store = await Store.findByPk(store_id);
    const organization = await Organization.findByPk(organization_id);

    if (!store || !organization) {
      return NextResponse.json({ error: 'Store or Organization not found' }, { status: 404 });
    }

    // Update Organization fields if provided
    const orgUpdates: any = {};
    if (body.companyName !== undefined) orgUpdates.name = body.companyName;
    if (body.logo !== undefined) orgUpdates.logo = body.logo;
    
    if (Object.keys(orgUpdates).length > 0) {
      await organization.update(orgUpdates);
    }

    // Update Store fields if provided
    const storeUpdates: any = {};
    if (body.profileName !== undefined) storeUpdates.name = body.profileName;
    if (body.category !== undefined) storeUpdates.category = body.category;
    if (body.address !== undefined) storeUpdates.address = body.address;
    if (body.zipCode !== undefined) storeUpdates.zip_code = body.zipCode;
    if (body.state !== undefined) storeUpdates.state = body.state;
    if (body.city !== undefined) storeUpdates.city = body.city;
    if (body.country !== undefined) storeUpdates.country = body.country;
    if (body.phone !== undefined) storeUpdates.phone = body.phone;
    if (body.email !== undefined) storeUpdates.email = body.email;
    if (body.currency !== undefined) storeUpdates.currency = body.currency;
    if (body.website !== undefined) storeUpdates.website = body.website;
    if (body.description !== undefined) storeUpdates.description = body.description;
    if (body.banner !== undefined) storeUpdates.banner = body.banner;
    if (body.themePrimaryColor !== undefined) storeUpdates.theme_primary_color = body.themePrimaryColor;
    if (body.themeAccentColor !== undefined) storeUpdates.theme_accent_color = body.themeAccentColor;
    if (body.themeBgColor !== undefined) storeUpdates.theme_bg_color = body.themeBgColor;
    if (body.themeLayout !== undefined) storeUpdates.theme_layout = body.themeLayout;
    if (body.themeFont !== undefined) storeUpdates.theme_font = body.themeFont;

    if (Object.keys(storeUpdates).length > 0) {
      await store.update(storeUpdates);
    }

    return NextResponse.json({
      success: true,
      message: 'Business profile updated successfully',
      store,
      organization,
    });
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
