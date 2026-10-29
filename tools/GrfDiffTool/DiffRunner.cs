using System.Diagnostics;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace GrfDiffTool;

public sealed record ManifestEntry(string Path, long Size, string Sha256, string ReadStatus = "ok");
public sealed record DiffResult(bool Success, int Added, int Changed, int Removed, string? ReportPath, string? Error = null);
public sealed record DiffProgress(string Stage, int Current, int Total);

public sealed class DiffRunner
{
    static readonly JsonSerializerOptions J = new(JsonSerializerDefaults.Web) { WriteIndented = true };
    static readonly JsonSerializerOptions JL = new(JsonSerializerDefaults.Web);

    public async Task<DiffResult> RunAsync(Options o, CancellationToken ct, Action<string>? log = null, Action<DiffProgress>? progress = null)
    {
        if (!File.Exists(o.GrfPath)) return new(false, 0, 0, 0, null, $"GRF not found: {o.GrfPath}");
        if (!File.Exists(o.ExtractorScript)) return new(false, 0, 0, 0, null, $"grf-extract.mjs not found: {o.ExtractorScript}");
        // A running game or patcher keeps data.grf open, and GrfCL then reports the archive as broken.
        try { using var _ = new FileStream(o.GrfPath, FileMode.Open, FileAccess.Read, FileShare.None); }
        catch (IOException) { return new(false, 0, 0, 0, null, "data.grf กำลังถูกใช้อยู่ — ปิดเกม/launcher หรือรอแพทช์จบก่อน แล้วลองใหม่"); }
        var day = DateTime.Now.ToString("yyyy-MM-dd");
        var run = DateTime.Now.ToString("yyyyMMdd-HHmmss");
        var root = Path.GetFullPath(o.OutputRoot);
        var snap = Path.Combine(root, day);
        var staging = Path.Combine(root, ".staging", run);
        Directory.CreateDirectory(staging);
        try
        {
            progress?.Invoke(new("Extracting GRF", 0, -1));
            log?.Invoke($"Extracting with {o.ExtractorScript}");
            var exit = await Extract(o, staging, ct, log);
            if (exit != 0) throw new InvalidOperationException($"grf-extract.mjs exited with code {exit}");
            var data = Path.Combine(staging, "files");
            Directory.CreateDirectory(data);
            progress?.Invoke(new("Scanning extracted files", 0, -1));
            var files = Directory.EnumerateFiles(data, "*", SearchOption.AllDirectories).ToList();
            var cur = new Dictionary<string, ManifestEntry>(StringComparer.OrdinalIgnoreCase);
            log?.Invoke($"Found {files.Count:N0} files. Hashing SHA-256...");
            for (var i = 0; i < files.Count; i++)
            {
                ct.ThrowIfCancellationRequested();
                var f = files[i];
                var rel = Path.GetRelativePath(data, f).Replace('\\', '/');
                cur[rel] = new(rel, new FileInfo(f).Length, await Hash(f, ct));
                progress?.Invoke(new("Hashing files", i + 1, files.Count));
            }
            // Flag 2 entries cannot be decoded, so they are tracked by the hash of their stored bytes.
            foreach (var l in File.ReadLines(Path.Combine(staging, "index.jsonl")))
            {
                using var d = JsonDocument.Parse(l); var e = d.RootElement;
                if (!e.TryGetProperty("rawSha256", out var raw)) continue;
                var rel = e.GetProperty("name").GetString()!;
                cur[rel] = new(rel, e.GetProperty("size").GetInt64(), raw.GetString()!, Encrypted);
            }
            var enc = cur.Values.Count(x => x.ReadStatus == Encrypted);
            log?.Invoke($"{enc:N0} encrypted entries compared by stored bytes (size only against a baseline that has their plain content).");
            progress?.Invoke(new("Comparing with previous snapshot", 0, 1));
            var baseM = Load(root);
            var add = cur.Values.Where(x => !baseM.ContainsKey(x.Path)).ToList();
            var change = cur.Values.Where(x => baseM.TryGetValue(x.Path, out var old) && Differs(old, x)).ToList();
            var rem = baseM.Values.Where(x => !cur.ContainsKey(x.Path)).ToList();
            Directory.CreateDirectory(snap);
            Directory.CreateDirectory(Path.Combine(snap, "added"));
            Directory.CreateDirectory(Path.Combine(snap, "changed"));
            progress?.Invoke(new("Copying changed files", 0, add.Count + change.Count));
            var copied = 0;
            foreach (var e in add) { if (e.ReadStatus == Encrypted) continue; CopySafe(data, e.Path, Path.Combine(snap, "added", e.Path)); progress?.Invoke(new("Copying changed files", ++copied, add.Count + change.Count)); }
            foreach (var e in change) { if (e.ReadStatus == Encrypted) continue; CopySafe(data, e.Path, Path.Combine(snap, "changed", e.Path)); progress?.Invoke(new("Copying changed files", ++copied, add.Count + change.Count)); }
            progress?.Invoke(new("Writing reports", 1, 1));
            await File.WriteAllLinesAsync(Path.Combine(snap, "manifest.jsonl"), cur.Values.OrderBy(x => x.Path).Select(x => JsonSerializer.Serialize(x, JL)), ct);
            await File.WriteAllTextAsync(Path.Combine(snap, "removed.json"), JsonSerializer.Serialize(rem, J), ct);
            await File.WriteAllTextAsync(Path.Combine(snap, "summary.json"), JsonSerializer.Serialize(new { generatedAt = DateTimeOffset.Now, source = o.GrfPath, entries = cur.Count, added = add.Count, changed = change.Count, removed = rem.Count, unchanged = cur.Count - add.Count - change.Count }, J), ct);
            var report = Path.Combine(snap, "report.md");
            await File.WriteAllTextAsync(report, Report(o, cur.Count, add, change, rem), Encoding.UTF8, ct);
            AtomicWrite(Path.Combine(root, "latest.json"), JsonSerializer.Serialize(new { date = day, manifest = Path.Combine(snap, "manifest.jsonl") }, J));
            CleanupOldPayloads(root, snap, log);
            log?.Invoke($"Done: +{add.Count} ~{change.Count} -{rem.Count}");
            return new(true, add.Count, change.Count, rem.Count, report);
        }
        catch (OperationCanceledException) { return new(false, 0, 0, 0, null, "Cancelled"); }
        catch (Exception ex) { log?.Invoke(ex.ToString()); return new(false, 0, 0, 0, null, ex.Message); }
        finally { try { if (Directory.Exists(staging)) Directory.Delete(staging, true); } catch { } }
    }

