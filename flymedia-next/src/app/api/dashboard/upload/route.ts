import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { Organization } from '../../../../models';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id } = session.user as any;
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Fetch organization slug
    const org = await Organization.findByPk(organization_id);
    const slug = org ? org.slug : 'default';

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const type = formData.get('type') as string | null;
    const isLogo = type === 'logo';
    const isBanner = type === 'banner';

    // Save to uploads/{slug}/logo, uploads/{slug}/banner or uploads/{slug}/menu
    const subFolder = isLogo ? 'logo' : isBanner ? 'banner' : 'menu';
    const prefix = isLogo ? 'logo' : isBanner ? 'banner' : 'menu-item';

    const uploadDir = path.join(process.cwd(), 'uploads', slug, subFolder);
    await mkdir(uploadDir, { recursive: true });

    // Extract file extension cleanly
    const originalName = file.name || 'image.png';
    const ext = path.extname(originalName) || '.png';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${prefix}-${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    const relativeUrl = `/uploads/${slug}/${subFolder}/${filename}`;

    return NextResponse.json({ success: true, url: relativeUrl });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
