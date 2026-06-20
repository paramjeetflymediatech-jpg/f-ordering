import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { DeliveryZone, DeliveryRule } from '../../../../models';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;

    const zones = await DeliveryZone.findAll({
      where: { store_id },
      include: [
        {
          model: DeliveryRule,
          as: 'rules',
        },
      ],
      order: [['created_at', 'ASC']],
    });

    return NextResponse.json({ success: true, zones });
  } catch (error: any) {
    console.error('Fetch Delivery Zones Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
      type, // 'zone' | 'rule'
      // Zone fields
      name, 
      zoneType, // 'RADIAL DISTANCE' | 'ZIPCODE'
      country, 
      distance, 
      state, 
      city, 
      zip, 
      locality,
      // Rule fields
      zoneId,
      sequence,
      charge,
      estimatedDelivery,
      minOrderValue,
      freeDeliveryAbove,
      startDate,
      endDate,
      provider,
      chargeByItem,
      description
    } = body;

    if (type === 'zone') {
      if (!name) {
        return NextResponse.json({ error: 'Zone Name is required' }, { status: 400 });
      }

      const zone = await DeliveryZone.create({
        organization_id,
        store_id,
        name,
        type: zoneType || 'ZIPCODE',
        country: country || 'Australia',
        distance: distance ? parseInt(distance) : null,
        state: state || null,
        city: city || null,
        zip: zip || null,
        locality: locality || null,
        is_active: true,
      });

      return NextResponse.json({ success: true, zone });
    }

    if (type === 'rule') {
      if (!zoneId || !name || charge === undefined || !startDate || !endDate) {
        return NextResponse.json({ error: 'Zone ID, Rule Name, Charge, Start/End Dates are required' }, { status: 400 });
      }

      const rule = await DeliveryRule.create({
        delivery_zone_id: zoneId,
        name,
        sequence: sequence ? parseInt(sequence) : 1,
        charge: parseFloat(charge),
        estimated_delivery: estimatedDelivery ? parseInt(estimatedDelivery) : 30,
        min_order_value: minOrderValue ? parseFloat(minOrderValue) : 0,
        free_delivery_above: freeDeliveryAbove ? parseFloat(freeDeliveryAbove) : 999999999,
        start_date: startDate,
        end_date: endDate,
        provider: provider || 'Self Managed',
        charge_by_item: !!chargeByItem,
        description: description || null,
      });

      return NextResponse.json({ success: true, rule });
    }

    return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 });
  } catch (error: any) {
    console.error('Create Delivery Zone/Rule Error:', error);
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
      type, // 'zone' | 'rule'
      id,
      // Zone fields
      name, 
      zoneType,
      country, 
      distance, 
      state, 
      city, 
      zip, 
      locality,
      isActive,
      // Rule fields
      sequence,
      charge,
      estimatedDelivery,
      minOrderValue,
      freeDeliveryAbove,
      startDate,
      endDate,
      provider,
      chargeByItem,
      description
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (type === 'zone') {
      await DeliveryZone.update(
        {
          name,
          type: zoneType,
          country,
          distance: distance !== undefined ? (distance ? parseInt(distance) : null) : undefined,
          state,
          city,
          zip,
          locality,
          is_active: isActive,
        },
        { where: { id } }
      );
      return NextResponse.json({ success: true });
    }

    if (type === 'rule') {
      await DeliveryRule.update(
        {
          name,
          sequence: sequence !== undefined ? parseInt(sequence) : undefined,
          charge: charge !== undefined ? parseFloat(charge) : undefined,
          estimated_delivery: estimatedDelivery !== undefined ? parseInt(estimatedDelivery) : undefined,
          min_order_value: minOrderValue !== undefined ? parseFloat(minOrderValue) : undefined,
          free_delivery_above: freeDeliveryAbove !== undefined ? parseFloat(freeDeliveryAbove) : undefined,
          start_date: startDate,
          end_date: endDate,
          provider,
          charge_by_item: chargeByItem !== undefined ? !!chargeByItem : undefined,
          description,
        },
        { where: { id } }
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid update type' }, { status: 400 });
  } catch (error: any) {
    console.error('Update Delivery Zone/Rule Error:', error);
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
    const type = searchParams.get('type'); // 'zone' | 'rule'

    if (!id || !type) {
      return NextResponse.json({ error: 'ID and Type are required' }, { status: 400 });
    }

    if (type === 'zone') {
      await DeliveryZone.destroy({ where: { id } });
      return NextResponse.json({ success: true });
    }

    if (type === 'rule') {
      await DeliveryRule.destroy({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid delete type' }, { status: 400 });
  } catch (error: any) {
    console.error('Delete Delivery Zone/Rule Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
