import { useEffect } from 'react';
import { seoConfig } from '@/utils/seo.config';

export interface SeoMetaOptions {
  title: string;
  description?: string;
  keywords?: string;
  /** Relative path for this page, e.g. "/" or "/learn/01-01". Used to build canonical URL. */
  path?: string;
}

function setMeta(value: string, attr: 'name' | 'property', content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${value}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  el.content = content;
}

function removeMeta(value: string, attr: 'name' | 'property') {
  document.head.querySelector(`meta[${attr}="${value}"]`)?.remove();
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function removeLink(rel: string) {
  document.head.querySelector(`link[rel="${rel}"]`)?.remove();
}

export function useSeoMeta({ title, description, keywords, path }: SeoMetaOptions) {
  useEffect(() => {
    const canonicalUrl = seoConfig.siteUrl && path ? `${seoConfig.siteUrl}${path}` : undefined;
    const kw = keywords ?? seoConfig.keywords;

    if (description) {
      setMeta('description', 'name', description);
      setMeta('og:description', 'property', description);
      setMeta('twitter:description', 'name', description);
    } else {
      removeMeta('description', 'name');
      removeMeta('og:description', 'property');
      removeMeta('twitter:description', 'name');
    }

    if (kw) {
      setMeta('keywords', 'name', kw);
    }

    if (seoConfig.siteName) {
      setMeta('og:site_name', 'property', seoConfig.siteName);
    } else {
      removeMeta('og:site_name', 'property');
    }

    setMeta('og:title', 'property', title);
    setMeta('twitter:title', 'name', title);

    if (canonicalUrl) {
      setLink('canonical', canonicalUrl);
      setMeta('og:url', 'property', canonicalUrl);
      setMeta('twitter:url', 'name', canonicalUrl);
    } else {
      removeLink('canonical');
      removeMeta('og:url', 'property');
      removeMeta('twitter:url', 'name');
    }
  }, [title, description, keywords, path]);
}
