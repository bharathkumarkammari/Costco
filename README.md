
# Costco Receipt Parser via GitHub Actions

## How it works
- Hosted frontend on GitHub Pages
- Button triggers a GitHub Action via REST API
- Action downloads `creds.json` from Google Drive and runs `extractor.py`
- Extracted data goes to Google Sheets

## Setup
1. Replace `YOUR_GITHUB_TOKEN` and `YOUR_USERNAME` in `script.js`
2. Enable GitHub Pages on the `docs/` folder
3. Add a Personal Access Token (PAT) with `workflow` scope
