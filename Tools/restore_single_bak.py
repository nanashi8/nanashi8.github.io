#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Restore files from '*.single.bak' to their original filenames safely.
Run from workspace root.
"""
from pathlib import Path
import shutil

ROOT = Path('/Users/yuichinakamura/Documents/20251006_002/SimpleWord')
count = 0
for p in ROOT.rglob('*.single.bak'):
    dest = Path(str(p)[:-len('.single.bak')])
    try:
        shutil.copy2(p, dest)
        print(f"restored: {p} -> {dest}")
        count += 1
    except Exception as e:
        print(f"failed to restore {p}: {e}")
print(f"done. restored {count} files.")
