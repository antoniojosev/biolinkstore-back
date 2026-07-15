/**
 * Las URLs de imagenes que devuelve Instagram (via el dataset de Apify) son
 * firmadas y expiran en horas — hay que bajarlas apenas se procesa el post,
 * nunca guardar la URL cruda como si fuera permanente.
 */
export async function downloadImage(
  url: string,
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const mimeType = res.headers.get('content-type') || 'image/jpeg';
    if (!mimeType.startsWith('image/')) return null;
    const arrayBuffer = await res.arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer), mimeType };
  } catch {
    return null;
  }
}
