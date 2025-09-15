import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../lib/firebase';

/**
 * Uploads a profile image to Firebase Storage
 * @param {File|Blob} fileOrBlob - The file or blob to upload
 * @returns {Promise<{url: string, path: string}>} The download URL and storage path
 * @throws {Error} If user is not signed in
 */
export async function uploadProfileImage(fileOrBlob) {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in');

  const uid = user.uid;
  const ext = (fileOrBlob.type && fileOrBlob.type.split('/')[1]) || 'jpg';
  const filename = `${Date.now()}.${ext}`;
  const path = `profile_images/${uid}/${filename}`;

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, fileOrBlob, {
    contentType: fileOrBlob.type || 'image/jpeg',
  });

  const url = await getDownloadURL(storageRef);
  return { url, path };
}
