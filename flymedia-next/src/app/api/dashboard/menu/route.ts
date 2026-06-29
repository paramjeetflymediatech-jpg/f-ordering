import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { MenuCategory, MenuItem, MenuVariant, MenuAddon, Organization } from '../../../../models';
import { getTenantModels } from '../../../../lib/tenant-db';
import { deleteUploadedFile } from '../../../../lib/file-utils';


// Helper function to recursively ensure categories exist in the tenant database
async function ensureCategorySynced(categoryId: string, organizationId: string, storeId: string, tenantModels: any) {
  if (!categoryId || categoryId === 'uncategorized') return;

  try {
    // Check if category already exists in tenant DB
    const tenantCat = await tenantModels.MenuCategory.findByPk(categoryId);
    if (tenantCat) return; // Already exists

    // Fetch from main DB
    const mainCat = await MenuCategory.findByPk(categoryId);
    if (!mainCat) return; // Doesn't exist in main DB either

    // If this category has a parent, recursively sync the parent first
    if (mainCat.parent_id) {
      await ensureCategorySynced(mainCat.parent_id, organizationId, storeId, tenantModels);
    }

    // Create in tenant DB
    await tenantModels.MenuCategory.create({
      id: mainCat.id,
      organization_id: mainCat.organization_id || organizationId,
      store_id: mainCat.store_id || storeId,
      name: mainCat.name,
      sort_order: mainCat.sort_order,
      is_active: mainCat.is_active,
      parent_id: mainCat.parent_id,
      printer_category: mainCat.printer_category,
    });
  } catch (err: any) {
    console.error(`Failed to auto-sync category ${categoryId} to tenant DB:`, err.message);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id, store_id } = session.user as any;
    const body = await request.json();
    const { 
      type, 
      name, 
      categoryId, 
      description, 
      price, 
      imageUrl,
      parentId,
      printerCategory,
      // For multi-level creation
      categoryName,
      subcategoryName,
      // Item additions
      barcode,
      sku,
      stockCount,
      unit,
      variants,
      addons
    } = body;

    if (type === 'category') {
      if (!name) {
        return NextResponse.json({ error: 'Category/Menu name is required' }, { status: 400 });
      }
      
      const count = await MenuCategory.count({ where: { store_id, parent_id: parentId || null } });
      
      // If we are creating a 3-level catalog details layout in one go:
      const mainCategory = await MenuCategory.create({
        organization_id,
        store_id,
        name,
        sort_order: count + 1,
        is_active: true,
        parent_id: parentId || null,
        printer_category: printerCategory || null,
      });

      let level1Category = null;
      let level2Category = null;

      if (categoryName && categoryName.trim()) {
        level1Category = await MenuCategory.create({
          organization_id,
          store_id,
          name: categoryName.trim(),
          sort_order: 1,
          is_active: true,
          parent_id: mainCategory.id,
          printer_category: printerCategory || null,
        });

        if (subcategoryName && subcategoryName.trim()) {
          level2Category = await MenuCategory.create({
            organization_id,
            store_id,
            name: subcategoryName.trim(),
            sort_order: 1,
            is_active: true,
            parent_id: level1Category.id,
            printer_category: printerCategory || null,
          });
        }
      }

      // Sync to tenant database
      try {
        const org = await Organization.findByPk(organization_id);
        if (org) {
          const tenantModels = await getTenantModels(org.slug);
          
          await tenantModels.MenuCategory.create({
            id: mainCategory.id,
            organization_id,
            store_id,
            name,
            sort_order: count + 1,
            is_active: true,
            parent_id: parentId || null,
            printer_category: printerCategory || null,
          });

          if (level1Category) {
            await tenantModels.MenuCategory.create({
              id: level1Category.id,
              organization_id,
              store_id,
              name: categoryName.trim(),
              sort_order: 1,
              is_active: true,
              parent_id: mainCategory.id,
              printer_category: printerCategory || null,
            });
          }

          if (level2Category) {
            await tenantModels.MenuCategory.create({
              id: level2Category.id,
              organization_id,
              store_id,
              name: subcategoryName.trim(),
              sort_order: 1,
              is_active: true,
              parent_id: level1Category!.id,
              printer_category: printerCategory || null,
            });
          }
        }
      } catch (err: any) {
        console.error('Failed to sync created category to tenant DB:', err.message);
      }

      return NextResponse.json({ 
        success: true, 
        category: mainCategory,
        level1Category,
        level2Category
      });
    } 
    
    if (type === 'item') {
      if (!name || price === undefined) {
        return NextResponse.json({ error: 'Name and Price are required' }, { status: 400 });
      }

      const item = await MenuItem.create({
        organization_id,
        store_id,
        category_id: categoryId || 'uncategorized', // Allow uncategorized if categoryId is empty
        name,
        description: description || '',
        price: parseFloat(price),
        image_url: imageUrl || null,
        is_available: true,
        barcode: barcode || null,
        sku: sku || null,
        stock_count: stockCount !== undefined ? parseInt(stockCount) : 0,
        unit: unit || 'pcs',
      });

      // Create Menu Variants (Main DB)
      if (variants && Array.isArray(variants)) {
        for (const v of variants) {
          await MenuVariant.create({
            menu_item_id: item.id,
            name: v.name,
            additional_price: parseFloat(v.additional_price) || 0.00,
          });
        }
      }

      // Create Menu Addons (Main DB)
      if (addons && Array.isArray(addons)) {
        for (const a of addons) {
          await MenuAddon.create({
            menu_item_id: item.id,
            name: a.name,
            price: parseFloat(a.price) || 0.00,
          });
        }
      }

      // Sync to tenant database
      try {
        const org = await Organization.findByPk(organization_id);
        if (org) {
          const tenantModels = await getTenantModels(org.slug);
          
          // Auto-sync category if missing
          if (categoryId) {
            await ensureCategorySynced(categoryId, organization_id, store_id, tenantModels);
          }

          await tenantModels.MenuItem.create({
            id: item.id,
            organization_id,
            store_id,
            category_id: categoryId || 'uncategorized',
            name,
            description: description || '',
            price: parseFloat(price),
            image_url: imageUrl || null,
            is_available: true,
            barcode: barcode || null,
            sku: sku || null,
            stock_count: stockCount !== undefined ? parseInt(stockCount) : 0,
            unit: unit || 'pcs',
          });

          // Sync variants to tenant DB
          if (variants && Array.isArray(variants)) {
            for (const v of variants) {
              await tenantModels.MenuVariant.create({
                menu_item_id: item.id,
                name: v.name,
                additional_price: parseFloat(v.additional_price) || 0.00,
              });
            }
          }

          // Sync addons to tenant DB
          if (addons && Array.isArray(addons)) {
            for (const a of addons) {
              await tenantModels.MenuAddon.create({
                menu_item_id: item.id,
                name: a.name,
                price: parseFloat(a.price) || 0.00,
              });
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to sync created menu item to tenant DB:', err.message);
      }

      return NextResponse.json({ success: true, item });
    }

    if (type === 'sort_categories') {
      const { orders } = body; // Array of { id: string, sort_order: number }
      if (!orders || !Array.isArray(orders)) {
        return NextResponse.json({ error: 'Orders array is required' }, { status: 400 });
      }

      for (const item of orders) {
        await MenuCategory.update({ sort_order: item.sort_order }, { where: { id: item.id } });
      }

      return NextResponse.json({ success: true });
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
    const { 
      type, 
      id, 
      name, 
      description, 
      price, 
      imageUrl, 
      isAvailable, 
      parentId, 
      printerCategory,
      barcode,
      sku,
      stockCount,
      unit,
      categoryId,
      variants,
      addons
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { organization_id } = session.user as any;

    if (type === 'category') {
      await MenuCategory.update({ 
        name,
        parent_id: parentId !== undefined ? parentId : undefined,
        printer_category: printerCategory !== undefined ? printerCategory : undefined,
      }, { where: { id } });

      // Sync to tenant database
      try {
        const org = await Organization.findByPk(organization_id);
        if (org) {
          const tenantModels = await getTenantModels(org.slug);
          await tenantModels.MenuCategory.update({ 
            name,
            parent_id: parentId !== undefined ? parentId : undefined,
            printer_category: printerCategory !== undefined ? printerCategory : undefined,
          }, { where: { id } });
        }
      } catch (err: any) {
        console.error('Failed to sync updated category to tenant DB:', err.message);
      }

      return NextResponse.json({ success: true });
    }

    if (type === 'item') {
      const oldItem = await MenuItem.findByPk(id);
      if (imageUrl !== undefined && oldItem && oldItem.image_url && oldItem.image_url !== imageUrl) {
        await deleteUploadedFile(oldItem.image_url);
      }

      await MenuItem.update(
        {
          name,
          description,
          price: price !== undefined ? parseFloat(price) : undefined,
          image_url: imageUrl,
          is_available: isAvailable,
          barcode: barcode !== undefined ? barcode : undefined,
          sku: sku !== undefined ? sku : undefined,
          stock_count: stockCount !== undefined ? parseInt(stockCount) : undefined,
          unit: unit !== undefined ? unit : undefined,
          category_id: categoryId !== undefined ? categoryId : undefined,
        },
        { where: { id } }
      );

      // Save Variants & Addons (Main DB)
      if (variants && Array.isArray(variants)) {
        await MenuVariant.destroy({ where: { menu_item_id: id } });
        for (const v of variants) {
          await MenuVariant.create({
            menu_item_id: id,
            name: v.name,
            additional_price: parseFloat(v.additional_price) || 0.00,
          });
        }
      }

      if (addons && Array.isArray(addons)) {
        await MenuAddon.destroy({ where: { menu_item_id: id } });
        for (const a of addons) {
          await MenuAddon.create({
            menu_item_id: id,
            name: a.name,
            price: parseFloat(a.price) || 0.00,
          });
        }
      }

      // Sync to tenant database
      try {
        const org = await Organization.findByPk(organization_id);
        if (org) {
          const tenantModels = await getTenantModels(org.slug);

          // Auto-sync category if missing
          const targetCategoryId = categoryId !== undefined ? categoryId : (oldItem ? oldItem.category_id : null);
          if (targetCategoryId) {
            const storeId = oldItem ? oldItem.store_id : '';
            await ensureCategorySynced(targetCategoryId, organization_id, storeId, tenantModels);
          }

          await tenantModels.MenuItem.update(
            {
              name,
              description,
              price: price !== undefined ? parseFloat(price) : undefined,
              image_url: imageUrl,
              is_available: isAvailable,
              barcode: barcode !== undefined ? barcode : undefined,
              sku: sku !== undefined ? sku : undefined,
              stock_count: stockCount !== undefined ? parseInt(stockCount) : undefined,
              unit: unit !== undefined ? unit : undefined,
              category_id: categoryId !== undefined ? categoryId : undefined,
            },
            { where: { id } }
          );

          // Sync variants to tenant DB (delete & recreate)
          if (variants && Array.isArray(variants)) {
            await tenantModels.MenuVariant.destroy({ where: { menu_item_id: id } });
            for (const v of variants) {
              await tenantModels.MenuVariant.create({
                menu_item_id: id,
                name: v.name,
                additional_price: parseFloat(v.additional_price) || 0.00,
              });
            }
          }

          // Sync addons to tenant DB (delete & recreate)
          if (addons && Array.isArray(addons)) {
            await tenantModels.MenuAddon.destroy({ where: { menu_item_id: id } });
            for (const a of addons) {
              await tenantModels.MenuAddon.create({
                menu_item_id: id,
                name: a.name,
                price: parseFloat(a.price) || 0.00,
              });
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to sync updated menu item to tenant DB:', err.message);
      }

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

    const { organization_id } = session.user as any;

    if (type === 'category') {
      await MenuCategory.destroy({ where: { id } });

      // Sync to tenant database
      try {
        const org = await Organization.findByPk(organization_id);
        if (org) {
          const tenantModels = await getTenantModels(org.slug);
          await tenantModels.MenuCategory.destroy({ where: { id } });
        }
      } catch (err: any) {
        console.error('Failed to sync deleted category to tenant DB:', err.message);
      }

      return NextResponse.json({ success: true });
    }

    if (type === 'item') {
      const item = await MenuItem.findByPk(id);
      if (item && item.image_url) {
        await deleteUploadedFile(item.image_url);
      }

      await MenuItem.destroy({ where: { id } });

      // Sync to tenant database
      try {
        const org = await Organization.findByPk(organization_id);
        if (org) {
          const tenantModels = await getTenantModels(org.slug);
          await tenantModels.MenuItem.destroy({ where: { id } });
        }
      } catch (err: any) {
        console.error('Failed to sync deleted menu item to tenant DB:', err.message);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid delete type' }, { status: 400 });
  } catch (error: any) {
    console.error('Delete Menu Asset Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
