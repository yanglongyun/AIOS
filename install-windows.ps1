$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$RepoUrl = if ($env:AIOS_REPO_URL) { $env:AIOS_REPO_URL } else { "https://github.com/valueriver/aios.git" }
$RepoRef = if ($env:AIOS_REPO_REF) { $env:AIOS_REPO_REF } else { "main" }
$InstallRoot = if ($env:AIOS_INSTALL_ROOT) { $env:AIOS_INSTALL_ROOT } else { Join-Path $HOME ".aios" }
$RepoDir = Join-Path $InstallRoot "repo"
$AppDir = Join-Path $InstallRoot "app"
$LogDir = Join-Path $InstallRoot "logs"
$RunDir = Join-Path $InstallRoot "run"
$ServerLog = Join-Path $LogDir "server.log"
$AppsLog = Join-Path $LogDir "apps.log"
$ServerPidFile = Join-Path $RunDir "server.pid"
$AppsPidFile = Join-Path $RunDir "apps.pid"
$ServerPort = if ($env:AIOS_SERVER_PORT) { [int]$env:AIOS_SERVER_PORT } else { 9501 }
$AppsPort = if ($env:AIOS_APPS_PORT) { [int]$env:AIOS_APPS_PORT } else { 9502 }

function Write-Info([string]$Message) {
  Write-Host $Message
}

function Fail([string]$Message) {
  throw $Message
}

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Fail "Missing required command: $Name"
  }
}

function Invoke-External([string]$FilePath, [string[]]$Arguments) {
  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    Fail "$FilePath failed with exit code $LASTEXITCODE"
  }
}

function Assert-Windows {
  if (-not ($env:OS -eq "Windows_NT")) {
    Fail "This installer is for Windows only."
  }
}

function Assert-NodeVersion {
  $nodeVersion = (& node -v).Trim()
  if (-not $nodeVersion) {
    Fail "Failed to read Node.js version."
  }
  $majorPart = ($nodeVersion -replace "^v", "").Split(".")[0]
  $majorVersion = 0
  if (-not [int]::TryParse($majorPart, [ref]$majorVersion)) {
    Fail "Unable to parse Node.js version: $nodeVersion"
  }
  if ($majorVersion -lt 20) {
    Fail "Node.js 20 or newer is required. Current version: $nodeVersion"
  }
}

function Ensure-Dirs {
  New-Item -ItemType Directory -Force -Path $InstallRoot, $LogDir, $RunDir | Out-Null
}

function Update-Repo {
  if (Test-Path (Join-Path $RepoDir ".git")) {
    Write-Info "Updating repository in $RepoDir"
    Invoke-External "git" @("-C", $RepoDir, "fetch", "origin", $RepoRef)
    Invoke-External "git" @("-C", $RepoDir, "checkout", $RepoRef)
    Invoke-External "git" @("-C", $RepoDir, "pull", "--ff-only", "origin", $RepoRef)
  } else {
    Write-Info "Cloning repository into $RepoDir"
    Invoke-External "git" @("clone", "--branch", $RepoRef, "--depth", "1", $RepoUrl, $RepoDir)
  }
  if (-not (Test-Path (Join-Path $RepoDir "package.json"))) {
    Fail "AIOS source package.json not found: $(Join-Path $RepoDir "package.json")"
  }
}

function Sync-App {
  Write-Info "Syncing runtime copy to $AppDir"
  New-Item -ItemType Directory -Force -Path $AppDir | Out-Null
  & robocopy $RepoDir $AppDir /MIR /XD ".git" "node_modules" "database" "files" ".aios" /XF ".DS_Store" /NFL /NDL /NJH /NJS /NP | Out-Null
  if ($LASTEXITCODE -ge 8) {
    Fail "robocopy failed with exit code $LASTEXITCODE"
  }
  $global:LASTEXITCODE = 0
  if (-not (Test-Path (Join-Path $AppDir "package.json"))) {
    Fail "AIOS runtime package.json not found: $(Join-Path $AppDir "package.json")"
  }
}

function Clear-LanguageBakeMarker {
  Remove-Item -Force -ErrorAction SilentlyContinue (Join-Path $AppDir ".aios/settings.json")
}

