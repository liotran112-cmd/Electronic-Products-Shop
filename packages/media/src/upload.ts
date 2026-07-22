import { v2 as cloudinary } from "cloudinary";

import { serverEnv } from "@repo/env";

/**
 * SERVER-ONLY signed-upload helper. Backs quote-attachment / firmware uploads:
 * the browser gets a short-lived signature and uploads directly to Cloudinary,
 * so large engineering files never transit our server (CUSTOM-DEVICE §4).
 */
function configure() {
  const env = serverEnv();
  if (!env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary signing requires CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET");
  }
  cloudinary.config({
    cloud_name: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  return env.CLOUDINARY_API_SECRET;
}

export interface SignedUpload {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export function signUpload(folder: string, timestamp: number): SignedUpload {
  const secret = configure();
  const env = serverEnv();
  const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, secret);
  return {
    signature,
    timestamp,
    apiKey: env.CLOUDINARY_API_KEY as string,
    cloudName: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    folder,
  };
}
