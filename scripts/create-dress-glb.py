"""Create actual curved mesh surfaces using the photographed silhouette.

Not photogrammetry: depth, back and gold connector are inferred, not measured.
Original images are read unchanged; their pixels/alpha guide mesh and UV layout.
Requires the bundled NumPy and Pillow. No raster editing or background removal.
"""
import json
import math
import struct
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'assets/hero-aurora-cutout.png'
OUTPUT = ROOT / 'assets/models/vestido-aurora-aproximado.glb'
rgba = np.asarray(Image.open(SOURCE).convert('RGBA'))
h, w = rgba.shape[:2]
rows, cols = 270, 205
ys = np.linspace(0, h - 1, rows).astype(int)
xs = np.linspace(0, w - 1, cols).astype(int)
sample = rgba[np.ix_(ys, xs)].astype(float)
blue = ((sample[:, :, 3] > 210) & (sample[:, :, 2] > sample[:, :, 0] * 1.17)
        & (sample[:, :, 2] > sample[:, :, 1] * 1.04))

# Discard disconnected transparent-edge noise, retain the two garment panels.
seen = np.zeros_like(blue)
components = []
for r, c in zip(*np.where(blue)):
    if seen[r, c]:
        continue
    stack, component = [(r, c)], []
    seen[r, c] = True
    while stack:
        rr, cc = stack.pop()
        component.append((rr, cc))
        for nr, nc in [(rr-1, cc), (rr+1, cc), (rr, cc-1), (rr, cc+1)]:
            if 0 <= nr < rows and 0 <= nc < cols and blue[nr, nc] and not seen[nr, nc]:
                seen[nr, nc] = True
                stack.append((nr, nc))
    components.append(component)
mask = np.zeros_like(blue)
for component in sorted(components, key=len, reverse=True)[:2]:
    for r, c in component:
        mask[r, c] = True
valid_y, valid_x = np.where(mask)
ymin, ymax = ys[valid_y.min()], ys[valid_y.max()]
xmin, xmax = xs[valid_x.min()], xs[valid_x.max()]
scale = 1.18 / (ymax - ymin)
center_x = (xmin + xmax) / 2

positions, uvs, triangles = [], [], []
lookup = {}
for side in [1, -1]:
    for r in range(rows):
        indices = np.flatnonzero(mask[r])
        if not len(indices):
            continue
        left, right = xs[indices[0]], xs[indices[-1]]
        mid, half = (left + right) / 2, max((right - left) / 2, 1)
        # A cross-section with genuine depth, scaled to each visible panel.
        depth = min(.115, max(.008, half * scale * .49))
        for c in indices:
            xpx, ypx = xs[c], ys[r]
            nx = (xpx - mid) / half
            z = side * depth * math.sqrt(max(0, 1 - nx * nx))
            # Very slight geometric irregularity keeps the surface from being flat.
            z += side * .0012 * math.sin(r * .71) * math.cos(c * .19) * (1 - nx * nx)
            lookup[(side, r, c)] = len(positions)
            positions.append(((xpx - center_x) * scale, (ymax - ypx) * scale, z))
            if side == 1:
                uvs.append((xpx / (w-1), ypx / (h-1)))
            else:
                # Reuse the known fabric projection at its original scale.
                # This inferred back is explicitly illustrative, not photographed.
                uvs.append((xpx / (w-1), ypx / (h-1)))
    for r in range(rows-1):
        for c in range(cols-1):
            for points in [((r,c),(r+1,c),(r,c+1)), ((r,c+1),(r+1,c),(r+1,c+1))]:
                keys = [(side, rr, cc) for rr, cc in points]
                if all(k in lookup for k in keys):
                    face = [lookup[k] for k in keys]
                    triangles.append(face if side == 1 else face[::-1])

