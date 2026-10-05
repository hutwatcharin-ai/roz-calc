@echo off
rem Opens /admin/prices on this PC (owner, 5 Oct 2026). Starts the local
rem server first if nothing is listening on port 3177 yet. The page only
rem exists where ENABLE_ADMIN=1 is in .env.local, i.e. on this machine.
cd /d D:\Web\roz-calc
powershell -NoProfile -Command "if (-not (Get-NetTCPConnection -LocalPort 3177 -State Listen -ErrorAction SilentlyContinue)) { Start-Process -FilePath cmd.exe -ArgumentList '/c npx next start -p 3177' -WorkingDirectory 'D:\Web\roz-calc' -WindowStyle Minimized; Start-Sleep 8 }"
start "" http://localhost:3177/admin/prices
