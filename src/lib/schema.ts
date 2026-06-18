/**
 * Pure JSON-LD structured-data builders.
 *
 * No React, no DOM — so these run both in the browser (via useJsonLd) and in
 * the Node build-time prerender script, guaranteeing the static HTML and the
 * client-hydrated head emit identical structured data.
 */

import { SITE_URL } from './seo';

type Json = Record<string, unknown>;
interface FAQ { question: string; answer: string; }

const LOGO = 'https://i.postimg.cc/gJWNVrk0/Company_logo_page_0001.jpg';
const HERO = 'https://i.postimg.cc/wMfhtjbn/DSC04689.jpg';
const MAP_URL =
  'https://www.google.com/maps/dir/?api=1&destination=4099+Erin+Mills+Pkwy+%234,+Mississauga,+ON+L5L+3P9';

/** Canonical off-site profiles — strengthens entity recognition in Google's
 *  Knowledge Graph and in AI answer engines. Emitted on every page. */
const SAME_AS = [
  'https://www.instagram.com/clip.and.chill/',
  'https://www.facebook.com/profile.php?id=61571956989946',
  'https://www.tiktok.com/@clip.and.chill',
  'https://getsquire.com/discover/barbershop/clip-and-chill-mississauga',
  'https://www.google.com/search?q=clip+and+chill+barbershop+mississauga',
];

/** A small, stable set of real 5-star reviews carried site-wide so service and
 *  location pages are also eligible for review rich results. */
const REVIEWS = [
  {
    '@type': 'Review',
    author: { '@type': 'Person', name: 'Jordan M.' },
    reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
    datePublished: '2025-03-15',
    reviewBody:
      "Best haircut I've ever had — bar none. The attention to detail is unreal. I drive 25 minutes to come here and it's 100% worth it.",
  },
  {
    '@type': 'Review',
    author: { '@type': 'Person', name: 'Marcus T.' },
    reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
    datePublished: '2025-01-20',
    reviewBody:
      "I've been to many barbers in Mississauga and Clip & Chill is on a different level. The hot towel shave was an experience I didn't know I needed.",
  },
];

const ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: '4099 Erin Mills Pkwy #4',
  addressLocality: 'Mississauga',
  addressRegion: 'ON',
  postalCode: 'L5L 3P9',
  addressCountry: 'CA',
};

const GEO = { '@type': 'GeoCoordinates', latitude: 43.5352458, longitude: -79.6976644 };

