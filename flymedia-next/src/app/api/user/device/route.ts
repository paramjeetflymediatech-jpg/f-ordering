import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { UserDevice } from '../../../../models';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fcmToken, deviceType, lastLoginDevice } = body;

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Invalid session user ID' }, { status: 400 });
    }

    // Capture device details
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const deviceDescription = lastLoginDevice || userAgent.substring(0, 250);
    const resolvedDeviceType = deviceType || (userAgent.toLowerCase().includes('android') ? 'android' : userAgent.toLowerCase().includes('iphone') || userAgent.toLowerCase().includes('ipad') ? 'ios' : 'web');

    let deviceRecord = null;

    if (fcmToken) {
      // If we have an FCM token, locate the device token under this user
      deviceRecord = await UserDevice.findOne({
        where: {
          user_id: userId,
          fcmToken: fcmToken
        }
      });
    } else {
      // If no push token is present (web browser), match by user_id and device description
      deviceRecord = await UserDevice.findOne({
        where: {
          user_id: userId,
          lastLoginDevice: deviceDescription
        }
      });
    }

    if (deviceRecord) {
      // Update existing device
      await deviceRecord.update({
        fcmToken: fcmToken !== undefined ? fcmToken : deviceRecord.fcmToken,
        deviceType: resolvedDeviceType,
        lastActive: new Date()
      });
    } else {
      // Register new device
      await UserDevice.create({
        user_id: userId,
        fcmToken: fcmToken || null,
        deviceType: resolvedDeviceType,
        lastLoginDevice: deviceDescription,
        lastActive: new Date()
      });
    }

    return NextResponse.json({ success: true, message: 'Device registered successfully' });
  } catch (error: any) {
    console.error('Error registering device token:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
