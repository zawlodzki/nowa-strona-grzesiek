import type { ContentImage, Logo } from '../../../../studio/sanity.types';

/** A testimonial image takes the invert flag of the logo document that shows the same asset. */
export function invertsLikeLogo(logos: Iterable<Logo>, image: ContentImage | undefined): boolean {
  const asset = image?.asset?._ref;
  return Boolean(asset) && [...logos].some((logo) => logo.invert === true && logo.image?.asset?._ref === asset);
}
