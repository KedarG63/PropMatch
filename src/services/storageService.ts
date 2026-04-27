import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadListingPhotos(
  listingId: string,
  uris: string[],
): Promise<string[]> {
  const urls = await Promise.all(
    uris.map(async (uri, i) => {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `listings/${listingId}/photo_${i}.jpg`);
      await uploadBytes(storageRef, blob);
      return getDownloadURL(storageRef);
    }),
  );
  return urls;
}
