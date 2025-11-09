#!/usr/bin/env python3
from pathlib import Path
import csv

def clean_leading(lines):
    while lines and lines[0].lstrip().startswith('//'):
        lines.pop(0)
    while lines and lines[0].strip()=='' :
        lines.pop(0)
    return lines

RES = Path('SimpleWord/Resources')
files = list(RES.glob('*.csv'))
fixed = []
for f in files:
    text = f.read_text(encoding='utf-8')
    lines = text.splitlines()
    lines = clean_leading(lines)
    if not lines:
        continue
    header = lines[0]
    reader = csv.reader(lines)
    rows = list(reader)
    expected = len(rows[0])
    changed = False
    out_lines = [header]
    for row in rows[1:]:
        if len(row) == expected:
            # keep as is
            import io
            sio = io.StringIO(); csv.writer(sio, lineterminator='').writerow(row)
            out_lines.append(sio.getvalue())
            continue
        # try to fix rows where one column is combined with semicolon
        if len(row) == expected-1:
            # look for a cell with a semicolon that can be split
            split_done = False
            for idx,cell in enumerate(row):
                if ';' in cell:
                    parts = cell.split(';')
                    # try split into two pieces
                    if len(parts) >= 2:
                        # split at first semicolon producing two fields (join rest back with ;)
                        left = parts[0]
                        right = ';'.join(parts[1:])
                        new_row = row[:idx] + [left, right] + row[idx+1:]
                        if len(new_row) == expected:
                            import io
                            sio = io.StringIO(); csv.writer(sio, lineterminator='').writerow(new_row)
                            out_lines.append(sio.getvalue())
                            split_done = True
                            changed = True
                            break
            if not split_done:
                # fallback: append original as-is (to avoid data loss) but mark
                import io
                sio = io.StringIO(); csv.writer(sio, lineterminator='').writerow(row)
                out_lines.append(sio.getvalue())
                print('Could not auto-fix row in', f, row)
        else:
            # complex case: leave as-is
            import io
            sio = io.StringIO(); csv.writer(sio, lineterminator='').writerow(row)
            out_lines.append(sio.getvalue())
            if len(row) < expected:
                print('Row shorter than expected and not fixable in', f, 'len', len(row))
            else:
                print('Row longer than expected in', f, 'len', len(row))
    if changed:
        f.write_text('\n'.join(out_lines)+"\n", encoding='utf-8')
        fixed.append(f.name)
        print('Fixed', f.name)
    else:
        print('No changes for', f.name)

print('Fixed files:', fixed)
