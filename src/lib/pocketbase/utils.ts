import type {
  EventsRecord,
  ImagesRecord,
  KnowledgesRecord,
  PlacesRecord,
  PostsRecord,
  ProductsRecord,
  ServicesRecord,
} from "@/lib/pocketbase/schemas";
import { format } from "@formkit/tempo";
import { PUBLIC_IMGIX_URL } from "astro:env/server";

type Narrow<FROM, TO> = FROM extends undefined ? (TO extends Promise<unknown> ? Promise<undefined> : undefined) : TO;
export function allowUndefined<FROM, TO>(method: (defined: FROM) => TO) {
  return <F extends FROM | undefined>(possiblyUndefined: F) => (possiblyUndefined ? method(possiblyUndefined) : undefined) as Narrow<F, TO>;
}

// EVENTS **********************************************************************************************************************************
function strictItemFromEvent(event: EventForItem) {
  const { excerpt: text, from, image, name: title, places, service, slug, to, url: href } = event;
  const features = [
    { href: hrefFromService(service), key: "Type", value: service.name },
    { key: "Du", value: format({ date: from, format: { date: "full", time: "short" }, locale: "fr", tz: "Indian/Reunion" }) },
    { key: "Au", value: format({ date: to, format: { date: "full", time: "short" }, locale: "fr", tz: "Indian/Reunion" }) },
    { key: "Endroits", value: places.map(({ name }) => name).join(" ou ") },
  ];
  return { features, href, image, slug, stale: to.toISOString(), text, title };
}
export const itemFromEvent = allowUndefined(strictItemFromEvent);

// IMAGE ***********************************************************************************************************************************
export function imageFrom({ alt, height, id, src, width }: ImageData) {
  return { alt, height, src: `${PUBLIC_IMGIX_URL}/${id}/${src}?q=50`, width };
}

// KNOWLEDGE *******************************************************************************************************************************
function strictItemFromKnowledge(knowledge: KnowledgeForItem) {
  const { image, name: title, slug, text } = knowledge;
  return { href: hrefFromKnowledge(knowledge).slice(0, -1), image, slug, text, title };
}
export const itemFromKnowledge = allowUndefined(strictItemFromKnowledge);

export function fragmentFromKnowledge({ slug }: KnowledgeForRoute) {
  return slug === "traditions-ancestrales" ? undefined : slug;
}

export function hrefFromKnowledge({ slug }: KnowledgeForRoute) {
  return "/" + (slug === "traditions-ancestrales" ? "" : `${slug}/`);
}

export function entryFromKnowledge(knowledge: KnowledgeForRoute) {
  return { knowledge: fragmentFromKnowledge(knowledge) };
}

export function pathFromKnowledge(knowledge: KnowledgeForRoute) {
  return { params: entryFromKnowledge(knowledge) };
}

// POST ************************************************************************************************************************************
function strictSingleFromPost(post: PostForSingle) {
  const { image, text, title } = post;
  return { features: [], image, text, title };
}
export const singleFromPost = allowUndefined(strictSingleFromPost);

function strictItemFromPost(post: PostForItem) {
  const { excerpt: text, image, slug, title } = post;
  if (!image) throw new Error(`Post ${slug} has no image`);
  return { href: hrefFromPost(post), image, slug, text, title };
}
export const itemFromPost = allowUndefined(strictItemFromPost);

export function hrefFromPost(post: PostForRoute) {
  return `${hrefFromKnowledge(post.knowledge)}articles/${post.slug}`;
}

export function entryFromPost({ knowledge, slug }: PostForRoute) {
  return { knowledge: fragmentFromKnowledge(knowledge), collection: "articles", slug };
}

export function pathFromPost(post: PostForRoute) {
  return { params: entryFromPost(post) };
}

// PRODUCT *********************************************************************************************************************************
function strictItemFromProduct(product: ProductForItem) {
  const { excerpt: text, image, name: title, slug, url: href } = product;
  if (!image) throw new Error(`Product ${slug} has no image`);
  return { features: featuresFromProduct(product), href, image, slug, text, title };
}
export const itemFromProduct = allowUndefined(strictItemFromProduct);

