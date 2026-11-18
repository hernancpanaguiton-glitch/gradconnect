"""Renders every page of a PDF to PNG for the visual check.

Usage: python -I pages.py <pdf> <outdir>
"""
import sys
from pathlib import Path

import pymupdf

pdf, out = Path(sys.argv[1]), Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)

doc = pymupdf.open(pdf)
for i, page in enumerate(doc, 1):
    page.get_pixmap(dpi=80).save(out / f'page-{i:03d}.png')

print(f'{doc.page_count} pages -> {out}')