# Join the visible side boundaries so a side view has a continuous seam.
# Leave the broad hem and the interior cutout boundaries open.
reverse = {value: key for key, value in lookup.items()}
edge_counts = {}
for face in triangles:
    if reverse[face[0]][0] != 1:
        continue
    for a, b in [(face[0], face[1]), (face[1], face[2]), (face[2], face[0])]:
        edge = tuple(sorted((a, b)))
        edge_counts[edge] = edge_counts.get(edge, 0) + 1
def at_side(index):
    _, r, c = reverse[index]
    row = np.flatnonzero(mask[r])
    return c <= row[0]+1 or c >= row[-1]-1
for (a, b), count in edge_counts.items():
    if count != 1 or not (at_side(a) and at_side(b)):
        continue
    _, ar, ac = reverse[a]
    _, br, bc = reverse[b]
    aa, bb = lookup[(-1, ar, ac)], lookup[(-1, br, bc)]
    triangles.extend([[a, b, aa], [b, bb, aa]])

positions = np.asarray(positions, dtype=np.float32)
uvs = np.asarray(uvs, dtype=np.float32)
triangles = np.asarray(triangles, dtype=np.uint32)

def normals(p, faces):
    n = np.zeros_like(p)
    fn = np.cross(p[faces[:, 1]] - p[faces[:, 0]], p[faces[:, 2]] - p[faces[:, 0]])
    for i in range(3):
        np.add.at(n, faces[:, i], fn)
    # Smooth tiny silhouette-grid differences, keeping the photographed outline.
    edges = np.concatenate([faces[:, [0, 1]], faces[:, [1, 2]], faces[:, [2, 0]]])
    edges = np.concatenate([edges, edges[:, ::-1]])
    counts = np.zeros(len(p), dtype=np.float32)
    np.add.at(counts, edges[:, 0], 1)
    counts[counts == 0] = 1
    for _ in range(5):
        sums = np.zeros_like(n)
        np.add.at(sums, edges[:, 0], n[edges[:, 1]])
        n = n * .35 + (sums / counts[:, None]) * .65
    lengths = np.linalg.norm(n, axis=1)
    lengths[lengths == 0] = 1
    return n / lengths[:, None]

# An estimated scalloped shell connector at the waist, modeled as a solid fan.
gold = ((sample[:, :, 3] > 210) & (sample[:, :, 0] > 130)
        & (sample[:, :, 1] > 105) & (sample[:, :, 2] < sample[:, :, 1] * .88))
gy, gx = np.where(gold)
waist_x = (float(np.median(xs[gx])) - center_x) * scale
waist_y = (ymax - float(np.median(ys[gy]))) * scale
gp, gt = [], []
segments, rings = 70, 16
for back in [False, True]:
    for ri in range(rings+1):
        radius = .050 * ri / rings
        for si in range(segments+1):
            a = -1.12 + 2.24 * si / segments
            rib = .0014 * math.cos(a * 20) * (ri/rings)
            gp.append((waist_x + radius * math.sin(a), waist_y - .021 + radius * math.cos(a),
                       .116 + (-.005 if back else .005 + .010 * (1-(ri/rings)**2) + rib)))
offset = (rings+1) * (segments+1)
for side in range(2):
    for ri in range(rings):
        for si in range(segments):
            a = side*offset + ri*(segments+1)+si
            b, c, d = a+1, a+segments+1, a+segments+2
            gt.extend([[a,c,b],[b,c,d]] if side == 0 else [[a,b,c],[b,d,c]])
for i in range(segments):
    a = rings*(segments+1)+i
    gt.extend([[a,a+1,a+offset],[a+1,a+offset+1,a+offset]])
gp, gt = np.asarray(gp, dtype=np.float32), np.asarray(gt, dtype=np.uint32)

binary = bytearray()
views, accessors = [], []
def buffer_view(data, target=None):
    while len(binary) % 4:
        binary.append(0)
    start = len(binary)
    binary.extend(data)
    view = {'buffer': 0, 'byteOffset': start, 'byteLength': len(data)}
    if target:
        view['target'] = target
    views.append(view)
    return len(views)-1

