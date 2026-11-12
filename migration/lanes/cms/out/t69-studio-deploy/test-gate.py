"""Execute the workflow's SHA gate against a local Git remote."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

WORKFLOW = Path('.github/workflows/deploy-studio.yml').read_text()
BLOCK = WORKFLOW.split('        run: |\n', 1)[1].split('      - uses:', 1)[0]
SCRIPT = '\n'.join(line[10:] for line in BLOCK.splitlines())

class GateTest(unittest.TestCase):
    def test_current_and_outdated(self):
        with tempfile.TemporaryDirectory() as directory:
            def git(*args):
                return subprocess.check_output(['git', '-C', directory, *args], stderr=subprocess.DEVNULL, text=True).strip()
            git('init', '-b', 'main')
            git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '--allow-empty', '-m', 'first')
            head = git('rev-parse', 'HEAD')
            git('remote', 'add', 'origin', directory)
            for sha, expected in [(head, 'current=true'), ('0' * 40, '')]:
                output = Path(directory) / 'output'
                output.write_text('')
                result = subprocess.run(['bash', '-e', '-c', SCRIPT], cwd=directory, env={**os.environ, 'TARGET_SHA': sha, 'GITHUB_OUTPUT': str(output)}, capture_output=True, text=True, check=True)
                self.assertEqual(output.read_text().strip(), expected)
                if not expected:
                    self.assertIn('Skipping outdated commit', result.stdout)
                    print(result.stdout.strip())

if __name__ == '__main__':
    unittest.main()
