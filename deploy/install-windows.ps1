Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/valueriver/aios.git"
$AppName = "aios"
$LocalPort = 9700
$AppDir = Join-Path $HOME "aios"
$RunningOnWindows = [System.Environment]::OSVersion.Platform -eq [System.PlatformID]::Win32NT

if (-not $RunningOnWindows) {
  throw "install-windows.ps1 only supports Windows."
}

try {
  $CurrentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
}
catch {
  throw "Unable to detect current Windows user."
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

$NodeCommand = Get-Command node -ErrorAction Stop
$NodeExe = $NodeCommand.Source
if (-not (Test-Path $NodeExe)) {
  throw "Unable to resolve node executable path."
}

Write-Host "[2/5] Pull code..."
if (-not (Test-Path (Join-Path $AppDir ".git"))) {
  if ((Test-Path $AppDir) -and (Get-ChildItem -Force -Path $AppDir -ErrorAction SilentlyContinue | Select-Object -First 1)) {
    throw "Target directory already exists and is not a git repository: $AppDir"
  }
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
$NpmCacheDir = Join-Path $AppDir ".npm-cache"
if (-not (Test-Path $NpmCacheDir)) {
  New-Item -ItemType Directory -Force -Path $NpmCacheDir | Out-Null
}
if (-not (Test-Path $NpmCacheDir)) {
  throw "Failed to create npm cache directory: $NpmCacheDir"
}
try {
  $ProbeFile = Join-Path $NpmCacheDir ".aios-write-test"
  Set-Content -Path $ProbeFile -Value "ok" -Encoding UTF8
  Remove-Item -Path $ProbeFile -Force
}
catch {
  throw "npm cache directory is not writable: $NpmCacheDir"
}
npm ci --cache $NpmCacheDir
npm run build
npm link --cache $NpmCacheDir

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
& "$NodeExe" --import tsx server/index.ts
"@ | Set-Content -Path $ServerRunner -Encoding UTF8

@"
Set-Location "$AppDir"
& "$NodeExe" --import tsx apps/index.ts
"@ | Set-Content -Path $AppsRunner -Encoding UTF8

Write-Host "[4/5] Setup startup tasks..."
$ServerAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ServerRunner`""
$AppsAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$AppsRunner`""
$Trigger = New-ScheduledTaskTrigger -AtLogOn -User $CurrentUser

Unregister-ScheduledTask -TaskName $ServerTaskName -Confirm:$false -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName $AppsTaskName -Confirm:$false -ErrorAction SilentlyContinue

Register-ScheduledTask -TaskName $ServerTaskName -Action $ServerAction -Trigger $Trigger -User $CurrentUser -Force | Out-Null
Register-ScheduledTask -TaskName $AppsTaskName -Action $AppsAction -Trigger $Trigger -User $CurrentUser -Force | Out-Null

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
