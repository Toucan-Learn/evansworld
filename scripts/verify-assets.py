from pathlib import Path
import concurrent.futures
import hashlib
import json
import subprocess

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'data/music-provenance.json').read_text())
tracks = manifest['tracks']
assert len(tracks) == 38
assert {t['number'] for t in tracks} == set(range(1, 39))

def verify(track):
    media = root / 'public' / track['src']
    assert hashlib.sha256(media.read_bytes()).hexdigest() == track['sha256'], media
    result = subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries',
        'format=duration:stream=codec_name,sample_rate,channels', '-of', 'json', str(media)], text=True)
    info = json.loads(result)
    stream = info['streams'][0]
    assert stream['codec_name'] == 'mp3' and stream['channels'] == 2
    delta = abs(float(info['format']['duration']) - track['duration'])
    assert delta < 0.1, (media, delta)
    return delta

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    deltas = list(pool.map(verify, tracks))

print(json.dumps({'tracks': len(tracks), 'all_hashes_match': True,
    'all_stereo_mp3': True, 'max_duration_difference_seconds': max(deltas)}, indent=2))
