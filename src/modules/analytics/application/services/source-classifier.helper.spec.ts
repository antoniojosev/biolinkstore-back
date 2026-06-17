import { classifySource } from './source-classifier.helper';

describe('classifySource', () => {
  it('treats null/empty as direct', () => {
    expect(classifySource(null)).toBe('direct');
    expect(classifySource(undefined)).toBe('direct');
    expect(classifySource('')).toBe('direct');
    expect(classifySource('   ')).toBe('direct');
  });

  it('consolidates instagram subdomains', () => {
    expect(classifySource('https://www.instagram.com/abc')).toBe('instagram.com');
    expect(classifySource('https://l.instagram.com/?u=foo')).toBe('instagram.com');
    expect(classifySource('https://instagram.com/store/123')).toBe('instagram.com');
  });

  it('consolidates tiktok subdomains', () => {
    expect(classifySource('https://www.tiktok.com/@foo')).toBe('tiktok.com');
    expect(classifySource('https://vt.tiktok.com/abcd/')).toBe('tiktok.com');
  });

  it('consolidates twitter / x', () => {
    expect(classifySource('https://twitter.com/foo')).toBe('twitter.com');
    expect(classifySource('https://x.com/foo')).toBe('twitter.com');
    expect(classifySource('https://t.co/short')).toBe('twitter.com');
  });

  it('consolidates whatsapp and facebook', () => {
    expect(classifySource('https://wa.me/123')).toBe('whatsapp.com');
    expect(classifySource('https://web.whatsapp.com/')).toBe('whatsapp.com');
    expect(classifySource('https://www.facebook.com/page')).toBe('facebook.com');
    expect(classifySource('https://m.facebook.com/page')).toBe('facebook.com');
  });

  it('groups google TLDs into "google"', () => {
    expect(classifySource('https://www.google.com/search?q=x')).toBe('google');
    expect(classifySource('https://www.google.co.ve/')).toBe('google');
  });

  it('groups other search engines into "search"', () => {
    expect(classifySource('https://www.bing.com/search?q=x')).toBe('search');
    expect(classifySource('https://duckduckgo.com/?q=x')).toBe('search');
  });

  it('falls back to eTLD+1 for unknown domains', () => {
    expect(classifySource('https://shop.example.com.ve/')).toBe('com.ve');
    expect(classifySource('https://example.com/foo')).toBe('example.com');
    expect(classifySource('https://blog.medium.com/')).toBe('medium.com');
  });

  it('returns "other" for unparseable strings', () => {
    expect(classifySource('not a url')).toBe('other');
    expect(classifySource('http://')).toBe('other');
  });
});
