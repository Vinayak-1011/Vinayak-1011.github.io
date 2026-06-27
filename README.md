# Vinayak — Personal Portfolio

A dark, sleek, single-page resume/portfolio site. Plain HTML, CSS, and JavaScript — no build step required.

## Structure

```
.
├── index.html        # Page content (edit the sections here)
├── css/styles.css    # Theme, layout, responsive styles
├── js/main.js        # Nav, mobile menu, scroll animations
├── assets/           # Put resume.pdf, images, favicon here
└── README.md
```

## Editing your content

Open `index.html` and look for the `<!-- EDIT -->` comments. Replace the placeholder text in:

- **Hero** — your tagline and intro line
- **About** — short bio and the quick facts (location, focus, years, email)
- **Skills** — the tag lists under each group
- **Experience / Education** — job entries (date, title, company, bullets)
- **Projects** — project cards (title, link, description, tech tags)
- **Contact** — links

Update the GitHub and LinkedIn URLs (currently pointing to placeholder homepages), and drop your résumé at `assets/resume.pdf` so the download button works.

## Preview locally

Just open `index.html` in a browser, or run a small server:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to GitHub Pages

1. Create a repo on GitHub and push this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo>.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Build and deployment**.
3. Set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`, then **Save**.
4. Your site goes live at `https://<your-username>.github.io/<repo>/` in a minute or two.

> Tip: for a clean URL like `https://<your-username>.github.io`, name the repo exactly `<your-username>.github.io`.
