# ROZero GRF Weekly Diff

Windows WPF desktop tool and headless runner for deterministic weekly GRF comparisons. It needs Node.js; no AI and no network are required.

## Build

```powershell
dotnet build .\GrfDiffTool.csproj -c Release -p:EnableWindowsTargeting=true
dotnet publish .\GrfDiffTool.csproj -c Release -r win-x64 --self-contained false -o "D:\Data grf roz\GrfDiffTool"
```

The installed copy lives in `D:\Data grf roz\GrfDiffTool` (desktop shortcut points there). Publishing also copies `../grf-extract.mjs` and `../grf-des.mjs` next to the exe; the tool runs them with `node`, because GrfCL cannot open this client's GRF 0x300 ("Event Horizon"). Flag 2 entries cannot be decoded, so they are tracked by the SHA-256 of their stored bytes and are never copied out.

## Headless run

```powershell
GrfDiffTool.exe --run --grf D:\RagnarokZero\data.grf --output "D:\Data grf roz\weekly"
```

The run stops without writing a snapshot when another process has `data.grf` open for writing (the patcher mid-update), or when extraction fails. The game itself only reads the file, so it can stay open. There is no fallback to an older extraction.

Each run writes a dated snapshot containing `manifest.jsonl`, `summary.json`, `removed.json`, `report.md`, and `added`/`changed` files. The `latest.json` pointer selects the baseline for the next run.

The extractor uses a temporary `.staging` directory and streams SHA-256 hashing so the complete GRF is not retained as a second weekly copy.
