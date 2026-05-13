$ErrorActionPreference = "Continue"

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outDir = "phase1-qa-output-$timestamp"

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Write-Host "========================================"
Write-Host "PHASE 1 QA AUTOMATED CERTIFICATION RUN"
Write-Host "Output folder: $outDir"
Write-Host "========================================"

Write-Host "`n[1/5] Checking Node and npm..."
node -v | Tee-Object -FilePath "$outDir\node-version.txt"
npm -v | Tee-Object -FilePath "$outDir\npm-version.txt"

Write-Host "`n[2/5] Installing dependencies..."
npm install 2>&1 | Tee-Object -FilePath "$outDir\npm-install-output.txt"

Write-Host "`n[3/5] Installing Playwright browsers..."
npx playwright install --with-deps 2>&1 | Tee-Object -FilePath "$outDir\playwright-install-output.txt"

Write-Host "`n[4/5] Running Phase 1 QA test suite..."
npm run qa:phase1 2>&1 | Tee-Object -FilePath "$outDir\phase1-terminal-output.txt"

Write-Host "`n[5/5] Collecting evidence files..."

$filesToCopy = @(
  "docs\PHASE_1_AUTOMATED_QA_RUN_LOG.md",
  "docs\PHASE_1_AUTOMATED_QA_CERTIFICATION_REPORT.md",
  "playwright-report",
  "test-results",
  "docs\qa-evidence\phase-1"
)

foreach ($item in $filesToCopy) {
  if (Test-Path $item) {
    Copy-Item $item -Destination $outDir -Recurse -Force
    Write-Host "Copied: $item"
  } else {
    Write-Host "Missing: $item" | Tee-Object -FilePath "$outDir\missing-evidence.txt" -Append
  }
}

Write-Host "`n========================================"
Write-Host "PHASE 1 QA COLLECTION COMPLETE"
Write-Host "Output folder: $outDir"
Write-Host "========================================"

Write-Host "`nPaste back these files:"
Write-Host "$outDir\phase1-terminal-output.txt"
Write-Host "$outDir\PHASE_1_AUTOMATED_QA_RUN_LOG.md"
Write-Host "$outDir\PHASE_1_AUTOMATED_QA_CERTIFICATION_REPORT.md"
Write-Host "$outDir\missing-evidence.txt if it exists"