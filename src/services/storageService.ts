import * as FileSystem from 'expo-file-system/legacy';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadListingPhotos(
  listingId: string,
  uris: string[],
): Promise<string[]> {
  const urls = await Promise.all(
    uris.map(async (uri, i) => {
      // Read as base64 — works with Expo Go's sandboxed file:// cache URIs
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as FileSystem.EncodingType,
      });
      const storageRef = ref(storage, `listings/${listingId}/photo_${i}.jpg`);
      await uploadString(storageRef, base64, 'base64', { contentType: 'image/jpeg' });
      return getDownloadURL(storageRef);
    }),
  );
  return urls;
}
