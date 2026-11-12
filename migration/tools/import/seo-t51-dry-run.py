"""Generate a Sanity mutation payload from a fresh published SEO export and reviewed copy."""

import argparse
import csv
import json
from pathlib import Path


SEO_LIMITS = {'seo.title': 60, 'seo.description': 160, 'defaultSeo.title': 60}


def text_length(text):
    return len(text.encode('utf-16-le')) // 2


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('snapshot', type=Path, help='JSON array from the published SEO projection')
    parser.add_argument('review', type=Path, help='TSV containing reviewed old and new copy')
    parser.add_argument('patch', type=Path, help='Output path for the unapplied mutation payload')
    args = parser.parse_args()

    documents = json.loads(args.snapshot.read_text())
    with args.review.open(newline='') as review_file:
        rows = list(csv.DictReader(review_file, delimiter='\t'))
    review = {(row['id'], row['field']): row for row in rows}
    if len(review) != len(rows):
        parser.error('The review contains duplicate fields.')

    mutations = []
    seen = set()
    for document in documents:
        values = document.get('values')
        doc_id = document['_id']
        if not doc_id or '.' in doc_id or not document.get('_rev') or values is None:
            parser.error(f'Expected a published document with a revision and SEO values: {doc_id}')

        changes = {}
        for field, limit in SEO_LIMITS.items():
            current = values.get(field)
            if current is None or text_length(current) <= limit:
                continue
            key = (doc_id, field)
            row = review.get(key)
            if row is None or row['old_text'] != current or row['slug'] != document['slug']:
                parser.error(f'Missing or stale reviewed copy for {doc_id} {field}.')
            new_text = row['new_text']
            if not new_text.strip() or text_length(new_text) > limit:
                parser.error(f'The reviewed copy does not fit {doc_id} {field}.')
            if (int(row['old_length']), int(row['new_length'])) != (text_length(current), text_length(new_text)):
                parser.error(f'The reviewed lengths do not match {doc_id} {field}.')
            seen.add(key)
            changes[field] = new_text

        if changes:
            mutations.append({'patch': {'id': doc_id, 'ifRevisionID': document['_rev'], 'set': changes}})

    if seen != review.keys():
        parser.error('The review includes fields that no longer overflow or are missing from the export.')

    args.patch.write_text(json.dumps({'mutations': mutations}, ensure_ascii=False, indent=2) + '\n')
    print(f'{len(seen)} fields across {len(mutations)} published documents.')


if __name__ == '__main__':
    main()
