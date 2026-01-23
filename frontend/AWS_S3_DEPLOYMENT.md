# Deploy Frontend to AWS S3

## Yes, You Can Deploy to S3! ✅

AWS S3 supports **static website hosting**, which is perfect for your React/Vite frontend.

---

## Quick Deploy to S3

### Step 1: Build Your Frontend

```bash
cd frontend
npm run build
```

This creates a `dist/` folder with your static files.

### Step 2: Create S3 Bucket

```bash
# Install AWS CLI (if not installed)
# macOS: brew install awscli
# Or download from: https://aws.amazon.com/cli/

# Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region

# Create bucket (must be globally unique name)
aws s3 mb s3://your-app-name-frontend --region us-east-1
```

### Step 3: Enable Static Website Hosting

```bash
# Enable static website hosting
aws s3 website s3://your-app-name-frontend \
  --index-document index.html \
  --error-document index.html
```

### Step 4: Upload Files

```bash
# Upload dist/ folder to S3
aws s3 sync dist/ s3://your-app-name-frontend --delete

# Or use the AWS Console:
# 1. Go to S3 → Your bucket
# 2. Upload → Select all files from dist/
# 3. Make files public (set permissions)
```

### Step 5: Set Bucket Policy (Make Public)

Create `bucket-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-app-name-frontend/*"
    }
  ]
}
```

Apply policy:
```bash
aws s3api put-bucket-policy \
  --bucket your-app-name-frontend \
  --policy file://bucket-policy.json
```

### Step 6: Access Your Site

Your site will be available at:
```
http://your-app-name-frontend.s3-website-us-east-1.amazonaws.com
```

Or use CloudFront for custom domain + HTTPS (see below).

---

## Using AWS Console (GUI Method)

### Step 1: Create Bucket

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click "Create bucket"
3. Bucket name: `your-app-name-frontend` (must be unique)
4. Region: Choose closest to users (e.g., `us-east-1`)
5. **Uncheck** "Block all public access" (for static hosting)
6. Click "Create bucket"

### Step 2: Enable Static Website Hosting

1. Click on your bucket
2. Go to "Properties" tab
3. Scroll to "Static website hosting"
4. Click "Edit"
5. Enable static website hosting
6. Index document: `index.html`
7. Error document: `index.html` (for SPA routing)
8. Click "Save"

### Step 3: Upload Files

1. Go to "Objects" tab
2. Click "Upload"
3. Click "Add files"
4. Select **all files** from `frontend/dist/` folder
5. Click "Upload"

### Step 4: Make Files Public

1. Select all uploaded files
2. Click "Actions" → "Make public using ACL"
3. Confirm

### Step 5: Get Website URL

1. Go to "Properties" tab
2. Scroll to "Static website hosting"
3. Copy the "Bucket website endpoint"
4. Your site is live! 🎉

---

## Add CloudFront (Recommended for Production)

CloudFront adds:
- ✅ HTTPS/SSL
- ✅ Custom domain
- ✅ Global CDN (faster)
- ✅ Better performance

### Setup CloudFront

