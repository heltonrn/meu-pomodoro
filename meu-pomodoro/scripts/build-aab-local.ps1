<#
.SYNOPSIS
  Gera o AAB do Meu Pomodoro localmente (sem EAS Build).

.DESCRIPTION
  1. Valida keystore.properties, Java e Android SDK
  2. Roda expo prebuild (recria a pasta android a partir do app.config.ts)
  3. Configura o Android SDK em local.properties
  4. Roda gradlew bundleRelease (anúncios definidos por -AdsEnv)
  5. Copia o AAB para dist\

  Uso:
    pnpm build:aab                                                         # teste fechado: anúncios de TESTE
    powershell -ExecutionPolicy Bypass -File scripts\build-aab-local.ps1 -AdsEnv production   # produção
#>
param(
    [ValidateSet('test', 'production')]
    [string]$AdsEnv = 'test'
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Fail($msg) {
    Write-Host "`nERRO: $msg" -ForegroundColor Red
    exit 1
}

function Success($msg) {
    Write-Host "`n$msg" -ForegroundColor Green
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  BUILD AAB LOCAL - MEU POMODORO" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# --- 1. Keystore -------------------------------------------------------------
Write-Host "`n>> Verificando keystore..." -ForegroundColor Cyan

if (-not (Test-Path 'keystore.properties')) {
    Fail "keystore.properties não encontrado (copie keystore.properties.example e preencha)."
}

$ks = ConvertFrom-StringData (Get-Content 'keystore.properties' -Raw)

if ([string]::IsNullOrWhiteSpace($ks.storeFile)) { Fail "keystore.properties: campo 'storeFile' vazio." }
if (-not (Test-Path $ks.storeFile)) { Fail "Keystore '$($ks.storeFile)' não existe." }

foreach ($k in 'storePassword', 'keyAlias', 'keyPassword') {
    if ([string]::IsNullOrWhiteSpace($ks[$k])) { Fail "keystore.properties: campo '$k' vazio." }
}

Success "Keystore encontrada (alias: $($ks.keyAlias))."

# --- 2. Java e Android SDK ---------------------------------------------------
Write-Host "`n>> Verificando Java..." -ForegroundColor Cyan
$javaCommand = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaCommand) { Fail "Java não encontrado no PATH." }
Write-Host "Java: $($javaCommand.Source)"

Write-Host "`n>> Verificando Android SDK..." -ForegroundColor Cyan
$sdkDir = $env:ANDROID_HOME
if (-not $sdkDir) { $sdkDir = $env:ANDROID_SDK_ROOT }
if (-not $sdkDir) { $sdkDir = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
if (-not (Test-Path $sdkDir)) { Fail "Android SDK não encontrado: $sdkDir" }
Write-Host "Android SDK: $sdkDir"

# --- 3. Ambiente -------------------------------------------------------------
$env:EXPO_PUBLIC_ADS_ENV = $AdsEnv
$env:NODE_ENV = 'production'
Write-Host "`nAnúncios: $AdsEnv (EXPO_PUBLIC_ADS_ENV=$env:EXPO_PUBLIC_ADS_ENV)" -ForegroundColor Yellow

# --- 4. Expo prebuild --------------------------------------------------------
Write-Host "`n>> expo prebuild (android, clean)" -ForegroundColor Cyan
npx expo prebuild --platform android --clean --no-install
if ($LASTEXITCODE -ne 0) { Fail "expo prebuild falhou." }
if (-not (Test-Path 'android')) { Fail "A pasta android não foi criada pelo expo prebuild." }
Success "Projeto Android gerado."

# --- 5. local.properties -----------------------------------------------------
$sdkDirEscaped = $sdkDir -replace '\\', '\\' -replace ':', '\:'
Set-Content -Path 'android\local.properties' -Value "sdk.dir=$sdkDirEscaped" -Encoding ascii

# --- 6. Gradle bundleRelease -------------------------------------------------
Write-Host "`n>> gradlew bundleRelease" -ForegroundColor Cyan
Push-Location android
try {
    if (-not (Test-Path 'gradlew.bat')) { Fail "gradlew.bat não encontrado na pasta android." }
    .\gradlew.bat bundleRelease
    if ($LASTEXITCODE -ne 0) { Fail "gradlew bundleRelease falhou." }
}
finally {
    Pop-Location
}

$aab = 'android\app\build\outputs\bundle\release\app-release.aab'
if (-not (Test-Path $aab)) { Fail "AAB não gerado em: $aab" }

# --- 7. Copiar para dist -----------------------------------------------------
$cfg = Get-Content 'app.config.ts' -Raw
$version = if ($cfg -match "version:\s*[`"']([^`"']+)[`"']") { $Matches[1] } else { 'x' }
$versionCode = if ($cfg -match 'versionCode:\s*(\d+)') { $Matches[1] } else { 'local' }

$out = "dist\meu-pomodoro-$version-vc$versionCode-ads-$AdsEnv.aab"
New-Item -ItemType Directory -Force -Path 'dist' | Out-Null
Copy-Item $aab $out -Force

Success "AAB gerado com sucesso!"
Write-Host "Arquivo : $out" -ForegroundColor White
Write-Host "Tamanho : $([math]::Round((Get-Item $out).Length / 1MB, 2)) MB"
Write-Host "`nPróximo passo: Play Console > Meu Pomodoro > Teste fechado > Criar nova versão" -ForegroundColor Cyan
