export type MediaSubType = 'image' | 'video' | 'pdf' | 'link';

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|bmp|ico|avif)(\?.*)?$/i;
const VIDEO_EXT = /\.(mp4|webm|ogg|mov|avi|mkv|m4v)(\?.*)?$/i;
const PDF_EXT   = /\.pdf(\?.*)?$/i;

// Match file ID from sharing, edit, preview, open, or download/uc URLs from Google Drive
const GD_REGEX = /(?:drive|docs)\.google\.com\/(?:[^\/]+\/)*?(?:file\/d\/|open\?id=|uc\?(?:[^\&]*\&)*?id=)([^/\?&#]+)/i;

export function isGoogleDriveUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return GD_REGEX.test(url.trim());
}

export function resolveMediaUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return "";
  const trimmed = url.trim();
  const match = trimmed.match(GD_REGEX);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return trimmed;
}

export function detectMediaType(url: string | undefined | null): MediaSubType {
  if (!url || typeof url !== 'string') return 'link';
  const trimmed = url.trim();
  if (IMAGE_EXT.test(trimmed)) return 'image';
  if (VIDEO_EXT.test(trimmed)) return 'video';
  if (PDF_EXT.test(trimmed)) return 'pdf';
  if (isGoogleDriveUrl(trimmed)) return 'image';
  return 'link';
}

