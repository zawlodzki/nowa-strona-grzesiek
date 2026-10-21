import hashlib


def doc_id(kind, webflow_id):
    """Sanity _id derived from a Webflow id, so a re-import overwrites instead of duplicating."""
    return f'{kind}-{webflow_id}'


class Keys:
    """Deterministic _key values: the n-th key for a seed is always the same."""

    def __init__(self, seed):
        self.seed = seed
        self.n = 0

    def __call__(self):
        self.n += 1
        return hashlib.sha1(f'{self.seed}:{self.n}'.encode()).hexdigest()[:12]
