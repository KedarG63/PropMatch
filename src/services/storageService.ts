import * as FileSystem from 'expo-file-system/legacy';
import { auth } from './firebase';

const BUCKET = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '';

export async function uploadListingPhotos(
  listingId: string,
  uris: string[],
): Promise<string[]> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Not authenticated');

  const urls = await Promise.all(
    uris.map(async (uri, i) => {
      const storagePath = `listings/${listingId}/photo_${i}.jpg`;
      const encodedPath = encodeURIComponent(storagePath);
      const uploadUrl =
        `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o` +
        `?uploadType=media&name=${encodedPath}`;

      // uploadAsync uses the native HTTP client — reads Expo Go's sandboxed
      // file:// URIs correctly, no Blob/ArrayBuffer needed
      const result = await FileSystem.uploadAsync(uploadUrl, uri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          'Content-Type': 'image/jpeg',
          Authorization: `Bearer ${token}`,
        },
      });

      if (result.status < 200 || result.status >= 300) {
        throw new Error(`Upload failed (${result.status}): ${result.body}`);
      }

      const data = JSON.parse(result.body) as { downloadTokens?: string };
      return (
        `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/` +
        `${encodedPath}?alt=media&token=${data.downloadTokens}`
      );
    }),
  );
  return urls;
}
