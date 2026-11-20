import entities from '../../../../migration/contracts/entities.json' with { type: 'json' };

const BRAND = entities.person.name;
export const TITLE_SUFFIX = ` | ${BRAND}`;

/** Appends the brand suffix to a bare title. Stored titles hold only the bare text; the suffix is never doubled. */
export function brandTitle(title: string): string {
  const bare = title.trim();
  return bare === BRAND || bare.endsWith(TITLE_SUFFIX) ? bare : `${bare}${TITLE_SUFFIX}`;
}
