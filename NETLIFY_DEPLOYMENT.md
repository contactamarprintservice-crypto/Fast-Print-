# Netlify Deployment Guide for Fast Print Service

Fast Print Service is pre-configured and 100% production-ready for deployment on **Netlify**.

---

## 1. Quick Deploy via Netlify UI (Git Integration)

1. Push your repository to **GitHub**, **GitLab**, or **Bitbucket**.
2. Log in to [app.netlify.com](https://app.netlify.com).
3. Click **Add new site** $\rightarrow$ **Import an existing project**.
4. Select your repository.
5. The pre-configured settings from `netlify.toml` will be auto-detected:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node.js version:** `20`
6. Click **Deploy Fast Print Service**. Your site will be live on a secure HTTPS URL in under 60 seconds!

---

## 2. Deploy via Netlify CLI (Terminal)

You can also deploy directly from your local terminal:

```bash
# 1. Install Netlify CLI (if not already installed)
npm install -g netlify-cli

# 2. Build the production bundle
npm run build

# 3. Deploy to production
netlify deploy --prod --dir=dist
```

---

## 3. Included Netlify Configurations (`netlify.toml`)

- **Single Page Application (SPA) Routing:**
  Redirects all URL paths (`/*`) to `/index.html` with a 200 status code, enabling direct links to:
  - `/?view=upload&shop=<shop_id>` (Customer mobile QR scan page)
  - `/?view=dashboard` (Shopkeeper workstation view)
  - `/?view=admin` (Super Admin console)
- **Security Headers:**
  Includes `X-Frame-Options`, `X-Content-Type-Options: nosniff`, and secure `Referrer-Policy`.
- **Asset Caching:**
  Vite-hashed production JavaScript and CSS bundles under `/assets/*` are configured with 1-year immutable caching (`max-age=31536000`).

---

## 4. Connecting the Windows Print Agent to Your Netlify Site

Once deployed to your Netlify domain (e.g. `https://fast-print-service.netlify.app`):
1. Open the **Shop Dashboard** on your computer.
2. In the **Windows Agent Setup** modal:
   - Run the PowerShell one-liner or double-click `run_agent.bat`.
   - Enter your Netlify URL when prompted for the server address:
     ```text
     Enter Fast Print Server URL: https://fast-print-service.netlify.app
     ```
3. Your shop's local laser and inkjet printers will immediately pair with your Netlify cloud dashboard!
