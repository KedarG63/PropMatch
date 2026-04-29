import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

// fetch() does not handle file:// URIs in React Native — XHR does
function localUriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error(`Failed to read file: ${uri}`));
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

export async function uploadListingPhotos(
  listingId: string,
  uris: string[],
): Promise<string[]> {
  const urls = await Promise.all(
    uris.map(async (uri, i) => {
      const blob = await localUriToBlob(uri);
      const storageRef = ref(storage, `listings/${listingId}/photo_${i}.jpg`);
      await uploadBytes(storageRef, blob);
      return getDownloadURL(storageRef);
    }),
  );
  return urls;
}
