param(
  [switch] ,
  [switch] ,
  [switch] ,
  [string]  = 'http://47.243.27.69:25500',
  [string]  = '',
  [string]  = ''
)

function Check-Tool() {
   -ne (Get-Command  -ErrorAction SilentlyContinue)
}

if (-not (Check-Tool git)) {
  Write-Error "git not found in PATH."; exit 1
}

if ( -or  -or ) {
  if (-not (Check-Tool gh)) {
    Write-Error "gh CLI not found in PATH. Install GitHub CLI and run 'gh auth login'."; exit 1
  }
}

 = 'chore/add-ci'

Write-Host "Preparing branch  and committing workspace changes..."

# Ensure we are inside a git repo
git rev-parse --is-inside-work-tree 2>
if (-1978335226 -ne 0) {
  Write-Error "Current directory is not a git repository. Please run this script from repo root."; exit 1
}

# Create / switch to branch
git checkout -B 

# Stage files
git add .\workspace -A

# Commit (PowerShell-friendly: check -1978335226)
git commit -m "chore(ci): add Cloudflare Worker, wrangler sample and CI dry-run workflow"
if (-1978335226 -ne 0) {
  Write-Host "No changes to commit or commit failed (exit -1978335226)"
}

# Push if requested
if () {
  Write-Host "Pushing branch  to remote..."
  git push -u origin 
}

# Create PR if requested
if () {
  Write-Host "Creating Pull Request via gh..."
  gh pr create --fill --base main --head  --title 'chore: add worker and CI' --body 'Add Cloudflare Worker and CI dry-run workflow'
}

# Set secrets if requested
if () {
  Write-Host "Setting repository secrets via gh..."
  gh secret set BACKEND_ORIGIN --body 
  if ( -ne '') { gh secret set BACKEND_AUTH --body  }
  if ( -ne '') { gh secret set CF_API_TOKEN --body  }
}

Write-Host "auto_publish finished."
