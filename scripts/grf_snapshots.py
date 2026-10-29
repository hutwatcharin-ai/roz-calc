"""Where the newest extracted client files are, without naming a date.

GrfDiffTool (D:/Data grf roz/GrfDiffTool) writes one folder per run under
D:/Data grf roz/weekly/<YYYY-MM-DD>/, holding only the files that changed since
the run before, in added/ and changed/. A file's newest copy is therefore in the
newest snapshot that has it, falling back to older snapshots and finally to the
full 22 Sep 2026 extract.

Scripts call weekly_roots() instead of hard-coding a snapshot path, so a new
patch needs no code edit: run GrfDiffTool, then rerun the scripts. (Hard-coded
paths also made scripts/dressup/zorder.py change on every patch, which the
dress-up exporter treats as an exporter change and re-exports every part.)
"""
import os
import re

WEEKLY = 'D:/Data grf roz/weekly'


def weekly_roots():
    """'<snapshot>/<added|changed>/data' folders, newest snapshot first."""
    if not os.path.isdir(WEEKLY):
        return []
    dates = sorted((d for d in os.listdir(WEEKLY) if re.fullmatch(r'\d{4}-\d{2}-\d{2}', d)), reverse=True)
    roots = []
    for d in dates:
        for part in ('added', 'changed'):
            p = f'{WEEKLY}/{d}/{part}/data'
            if os.path.isdir(p):
                roots.append(p)
    return roots


def newest(rel):
    """Newest extracted copy of a client file, by its path under data/ (forward slashes), or None."""
    for root in weekly_roots():
        p = f'{root}/{rel}'
        if os.path.exists(p):
            return p
    return None
