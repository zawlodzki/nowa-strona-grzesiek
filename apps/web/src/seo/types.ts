// Input for buildGraph() and buildMeta(). Routes (T18) map Sanity documents into this shape;
// the builders never read Sanity directly, so they stay pure and testable from fixtures.

export type Language = 'pl' | 'en';

/** Path without the language prefix, as stored in Sanity `slug.current`: `/`, `/o-mnie`, `/blog/x`. */
export type SitePath = `/${string}`;

export interface Image {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface Seo {
  title: string;
  description: string;
  ogImage?: Image;
  noindex?: boolean;
  canonicalOverride?: string;
}

export interface Crumb {
  name: string;
  path: SitePath;
}

/** A visible FAQ block, answers flattened to plain text. Pass it only when the block renders and emits schema. */
export interface FaqEntry {
  question: string;
  answer: string;
}

export type Availability = 'InStock' | 'PreOrder' | 'OutOfStock';

export interface Offer {
  name: string;
  description?: string;
  price?: number;
  priceCurrency?: 'PLN';
  availability?: Availability;
  availabilityStarts?: string;
  validThrough?: string;
  /** Instalment price: `price` per `billingIncrement` months, `billingDuration` months in total. */
  monthly?: { price: number; billingDuration: number };
  /** True when the Organization sells it; emitted as `seller`. */
  soldByOrganization?: boolean;
}

/** Reference to a service or course defined on its own page. Emitted as a typed stub. */
export interface ServiceStub {
  name: string;
  description?: string;
  path: SitePath;
  entity?: 'service' | 'course';
}

export interface Service {
  name: string;
  description: string;
  serviceType?: string;
  areaServed?: string;
  offers: Offer[];
}

export interface Course {
  name: string;
  description: string;
  educationalLevel?: string;
  isAccessibleForFree: boolean;
  audience?: string;
  teaches: string[];
  instance?: {
    name: string;
    courseMode: 'online' | 'onsite' | 'blended';
    courseWorkload?: string;
    startDate?: string;
  };
  offers: Offer[];
}

export interface Post {
  headline: string;
  /** The blog index this post belongs to, emitted as a typed `Blog` stub. */
  blog: { name: string; path: SitePath };
  image?: Image;
  datePublished: string;
  dateModified?: string;
  wordCount?: number;
  section?: string;
}

export interface Occupation {
  name: string;
  location?: string;
  skills?: string;
}

/** What the page is about. Each kind decides the WebPage subtype and the page's main entity. */
export type PageKind =
  | { kind: 'home'; services: ServiceStub[] }
  | { kind: 'service'; service: Service }
  | { kind: 'course'; course: Course }
  | { kind: 'post'; post: Post }
  | { kind: 'blogIndex'; blog: { name: string; description: string } }
  | { kind: 'contact'; significantLinks?: SitePath[] }
  | { kind: 'about'; occupation?: Occupation; services: ServiceStub[] }
  | { kind: 'generic' };

export type SeoPage = PageKind & {
  language: Language;
  path: SitePath;
  /** Visible page name, usually the H1. */
  name: string;
  seo: Seo;
  /** Trail from home to this page, home included. Fewer than two crumbs emits no BreadcrumbList. */
  breadcrumbs: Crumb[];
  primaryImage?: Image;
  entityImages?: { person: Image; organization: Image };
  dateModified?: string;
  faq?: FaqEntry[];
  /** The same page in the other language. Only real pairs, so hreflang never points at a missing page. */
  translation?: { language: Language; path: SitePath };
};
