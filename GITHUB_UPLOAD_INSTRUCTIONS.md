# GitHub upload instructions

This ZIP is configured for a GitHub repository named:

```text
job-kanban-scheduler
```

## Upload steps

1. Create a new public GitHub repository called `job-kanban-scheduler`.
2. Upload the contents of this folder to the repository.
3. Commit the files to the `main` branch.
4. Go to **Settings → Pages**.
5. Under **Build and deployment**, set **Source** to **GitHub Actions**.
6. Go to the **Actions** tab and wait for the deployment workflow to finish.
7. Open:

```text
https://YOUR-GITHUB-USERNAME.github.io/job-kanban-scheduler/
```

## If you use a different repository name

Open `vite.config.js` and change:

```js
base: "/job-kanban-scheduler/",
```

to match your repository name. For example, if your repository is called `aim-job-board`, use:

```js
base: "/aim-job-board/",
```

## Current data limitation

This version stores jobs in each browser's local storage. It does not sync jobs between phones/computers yet.
