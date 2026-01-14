import { invoke } from '@tauri-apps/api/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Shows a toast notification to the user
 * 
 * Uses the backend notification system that properly registers the app
 * with Windows to show notifications with the correct app name and icon.
 * 
 * @param message - The notification message to display
 * @param type - The type of notification (success, error, warning, info)
 */
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
    
    console.log(`[Notification] Attempting to send: ${title} - ${message}`);
    
    // Send notification using backend command that properly registers the app
    await invoke('send_notification', {
      title: title,
      body: message,
    });
    
    console.log(`[Notification] Successfully sent: ${title} - ${message}`);
  } catch (error) {
    console.error('[Notification] Error showing notification:', error);
    // Log the full error details for debugging
    if (error instanceof Error) {
      console.error('[Notification] Error message:', error.message);
      console.error('[Notification] Error stack:', error.stack);
    }
    // Don't throw - just log the error so the app continues to work
  }
}

