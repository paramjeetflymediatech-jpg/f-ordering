import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { Store, Organization } from '../../../../models';
import { deleteUploadedFile } from '../../../../lib/file-utils';
import mysql from 'mysql2/promise';

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

async function renameTenantDatabase(oldSlug: string, newSlug: string) {
  const oldDbName = `tenant_${oldSlug.replace(/-/g, '_')}`;
  const newDbName = `tenant_${newSlug.replace(/-/g, '_')}`;
  
  if (oldDbName === newDbName) return;

  const DB_HOST = process.env.DB_HOST || '127.0.0.1';
  const DB_PORT = parseInt(process.env.DB_PORT || '3306');
  const DB_USER = process.env.DB_USER || 'root';
  const DB_PASS = process.env.DB_PASSWORD || '';

  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
  });

  try {
    // Check if old database exists
    const [dbs]: any = await conn.query('SHOW DATABASES LIKE ?', [oldDbName]);
    if (dbs.length === 0) {
      console.log(`[RenameDB] Old database ${oldDbName} does not exist. Skipping rename.`);
      return;
    }

    // Create the new database
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${newDbName}\`;`);

    // Get all tables from the old database
    const [tables]: any = await conn.query(`SHOW TABLES FROM \`${oldDbName}\`;`);
    
    for (const row of tables) {
      const tableName = Object.values(row)[0] as string;
      // Rename table from old database to new database
      await conn.query(`RENAME TABLE \`${oldDbName}\`.\`${tableName}\` TO \`${newDbName}\`.\`${tableName}\`;`);
    }

    // Drop the old database
    await conn.query(`DROP DATABASE IF EXISTS \`${oldDbName}\`;`);
    console.log(`[RenameDB] Successfully renamed database ${oldDbName} to ${newDbName}.`);
  } catch (err: any) {
    console.error(`[RenameDB] Failed to rename database:`, err.message);
    throw new Error(`Database migration failed: ${err.message}`);
  } finally {
    await conn.end();
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
    if (body.logo !== undefined && body.logo !== organization.logo) {
      await deleteUploadedFile(organization.logo);
      orgUpdates.logo = body.logo;
    }

    // Handle Subdomain Slug Change
    if (body.slug !== undefined && body.slug !== organization.slug) {
      const cleanSlug = body.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');
      if (!cleanSlug) {
        return NextResponse.json({ error: 'Subdomain slug cannot be empty.' }, { status: 400 });
      }

      // Check if slug is taken by another organization
      const existingOrg = await Organization.findOne({ where: { slug: cleanSlug } });
      if (existingOrg && existingOrg.id !== organization.id) {
        return NextResponse.json({ error: 'This subdomain slug is already in use.' }, { status: 409 });
      }

      // Rename MySQL tenant database table by table
      await renameTenantDatabase(organization.slug, cleanSlug);
      orgUpdates.slug = cleanSlug;
    }
    
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
    if (body.banner !== undefined && body.banner !== store.banner) {
      await deleteUploadedFile(store.banner);
      storeUpdates.banner = body.banner;
    }
    if (body.themePrimaryColor !== undefined) storeUpdates.theme_primary_color = body.themePrimaryColor;
    if (body.themeAccentColor !== undefined) storeUpdates.theme_accent_color = body.themeAccentColor;
    if (body.themeBgColor !== undefined) storeUpdates.theme_bg_color = body.themeBgColor;
    if (body.themeLayout !== undefined) storeUpdates.theme_layout = body.themeLayout;
    if (body.themeFont !== undefined) storeUpdates.theme_font = body.themeFont;
      // Include business hours if edited
      if (body.businessHours && Object.keys(body.businessHours).length > 0) {
        storeUpdates.business_hours = body.businessHours;
      }

    if (Object.keys(storeUpdates).length > 0) {
      await store.update(storeUpdates);
    }

    const io = (request as any).io || (global as any).__socketIo;
    if (io) {
      io.to(store.id).emit('store_update');
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