const OPENING_HOURS = [
  { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '10:00', closes: '20:00' },
  { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Sunday'], opens: '11:00', closes: '19:00' },
];

const AGGREGATE_RATING = { '@type': 'AggregateRating', ratingValue: '5.0', reviewCount: '406' };

export function localBusinessSchema(opts: {
  slug: string;
  description: string;
  type?: string;
  areaServed?: string;
  extra?: Json;
}): Json {
  return {
    '@context': 'https://schema.org',
    '@type': opts.type ?? 'LocalBusiness',
    '@id': SITE_URL,
    name: 'Clip & Chill Barbershop',
    description: opts.description,
    url: `${SITE_URL}/${opts.slug}`,
    telephone: '+19056062212',
    priceRange: '$$',
    currenciesAccepted: 'CAD',
    paymentAccepted: 'Cash, Credit Card, Debit Card',
    logo: LOGO,
    image: [LOGO, HERO],
    hasMap: MAP_URL,
    sameAs: SAME_AS,
    address: ADDRESS,
    geo: GEO,
    openingHoursSpecification: OPENING_HOURS,
    aggregateRating: AGGREGATE_RATING,
    review: REVIEWS,
    knowsAbout: [
      "Men's haircuts", 'Skin fade', 'Taper fade', 'Buzz cut', 'Beard trim',
      'Beard lineup', 'Hot towel shave', 'Kids haircut', 'Curly hair cuts',
    ],
    speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1'] },
    areaServed: opts.areaServed
      ? { '@type': 'Place', name: opts.areaServed }
      : { '@type': 'City', name: 'Mississauga' },
    ...(opts.extra ?? {}),
  };
}

export function breadcrumbSchema(items: Array<{ name: string; slug: string }>): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.slug}`,
    })),
  };
}

export function faqPageSchema(faqs: FAQ[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

export function serviceSchemas(data: {
  slug: string; h1: string; metaDescription: string; faqs: FAQ[];
}): Json[] {
  const schemas: Json[] = [
    localBusinessSchema({
      slug: data.slug,
      description: data.metaDescription,
      extra: { hasOfferCatalog: { '@type': 'OfferCatalog', name: data.h1 } },
    }),
    breadcrumbSchema([
      { name: 'Home', slug: '/' },
      { name: data.h1, slug: `/${data.slug}` },
    ]),
  ];
  if (data.faqs.length) schemas.push(faqPageSchema(data.faqs));
  return schemas;
}

export function locationSchemas(data: {
  slug: string; h1: string; metaDescription: string; neighborhood: string; faqs: FAQ[];
}): Json[] {
  const schemas: Json[] = [
    localBusinessSchema({
      slug: data.slug,
      description: data.metaDescription,
      areaServed: data.neighborhood,
    }),
    breadcrumbSchema([
      { name: 'Home', slug: '/' },
      { name: data.h1, slug: `/${data.slug}` },
    ]),
  ];
  if (data.faqs.length) schemas.push(faqPageSchema(data.faqs));
  return schemas;
}

export function listicleSchemas(data: {
  slug: string; h1: string; metaDescription: string; city: string;
  faqs: FAQ[];
  shops: Array<{
    name: string; address: string; phone?: string; rating: number;
    reviewCount: number; priceRange: string;
  }>;
}): Json[] {
  const itemList: Json = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: data.h1,
    description: data.metaDescription,
    numberOfItems: data.shops.length,
    itemListElement: data.shops.map((shop, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: shop.name,
      item: {
        '@type': 'LocalBusiness',
        name: shop.name,
        address: {
          '@type': 'PostalAddress',
          streetAddress: shop.address.split(',')[0],
          addressLocality: data.city,
          addressRegion: 'ON',
          addressCountry: 'CA',
        },
        ...(shop.phone ? { telephone: shop.phone } : {}),
        aggregateRating: { '@type': 'AggregateRating', ratingValue: shop.rating, reviewCount: shop.reviewCount },
        priceRange: shop.priceRange,
      },
    })),
  };
  return [
    itemList,
    faqPageSchema(data.faqs),
    breadcrumbSchema([
      { name: 'Home', slug: '/' },
      { name: data.h1, slug: `/${data.slug}` },
    ]),
  ];
}

export function blogPostingSchemas(meta: {
  slug: string; title: string; description: string; category: string; date: string;
}): Json[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: meta.title,
      description: meta.description,
      image: { '@type': 'ImageObject', url: LOGO, width: 1200, height: 1200 },
      datePublished: meta.date,
      dateModified: meta.date,
      inLanguage: 'en-CA',
      articleSection: meta.category,
      keywords: [meta.category, 'barbershop Mississauga', 'haircut', 'grooming', 'Erin Mills'],
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/${meta.slug}` },
      isPartOf: { '@type': 'Blog', '@id': `${SITE_URL}/blog`, name: 'Clip & Chill Barbershop Blog' },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', 'h2'] },
      author: {
        '@type': 'Organization',
        name: 'Clip & Chill Barbershop',
        url: SITE_URL,
        sameAs: SAME_AS,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Clip & Chill Barbershop',
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: LOGO },
      },
    },
    breadcrumbSchema([
      { name: 'Home', slug: '/' },
      { name: 'Blog', slug: '/blog' },
      { name: meta.title, slug: `/${meta.slug}` },
    ]),
  ];
}

export function blogIndexSchemas(posts: Array<{
  slug: string; title: string; description: string; category: string; date: string;
}>): Json[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Clip & Chill Barbershop Blog',
      url: `${SITE_URL}/blog`,
      publisher: { '@type': 'Organization', name: 'Clip & Chill Barbershop', url: SITE_URL },
      blogPost: posts.map((post) => ({
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        articleSection: post.category,
        url: `${SITE_URL}/${post.slug}`,
      })),
    },
    breadcrumbSchema([
      { name: 'Home', slug: '/' },
      { name: 'Blog', slug: '/blog' },
    ]),
  ];
}
