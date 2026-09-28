# push.ps1 - stage, safety-check, commit and push the CURRENT branch.
# Usage (from anywhere inside the repo):
#   .\push.ps1 "add client dashboard screen"
#
# It refuses to run on main/master and refuses to commit anything that
# looks like a secret. Work goes to a feature branch; merging to main
# happens through a reviewed pull request.

param([string]$Message = "chore: sync from VS Code")

$root = git rev-parse --show-toplevel 2>$null
if (-not $root) { Write-Host "Not inside a git repo." -ForegroundColor Red; exit 1 }
Set-Location $root

$branch = git rev-parse --abbrev-ref HEAD
if ($branch -eq "main" -or $branch -eq "master") {
    Write-Host "You are on '$branch'. Create a feature branch first:" -ForegroundColor Yellow
    Write-Host "  git switch -c feature/your-change"
    exit 1
}

git add -A
$staged = @(git diff --cached --name-only)
if ($staged.Count -eq 0) { Write-Host "Nothing to commit."; exit 0 }

# 1) Block secret-looking file names (.env.example is allowed)
$badNames = '(^|/)\.env(\.(?!example$)[^/]*)?$', '\.pem$', '\.key$', 'service[-_]?role', 'settings\.local\.json$'
$hits = $staged | Where-Object { $f = $_; $badNames | Where-Object { $f -match $_ } }
if ($hits) {
    git reset -q
    Write-Host "Blocked. These files look like secrets:" -ForegroundColor Red
    $hits | ForEach-Object { Write-Host "  $_" }
    Write-Host "Add them to .gitignore, then run again."
    exit 1
}

# 2) Block secret-looking content in added lines
$patterns = 'SUPABASE_JWT_SECRET\s*=\s*\S+', 'OPENAI_API_KEY\s*=\s*\S+', 'INTERNAL_SERVICE_SECRET\s*=\s*\S+',
            'sk-[A-Za-z0-9_-]{20,}', 'AIza[0-9A-Za-z_-]{35}', 'BEGIN (RSA |EC )?PRIVATE KEY'
$added = git diff --cached -U0 | Where-Object { $_ -match '^\+' -and $_ -notmatch '^\+\+\+' }
$found = $added | Select-String -Pattern $patterns
if ($found) {
    git reset -q
    Write-Host "Blocked. Possible secret in staged changes:" -ForegroundColor Red
    $found | ForEach-Object { Write-Host ("  " + $_.Line.Substring(0, [Math]::Min(60, $_.Line.Length)) + "...") }
    Write-Host "Remove it, then run again."
    exit 1
}

git commit -m $Message
if ($LASTEXITCODE -ne 0) { Write-Host "Commit failed." -ForegroundColor Red; exit 1 }

git push -u origin $branch
if ($LASTEXITCODE -ne 0) { Write-Host "Push failed." -ForegroundColor Red; exit 1 }

Write-Host "Pushed '$branch' to GitHub." -ForegroundColor Green