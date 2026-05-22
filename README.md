# Alpha & Omega Analytics GitHub Pages Site

Static landing page for `https://aoanalytics.github.io/`.

## Update the Discord Invite

Open `script.js` and replace:

```js
const DISCORD_INVITE_URL = "https://discord.com/invite/replace-me";
```

with your real Discord invite URL.

## Publish

Create a public GitHub repository named exactly:

```text
aoanalytics.github.io
```

Then from this folder:

```bash
git init
git add .
git commit -m "Launch Alpha & Omega Analytics landing page"
git branch -M main
git remote add origin https://github.com/aoanalytics/aoanalytics.github.io.git
git push -u origin main
```

GitHub Pages will serve the site from the repository root.
