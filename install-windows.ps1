Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/valueriver/aios.git"
$AppName = "aios"
$LocalPort = 9700
$AppDir = Join-Path $HOME "aios"
$CurrentUser = "$env:USERDOMAIN\$env:USERNAME"

if (-not $IsWindows) {
  throw "install-windows.ps1 only supports Windows."
}

Write-Host "[1/5] Check dependencies..."
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "git not found. Install Git for Windows first."
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "node not found. Install Node.js 22+ first."
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm not found. Install Node.js 22+ first."
}

$NodeVersion = [int]((node --version).TrimStart("v").Split(".")[0])
if ($NodeVersion -lt 22) {
  throw "Node.js version must be >= 22."
}

Write-Host "[2/5] Pull code..."
if (-not (Test-Path (Join-Path $AppDir ".git"))) {
  $Parent = Split-Path -Parent $AppDir
  if (-not (Test-Path $Parent)) {
    New-Item -ItemType Directory -Force -Path $Parent | Out-Null
  }
  git clone $RepoUrl $AppDir
}
else {
  git -C $AppDir pull --ff-only
}

Write-Host "[3/5] Install deps + build UI..."
Set-Location $AppDir
npm ci
npm run build
npm link

$ServerTaskName = "ai.$AppName.server"
$AppsTaskName = "ai.$AppName.apps"
$ScriptDir = Join-Path $AppDir "scripts"
$ServerRunner = Join-Path $ScriptDir "run-aios-server.ps1"
$AppsRunner = Join-Path $ScriptDir "run-aios-apps.ps1"

if (-not (Test-Path $ScriptDir)) {
  New-Item -ItemType Directory -Force -Path $ScriptDir | Out-Null
}

@"
Set-Location "$AppDir"
node server/index.js
"@ | Set-Content -Path $ServerRunner -Encoding UTF8

@"
Set-Location "$AppDir"
node apps/index.js
"@ | Set-Content -Path $AppsRunner -Encoding UTF8

Write-Host "[4/5] Setup startup tasks..."
$ServerAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ServerRunner`""
$AppsAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$AppsRunner`""
$Trigger = New-ScheduledTaskTrigger -AtLogOn -User $CurrentUser

Unregister-ScheduledTask -TaskName $ServerTaskName -Confirm:$false -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName $AppsTaskName -Confirm:$false -ErrorAction SilentlyContinue

Register-ScheduledTask -TaskName $ServerTaskName -Action $ServerAction -Trigger $Trigger -User $CurrentUser -RunLevel Highest -Force | Out-Null
Register-ScheduledTask -TaskName $AppsTaskName -Action $AppsAction -Trigger $Trigger -User $CurrentUser -RunLevel Highest -Force | Out-Null

Start-ScheduledTask -TaskName $ServerTaskName
Start-ScheduledTask -TaskName $AppsTaskName

Write-Host ""
Write-Host "Done."
Write-Host ""
Write-Host "  Main Task: $ServerTaskName"
Write-Host "  Apps Task: $AppsTaskName"
Write-Host "  CLI:       aios"
Write-Host "  Web:       http://localhost:$LocalPort"
Write-Host ""
