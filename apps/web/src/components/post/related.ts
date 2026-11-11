import type { PostDoc } from '../../lib/sanity/site';

export function relatedPosts(post: PostDoc, posts: PostDoc[]): PostDoc[] {
  const selectedIds = post.relatedPosts?.map((ref) => ref._ref) ?? [];
  const candidates = posts.filter((other) => other.language === post.language && other._id !== post._id);
  return (selectedIds.length
    ? selectedIds.flatMap((id) => candidates.find((other) => other._id === id) ?? [])
    : candidates.toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt)))
    .filter((item, index, all) => all.findIndex((other) => other._id === item._id) === index)
    .slice(0, 3);
}
