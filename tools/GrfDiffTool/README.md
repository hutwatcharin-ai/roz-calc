# ROZero GRF Weekly Diff

Windows WPF desktop tool and headless runner for deterministic weekly GRF comparisons. It needs Node.js; no AI and no network are required.

## Build

```powershell
dotnet build .\GrfDiffTool.csproj -c Release -p:EnableWindowsTargeting=true
dotnet publish .\GrfDiffTool.csproj -c Release -r win-x64 --self-contained false -o "D:\Data grf roz\GrfDiffTool"
```

The installed copy lives in `D:\Data grf roz\GrfDiffTool` (desktop shortcut points there). Publishing also copies `../grf-extract.mjs` and `../grf-des.mjs` next to the exe; the tool runs them with `node`, because GrfCL cannot open this client's GRF 0x300 ("Event Horizon"). Every entry decodes, flag 2 (mixed cipher) included; an entry that ever fails is tracked by the SHA-256 of its stored bytes and is not copied out.

## Headless run

```powershell
GrfDiffTool.exe --run --grf D:\RagnarokZero\data.grf --output "D:\Data grf roz\weekly"
```

The run stops without writing a snapshot when another process has `data.grf` open for writing (the patcher mid-update), or when extraction fails. The game itself only reads the file, so it can stay open. There is no fallback to an older extraction.

Each run writes a dated snapshot containing `manifest.jsonl`, `summary.json`, `removed.json`, `report.md`, and `added`/`changed` files. The `latest.json` pointer selects the baseline for the next run.

The extractor uses a temporary `.staging` directory and streams SHA-256 hashing so the complete GRF is not retained as a second weekly copy.

## Compare two stored snapshots

The window's "เทียบ snapshot" row (or `GrfDiffTool.exe --compare 2026-10-15 2026-10-29`) compares any two snapshot folders by their manifests, without reading the GRF, and writes `compare/<from>_vs_<to>.md` under the snapshot folder.
