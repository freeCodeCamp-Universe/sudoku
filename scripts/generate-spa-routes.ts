/**
 * Post-build script: generate dist/<variantId>/index.html for every registered
 * puzzle variant, so any static host can resolve deep links like /classic and
 * /killer to a real file on disk with route-specific SEO metadata.
 *
 * React Router then handles the route client-side.
 *
 * Run automatically as part of `pnpm build`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { variantRegistry } from '../src/variants/registry';
import { seoConfig } from '../src/utils/seo.config';

const dist = resolve(process.cwd(), 'dist');
const template = readFileSync(resolve(dist, 'index.html'), 'utf8');
let count = 0;

function buildJsonLd(
  title: string,
  description: string,
  canonicalPath: string,
  type: 'WebSite' | 'WebPage'
): string {
  const canonicalUrl = `${seoConfig.siteUrl}${canonicalPath}`;

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': type,
    name: title,
    url: canonicalUrl,
    description,
    publisher: {
      '@type': 'Organization',
      name: seoConfig.publisherName,
      url: seoConfig.siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: seoConfig.publisherLogoUrl,
        width: Number(seoConfig.publisherLogoWidth),
        height: Number(seoConfig.publisherLogoHeight),
      },
    },
    image: {
      '@type': 'ImageObject',
      url: seoConfig.ogImage,
      width: Number(seoConfig.ogImageWidth),
      height: Number(seoConfig.ogImageHeight),
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
  }).replace(/</g, '\\u003c');
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] ?? character
  );
}

function metadataBlock(
  title: string,
  description: string,
  path: string,
  schemaType: 'WebSite' | 'WebPage',
  openGraphType: 'website' | 'article'
): string {
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);
  const canonicalUrl = `${seoConfig.siteUrl}${path}`;
  const jsonLd = buildJsonLd(title, description, path, schemaType);

  return [
    `<title>${escapedTitle}</title>`,
    `<meta name="description" content="${escapedDescription}" />`,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:title" content="${escapedTitle}" />`,
    `<meta property="og:description" content="${escapedDescription}" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:type" content="${openGraphType}" />`,
    `<meta property="og:site_name" content="${escapeHtml(seoConfig.siteName)}" />`,
    `<meta property="og:image" content="${escapeHtml(seoConfig.ogImage)}" />`,
    `<meta property="og:image:width" content="${seoConfig.ogImageWidth}" />`,
    `<meta property="og:image:height" content="${seoConfig.ogImageHeight}" />`,
    `<meta property="article:publisher" content="${escapeHtml(seoConfig.articlePublisher)}" />`,
    `<meta name="keywords" content="${escapeHtml(seoConfig.keywords)}" />`,
    `<meta name="referrer" content="${seoConfig.referrer}" />`,
    `<meta name="twitter:card" content="${seoConfig.twitterCard}" />`,
    `<meta name="twitter:site" content="${seoConfig.twitterHandle}" />`,
    `<meta name="twitter:title" content="${escapedTitle}" />`,
    `<meta name="twitter:description" content="${escapedDescription}" />`,
    `<meta name="twitter:image" content="${escapeHtml(seoConfig.ogImage)}" />`,
    `<script id="seo-json-ld" type="application/ld+json">${jsonLd}</script>`,
  ].join('\n    ');
}

function render(
  templateHtml: string,
  title: string,
  description: string,
  path: string,
  type: string
) {
  return templateHtml.replace(
    '<!-- SEO_META_PLACEHOLDER -->',
    metadataBlock(title, description, path, type, type === 'WebSite' ? 'website' : 'article')
  );
}

writeFileSync(
  resolve(dist, 'index.html'),
  render(template, seoConfig.siteTitle, seoConfig.siteDescription, '/', 'WebSite')
);

for (const variant of Object.values(variantRegistry)) {
  const title = `${variant.name} | ${seoConfig.siteTitle}`;
  const description = variant.description;
  const dir = resolve(dist, variant.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    resolve(dir, 'index.html'),
    render(template, title, description, `/${variant.id}`, 'WebPage')
  );
  count++;
}

console.log(`Generated ${count} per-route index.html files in dist/`);
