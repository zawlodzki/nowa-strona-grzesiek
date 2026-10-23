"""Audit a native Sanity export offline before requesting production import approval."""
import argparse
import collections
import hashlib
import json
from pathlib import Path, PurePosixPath
import tarfile


def nodes(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from nodes(child)
    elif isinstance(value, list):
        for child in value:
            yield from nodes(child)


def audit(path):
    with tarfile.open(path, 'r:gz') as archive:
        members = archive.getmembers()
        if any(PurePosixPath(member.name).is_absolute() or '..' in PurePosixPath(member.name).parts or not (member.isfile() or member.isdir()) for member in members):
            raise ValueError('Archive contains unsafe paths or non-file entries')
        data_files = [member for member in members if member.name.endswith('/data.ndjson')]
        if len(data_files) != 1:
            raise ValueError('Expected exactly one data.ndjson')
        root = str(PurePosixPath(data_files[0].name).parent)
        files = {member.name: member for member in members if member.isfile()}
        payload = archive.extractfile(data_files[0]).read()
        documents = [json.loads(line) for line in payload.splitlines()]
        ids = {doc['_id'] for doc in documents}
        if len(ids) != len(documents) or any(id_.startswith('drafts.') for id_ in ids):
            raise ValueError('Duplicate document IDs or draft documents')
        if any(doc.get('language', 'pl') != 'pl' for doc in documents):
            raise ValueError('Only PL content is approved for this migration phase')
        if b'website-files.com' in payload or b'uploads-ssl.webflow.com' in payload or b'/development/' in payload:
            raise ValueError('Payload contains legacy CDN or development URLs')
        references = []
        for node in nodes(documents):
            if '_ref' in node and node['_ref'] not in ids:
                raise ValueError('Reference points outside the bundle')
            if '_sanityAsset' in node:
                marker = node['_sanityAsset']
                if not marker.startswith(('image@file://./images/', 'file@file://./files/')) or '..' in PurePosixPath(marker).parts:
                    raise ValueError('Asset must use a local export path')
                target = marker.split('@file://./', 1)[1]
                if f'{root}/{target}' not in files:
                    raise ValueError('Referenced asset is absent from the archive')
                references.append(target)
        metadata = json.load(archive.extractfile(files[f'{root}/assets.json']))
        hashes = {}
        for member in members:
            if member.isfile() and (member.name.startswith(f'{root}/images/') or member.name.startswith(f'{root}/files/')):
                content = archive.extractfile(member).read()
                relative = member.name.removeprefix(f'{root}/')
                kind = relative.split('/')[0].removesuffix('s')
                sha1 = PurePosixPath(relative).name[:40]
                key = f'{kind}-{sha1}'
                if key in hashes:
                    raise ValueError('Duplicate content in exported assets')
                hashes[key] = (hashlib.sha1(content).hexdigest(), len(content), relative)
        asset_bytes = 0
        expected_paths = set()
        for asset_id, info in metadata.items():
            kind, sha1 = asset_id.split('-', 1)
            if asset_id not in hashes:
                raise ValueError('Asset manifest entry is absent from the archive')
            if hashes[asset_id][:2] != (sha1, info['size']):
                raise ValueError('Asset bytes differ from their Sanity content hash or size')
            expected_paths.add(hashes[asset_id][2])
            asset_bytes += info['size']
        if set(hashes) != set(metadata) or not set(references) <= expected_paths:
            raise ValueError('Asset manifest, files and references disagree')
    with Path(path).open('rb') as source:
        archive_hash = hashlib.file_digest(source, 'sha256').hexdigest()
    return {
        'documents': len(documents),
        'documentsByType': dict(sorted(collections.Counter(doc['_type'] for doc in documents).items())),
        'assets': len(metadata), 'assetBytes': asset_bytes,
        'assetReferences': len(references), 'referencedAssets': len(set(references)),
        'payloadSha256': hashlib.sha256(payload).hexdigest(),
        'archiveSha256': archive_hash,
        'integrityVerified': True,
        'productionImported': False,
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive')
    parser.add_argument('--report', required=True)
    args = parser.parse_args()
    summary = audit(args.archive)
    Path(args.report).write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps(summary, indent=2))
