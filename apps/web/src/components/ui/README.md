# Block rendering API

The six blocks accept `data` with the corresponding generated type from `apps/studio/sanity.types.ts`. They do not fetch CMS data. The page query resolves references and passes media separately.

- `Hero` accepts `image: ResolvedImage`. It defaults to H1. Set `headingLevel="h2"` only when embedding it in the catalog.
- `LogoStrip` accepts `logos: ResolvedLogo[]`. The block's reference array owns order. Unresolved references are omitted. Supply every referenced logo in the query result. Client strips retain all logos in two scrollable rows on small containers. Tools use one row.
- `Feature` accepts `image: ResolvedImage`, `headingLevel="h2"|"h3"`, and named `body` and `media` slots. Put the T11 diagram renderer in `media` when `data.media.kind` is `diagram`.
- `ContentSection` accepts `image: ResolvedImage`, and named `intro` and `media` slots.
- `CtaBand` accepts `tone="accent"|"soft"`, defaulting to accent.
- `PromoCard` accepts a resolved `target: ResolvedPage` whose `_id` matches `data.target._ref`, and an optional `badge: ResolvedImage`. The target language controls the `/en` prefix.

`ResolvedImage` contains the final image URL and intrinsic dimensions, plus the CMS alt and caption. The page's image adapter owns Sanity crop, hotspot and CDN URL generation. Hero images load eagerly. Other images load lazily.

`BlockProse` renders text styles, flat lists, emphasis, code and links. It rejects rich media and nested lists with a build error. Pass the full Portable Text renderer through the block's `body` or `intro` slot for those documents. Its `links` map resolves internal document references to URLs. A caller using the default block fallback should use text without internal references, or pass `BlockProse` through the named slot with a populated map.

`Button` accepts a generated `Link` and `primary`, `secondary`, `on-dark` or `text` variant. It omits missing labels and invalid URLs. `safeHref` accepts site-relative paths, anchors, HTTP, HTTPS, mailto and telephone links. `BlockSection` provides the existing content grid, section rhythm and an inline-size container for its children.

The catalog at `/_ds/blocks-a` is noindex and uses synthetic images and text. `?data=demo`, `worst`, `empty` or `one` selects a fixture. Production page queries must not import these fixtures.
