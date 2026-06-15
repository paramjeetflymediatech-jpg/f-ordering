import { NextResponse } from 'next/server';
import { Package, Service } from '../../../../models';

export async function GET() {
  try {
    const packages = await Package.findAll({
      include: [
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'title'],
        },
      ],
      order: [['price', 'ASC']],
    });

    return NextResponse.json({ success: true, packages });
  } catch (error: any) {
    console.error('Public GET Packages Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve packages.', error: error.message },
      { status: 500 }
    );
  }
}