1. Go to [CloudFront Console](https://console.aws.amazon.com/cloudfront/)
2. Click "Create distribution"
3. Origin domain: Select your S3 bucket
4. Viewer protocol policy: "Redirect HTTP to HTTPS"
5. Default root object: `index.html`
6. Click "Create distribution"
7. Wait 5-10 minutes for deployment
8. Use CloudFront URL: `https://d1234abcd.cloudfront.net`

### Custom Domain (Optional)

1. In CloudFront distribution
2. Go to "General" tab → "Edit"
3. Add alternate domain name: `yourdomain.com`
4. Request SSL certificate in AWS Certificate Manager
5. Select certificate in CloudFront
6. Update DNS to point to CloudFront

---

## Automated Deployment Script

Create `deploy-s3.sh`:

```bash
#!/bin/bash

# Build the project
echo "🔨 Building frontend..."
cd frontend
npm run build

# Deploy to S3
echo "🚀 Deploying to S3..."
aws s3 sync dist/ s3://your-app-name-frontend --delete

# Invalidate CloudFront cache (if using CloudFront)
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"

echo "✅ Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy-s3.sh
./deploy-s3.sh
```

---

## Cost Comparison

### AWS S3 + CloudFront

**S3 Storage:**
- First 50 GB: $0.023/GB/month
- Your app: ~5-10 MB = **$0.00/month** (negligible)

**S3 Requests:**
- GET requests: $0.0004 per 1,000
- 100,000 requests = **$0.04/month**

**CloudFront:**
- First 1 TB: $0.085/GB
- 10 GB/month = **$0.85/month**

**Total: ~$1-2/month** for small traffic

### vs Vercel/Netlify

- **Vercel**: Free tier (generous)
- **Netlify**: Free tier (generous)
- **S3+CloudFront**: ~$1-2/month

**Verdict:** S3 is cheap but Vercel/Netlify are free and easier!

---

## Pros and Cons

### ✅ Pros of S3

- ✅ **Very cheap** - Pay only for what you use
- ✅ **Scalable** - Handles any traffic
- ✅ **Reliable** - AWS infrastructure
- ✅ **Custom domain** - Full control
- ✅ **CDN available** - CloudFront integration

### ❌ Cons of S3

- ❌ **More setup** - Manual configuration
- ❌ **No automatic deployments** - Need scripts
- ❌ **No preview deployments** - Manual process
- ❌ **Requires AWS account** - More complex
- ❌ **No built-in CI/CD** - Need to set up

### vs Vercel/Netlify

| Feature | S3+CloudFront | Vercel/Netlify |
|---------|---------------|----------------|
| **Setup** | ❌ Complex | ✅ Easy |
| **Cost** | 💰 $1-2/month | ✅ Free |
| **Auto Deploy** | ❌ Manual | ✅ Automatic |
| **Preview Deploys** | ❌ No | ✅ Yes |
| **CI/CD** | ❌ Manual | ✅ Built-in |
| **Custom Domain** | ✅ Yes | ✅ Yes |
| **HTTPS** | ✅ (CloudFront) | ✅ Automatic |

---

## When to Use S3

### Use S3 When:
- ✅ You're already using AWS
- ✅ You need full control
- ✅ You have AWS expertise
- ✅ You want to minimize costs
- ✅ You need custom AWS integrations

### Use Vercel/Netlify When:
- ✅ You want easiest setup
- ✅ You want free tier
- ✅ You want automatic deployments
- ✅ You want preview deployments
- ✅ You want best DX (Developer Experience)

---

## Quick Comparison

### Vercel (Easiest)
```bash
npm install -g vercel
cd frontend
vercel
# Done in 2 minutes!
```

### S3 (More Setup)
```bash
# 1. Create bucket
# 2. Enable static hosting
# 3. Upload files
# 4. Set permissions
# 5. Configure CloudFront (optional)
# Takes 15-30 minutes
```

---

## Recommendation

**For Most Users:** Use **Vercel** or **Netlify**
- ✅ Free
- ✅ Easy
- ✅ Automatic deployments
- ✅ Better DX

**For AWS Users:** Use **S3 + CloudFront**
- ✅ If you're already on AWS
- ✅ If you need AWS integrations
- ✅ If you want full control

---

## Complete S3 Deployment Example

```bash
# 1. Build
cd frontend
npm run build

# 2. Create bucket
aws s3 mb s3://my-app-frontend --region us-east-1

# 3. Enable static hosting
aws s3 website s3://my-app-frontend \
  --index-document index.html \
  --error-document index.html

# 4. Upload
aws s3 sync dist/ s3://my-app-frontend --delete

# 5. Make public
aws s3api put-bucket-policy \
  --bucket my-app-frontend \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-app-frontend/*"
    }]
  }'

# 6. Access at:
# http://my-app-frontend.s3-website-us-east-1.amazonaws.com
```

---

## Environment Variables on S3

**Important:** S3 is static hosting, so you need to:

1. **Build with environment variables:**
   ```bash
   # Set env vars before building
   export VITE_SUPABASE_URL=https://...
   export VITE_SUPABASE_PUBLISHABLE_KEY=...
   npm run build
   ```

2. **Or use build script:**
   ```bash
   # .env file is read during build
   # Variables are baked into the build
   npm run build
   ```

3. **Variables are embedded in JS:**
   - Vite replaces `import.meta.env.VITE_*` at build time
   - No runtime environment variables
   - Rebuild to change variables

---

## Summary

**Yes, you can deploy to S3!** ✅

**But consider:**
- S3: More setup, ~$1-2/month, full control
- Vercel: Easy setup, free, automatic deployments

**Recommendation:** Start with Vercel (easier), move to S3 if you need AWS-specific features.
