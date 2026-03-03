# Deploying ELI5 Reader to Vercel

This guide will walk you through deploying your ELI5 Reader app to Vercel with your custom domain.

## Prerequisites

- ✅ Vercel account (sign up at https://vercel.com)
- ✅ Custom domain purchased
- ✅ GitHub account (for connecting repository)

## Step 1: Push Your Code to GitHub

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Name: `eli5-reader` (or any name you prefer)
   - Keep it Public or Private (Vercel works with both)
   - Don't initialize with README (we already have one)
   - Click "Create repository"

2. **Connect your local repo to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/eli5-reader.git
   git branch -M main
   git push -u origin main
   ```

   Replace `YOUR_USERNAME` with your GitHub username.

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel:**
   - Visit https://vercel.com/new
   - Sign in with your GitHub account

2. **Import Your Repository:**
   - Click "Import Git Repository"
   - Select your `eli5-reader` repository
   - Click "Import"

3. **Configure Project:**
   - **Project Name:** `eli5-reader` (or customize)
   - **Framework Preset:** Leave as "Other" or select "Create React App"
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run vercel-build` (should be auto-detected)
   - **Output Directory:** `dist` (should be auto-detected)
   - **Install Command:** `npm install` (should be auto-detected)

4. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for the build to complete
   - Your app will be live at `https://your-project-name.vercel.app`

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

   Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? **eli5-reader**
   - In which directory is your code? **./
   - Override settings? **N**

4. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

## Step 3: Connect Your Custom Domain

1. **Add Domain in Vercel:**
   - Go to your project dashboard: https://vercel.com/dashboard
   - Click on your `eli5-reader` project
   - Go to "Settings" → "Domains"
   - Click "Add Domain"
   - Enter your custom domain (e.g., `yourdomain.com`)
   - Click "Add"

2. **Configure DNS Records:**

   Vercel will show you which DNS records to add. You have two options:

   **Option A: Use Vercel Nameservers (Easiest)**
   - Go to your domain registrar (where you purchased the domain)
   - Update nameservers to Vercel's nameservers:
     - `ns1.vercel-dns.com`
     - `ns2.vercel-dns.com`
   - Wait 24-48 hours for DNS propagation

   **Option B: Add A/CNAME Records (Faster)**
   - Go to your domain registrar's DNS settings
   - Add these records:

     For root domain (`yourdomain.com`):
     ```
     Type: A
     Name: @
     Value: 76.76.21.21
     ```

     For www subdomain (`www.yourdomain.com`):
     ```
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```

   - Save changes
   - Wait 10-60 minutes for DNS propagation

3. **Verify Domain:**
   - Go back to Vercel dashboard
   - Click "Refresh" next to your domain
   - Once verified, Vercel will automatically issue an SSL certificate
   - Your app will be live at your custom domain!

## Step 4: Set Up Automatic Deployments

Good news! Vercel automatically deploys when you push to GitHub:

- **Push to `main` branch** → Deploys to production (your custom domain)
- **Push to other branches** → Creates preview deployments

To make changes:
```bash
# Make your code changes
git add .
git commit -m "Your commit message"
git push origin main
```

Vercel will automatically rebuild and deploy your changes within 1-2 minutes.

## Environment Variables (Optional)

If you need to add environment variables (e.g., API keys):

1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Add your variables:
   - Key: `REACT_APP_API_KEY`
   - Value: `your-api-key-here`
   - Environment: Select "Production", "Preview", and "Development"
3. Click "Save"
4. Redeploy your project

## Troubleshooting

### Build Fails

If your build fails, check the build logs in Vercel dashboard:

1. Common issues:
   - Missing dependencies: Run `npm install` locally to verify
   - TypeScript errors: Run `npx tsc --noEmit` locally
   - Build command errors: Test `npm run vercel-build` locally

### Domain Not Working

1. **Check DNS propagation:**
   - Use https://www.whatsmydns.net/ to check if DNS has propagated
   - Enter your domain and check A/CNAME records globally

2. **Verify SSL certificate:**
   - Vercel automatically issues SSL certificates
   - Can take up to 24 hours for first-time setup

3. **Clear browser cache:**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Try incognito/private browsing mode

### App Not Loading Properly

1. **Check browser console:**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Common issue: AsyncStorage doesn't work on first load (this is normal)

2. **Verify build output:**
   - Check that `dist/` folder contains `index.html`
   - Ensure all assets are properly bundled

## Next Steps

- 🎉 Your app is now live!
- Test all features (book import, reading, saving terms)
- Share the link with others
- Monitor performance in Vercel Analytics (Settings → Analytics)

## Quick Commands Reference

```bash
# Deploy to Vercel
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View deployment logs
vercel logs

# Open project in browser
vercel open
```

## Support

- Vercel Documentation: https://vercel.com/docs
- Expo Web Documentation: https://docs.expo.dev/workflow/web/
- Vercel Support: https://vercel.com/support

---

**Your app is ready to be deployed! 🚀**

Follow the steps above and your ELI5 Reader will be live on your custom domain within minutes.
