---
name: push-povidka
description: Push a Twine/Twinery story export (.twee or .html) into the "povidka" directory of this repository, commit and push to GitHub. Use when the user says "push povidka", "upload story", "/push-povidka <file>", or gives a Twine export file to publish.
argument-hint: <path-to-file.twee|file.html>
disable-model-invocation: true
allowed-tools: Bash(git *), Bash(cp *), Bash(mkdir *), Bash(ls *), Bash(test *)
---

# Push Twine story to GitHub (povidka/)

Input: `$ARGUMENTS` = path to an exported Twine story file (`.twee` or `.html`).

## Steps

1. **Validate the input**
   - If `$ARGUMENTS` is empty, ask the user for the file path and stop.
   - Strip surrounding quotes. Confirm the file exists (`test -f`). Windows paths like `C:\Users\me\Downloads\story.twee` are fine; in bash use `/c/Users/...` form if needed.
   - Extension must be `.twee` or `.html` (case-insensitive). Otherwise stop and tell the user.

2. **Make sure we're in the repo**
   - Run `git rev-parse --show-toplevel` and work from that root. If not a git repo, stop and tell the user.
   - Run `git status --short` and note any pre-existing uncommitted changes. Do NOT stage them; only stage the story file.

3. **Copy the file**
   - `mkdir -p povidka` at the repo root.
   - Copy the file to `povidka/<original-filename>`, overwriting if it exists (git history keeps old versions).
   - If the source file is already inside `povidka/`, skip the copy.

4. **Commit**
   - `git add -- "povidka/<filename>"`
   - If `git diff --cached --quiet -- "povidka/<filename>"` shows no change, tell the user the file is identical to the committed version and stop.
   - Commit with message: `Update story: <filename>` (use `Add story: <filename>` if the file was new).

5. **Push**
   - `git push` to the current branch's upstream. If no upstream is set, use `git push -u origin <current-branch>`.
   - On rejection (non-fast-forward), do NOT force push. Run `git pull --rebase`, then retry once. If it still fails, report the error to the user.

6. **Report**
   - Print the commit hash, branch, and the file's path in the repo (`povidka/<filename>`). If the remote is GitHub, include a link built from `git remote get-url origin`.

## Rules

- Never use `--force`.
- Never stage or commit files other than the story file.
- Never modify the contents of the story file.
