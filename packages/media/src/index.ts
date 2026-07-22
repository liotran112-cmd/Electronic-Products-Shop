import { clientEnv } from "@repo/env";

/**
 * Cloudinary delivery-URL builder — dependency-free and browser-safe (uses only
 * the public cloud name). Always requests `f_auto,q_auto` for responsive,
 * modern-format delivery (FRONTEND §9). Signed uploads live in `./upload`.
 */
export interface CldTransform {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "limit" | "thumb" | "scale";
  quality?: string | number;
  format?: string;
}

export function cldUrl(publicId: string, t: CldTransform = {}): string {
  const cloud = clientEnv().NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const parts = [
    t.crop && `c_${t.crop}`,
    t.width && `w_${t.width}`,
    t.height && `h_${t.height}`,
    `q_${t.quality ?? "auto"}`,
    `f_${t.format ?? "auto"}`,
  ].filter(Boolean);
  return `https://res.cloudinary.com/${cloud}/image/upload/${parts.join(",")}/${publicId}`;
}
