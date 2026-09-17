/* eslint-disable testing-library/no-node-access */
import { afterEach, describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { classic } from '@/variants/classic';
import { seoConfig } from '@/utils/seo.config';
import { useSeoMeta } from './useSeoMeta';

function metaContent(selector: string): string | undefined {
  return document.head.querySelector<HTMLMetaElement>(selector)?.content;
}

function expectCommonMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  const canonicalUrl = `${seoConfig.siteUrl}${path}`;

  expect(document.title).toBe(title);
  expect(metaContent('meta[name="description"]')).toBe(description);
  expect(metaContent('meta[name="keywords"]')).toBe(seoConfig.keywords);
  expect(metaContent('meta[name="referrer"]')).toBe(seoConfig.referrer);
  expect(metaContent('meta[property="og:type"]')).toBe(seoConfig.ogType);
  expect(metaContent('meta[property="og:title"]')).toBe(title);
  expect(metaContent('meta[property="og:description"]')).toBe(description);
  expect(metaContent('meta[property="og:url"]')).toBe(canonicalUrl);
  expect(metaContent('meta[property="og:site_name"]')).toBe(seoConfig.siteName);
  expect(metaContent('meta[property="og:image"]')).toBe(seoConfig.ogImage);
  expect(metaContent('meta[property="og:image:width"]')).toBe(seoConfig.ogImageWidth);
  expect(metaContent('meta[property="og:image:height"]')).toBe(seoConfig.ogImageHeight);
  expect(metaContent('meta[property="article:publisher"]')).toBe(seoConfig.articlePublisher);
  expect(metaContent('meta[name="twitter:card"]')).toBe(seoConfig.twitterCard);
  expect(metaContent('meta[name="twitter:site"]')).toBe(seoConfig.twitterHandle);
  expect(metaContent('meta[name="twitter:title"]')).toBe(title);
  expect(metaContent('meta[name="twitter:description"]')).toBe(description);
  expect(metaContent('meta[name="twitter:image"]')).toBe(seoConfig.ogImage);
  expect(metaContent('meta[name="twitter:url"]')).toBe(canonicalUrl);
  expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
    canonicalUrl
  );
}

describe('useSeoMeta', () => {
  afterEach(() => {
    document.title = '';
  });

  it('should set home page metadata', () => {
    expect.hasAssertions();

    renderHook(() =>
      useSeoMeta({
        title: seoConfig.siteTitle,
        description: seoConfig.siteDescription,
        path: '/',
      })
    );

    expectCommonMetadata({
      title: seoConfig.siteTitle,
      description: seoConfig.siteDescription,
      path: '/',
    });
  });

  it('should set route-specific metadata', () => {
    expect.hasAssertions();

    renderHook(() =>
      useSeoMeta({
        title: `${classic.name} | ${seoConfig.publisherName}`,
        description: classic.description,
        path: '/classic',
      })
    );

    expectCommonMetadata({
      title: `Classic Sudoku | ${seoConfig.publisherName}`,
      description: classic.description,
      path: '/classic',
    });
  });

  it('should update metadata when navigating between home and a variant', () => {
    expect.hasAssertions();

    const { rerender } = renderHook(
      ({ title, description, path }: { title: string; description: string; path: string }) =>
        useSeoMeta({ title, description, path }),
      {
        initialProps: {
          title: seoConfig.siteTitle,
          description: seoConfig.siteDescription,
          path: '/',
        } as { title: string; description: string; path: string },
      }
    );

    rerender({
      title: `${classic.name} | ${seoConfig.publisherName}`,
      description: classic.description,
      path: '/classic',
    });

    expectCommonMetadata({
      title: `Classic Sudoku | ${seoConfig.publisherName}`,
      description: classic.description,
      path: '/classic',
    });
  });
});
