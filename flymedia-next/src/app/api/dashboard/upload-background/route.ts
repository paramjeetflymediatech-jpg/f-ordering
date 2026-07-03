import { promises as fs, existsSync } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { Store } from '../../../../models';

async function deleteOldFile(fileUrl: string | null | undefined) {
  if (!fileUrl) return;
  try {
    if (fileUrl.startsWith('/backgrounds/')) {
      const relativePath = fileUrl.replace(/^\/backgrounds\//, '');
      const filePath = path.join(process.cwd(), 'public', 'backgrounds', relativePath);
      const resolvedPath = path.resolve(filePath);
      
      const backgroundsDir = path.resolve(path.join(process.cwd(), 'public', 'backgrounds'));
      if (resolvedPath.startsWith(backgroundsDir) && existsSync(resolvedPath)) {
        await fs.unlink(resolvedPath);
        console.log(`[FileDelete] Deleted old background: ${resolvedPath}`);
      }
    }
  } catch (err: any) {
    console.error(`[FileDelete] Failed to delete file ${fileUrl}:`, err.message);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).store_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;
    const store = await Store.findByPk(store_id);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('background');
    const bgColor = formData.get('bgColor');
    const targetScreen = formData.get('targetScreen');

    if (!targetScreen || typeof targetScreen !== 'string') {
      return NextResponse.json({ error: 'No target screen provided' }, { status: 400 });
    }

    if (!file && !bgColor) {
      return NextResponse.json({ error: 'Please provide either an image or a background color' }, { status: 400 });
    }

    let fileUrl: string | null = null;
    if (file && file instanceof Blob) {
      // Determine save path
      const uploadDir = path.join(process.cwd(), 'public', 'backgrounds');
      await fs.mkdir(uploadDir, { recursive: true });
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = (file as any).type.split('/')[1] || 'png';
      const filename = `${targetScreen.toLowerCase()}-${Date.now()}.${ext}`;
      const filePath = path.join(uploadDir, filename);
      await fs.writeFile(filePath, buffer);
      fileUrl = `/backgrounds/${filename}`;
    }

    // Update the appropriate field in the database based on targetScreen
    let oldFileUrl: string | null = null;
    const screenKey = targetScreen.toLowerCase();

    if (screenKey === 'dashboard') {
      if (fileUrl) {
        oldFileUrl = store.bg_dashboard;
        store.bg_dashboard = fileUrl;
      }
      if (bgColor !== null && bgColor !== undefined) {
        store.bg_color_dashboard = bgColor as string;
      }
    } else if (screenKey === 'login') {
      if (fileUrl) {
        oldFileUrl = store.bg_login;
        store.bg_login = fileUrl;
      }
      if (bgColor !== null && bgColor !== undefined) {
        store.bg_color_login = bgColor as string;
      }
    } else if (screenKey === 'menu') {
      if (fileUrl) {
        oldFileUrl = store.bg_menu;
        store.bg_menu = fileUrl;
      }
      if (bgColor !== null && bgColor !== undefined) {
        store.bg_color_menu = bgColor as string;
      }
    } else if (screenKey === 'customerlogin') {
      if (fileUrl) {
        oldFileUrl = store.bg_customer_login;
        store.bg_customer_login = fileUrl;
      }
      if (bgColor !== null && bgColor !== undefined) {
        store.bg_color_customer_login = bgColor as string;
      }
    } else if (screenKey === 'register') {
      if (fileUrl) {
        oldFileUrl = store.bg_register;
        store.bg_register = fileUrl;
      }
      if (bgColor !== null && bgColor !== undefined) {
        store.bg_color_register = bgColor as string;
      }
    } else if (screenKey === 'customerregister') {
      if (fileUrl) {
        oldFileUrl = store.bg_customer_register;
        store.bg_customer_register = fileUrl;
      }
      if (bgColor !== null && bgColor !== undefined) {
        store.bg_color_customer_register = bgColor as string;
      }
    } else if (screenKey === 'book') {
      if (fileUrl) {
        oldFileUrl = store.bg_book;
        store.bg_book = fileUrl;
      }
      if (bgColor !== null && bgColor !== undefined) {
        store.bg_color_book = bgColor as string;
      }
    } else {
      return NextResponse.json({ error: 'Invalid target screen' }, { status: 400 });
    }

    await store.save();

    if (oldFileUrl) {
      await deleteOldFile(oldFileUrl);
    }

    return NextResponse.json({ success: true, message: 'Background settings saved successfully', targetScreen, fileUrl, bgColor }, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).store_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { store_id } = session.user as any;
    const store = await Store.findByPk(store_id);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const screens = [
      { key: 'Dashboard', url: store.bg_dashboard, color: store.bg_color_dashboard, label: 'Admin Dashboard' },
      { key: 'Login', url: store.bg_login, color: store.bg_color_login, label: 'Admin/Business Login' },
      { key: 'Menu', url: store.bg_menu, color: store.bg_color_menu, label: 'Customer Menu / Order Page' },
      { key: 'CustomerLogin', url: store.bg_customer_login, color: store.bg_color_customer_login, label: 'Customer Login Page' },
      { key: 'Register', url: store.bg_register, color: store.bg_color_register, label: 'Business Registration Page' },
      { key: 'CustomerRegister', url: store.bg_customer_register, color: store.bg_color_customer_register, label: 'Customer Signup Page' },
      { key: 'Book', url: store.bg_book, color: store.bg_color_book, label: 'Table Reservation Page' },
    ];

    const list = [];
    for (const screen of screens) {
      if (screen.url || screen.color) {
        let uploadedAt = (store as any).updatedAt || new Date();
        try {
          if (screen.url && screen.url.startsWith('/backgrounds/')) {
            const filename = screen.url.replace(/^\/backgrounds\//, '');
            const filePath = path.join(process.cwd(), 'public', 'backgrounds', filename);
            const stats = await fs.stat(filePath);
            uploadedAt = stats.mtime;
          }
        } catch (e) {
          // ignore, use fallback
        }
        list.push({
          ...screen,
          uploadedAt,
        });
      }
    }

    return NextResponse.json({ success: true, list }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch backgrounds list error:', error);
    return NextResponse.json({ error: 'Failed to fetch backgrounds' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).store_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { store_id } = session.user as any;
    const store = await Store.findByPk(store_id);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const targetScreen = searchParams.get('targetScreen');
    const type = searchParams.get('type') || 'all'; // 'image', 'color', or 'all'

    if (!targetScreen) {
      return NextResponse.json({ error: 'Target screen is required' }, { status: 400 });
    }

    const screenKey = targetScreen.toLowerCase();
    let oldFileUrl: string | null = null;

    if (screenKey === 'dashboard') {
      if (type === 'image' || type === 'all') {
        oldFileUrl = store.bg_dashboard;
        store.bg_dashboard = null;
      }
      if (type === 'color' || type === 'all') {
        store.bg_color_dashboard = null;
      }
    } else if (screenKey === 'login') {
      if (type === 'image' || type === 'all') {
        oldFileUrl = store.bg_login;
        store.bg_login = null;
      }
      if (type === 'color' || type === 'all') {
        store.bg_color_login = null;
      }
    } else if (screenKey === 'menu') {
      if (type === 'image' || type === 'all') {
        oldFileUrl = store.bg_menu;
        store.bg_menu = null;
      }
      if (type === 'color' || type === 'all') {
        store.bg_color_menu = null;
      }
    } else if (screenKey === 'customerlogin') {
      if (type === 'image' || type === 'all') {
        oldFileUrl = store.bg_customer_login;
        store.bg_customer_login = null;
      }
      if (type === 'color' || type === 'all') {
        store.bg_color_customer_login = null;
      }
    } else if (screenKey === 'register') {
      if (type === 'image' || type === 'all') {
        oldFileUrl = store.bg_register;
        store.bg_register = null;
      }
      if (type === 'color' || type === 'all') {
        store.bg_color_register = null;
      }
    } else if (screenKey === 'customerregister') {
      if (type === 'image' || type === 'all') {
        oldFileUrl = store.bg_customer_register;
        store.bg_customer_register = null;
      }
      if (type === 'color' || type === 'all') {
        store.bg_color_customer_register = null;
      }
    } else if (screenKey === 'book') {
      if (type === 'image' || type === 'all') {
        oldFileUrl = store.bg_book;
        store.bg_book = null;
      }
      if (type === 'color' || type === 'all') {
        store.bg_color_book = null;
      }
    } else {
      return NextResponse.json({ error: 'Invalid target screen' }, { status: 400 });
    }

    await store.save();

    if (oldFileUrl) {
      await deleteOldFile(oldFileUrl);
    }

    return NextResponse.json({ success: true, message: `Background ${type} settings cleared successfully` }, { status: 200 });
  } catch (error: any) {
    console.error('Delete background setting error:', error);
    return NextResponse.json({ error: 'Failed to remove background setting' }, { status: 500 });
  }
}
