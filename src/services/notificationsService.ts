import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// expo-notifications crashes at module init in Expo Go (SDK 53 removed push support).
// A static import runs the module factory immediately — guard with conditional require()
// so the factory never executes in Expo Go.
type NotificationsModule = typeof import('expo-notifications');

const isExpoGo = Constants.executionEnvironment === 'storeClient';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Notifs: NotificationsModule | null = isExpoGo ? null : require('expo-notifications');

export async function registerForPushNotifications(uid: string): Promise<void> {
  if (!Notifs || !Device.isDevice) return;

  Notifs.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  const { status: existingStatus } = await Notifs.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifs.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  try {
    const token = (await Notifs.getExpoPushTokenAsync()).data;
    await updateDoc(doc(db, 'users', uid), { fcmToken: token });
  } catch {
    // Requires a valid EAS projectId — safe to ignore in local dev
  }
}

export function addNotificationTapListener(
  onTap: (data: Record<string, string>) => void,
): { remove: () => void } {
  if (!Notifs) return { remove: () => {} };
  return Notifs.addNotificationResponseReceivedListener((response) => {
    const data = (response.notification.request.content.data ?? {}) as Record<string, string>;
    onTap(data);
  });
}
