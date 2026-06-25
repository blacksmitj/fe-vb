export type MediaSubType = 'image' | 'video' | 'pdf' | 'link';

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|bmp|ico|avif)(\?.*)?$/i;
const VIDEO_EXT = /\.(mp4|webm|ogg|mov|avi|mkv|m4v)(\?.*)?$/i;
const PDF_EXT   = /\.pdf(\?.*)?$/i;

export function detectMediaType(url: string | undefined | null): MediaSubType {
  if (!url || typeof url !== 'string') return 'link';
  const trimmed = url.trim();
  if (IMAGE_EXT.test(trimmed)) return 'image';
  if (VIDEO_EXT.test(trimmed)) return 'video';
  if (PDF_EXT.test(trimmed)) return 'pdf';
  return 'link';
}