function Stop-PreviousProcess([string]$PidFile, [string]$Name) {
  if (-not (Test-Path $PidFile)) {
    return
  }
  $rawPid = (Get-Content -Path $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
  if ($rawPid) {
    $proc = Get-Process -Id ([int]$rawPid) -ErrorAction SilentlyContinue
    if ($proc) {
      Write-Info "Stopping previous $Name process ($rawPid)"
      Stop-Process -Id ([int]$rawPid) -Force -ErrorAction SilentlyContinue
      Start-Sleep -Seconds 1
    }
  }
  Remove-Item -Force -ErrorAction SilentlyContinue $PidFile
}

function Test-PortInUse([int]$Port) {
  $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
  return $null -ne $listener
}

function Assert-PortsFree {
  if (Test-PortInUse $ServerPort) {
    Fail "Port $ServerPort is already in use. Stop the existing process and retry."
  }
  if (Test-PortInUse $AppsPort) {
    Fail "Port $AppsPort is already in use. Stop the existing process and retry."
  }
}

function Install-Dependencies {
  Write-Info "Installing npm dependencies"
  Push-Location $AppDir
  try {
    Invoke-External "npm" @("install")
  } finally {
    Pop-Location
  }
}

function Build-App {
  Write-Info "Building UI"
  Push-Location $AppDir
  try {
    Invoke-External "npm" @("run", "build")
  } finally {
    Pop-Location
  }
}

function Remove-RuntimeLanguageSources {
  Remove-Item -Recurse -Force -ErrorAction SilentlyContinue (Join-Path $AppDir "language")
}

function Start-ServiceProcess([string]$Command, [string]$LogFile, [string]$PidFile, [string]$Name) {
  Write-Info "Starting $Name"
  $escapedAppDir = $AppDir.Replace('"', '\"')
  $escapedLogFile = $LogFile.Replace('"', '\"')
  $cmdArgs = "/c cd /d ""$escapedAppDir"" && $Command > ""$escapedLogFile"" 2>&1"
  $process = Start-Process -FilePath "cmd.exe" -ArgumentList $cmdArgs -WindowStyle Hidden -PassThru
  Set-Content -Path $PidFile -Value $process.Id -NoNewline
}

function Wait-ForHttp([string]$Url, [string]$Name) {
  for ($i = 0; $i -lt 30; $i++) {
    try {
      Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 | Out-Null
      return
    } catch {
      Start-Sleep -Seconds 1
    }
  }
  Fail "$Name did not become healthy."
}

function Print-FailureLogs {
  if (Test-Path $ServerLog) {
    Write-Info "--- server.log ---"
    Get-Content -Path $ServerLog -Tail 40
  }
  if (Test-Path $AppsLog) {
    Write-Info "--- apps.log ---"
    Get-Content -Path $AppsLog -Tail 40
  }
}

try {
  Assert-Windows
  Require-Command "git"
  Require-Command "node"
  Require-Command "npm"
  Require-Command "robocopy"
  Assert-NodeVersion
  Ensure-Dirs
  Update-Repo
  Sync-App
  Clear-LanguageBakeMarker
  Install-Dependencies
  Build-App
  Remove-RuntimeLanguageSources
  Stop-PreviousProcess -PidFile $ServerPidFile -Name "server"
  Stop-PreviousProcess -PidFile $AppsPidFile -Name "apps"
  Assert-PortsFree
  Start-ServiceProcess -Command "set AIOS_APPS_PORT=$AppsPort&& node server/main/index.js --port=$ServerPort" -LogFile $ServerLog -PidFile $ServerPidFile -Name "AIOS server"
  Start-ServiceProcess -Command "set AIOS_MAIN_PORT=$ServerPort&& node server/apps/index.js --port=$AppsPort" -LogFile $AppsLog -PidFile $AppsPidFile -Name "AIOS apps service"
  Wait-ForHttp -Url "http://127.0.0.1:$ServerPort/api/health" -Name "AIOS server"
  Wait-ForHttp -Url "http://127.0.0.1:$AppsPort/apps/health" -Name "AIOS apps service"
  Write-Info ""
  Write-Info "AIOS installed successfully."
  Write-Info "Open: http://localhost:$ServerPort"
  Write-Info "Repo: $RepoDir"
  Write-Info "Logs: $LogDir"
} catch {
  Print-FailureLogs
  Write-Error $_
  exit 1
}
