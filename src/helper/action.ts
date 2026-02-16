import { createUserActionApi } from "../api/userActionApi/LogApi";
import { createNotificationApi } from "../api/userActionApi/notificationApi";

/**
 * Helper to log user actions and send notifications.
 * @param title - The module name (e.g., "Client", "Company")
 * @param action - The description (e.g., "Opened Client Module" or "Client 'ABC' deleted")
 * @param sendNotification - If true, sends to the Notification Bell. If false, only logs to User Action.
 */
export const actionHelper = async (
  title: string, 
  action: string, 
  sendNotification: boolean = false 
) => {
  try {
    // 1. Always log to User Action page
    await createUserActionApi({ title, action });

    // 2. Only log to Bell if it's an important event (Add/Update/Delete)
    if (sendNotification) {
      await createNotificationApi({ 
        title: title, 
        description: action 
      });
    }
  } catch (error) {
    console.error("Action Helper Error:", error);
  }
};