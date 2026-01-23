# Deploy to Vercel - Step by Step

## ✅ Build Successful!

Your frontend builds successfully. Now let's deploy to Vercel.

## Step-by-Step Deployment

### Step 1: Deploy to Vercel

Run this command in the `frontend/` directory:

```bash
cd frontend
vercel
```

### Step 2: Follow the Prompts

When you run `vercel`, you'll see prompts like:

```
? Set up and deploy? [Y/n] Y
? Which scope? (Select your account)
? Link to existing project? [y/N] N
? What's your project's name? song-to-bolly-beat
? In which directory is your code located? ./
? Want to override the settings? [y/N] N
```

**Just press Enter for defaults** - Vercel auto-detects Vite!

### Step 3: First Deployment

- Vercel will deploy your app
- You'll get a preview URL like: `https://song-to-bolly-beat-xxx.vercel.app`
- This is a **preview deployment** (not production yet)

### Step 4: Add Environment Variables

**Important:** Your app needs Supabase credentials!

1. Go to: https://vercel.com/dashboard
2. Click on your project: `song-to-bolly-beat`
3. Go to: **Settings** → **Environment Variables**
4. Click **Add New**
5. Add these two variables:

   **Variable 1:**
   - Key: `VITE_SUPABASE_URL`
   - Value: `https://ghmrfkddxnnrwnltveeq.supabase.co`
   - Environment: Production, Preview, Development (select all)

   **Variable 2:**
   - Key: `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Value: `your_anon_key_here` (get from Supabase dashboard)
   - Environment: Production, Preview, Development (select all)

6. Click **Save**

### Step 5: Deploy to Production

After adding environment variables, deploy to production:

```bash
vercel --prod
```

Or trigger from Vercel dashboard:
- Go to **Deployments** tab
- Click **...** on latest deployment
- Click **Promote to Production**

### Step 6: Your App is Live! 🎉

Your app will be available at:
```
https://song-to-bolly-beat.vercel.app
```

(Or whatever name you chose)

---

## Quick Commands

```bash
# Deploy preview
vercel

# Deploy to production
vercel --prod

# View deployments
vercel ls

# View logs
vercel logs

# Open dashboard
vercel dashboard
```

---

## Troubleshooting

### "Environment variables not working"

1. Make sure variables start with `VITE_`
2. Redeploy after adding variables: `vercel --prod`
3. Check variable names match exactly

### "404 on page refresh"

Already fixed! The `vercel.json` file includes SPA routing rewrite rules.

### "Build failed"

1. Test build locally first: `npm run build`
2. Check for errors in build output
3. Make sure all dependencies are installed: `npm install`

### "CORS errors"

1. Make sure Supabase functions are deployed
2. Check Supabase URL is correct
3. Verify environment variables are set

---

## Next Steps After Deployment

1. ✅ Test your live site
2. ✅ Verify API calls work
3. ✅ Check environment variables
4. ✅ Set up custom domain (optional)
5. ✅ Enable automatic deployments from Git (optional)

---

## Automatic Deployments (Optional)

To enable automatic deployments from Git:

1. Go to Vercel Dashboard
2. Project Settings → Git
3. Connect your GitHub/GitLab/Bitbucket repo
4. Every push to `main` = automatic production deploy
5. Every PR = automatic preview deploy

---

## You're Ready!

Run this command to start:

```bash
cd frontend
vercel
```

Follow the prompts, add environment variables, then run `vercel --prod`!

Good luck! 🚀
