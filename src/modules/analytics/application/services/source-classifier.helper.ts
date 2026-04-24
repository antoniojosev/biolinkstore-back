/**
 * BE-126: consolidates referrer URLs into a small set of canonical buckets.
 *
 * - Empty / null referrer       => "direct"
 * - instagram.com / l.instagram => "instagram.com"
 * - tiktok.com / vt.tiktok      => "tiktok.com"
 * - facebook.com / m.facebook   => "facebook.com"
 * - twitter.com / x.com         => "twitter.com"
 * - whatsapp.com / wa.me        => "whatsapp.com"
 * - youtube.com / youtu.be      => "youtube.com"
 * - google.com TLDs             => "google"
 * - bing/yahoo/duckduckgo       => "search"
 * - anything else               => its eTLD+1, lowercased
 * - unparseable strings         => "other"
 */
export function classifySource(referrer: string | null | undefined): string {
  if (!referrer || referrer.trim() === '') return 'direct';

  let host: string;
  try {
    const url = new URL(referrer.trim());
    host = url.hostname.toLowerCase();
  } catch {
    return 'other';
  }
  if (!host) return 'other';

  // Strip leading "www." for matching purposes only.
  const normalized = host.replace(/^www\./, '');

  if (normalized.endsWith('instagram.com')) return 'instagram.com';
  if (normalized === 'tiktok.com' || normalized.endsWith('.tiktok.com')) return 'tiktok.com';
  if (normalized.endsWith('facebook.com') || normalized === 'fb.com' || normalized.endsWith('.fb.com')) return 'facebook.com';
  if (normalized === 'twitter.com' || normalized.endsWith('.twitter.com') || normalized === 'x.com' || normalized.endsWith('.x.com')) return 'twitter.com';
  if (normalized === 'whatsapp.com' || normalized.endsWith('.whatsapp.com') || normalized === 'wa.me') return 'whatsapp.com';
  if (normalized === 'youtube.com' || normalized.endsWith('.youtube.com') || normalized === 'youtu.be') return 'youtube.com';
  if (normalized === 'threads.net' || normalized.endsWith('.threads.net')) return 'threads.net';
  if (normalized === 'pinterest.com' || normalized.endsWith('.pinterest.com')) return 'pinterest.com';
  if (normalized === 't.co') return 'twitter.com';
  if (/^(?:[a-z0-9-]+\.)?google\.[a-z.]+$/.test(normalized)) return 'google';
  if (/^(?:[a-z0-9-]+\.)?(bing|duckduckgo|yahoo|yandex)\.[a-z.]+$/.test(normalized)) return 'search';

  // Fallback: collapse subdomains to a 2-label suffix so foo.bar.example.com
  // and example.com share a bucket.
  const labels = normalized.split('.');
  if (labels.length <= 2) return normalized;
  return labels.slice(-2).join('.');
}