def accessor(a, kind, component, target, bounds=False):
    view = buffer_view(a.tobytes(), target)
    data = {'bufferView': view, 'componentType': component, 'count': len(a), 'type': kind}
    if bounds:
        data['min'], data['max'] = a.min(axis=0).tolist(), a.max(axis=0).tolist()
    accessors.append(data)
    return len(accessors)-1

def primitive(p, faces, uv=None, material=0):
    area = np.linalg.norm(np.cross(p[faces[:, 1]]-p[faces[:, 0]], p[faces[:, 2]]-p[faces[:, 0]]), axis=1)
    faces = faces[area > 1e-12]
    used, remapped = np.unique(faces, return_inverse=True)
    p = p[used]
    faces = remapped.reshape(-1, 3).astype(np.uint32)
    if uv is not None:
        uv = uv[used]
    attrs = {'POSITION': accessor(p, 'VEC3', 5126, 34962, True),
             'NORMAL': accessor(normals(p, faces).astype(np.float32), 'VEC3', 5126, 34962)}
    if uv is not None:
        attrs['TEXCOORD_0'] = accessor(uv, 'VEC2', 5126, 34962)
    indices = accessor(faces.reshape(-1), 'SCALAR', 5125, 34963)
    return {'attributes': attrs, 'indices': indices, 'material': material}

cloth = primitive(positions, triangles, uvs)
connector = primitive(gp, gt, material=1)
image_view = buffer_view(SOURCE.read_bytes())
gltf = {
    'asset': {'version': '2.0', 'generator': 'ZM Exclusiva — photo-guided approximate mesh'},
    'scene': 0, 'scenes': [{'nodes': [0]}],
    'nodes': [{'mesh': 0, 'name': 'Vestido Aurora — geometria aproximada'}],
    'meshes': [{'name': 'Vestido com superfícies curvas e concha', 'primitives': [cloth, connector]}],
    'materials': [
        {'name': 'Tecido azul da foto', 'doubleSided': True, 'pbrMetallicRoughness': {
            'baseColorTexture': {'index': 0}, 'metallicFactor': 0, 'roughnessFactor': .92}},
        {'name': 'Concha dourada aproximada', 'doubleSided': True, 'pbrMetallicRoughness': {
            'baseColorFactor': [.83, .56, .17, 1], 'metallicFactor': .72, 'roughnessFactor': .31}}
    ],
    'textures': [{'source': 0, 'sampler': 0}],
    'samplers': [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 33071, 'wrapT': 33071}],
    'images': [{'bufferView': image_view, 'mimeType': 'image/png'}],
    'bufferViews': views, 'accessors': accessors, 'buffers': [{'byteLength': len(binary)}],
    'extras': {'accuracy': 'Approximate, illustrative. Depth and back inferred from one frontal photo.',
               'source': 'assets/look-01.webp, via hero-aurora-cutout.png',
               'dimensions': 'Normalized display proportions; not measured garment dimensions.',
               'method': 'Curved silhouette surfaces, embedded photographic texture, inferred connector.'}
}
document = json.dumps(gltf, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
document += b' ' * (-len(document) % 4)
binary += b'\0' * (-len(binary) % 4)
total = 12 + 8 + len(document) + 8 + len(binary)
OUTPUT.write_bytes(struct.pack('<III', 0x46546C67, 2, total) + struct.pack('<II', len(document), 0x4E4F534A)
                   + document + struct.pack('<II', len(binary), 0x004E4942) + binary)
report = {'file': str(OUTPUT.name), 'bytes': total,
          'vertices': sum(accessors[p['attributes']['POSITION']]['count'] for p in [cloth, connector]),
          'triangles': sum(accessors[p['indices']]['count']//3 for p in [cloth, connector]),
          'frontAndBackDepth': float(np.ptp(positions[:, 2])),
          'approximation': gltf['extras']}
(ROOT / 'docs/dress-3d-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(report, ensure_ascii=False, indent=2))
