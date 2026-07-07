import { NextResponse } from 'next/server';
import { Store, DeliveryZone } from '../../../../../models';

function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

export async function POST(request: Request) {
  try {
    const { storeId, lat, lng, address, zipcode } = await request.json();

    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Store ID is required' }, { status: 400 });
    }

    const store = await Store.findByPk(storeId);
    if (!store) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const zones = await DeliveryZone.findAll({
      where: { store_id: storeId, is_active: true }
    });

    // If there are no delivery zones configured, default to true (delivery allowed everywhere)
    if (zones.length === 0) {
      return NextResponse.json({ success: true, allowed: true, message: 'No delivery zones restricted. Delivery is possible!' });
    }

    // Try matching zipcode if available
    let cleanZip = zipcode?.trim().toLowerCase();
    if (!cleanZip && address) {
      const zipMatch = address.match(/\b\d{4,5}\b/);
      if (zipMatch) {
        cleanZip = zipMatch[0].toLowerCase();
      }
    }

    let storeCoords: { lat: number; lng: number } | null = null;

    for (const zone of zones) {
      if (zone.type === 'ZIPCODE') {
        if (zone.zip && cleanZip) {
          const zips = zone.zip.split(',').map((z: string) => z.trim().toLowerCase());
          if (zips.includes(cleanZip)) {
            return NextResponse.json({ success: true, allowed: true, zoneName: zone.name, message: `Delivery is possible within "${zone.name}".` });
          }
        }
      } else if (zone.type === 'RADIAL DISTANCE' && lat && lng) {
        if (!storeCoords) {
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(store.address)}&limit=1`,
              {
                headers: {
                  'User-Agent': 'FlymediaNextApp/1.0'
                }
              }
            );
            const geoData = await geoRes.json();
            if (geoData && geoData[0]) {
              storeCoords = {
                lat: parseFloat(geoData[0].lat),
                lng: parseFloat(geoData[0].lon)
              };
            }
          } catch (err) {
            console.error('Failed to geocode store address:', err);
          }
        }

        if (storeCoords && zone.distance) {
          const calculatedDistance = getHaversineDistance(storeCoords.lat, storeCoords.lng, parseFloat(lat), parseFloat(lng));
          if (calculatedDistance <= zone.distance) {
            return NextResponse.json({
              success: true,
              allowed: true,
              zoneName: zone.name,
              message: `Delivery is possible within "${zone.name}" (${calculatedDistance.toFixed(2)} km away).`
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      allowed: false,
      message: 'Delivery is not possible to this location (does not match any active delivery zones).'
    });
  } catch (error: any) {
    console.error('Validate Delivery Zone Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
