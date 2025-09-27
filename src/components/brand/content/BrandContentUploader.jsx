import React, { useState } from "react";
import { db, storage } from '@/lib/firebase';
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { toast } from "sonner";

const MAX_SIZE_MB = 200; // video cap

export default function BrandContentUploader({ brandId }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);

  const handleUpload = () => {
    if (!file || !title) return toast.error("Missing title or file");
    const mb = file.size / (1024 * 1024);
    if (mb > MAX_SIZE_MB) return toast.error("File exceeds 200 MB limit");

    const storageRef = ref(storage, `brands/${brandId}/content/${file.name}`);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      (snap) => {
        setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
      },
      (err) => toast.error(err.message),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        await addDoc(collection(db, "brands", brandId, "content"), {
          title,
          url,
          sizeMB: mb,
          type: file.type,
          createdAt: serverTimestamp(),
        });
        toast.success("Content uploaded!");
        setFile(null);
        setTitle("");
        setProgress(0);
      }
    );
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg bg-white">
      <h2 className="font-playfair text-xl">Upload New Content</h2>
      <input
        className="border p-2 w-full"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        type="file"
        accept="video/*,image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      {progress > 0 && (
        <div className="w-full bg-gray-200 h-2 rounded">
          <div
            className="bg-accent h-2 rounded"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
      <button
        className="bg-accent text-white px-4 py-2 rounded font-semibold"
        onClick={handleUpload}
      >
        Upload
      </button>
    </div>
  );
}