    static async Task<int> Extract(Options o, string staging, CancellationToken ct, Action<string>? log)
    {
        // GrfCL cannot open this client's GRF 0x300 ("Event Horizon"); grf-extract.mjs can.
        var p = new ProcessStartInfo("node") { WorkingDirectory = staging, UseShellExecute = false, RedirectStandardOutput = true, RedirectStandardError = true, CreateNoWindow = true };
        foreach (var a in new[] { o.ExtractorScript, o.GrfPath, staging, "--match", ".", "--raw-hash" }) p.ArgumentList.Add(a);
        using var x = Process.Start(p) ?? throw new InvalidOperationException("Unable to start node");
        var so = x.StandardOutput.ReadToEndAsync(); var se = x.StandardError.ReadToEndAsync();
        await x.WaitForExitAsync(ct); var text = await so + await se;
        foreach (var l in text.Split('\n', StringSplitOptions.RemoveEmptyEntries).TakeLast(10)) log?.Invoke(l.Trim());
        return x.ExitCode;
    }

    const string Encrypted = "encrypted";
    static bool Differs(ManifestEntry old, ManifestEntry cur) => (old.ReadStatus == Encrypted) == (cur.ReadStatus == Encrypted) ? old.Sha256 != cur.Sha256 : old.Size != cur.Size;
    static async Task<string> Hash(string f, CancellationToken ct) { await using var s = File.OpenRead(f); using var h = IncrementalHash.CreateHash(HashAlgorithmName.SHA256); var b = new byte[1024 * 1024]; int n; while ((n = await s.ReadAsync(b, ct)) > 0) h.AppendData(b, 0, n); return Convert.ToHexString(h.GetHashAndReset()).ToLowerInvariant(); }
    static void AtomicWrite(string path, string text) { var tmp = path + ".tmp"; File.WriteAllText(tmp, text, Encoding.UTF8); File.Move(tmp, path, true); }
    static void CleanupOldPayloads(string root, string currentSnapshot, Action<string>? log) {
        foreach (var dir in Directory.EnumerateDirectories(root)) {
            if (string.Equals(Path.GetFullPath(dir), Path.GetFullPath(currentSnapshot), StringComparison.OrdinalIgnoreCase)) continue;
            foreach (var name in new[] { "added", "changed" }) {
                var payload = Path.Combine(dir, name);
                if (!Directory.Exists(payload)) continue;
                try { Directory.Delete(payload, true); log?.Invoke($"Removed old payload: {payload}"); }
                catch (Exception ex) { log?.Invoke($"Could not remove old payload: {ex.Message}"); }
            }
        }
    }
    static void CopySafe(string root, string rel, string target) { var full = Path.GetFullPath(Path.Combine(root, rel.Replace('/', Path.DirectorySeparatorChar))); if (!full.StartsWith(Path.GetFullPath(root) + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Unsafe entry path"); Directory.CreateDirectory(Path.GetDirectoryName(target)!); File.Copy(full, target, true); }
    static Dictionary<string, ManifestEntry> Load(string root) {
        var empty = new Dictionary<string, ManifestEntry>(StringComparer.OrdinalIgnoreCase);
        var latest = Path.Combine(root, "latest.json");
        if (!File.Exists(latest)) return empty;
        using var d = JsonDocument.Parse(File.ReadAllText(latest));
        if (!d.RootElement.TryGetProperty("manifest", out var m)) return empty;
        var p = m.GetString(); if (string.IsNullOrWhiteSpace(p) || !File.Exists(p)) return empty;
        var r = new Dictionary<string, ManifestEntry>(StringComparer.OrdinalIgnoreCase);
        // Older snapshots were written indented, so one record spans several lines; split on top-level objects instead of lines.
        foreach (var obj in JsonObjects(File.ReadAllText(p))) { var e = JsonSerializer.Deserialize<ManifestEntry>(obj, J); if (e != null) r[e.Path] = e; }
        if (r.Count == 0 && new FileInfo(p).Length > 0) throw new InvalidDataException($"Baseline manifest has no readable entries: {p}");
        return r;
    }
    static IEnumerable<string> JsonObjects(string s) {
        int depth = 0, start = -1; bool str = false, esc = false;
        for (int i = 0; i < s.Length; i++) {
            var c = s[i];
            if (str) { if (esc) esc = false; else if (c == '\\') esc = true; else if (c == '"') str = false; continue; }
            if (c == '"') str = true;
            else if (c == '{') { if (depth++ == 0) start = i; }
            else if (c == '}' && depth > 0 && --depth == 0) yield return s[start..(i + 1)];
        }
        if (depth != 0) throw new InvalidDataException("Baseline manifest ends inside an unclosed record");
    }
    static string Report(Options o, int total, List<ManifestEntry> a, List<ManifestEntry> c, List<ManifestEntry> r) { static string Rows(IEnumerable<ManifestEntry> x) => string.Join(Environment.NewLine, x.OrderBy(e => e.Path).Select(e => $"- `{e.Path}` ({e.Size:N0} bytes, `{e.Sha256}`)")); return $"# GRF Weekly Diff\n\n- Source: `{o.GrfPath}`\n- Generated: `{DateTimeOffset.Now:O}`\n- Entries: {total:N0}\n\n| State | Count |\n|---|---:|\n| Added | {a.Count:N0} |\n| Changed | {c.Count:N0} |\n| Removed | {r.Count:N0} |\n\n## Added\n\n{Rows(a)}\n\n## Changed\n\n{Rows(c)}\n\n## Removed\n\n{Rows(r)}\n"; }
}
