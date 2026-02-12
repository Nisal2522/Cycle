# Replace with YOUR GitHub username (the one that owns the "Cycle" repo)
$githubUser = "Nisal2522"

cd $PSScriptRoot
git remote add origin "https://github.com/$githubUser/Cycle.git" 2>$null
git remote set-url origin "https://github.com/$githubUser/Cycle.git" 2>$null
git push -u origin main
