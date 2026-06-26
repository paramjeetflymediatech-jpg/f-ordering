import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    
    // 1. Check in root-level 'uploads' directory
    let filePath = path.join(process.cwd(), 'uploads', ...pathSegments);
    let resolvedPath = path.resolve(filePath);
    const uploadsDir = path.resolve(path.join(process.cwd(), 'uploads'));

    // Prevent directory traversal
    if (!resolvedPath.startsWith(uploadsDir)) {
      return new Response('Forbidden', { status: 403 });
    }

    // 2. If it doesn't exist in root uploads, check in public/uploads
    if (!existsSync(resolvedPath)) {
      const publicFilePath = path.join(process.cwd(), 'public', 'uploads', ...pathSegments);
      const resolvedPublicPath = path.resolve(publicFilePath);
      const publicUploadsDir = path.resolve(path.join(process.cwd(), 'public', 'uploads'));

      if (resolvedPublicPath.startsWith(publicUploadsDir) && existsSync(resolvedPublicPath)) {
        resolvedPath = resolvedPublicPath;
      } else {
        return new Response('Not Found', { status: 404 });
      }
    }

    const fileBuffer = await readFile(resolvedPath);
    
    // Determine content type from file extension
    const ext = path.extname(resolvedPath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.pdf') contentType = 'application/pdf';

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return new Response('Not Found', { status: 404 });
  }
}
