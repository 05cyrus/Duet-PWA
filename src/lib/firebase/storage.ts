import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./client";
import { compressImage } from "../utils";

/**
 * Upload a file under the couple's storage folder and return its URL.
 * Images are compressed client-side before upload.
 */
export async function uploadCoupleFile(
  coupleId: string,
  folder: "gallery" | "timeline" | "chat" | "voice" | "avatars",
  file: File | Blob,
  fileName?: string,
): Promise<string> {
  let data: Blob = file;
  if (file instanceof File && file.type.startsWith("image/") && file.type !== "image/gif") {
    data = await compressImage(file);
  }
  const name = fileName ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const storageRef = ref(storage(), `couples/${coupleId}/${folder}/${name}`);
  await uploadBytes(storageRef, data, {
    contentType: data.type || (file instanceof File ? file.type : "application/octet-stream"),
  });
  return getDownloadURL(storageRef);
}

export async function deleteByUrl(url: string): Promise<void> {
  try {
    await deleteObject(ref(storage(), url));
  } catch {
    // Object may already be gone — deletion is best-effort.
  }
}
