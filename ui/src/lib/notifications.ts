import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export async function showToastNotification(
  message: string,
  type: NotificationType = 'info'
): Promise<void> {
  try {
    const titles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information',
    };

    const title = titles[type];
    
    let permissionGranted = await isPermissionGranted();
    
    if (!permissionGranted) {
      const permissionResult = await requestPermission();
      permissionGranted = permissionResult === 'granted';
      
      if (!permissionGranted) {
        console.warn('Notification permission not granted');
        return;
      }
    }

    await sendNotification({
      title: title,
      body: message,
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

