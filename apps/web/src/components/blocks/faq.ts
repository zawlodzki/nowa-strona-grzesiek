import type { Faq, FaqItem } from '../../../../studio/sanity.types';

export type VisibleFaqItem = Required<Pick<FaqItem, 'question' | 'answer'>> & { _key: string };

// Faq.astro renders exactly these items, so the SEO graph (T12) reads the same list to build FAQPage.
export function visibleFaqItems(data: Faq): VisibleFaqItem[] {
  return (data.items ?? []).flatMap((item) =>
    item.question?.trim() && item.answer?.length ? [{ _key: item._key, question: item.question, answer: item.answer }] : [],
  );
}

// FAQPage `<url>#faq` is emitted only for a visible block with emitSchema on, and at most once per page: the first such block wins.
export function emitsFaqPage(data: Faq): boolean {
  return data.emitSchema !== false && visibleFaqItems(data).length > 0;
}
