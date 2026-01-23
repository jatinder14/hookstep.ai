# Frontend Deployment Guide

## ⚡ Fastest Method: Vercel CLI (2 minutes)

**Quick Start:**
```bash
npm install -g vercel
cd frontend
vercel
# Follow prompts, add env vars in dashboard, then: vercel --prod
```

See `QUICK_DEPLOY.md` for the fastest deployment method.

**Want to use AWS S3?** See `AWS_S3_DEPLOYMENT.md` for complete S3 deployment guide.

---

## Quick Deploy Options

### Option 1: Vercel (Recommended) ⚡

**Best for:** React/Vite apps, automatic deployments, free tier

#### Steps:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd frontend
   vercel
   ```

3. **Follow prompts:**
   - Link to existing project or create new
   - Set build command: `npm run build`
   - Set output directory: `dist`
   - Add environment variables (VITE_SUPABASE_URL, etc.)

4. **Set Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`

**Benefits:**
- ✅ Free tier (generous limits)
- ✅ Automatic deployments from Git
- ✅ Preview deployments for PRs
- ✅ Global CDN
- ✅ HTTPS automatically

**URL:** `https://your-project.vercel.app`

---

### Option 2: Netlify 🌐

**Best for:** Simple deployments, form handling, free tier

#### Steps:

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy:**
   ```bash
   cd frontend
   netlify deploy --prod
   ```

3. **Or use Netlify Dashboard:**
   - Connect your Git repository
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Add environment variables

**Benefits:**
- ✅ Free tier
- ✅ Automatic deployments
- ✅ Preview deployments
- ✅ Global CDN

**URL:** `https://your-project.netlify.app`

---

### Option 3: GitHub Pages 📄

**Best for:** Free hosting, simple static sites

#### Steps:

1. **Update `vite.config.ts`:**
   ```typescript
   export default defineConfig({
     base: '/your-repo-name/', // Add this
     // ... rest of config
   });
   ```

2. **Add deploy script to `package.json`:**
   ```json
   {
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     }
   }
   ```

3. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```

**Benefits:**
- ✅ Free
- ✅ Integrated with GitHub
- ⚠️ Requires public repo (or GitHub Pro)

**URL:** `https://username.github.io/your-repo-name`

---

### Option 4: Cloudflare Pages ☁️

**Best for:** Fast global CDN, free tier

#### Steps:

1. **Connect GitHub repository**
2. **Build settings:**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: `18` or `20`

3. **Add environment variables:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

**Benefits:**
- ✅ Free tier
- ✅ Very fast CDN
- ✅ Automatic deployments
- ✅ Preview deployments

**URL:** `https://your-project.pages.dev`

---

### Option 5: Railway 🚂

**Best for:** Full-stack apps, easy setup

#### Steps:

1. **Connect GitHub repository**
2. **Railway auto-detects Vite**
3. **Add environment variables**
4. **Deploy automatically**

**Benefits:**
- ✅ Easy setup
- ✅ Free tier ($5 credit/month)
- ✅ Automatic deployments

**URL:** `https://your-project.up.railway.app`

---

## Pre-Deployment Checklist

### 1. Build the Project Locally

```bash
cd frontend
npm install
npm run build
```

Verify `dist/` folder is created with all files.

### 2. Test the Build

```bash
npm run preview
```

Visit `http://localhost:4173` and test the app.

### 3. Environment Variables

Make sure you have:
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY`

**Important:** These must be set in your deployment platform's environment variables!

### 4. Update API Endpoints (if needed)

If your Supabase functions are deployed, they should work automatically. No changes needed!

---

## Recommended: Vercel Deployment (Step-by-Step)

### Step 1: Prepare

```bash
cd frontend
npm install
npm run build  # Test build works
```

### Step 2: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Step 3: Follow Prompts

```
? Set up and deploy? [Y/n] Y
? Which scope? (your account)
? Link to existing project? [y/N] N
? What's your project's name? song-to-bolly-beat
? In which directory is your code located? ./
? Want to override the settings? [y/N] N
```

### Step 4: Set Environment Variables

Go to Vercel Dashboard:
1. Select your project
2. Settings → Environment Variables
3. Add:
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `your_anon_key`

### Step 5: Redeploy

After adding environment variables, redeploy:
```bash
vercel --prod
```

Or trigger from dashboard: Deployments → Redeploy

---

## Automatic Deployments (CI/CD)

### Vercel (Automatic)

1. **Connect GitHub:**
   - Go to Vercel Dashboard
   - Import Git Repository
   - Select your repo

2. **Configure:**
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Add Environment Variables:**
   - Same as above

4. **Deploy:**
   - Every push to `main` = production deploy
   - Every PR = preview deploy

### Netlify (Automatic)

1. **Connect GitHub:**
   - Go to Netlify Dashboard
   - Add new site → Import from Git
   - Select your repo

2. **Configure:**
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`

3. **Add Environment Variables:**
   - Site settings → Environment variables

---

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**
```bash
# Make sure dependencies are installed
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables Not Working

**Issue:** Variables not available in production

**Solution:**
- Make sure variables start with `VITE_`
- Redeploy after adding variables
- Check variable names match exactly

### CORS Errors

**Issue:** CORS errors in production

**Solution:**
- Make sure Supabase functions are deployed
- Check Supabase project URL is correct
- Verify environment variables are set

### 404 on Refresh

**Issue:** Page shows 404 on refresh (SPA routing)

**Solution (Vercel):**
- Create `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Solution (Netlify):**
- Create `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Cost Comparison

| Platform | Free Tier | Paid Plans |
|----------|-----------|------------|
| **Vercel** | ✅ Generous | $20/month |
| **Netlify** | ✅ Generous | $19/month |
| **Cloudflare Pages** | ✅ Unlimited | Free |
| **GitHub Pages** | ✅ Free | Free (public) |
| **Railway** | ✅ $5 credit/month | Pay as you go |

**Recommendation:** Start with **Vercel** or **Netlify** (both have excellent free tiers)

---

## Quick Start (Vercel - Recommended)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Navigate to frontend
cd frontend

# 3. Deploy
vercel

# 4. Follow prompts
# 5. Add environment variables in dashboard
# 6. Redeploy: vercel --prod
```

**Done!** Your app will be live at `https://your-project.vercel.app`

---

## Post-Deployment

### 1. Test Your Live Site
- ✅ Check all features work
- ✅ Test API calls
- ✅ Verify environment variables

### 2. Set Up Custom Domain (Optional)
- Vercel: Settings → Domains
- Netlify: Domain settings → Add custom domain

### 3. Monitor
- Check deployment logs
- Monitor errors
- Set up analytics (optional)

---

## Summary

**Easiest Option:** Vercel
- One command: `vercel`
- Automatic deployments
- Free tier
- Best DX

**Fastest Option:** Cloudflare Pages
- Very fast CDN
- Free unlimited
- Easy setup

**Simplest Option:** Netlify
- Drag and drop
- Free tier
- Great for beginners

Choose based on your needs, but **Vercel is recommended** for React/Vite apps! 🚀
