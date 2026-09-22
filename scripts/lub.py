"""Load RO client .lub files (Lua 5.1 bytecode built for 32-bit, size_t=4)
into a 64-bit Lua 5.1 (lupa) by rewriting every size_t field to 8 bytes,
then run them and hand back the globals as Python data."""
import struct
from lupa import lua51


def convert(data: bytes) -> bytes:
    assert data[:5] == b'\x1bLuaQ', 'not Lua 5.1 bytecode'
    hdr = bytearray(data[:12])
    assert hdr[8] == 4, f'size_t is {hdr[8]}, expected 4'
    hdr[8] = 8
    out = bytearray(hdr)
    pos = 12

    def rd(n):
        nonlocal pos
        b = data[pos:pos + n]
        pos += n
        return b

    def cp(n):
        out.extend(rd(n))

    def int_():
        b = rd(4)
        out.extend(b)
        return struct.unpack('<i', b)[0]

    def string():
        (n,) = struct.unpack('<I', rd(4))
        out.extend(struct.pack('<Q', n))
        if n:
            cp(n)

    def function():
        string()           # source
        int_(); int_()     # linedefined, lastlinedefined
        cp(4)              # nups, numparams, is_vararg, maxstacksize
        n = int_(); cp(4 * n)          # code
        n = int_()                     # constants
        for _ in range(n):
            t = rd(1)[0]
            out.append(t)
            if t == 0:
                pass
            elif t == 1:
                cp(1)
            elif t == 3:
                cp(8)
            elif t == 4:
                string()
            else:
                raise ValueError(f'constant type {t}')
        n = int_()                     # protos
        for _ in range(n):
            function()
        n = int_(); cp(4 * n)          # lineinfo
        n = int_()                     # locvars
        for _ in range(n):
            string(); int_(); int_()
        n = int_()                     # upvalues
        for _ in range(n):
            string()

    function()
    assert pos == len(data), f'trailing {len(data) - pos} bytes'
    return bytes(out)


def runtime():
    return lua51.LuaRuntime(unpack_returned_tuples=False, encoding=None)


def load(L, path):
    """Run one .lub in runtime L; returns the error string or None."""
    code = convert(open(path, 'rb').read())
    run = L.eval('function(s) local f,e=loadstring(s) if not f then return e end local ok,err=pcall(f) if not ok then return tostring(err) end return nil end')
    err = run(code)
    return err.decode('cp874', 'replace') if isinstance(err, bytes) else err


def to_py(v, enc='cp874', depth=0):
    """Lua table -> dict/list; byte strings decoded (Thai client uses cp874 / tis-620 in many tables)."""
    if isinstance(v, bytes):
        for e in ('utf-8', enc):
            try:
                return v.decode(e)
            except UnicodeDecodeError:
                pass
        return v.decode(enc, 'replace')
    if lua51.lua_type(v) == 'table':
        if depth > 20:
            return '<deep>'
        return {to_py(k, enc, depth + 1): to_py(x, enc, depth + 1) for k, x in v.items()}
    return v
