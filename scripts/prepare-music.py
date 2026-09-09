"""Rebuild the generated MP3 bank from the user's existing, hash-pinned FLAME input."""
from pathlib import Path
import argparse
import concurrent.futures
import hashlib
import json
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--source-game', type=Path, required=True, help='Local flame-godot checkout with runtime_q5_v001')
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
tracks = json.loads((root / 'data/music-provenance.json').read_text())['tracks']
(root / 'public/music').mkdir(parents=True, exist_ok=True)

def prepare(track):
    source = args.source_game / 'assets/audio/music/runtime_q5_v001' / track['sourceFile']
    destination = root / 'public' / track['src']
    assert hashlib.sha256(source.read_bytes()).hexdigest() == track['sourceSha256'], source
    subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-y', '-i', str(source),
        '-map_metadata', '-1', '-c:a', 'libmp3lame', '-b:a', '128k', str(destination)], check=True)
    assert hashlib.sha256(destination.read_bytes()).hexdigest() == track['sha256'], 'Encoding differs from pinned build: ' + str(destination)

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    list(pool.map(prepare, tracks))
print('Prepared all 38 pinned audio artifacts. Run python3 scripts/verify-assets.py before building.')
