#!/usr/bin/env python3
"""Render the aperture-mark favicon in several sizes as PNGs.

Pure stdlib: the mark is rasterised procedurally (supersampled, then
box-downsampled) and written out with a minimal PNG encoder, so no image
libraries are needed.
"""

import struct
import zlib

# favicon.svg geometry: 32-unit viewbox
BG = (0x20, 0x1B, 0x17)  # ink
FG = (0xFA, 0xF8, 0xF3)  # paper
ACCENT = (0xB4, 0x53, 0x2F)  # safelight

# (x1, y1, x2, y2) in 32-unit space — the three iris blades
BLADES = [(16, 7, 20.5, 20), (25, 13, 12, 17.5), (22, 22.5, 13.5, 12)]
RING = (16, 16, 9)  # cx, cy, r
DOT = (16, 16, 2.4)
STROKE = 1.6
CORNER = 6.0  # rounded-rect corner radius


def inside_rounded_square(px, py, corner):
    """True if the point is inside the rounded-square background."""
    m = 32.0 * 0.04  # 4% bleed margin so edges stay crisp
    lo, hi = m, 32.0 - m
    if lo <= px <= hi and lo <= py <= hi:
        return True
    cx = min(max(px, lo + corner), hi - corner)
    cy = min(max(py, lo + corner), hi - corner)
    return (px - cx) ** 2 + (py - cy) ** 2 <= corner ** 2


def seg_dist(px, py, x1, y1, x2, y2):
    dx, dy = x2 - x1, y2 - y1
    t = max(0, min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
    return ((px - x1 - t * dx) ** 2 + (py - y1 - t * dy) ** 2) ** 0.5


def sample(px, py):
    """Colour for one point in 32-unit space, or None when transparent."""
    if not inside_rounded_square(px, py, CORNER):
        return None
    for x1, y1, x2, y2 in BLADES:
        if seg_dist(px, py, x1, y1, x2, y2) <= STROKE / 2:
            return FG
    du, dv = px - RING[0], py - RING[1]
    if abs((du * du + dv * dv) ** 0.5 - RING[2]) <= STROKE / 2:
        return FG
    du, dv = px - DOT[0], py - DOT[1]
    if du * du + dv * dv <= DOT[2] ** 2:
        return ACCENT
    return BG


def render_icon(size, ss):
    """Render at `size` px by supersampling each pixel ss×ss."""
    out = [[(0, 0, 0, 0)] * size for _ in range(size)]
    for y in range(size):
        for x in range(size):
            r = g = b = a = 0
            for sy in range(ss):
                for sx in range(ss):
                    px = (x + (sx + 0.5) / ss) * 32.0 / size
                    py = (y + (sy + 0.5) / ss) * 32.0 / size
                    col = sample(px, py)
                    if col:
                        r += col[0]
                        g += col[1]
                        b += col[2]
                        a += 255
            n = ss * ss
            out[y][x] = (r // n, g // n, b // n, a // n)
    return out


def write_png(path, img):
    size = len(img)
    raw = b"".join(b"\x00" + bytes(v for px in row for v in px) for row in img)

    def chunk(kind, data):
        c = struct.pack(">I", len(data)) + kind + data
        return c + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)
    print(f"wrote {path} ({size}x{size})")


if __name__ == "__main__":
    write_png("public/favicon-32.png", render_icon(32, ss=10))
    write_png("public/apple-touch-icon.png", render_icon(180, ss=3))
    write_png("public/icon-512.png", render_icon(512, ss=2))
