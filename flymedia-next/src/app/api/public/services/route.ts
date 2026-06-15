import { NextResponse } from 'next/server';
import { Service, Package } from '../../../../models';

export async function GET() {
  try {
    const services = await Service.findAll({
      include: [
        {
          model: Package,
          as: 'packages',
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    return NextResponse.json({ success: true, services });
  } catch (error: any) {
    console.error('Public GET Services Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve services.', error: error.message },
      { status: 500 }
    );
  }
}
