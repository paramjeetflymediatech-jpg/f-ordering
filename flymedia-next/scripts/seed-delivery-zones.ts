import { Store, DeliveryZone, DeliveryRule } from '../src/models';
import { sequelize } from '../src/lib/db';

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const stores = await Store.findAll();
    if (stores.length === 0) {
      console.log('No stores found in database. Please run/open the app first.');
      process.exit(0);
    }

    for (const store of stores) {
      console.log(`Seeding delivery zones for store: ${store.name} (ID: ${store.id})`);
      
      // Delete existing to allow re-runs and test refreshes
      await DeliveryZone.destroy({ where: { store_id: store.id } });

      // 1. Radial Distance zone (10 km)
      const radialZone = await DeliveryZone.create({
        organization_id: store.organization_id,
        store_id: store.id,
        name: 'Local Radial Zone (10 km)',
        type: 'RADIAL DISTANCE',
        country: store.country || 'Australia',
        distance: 10,
        is_active: true
      });

      await DeliveryRule.create({
        delivery_zone_id: radialZone.id,
        name: 'Radial Rule 1',
        sequence: 1,
        charge: 5.00,
        min_order_value: 20.00,
        free_delivery_above: 50.00,
        estimated_delivery: 30,
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        is_active: true
      });

      // 2. Zipcode zone (2000, 2001, 2002)
      const zipZone = await DeliveryZone.create({
        organization_id: store.organization_id,
        store_id: store.id,
        name: 'Central Zipcode Zone',
        type: 'ZIPCODE',
        country: store.country || 'Australia',
        zip: '2000, 2001, 2002',
        state: store.state || 'NSW',
        city: store.city || 'Sydney',
        is_active: true
      });

      await DeliveryRule.create({
        delivery_zone_id: zipZone.id,
        name: 'Zipcode Rule 1',
        sequence: 1,
        charge: 8.00,
        min_order_value: 25.00,
        free_delivery_above: 60.00,
        estimated_delivery: 45,
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        is_active: true
      });

      console.log(`✅ Successfully seeded Radial (10km) and Zipcodes (2000, 2001, 2002) delivery zones for: ${store.name}!`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Failed to seed delivery zones:', error);
    process.exit(1);
  }
}

seed();
