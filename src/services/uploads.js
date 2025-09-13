// src/services/uploads.js
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '@/lib/firebase'; // if @ alias isn't set, use: ../lib/firebase

export async function uploadVerificationPhoto(fileOrBlob) {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in');

  const uid = user.uid;
  const ext = (fileOrBlob.type && fileOrBlob.type.split('/')[1]) || 'jpg';
  const filename = `verifications/${Date.now()}.${ext}`;

  // Use user_uploads path (works with your revised rules)
  // If you prefer your existing folder, swap to: `verification_photos/${uid}/${filename}`
  const path = `user_uploads/${uid}/${filename}`;

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, fileOrBlob, {
    contentType: fileOrBlob.type || 'image/jpeg',
  });

  const url = await getDownloadURL(storageRef);
  return { url, path };
}