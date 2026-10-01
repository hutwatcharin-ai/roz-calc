# Moves globals.css rules used by one route only into that route's own CSS.
# A rule moves when every class in its selector is used only by files under
# one app/<a>/<b> route (never by a shared component), and none of those
# classes appears in a rule that stays global (an @media block, a mixed
# selector) -- otherwise the cascade order between them would change.
import re, os, io, collections, sys
os.chdir(r'D:\Web\roz-calc')
WRITE = '--write' in sys.argv
raw = io.open('app/globals.css', encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in raw else '\n'
css = raw.replace('\r\n', '\n')

src = {}
for root in ['app', 'components', 'lib']:
    for dp, dn, fn in os.walk(root):
        for f in fn:
            if f.endswith(('.tsx', '.ts')) and '.test.' not in f:
                p = os.path.join(dp, f).replace(os.sep, '/')
                src[p] = io.open(p, encoding='utf-8').read()

# Top-level spans over the ORIGINAL text, braces inside comments ignored.
spans = []
depth = 0
start = 0
i = 0
n = len(css)
while i < n:
    if css.startswith('/*', i):
        j = css.index('*/', i + 2)
        i = j + 2
        continue
    c = css[i]
    if c == '{':
        depth += 1
    elif c == '}':
        depth -= 1
        if depth == 0:
            spans.append((start, i + 1))
            start = i + 1
    i += 1
tail = css[start:]

def selector(text):
    t = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
    return t[:t.index('{')].strip()

cache = {}
def users(cls):
    if cls not in cache:
        pat = re.compile(r'[\s"\'`{(]' + re.escape(cls) + r'(?=[\s"\'`})])')
        cache[cls] = {p for p, t in src.items() if pat.search(t)}
    return cache[cls]

def route_of(p):
    if p.startswith('app/'):
        parts = p.split('/')
        if p == 'app/page.tsx':
            return 'app'
        return '/'.join(parts[:3]) if len(parts) > 3 else None
    return None

info = []
for (a, b) in spans:
    text = css[a:b]
    sel = selector(text)
    allclasses = set(re.findall(r'\.([a-zA-Z][\w-]*)', re.sub(r'/\*.*?\*/', '', text, flags=re.S)))
    route = None
    if not sel.startswith('@'):
        classes = set(re.findall(r'\.([a-zA-Z][\w-]*)', sel))
        if classes:
            routes = set()
            ok = True
            for c in classes:
                for p in users(c):
                    r = route_of(p)
                    if r is None:
                        ok = False
                    routes.add(r)
            if ok and len(routes) == 1 and None not in routes:
                route = next(iter(routes))
    info.append([a, b, route, allclasses])

# Classes written together on one element (same string literal) can fight
# over a property; their relative order must not change.
strings = []
for t in src.values():
    strings += re.findall(r'"([^"\n]*)"|\'([^\'\n]*)\'|`([^`]*)`', t)
siblings = collections.defaultdict(set)
for g in strings:
    lit = ''.join(g)
    toks = set(re.findall(r'[a-zA-Z][\w-]*', lit))
    if len(toks) < 2:
        continue
    for tk in toks:
        siblings[tk] |= toks
# Also a BEM modifier sits beside its base class: .x--y with .x.
def family(c):
    base = c.split('--')[0]
    return {base} | siblings.get(c, set())

# Classes that stay global block their rules from moving; repeat to a fixpoint.
changed = True
while changed:
    changed = False
    staying = set()
    for a, b, route, cl in info:
        if route is None:
            staying |= cl
    for row in info:
        if not row[2]:
            continue
        near = set()
        for c in row[3]:
            near |= family(c)
        if row[3] & staying or (near - row[3]) & staying:
            row[2] = None
            changed = True

moved = collections.defaultdict(list)
keep = []
for a, b, route, cl in info:
    (moved[route] if route else keep).append(css[a:b])
total_moved = sum(len(''.join(v)) for v in moved.values())
print('global before', len(css), 'moved', total_moved, 'global after', len(css) - total_moved)
for r, v in sorted(moved.items(), key=lambda kv: -len(''.join(kv[1]))):
    print(len(''.join(v)), r)

if WRITE:
    for r, v in moved.items():
        d = r
        out = os.path.join(d, 'page.css')
        body = ('/* Styles used by this page only, moved out of app/globals.css on 1 Oct 2026\n'
                '   so other pages stop downloading them (scripts/css-split.py). */\n' + ''.join(v).strip('\n') + '\n')
        io.open(out, 'w', encoding='utf-8', newline='').write(body.replace('\n', nl))
        pages = [os.path.join(d, 'page.tsx')] if d == 'app' else [
            os.path.join(dp, 'page.tsx') for dp, dn, fn in os.walk(d) if 'page.tsx' in fn]
        for page in pages:
            rel = os.path.relpath(out, os.path.dirname(page)).replace(os.sep, '/')
            if not rel.startswith('.'):
                rel = './' + rel
            line = "import '" + rel + "';"
            t = io.open(page, encoding='utf-8', newline='').read()
            pnl = '\r\n' if '\r\n' in t else '\n'
            if line in t:
                continue
            lines = t.split(pnl)
            idx = next(k for k, l in enumerate(lines) if l.startswith('import '))
            lines.insert(idx, line)
            io.open(page, 'w', encoding='utf-8', newline='').write(pnl.join(lines))
    io.open('app/globals.css', 'w', encoding='utf-8', newline='').write((''.join(keep) + tail).replace('\n', nl))
    print('written')
