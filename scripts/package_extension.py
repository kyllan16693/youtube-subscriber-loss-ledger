"""Create dependency-free icons and a reproducible unpacked-extension ZIP."""
import hashlib
import json
import math
import struct
import zipfile
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXT = ROOT/'extension'


def icon(size):
    pixels = []
    def near_segment(x, y, a, b, width):
        dx, dy = b[0]-a[0], b[1]-a[1]
        t = max(0, min(1, ((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)))
        return math.hypot(x-a[0]-t*dx, y-a[1]-t*dy) < width
    for y in range(size):
        row = bytearray()
        for x in range(size):
            u, v = (x+.5)/size, (y+.5)/size
            inside = abs(u-.5)<.34 or abs(v-.5)<.34 or math.hypot(abs(u-.5)-.34, abs(v-.5)-.34)<.15
            color = (160,41,56,255) if inside else (0,0,0,0)
            line = [((.24,.32),(.49,.56)), ((.49,.56),(.75,.56)), ((.75,.56),(.62,.42)), ((.75,.56),(.62,.70))]
            if any(near_segment(u,v,a,b,.035) for a,b in line):color=(255,248,248,255)
            row.extend(color)
        pixels.append(b'\x00'+bytes(row))
    def chunk(kind, data):return struct.pack('!I',len(data))+kind+data+struct.pack('!I',zlib.crc32(kind+data)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!IIBBBBB',size,size,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(pixels)))+chunk(b'IEND',b'')


if __name__ == '__main__':
    (EXT/'icons').mkdir(exist_ok=True)
    for size in [16,32,48,128]:(EXT/'icons'/f'icon{size}.png').write_bytes(icon(size))
    out = ROOT/'dist'; out.mkdir(exist_ok=True)
    version = json.loads((EXT/'manifest.json').read_text())['version']
    archive = out/f'youtube-subscriber-loss-ledger-{version}.zip'
    with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as z:
        for path in sorted(EXT.rglob('*')):
            if path.is_file() and not path.name.startswith('.'):
                entry = zipfile.ZipInfo(str(path.relative_to(EXT)), date_time=(2026,10,22,0,0,0))
                entry.compress_type=zipfile.ZIP_DEFLATED
                entry.external_attr=0o644<<16
                z.writestr(entry,path.read_bytes())
    digest=hashlib.sha256(archive.read_bytes()).hexdigest()
    archive.with_suffix('.zip.sha256').write_text(digest+'  '+archive.name+'\n')
    print(json.dumps({'zip':str(archive),'bytes':archive.stat().st_size,'sha256':digest},indent=2))
