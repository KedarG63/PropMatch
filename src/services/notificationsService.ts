import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// Push notifications were removed from Expo Go in SDK 53 — guard every call
const isExpoGo = Constants.executionEnvironment === 'storeClient';

export async function registerForPushNotifications(uid: string): Promise<void> {
  if (isExpoGo || !Device.isDevice) return;

  // setNotificationHandler must not be called at module scope — it crashes Expo Go on load
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await updateDoc(doc(db, 'users', uid), { fcmToken: token });
  } catch {
    // Fails without a valid EAS projectId — safe to ignore in dev
  }
}

export function addNotificationTapListener(
  onTap: (data: Record<string, string>) => void,
): Notifications.Subscription {
  if (isExpoGo) {
    // Return a no-op subscription so callers can call .remove() safely
    return { remove: () => {} } as unknown as Notifications.Subscription;
  }
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = (response.notification.request.content.data ?? {}) as Record<string, string>;
    onTap(data);
  });
}
