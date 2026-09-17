import { useEffect } from 'react';
import { seoConfig } from '@/utils/seo.config';

export interface SeoMetaOptions {
  title: string;
  description?: string;
  keywords?: string;
  path?: string;
}

function setMeta(value: string, attr: 'name' | 'property', content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${value}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, value);
    document.head.appendChild(element);
  }

  element.content = content;
}

function setLink(rel: string, href: string): void {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }

  element.href = href;
}

export function useSeoMeta({ title, description, keywords, path }: SeoMetaOptions): void {
  useEffect(() => {
    const canonicalUrl = seoConfig.siteUrl && path ? `${seoConfig.siteUrl}${path}` : undefined;
    const pageDescription = description ?? seoConfig.siteDescription;
    const pageKeywords = keywords ?? seoConfig.keywords;

    document.title = title;
    setMeta('description', 'name', pageDescription);
    setMeta('keywords', 'name', pageKeywords);
    setMeta('referrer', 'name', seoConfig.referrer);
    setMeta('og:type', 'property', seoConfig.ogType);
    setMeta('og:title', 'property', title);
    setMeta('og:description', 'property', pageDescription);
    setMeta('og:site_name', 'property', seoConfig.siteName);
    setMeta('og:image', 'property', seoConfig.ogImage);
    setMeta('og:image:width', 'property', seoConfig.ogImageWidth);
    setMeta('og:image:height', 'property', seoConfig.ogImageHeight);
    setMeta('article:publisher', 'property', seoConfig.articlePublisher);
    setMeta('twitter:card', 'name', seoConfig.twitterCard);
    setMeta('twitter:site', 'name', seoConfig.twitterHandle);
    setMeta('twitter:title', 'name', title);
    setMeta('twitter:description', 'name', pageDescription);
    setMeta('twitter:image', 'name', seoConfig.ogImage);

    if (canonicalUrl && path) {
      setLink('canonical', canonicalUrl);
      setMeta('og:url', 'property', canonicalUrl);
      setMeta('twitter:url', 'name', canonicalUrl);
    }
  }, [description, keywords, path, title]);
}
