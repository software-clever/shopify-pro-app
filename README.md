# Keeping a Private Template in Sync with a Public Upstream Repository

This README explains how to create and maintain a private Git repository that tracks a public “template” repository, without ever needing to change fork visibility. Once set up, your private repo will share history with the public upstream and can automatically merge any new commits on a schedule.

---

## Table of Contents

1. [Overview](#overview)  
2. [Prerequisites](#prerequisites)  
3. [Step 1: Clone the Public Template Locally](#step-1-clone-the-public-template-locally)  
4. [Step 2: Create a New Private Repository and Push the Cloned History](#step-2-create-a-new-private-repository-and-push-the-cloned-history)  
5. [Step 3: Add the Public Template as an Upstream Remote](#step-3-add-the-public-template-as-an-upstream-remote)  
6. [Step 4: Syncing Changes from Upstream into Private](#step-4-syncing-changes-from-upstream-into-private)  
7. [Step 5: Mark the Private Repo as a “Template Repository”](#step-5-mark-the-private-repo-as-a-template-repository)  
8. [Step 6: Automate Upstream Sync with GitHub Actions](#step-6-automate-upstream-sync-with-github-actions)  
9. [Step 7: Handling Branch Names Other Than `main`](#step-7-handling-branch-names-other-than-main)  
10. [Troubleshooting & Tips](#troubleshooting--tips)  

---

## Overview

Instead of forking and dealing with “unrelated histories,” this workflow:

1. Clones the public repository to your local machine, preserving its full commit history.  
2. Pushes that cloned history into a newly created, empty private repository.  
3. Sets up `upstream` to point back at the public repo so that future pulls merge cleanly.  
4. Uses a scheduled GitHub Action to automatically fetch, merge, and push any new upstream commits.  

As a result, your private repository:

- Remains completely private.  
- Continues to share a commit graph with the public template.  
- Can be marked as a “Template repository” internally.  
- Stays up to date without manual intervention.

---

## Prerequisites

- **Git:** Installed locally (version ≥ 2.x).  
- **GitHub Account (or another Git hosting service):** Ability to create a new private repository.  
- **Permissions:** You must be an owner or have “Admin” rights on the new private repo to push and to create GitHub Actions workflows.  
- **Familiarity with:** Git remotes, branches, and basic command-line usage.  

---

## Step 1: Clone the Public Template Locally

1. Choose the HTTPS or SSH URL of the public template. For example:  
   ```
   https://github.com/public-org/upstream-template.git
   ```  
   or  
   ```
   git@github.com:public-org/upstream-template.git
   ```

2. Run:  
   ```bash
   git clone https://github.com/public-org/upstream-template.git
   cd upstream-template
   ```

3. Confirm you have the complete history:  
   ```bash
   git log --oneline
   ```  
   You should see all past commits of the public template.  

> **Why?** Cloning directly from the public template ensures that your local copy—and anything you push later—shares the same root commits. This avoids the “unrelated histories” problem.

---

## Step 2: Create a New Private Repository and Push the Cloned History

1. On GitHub (or your Git host), create a brand-new **empty** repository named, for example, `private-template`.  
   - **Important:** Do **not** initialize with a README or license. Leave it completely blank.

2. In your local `upstream-template` directory, remove the old `origin` remote (pointing at the public repo) and add your new private repo as `origin`:  
   ```bash
   # Inside upstream-template/ directory
   git remote remove origin
   git remote add origin git@github.com:your-org/private-template.git
   ```

3. Push all branches and tags to the private repository:  
   ```bash
   # Option A: Push everything, preserving all refs (branches + tags)
   git push --mirror origin

   # OR, if you prefer only to push the default branch and tags:
   # git push -u origin main
   # git push origin --tags
   ```

4. Verify on GitHub that `your-org/private-template` now contains the identical commit history of the public template.

> **Result:** Your private repo’s `main` (and any other branches/tags) is now an exact copy of the public template’s history.

---

## Step 3: Add the Public Template as an Upstream Remote

You now need to keep the public repo as a remote named `upstream`:

1. In the same local directory (`upstream-template`), add `upstream` pointing to the public repo:  
   ```bash
   git remote add upstream https://github.com/public-org/upstream-template.git
   ```

2. Confirm both remotes:  
   ```bash
   git remote -v
   # → origin   git@github.com:your-org/private-template.git (fetch)
   # → origin   git@github.com:your-org/private-template.git (push)
   # → upstream https://github.com/public-org/upstream-template.git (fetch)
   # → upstream https://github.com/public-org/upstream-template.git (push)
   ```

> **Why?** Now, whenever upstream receives new commits, you can `fetch` and `merge` from it, and Git will recognize shared history (since you started by cloning).

---

## Step 4: Syncing Changes from Upstream into Private

Whenever the public template gets new commits, follow these steps locally to integrate them:

1. Fetch upstream:  
   ```bash
   git fetch upstream
   ```
2. Check out your default branch (usually `main`):  
   ```bash
   git checkout main
   ```
3. Merge upstream’s `main` into your local `main`:  
   ```bash
   git merge upstream/main
   ```
   - If there are no conflicting changes, Git will perform a fast-forward merge or a clean three-way merge.  
   - If your private copy has diverged (e.g., you’ve committed something locally that touches the same file), you might see merge conflicts. Resolve them manually, then `git add` and `git commit` the resolutions.  

4. Push the merged result into your private repository:  
   ```bash
   git push origin main
   ```

After this sequence, your private repo’s `main` contains every new upstream commit plus any local merges or conflict resolutions you performed.  

---

## Step 5: Mark the Private Repo as a “Template Repository”

If you want your teammates to use this private repo as a template for new internal projects, do the following:

1. Go to **Settings → General** in `your-org/private-template`.  
2. Scroll down to the **Template repository** section.  
3. Check **“Template repository”** and click **Save changes**.

Now, anyone in your organization can click **Use this template** on `private-template` to spin up a brand-new private repository seeded with the latest contents. Note that those derived repos will not automatically sync; only `private-template` itself is kept in sync with the public upstream.

---

## Step 6: Automate Upstream Sync with GitHub Actions

Manually running `git fetch upstream && git merge upstream/main && git push origin main` is fine, but you can automate it with a GitHub Actions workflow. Create a new file in `private-template/.github/workflows/sync-upstream.yml` with the following contents:

```yaml
# .github/workflows/sync-upstream.yml

name: Sync Public Template into Private

# Adjust the cron schedule as needed.  
# Example: run daily at 02:00 UTC.
on:
  schedule:
    - cron: '0 2 * * *'
  workflow_dispatch: {}   # allows manual run from the Actions tab

jobs:
  sync:
    runs-on: ubuntu-latest

    steps:
      # 1. Check out the full repository history (no shallow clone)
      - name: Checkout repository
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      # 2. Configure Git user for the merge commit
      - name: Configure Git user
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

      # 3. Add the upstream remote (public template)
      - name: Add upstream remote
        run: |
          # Only add if it doesn’t already exist
          if ! git remote | grep -q upstream; then
            git remote add upstream https://github.com/public-org/upstream-template.git
          fi

      # 4. Fetch the latest commits from upstream
      - name: Fetch upstream
        run: git fetch upstream

      # 5. Merge upstream/main into local main
      - name: Merge upstream into main
        run: |
          git checkout main
          git merge upstream/main --no-edit

      # 6. Push the merged history back to your private origin
      - name: Push to private
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: git push origin main
```

### Explanation of Key Points

- **`fetch-depth: 0`**  
  Ensures the runner checks out the full commit history so that merges can see all common ancestors.
- **`GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}`**  
  Uses the built-in GitHub Actions token to authenticate the push. You do not need to create or store a Personal Access Token.  
- **`git merge upstream/main --no-edit`**  
  Performs a non-interactive merge. If there are merge conflicts, the workflow will fail. In that case, you must resolve conflicts manually (see [Troubleshooting](#troubleshooting--tips) below).  
- **Manual Trigger (`workflow_dispatch`)**  
  Allows you to run this workflow on demand from the Actions tab if you need to sync immediately.

Once this file is committed to `main` and pushed, GitHub Actions will run according to the schedule and keep your private `main` up to date with every new commit from the public template.

---

## Step 7: Handling Branch Names Other Than `main`

If your repository uses a different default branch name (for example, `master`, `develop`, or `production`), replace every occurrence of `main` in the steps above with the correct branch name. For instance:

- When pushing initially:  
  ```bash
  git push -u origin develop
  git push origin --tags
  ```
- When merging via Actions:  
  ```yaml
  - name: Merge upstream into develop
    run: |
      git checkout develop
      git merge upstream/main --no-edit
  ```
  (You still merge `upstream/main`—you pull from the public template’s default branch and merge into your own default branch.)

Ensure that your GitHub repository’s default branch setting matches the branch name you use in the workflow.

---

## Troubleshooting & Tips

1. **“Merge conflict” in the GitHub Action**  
   - If the GitHub Action fails because of merge conflicts, you’ll see an error in the “Merge upstream into main” step.  
   - To resolve:  
     1. Clone (or `git pull`) the `origin` locally.  
     2. Run `git fetch upstream && git merge upstream/main`.  
     3. Fix any conflicts, `git add` the resolved files, then `git commit`.  
     4. Push the result (`git push origin main`).  
     5. Re-run the workflow manually (or let the next scheduled run pick up from the new common history).

2. **Upstream branch gets renamed**  
   - If the public template switches from `main` to `master`, you must update your local tracking and workflow to use `upstream/master` instead of `upstream/main`.

3. **Keeping tags in sync**  
   - The example workflow merges only branches, not tags. If the public template adds or moves tags, you can optionally add a step:  
     ```yaml
     - name: Fetch all tags from upstream
       run: git fetch --tags upstream

     - name: Push tags to private
       env:
         GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
       run: git push origin --tags
     ```
   - Place these steps after the `Fetch upstream` step and before the final push.

4. **Verifying remote names**  
   - If you forked or cloned at different times, your local `origin` or `upstream` might already exist. Use `git remote -v` to check, and rename or remove as needed.  
   - You can rename a remote with:  
     ```bash
     git remote rename oldname newname
     ```

5. **Security Considerations**  
   - Because you never convert an existing fork, you avoid any policy that forbids making a public fork private.  
   - The built-in `GITHUB_TOKEN` has only the permissions granted to Actions in your repo. Do not expose any personal tokens in the workflow.

6. **Verifying Success**  
   - After the first successful Action run, check your private repo’s commit history on GitHub. The latest commits from the public template should appear in `private-template`.  
   - If you marked it as a template repository, you can test by clicking **Use this template** and confirming the new repo’s initial contents match.

---

## Summary

1. **Clone the public template** to your local machine.  
2. **Push that exact history to a new, empty private repo** via `git push --mirror`.  
3. **Add `upstream`** to point back at the public repo.  
4. **Merge upstream changes locally** whenever needed, then push to origin.  
5. **Mark the private repo as a template** if you want internal teams to use it.  
6. **Automate the merge** by adding a GitHub Actions workflow that fetches, merges, and pushes on a schedule.  

With this setup, your private template repository will always share a common ancestor with the public upstream. You avoid “unrelated histories” entirely, and every new commit in the public template flows into your private copy — automatically, securely, and transparently.

---

*End of README.md*