export function featuresFromProduct({ price }: ProductForFeatures) {
  return [{ key: "Tarif", value: price }];
}

// SERVICES ********************************************************************************************************************************
function strictSingleFromService(service: ServiceForSingle) {
  const { image, name: title, text } = service;
  return { features: featuresFromService(service), image, text, title };
}
export const singleFromService = allowUndefined(strictSingleFromService);

function strictItemFromService(service: ServiceForItem) {
  const { category, excerpt: text, image, name: title, slug } = service;
  const features = featuresFromService(service);
  return { extra: { category }, features, href: hrefFromService(service), image, slug, text, title };
}
export const itemFromService = allowUndefined(strictItemFromService);

export function featuresFromService({ price, duration, places }: ServiceForFeatures) {
  return [
    { key: "Tarif", value: price },
    { key: "Durée", value: duration },
    { key: "Endroits", value: places.map(({ name }) => name).join(" ou ") },
  ];
}

export function fragmentFromService({ category }: ServiceForFragment) {
  return { consult: "consultations" as const, training: "formations" as const, workshop: "ateliers" as const }[category];
}

export function hrefFromService(service: ServiceForRoute) {
  return `${hrefFromKnowledge(service.knowledge)}${fragmentFromService(service)}/${service.slug}`;
}

export function entryFromService(service: ServiceForRoute) {
  return { knowledge: fragmentFromKnowledge(service.knowledge), collection: fragmentFromService(service), slug: service.slug };
}

export function pathFromService(service: ServiceForRoute) {
  return { params: entryFromService(service) };
}

// TYPES ***********************************************************************************************************************************
export type ImageData = Pick<ImagesRecord, "alt" | "height" | "id" | "src" | "width">;

type EventForItem = Pick<EventsRecord, "excerpt" | "from" | "name" | "slug" | "to" | "url"> & {
  image: ImageData;
  places: Pick<PlacesRecord, "name">[];
  service: Pick<ServicesRecord, "name"> & ServiceForRoute;
};

type KnowledgeForItem = KnowledgeForRoute & Pick<KnowledgesRecord, "name" | "text"> & { image: ImageData };
type KnowledgeForRoute = Pick<KnowledgesRecord, "slug">;
type PostForSingle = Pick<PostsRecord, "text" | "title"> & { image?: ImageData };
type PostForItem = PostForRoute & Pick<PostsRecord, "excerpt" | "title"> & { image?: ImageData };
type PostForRoute = Pick<PostsRecord, "slug"> & { knowledge: KnowledgeForRoute };
type ProductForFeatures = Pick<ProductsRecord, "price">;
type ProductForItem = ProductForFeatures & Pick<ProductsRecord, "excerpt" | "name" | "slug" | "url"> & { image: ImageData };
type ServiceForSingle = ServiceForFeatures & Pick<ServicesRecord, "name" | "text"> & { image: ImageData };
type ServiceForFeatures = Pick<ServicesRecord, "price" | "duration"> & { places: Pick<PlacesRecord, "name">[] };
type ServiceForFragment = Pick<ServicesRecord, "category">;
type ServiceForItem = ServiceForFeatures & ServiceForRoute & Pick<ServicesRecord, "excerpt" | "name"> & { image: ImageData };
type ServiceForRoute = ServiceForFragment & Pick<ServicesRecord, "slug"> & { knowledge: KnowledgeForRoute };

export type Feature = {
  href?: string;
  key: string;
  value: string;
};

export type Extra = Record<string, unknown> | undefined;

type StrictItem = {
  features?: Feature[];
  href: string;
  image: ImageData;
  slug: string;
  stale?: string;
  text: string;
  title: string;
};

export type Item<E = undefined> = E extends undefined ? StrictItem : StrictItem & { extra: E };
export type ServiceItem = Awaited<ReturnType<typeof itemFromService>>;
