# Render Deployment Guide

This guide will help you deploy the Dipak Personal AI Assistant to Render.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. A MySQL database (you can use Render's MySQL service or an external database)
3. A Google Gemini API key

## Step 1: Prepare Your Database

### Option A: Use Render's MySQL Service
1. In your Render dashboard, create a new **MySQL** database
2. Note down the connection details (host, user, password, database name)

### Option B: Use External MySQL Database
- Use any MySQL database provider (AWS RDS, PlanetScale, etc.)
- Ensure the database is accessible from Render's IP addresses

## Step 2: Set Up Environment Variables

In your Render service dashboard, add the following environment variables:

### Required Variables:
```
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
GEMINI_API_KEY=your_gemini_api_key
SESSION_SECRET=your_strong_random_secret_here
```

### Optional Variables:
```
NODE_ENV=production
FRONTEND_URL=https://your-app.onrender.com
```

**Important Notes:**
- `PORT` is automatically set by Render - don't override it
- `SESSION_SECRET` should be a strong random string (at least 32 characters)
  - Generate one: `openssl rand -base64 32`
- `FRONTEND_URL` should match your Render service URL for CORS

## Step 3: Deploy to Render

### Method 1: Connect GitHub Repository

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Create a new Web Service on Render:**
   - Go to Render Dashboard → New → Web Service
   - Connect your GitHub repository
   - Select the repository and branch

3. **Configure the service:**
   - **Name:** dipak-personal-ai (or your preferred name)
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Choose based on your needs (Free tier available)

4. **Add Environment Variables:**
   - Click on "Environment" tab
   - Add all the required variables from Step 2

5. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically build and deploy your app

### Method 2: Manual Deploy

1. **Create a new Web Service:**
   - Go to Render Dashboard → New → Web Service
   - Choose "Public Git repository"
   - Enter your repository URL

2. **Follow the same configuration steps as Method 1**

## Step 4: Database Migration

After deployment, you need to run database migrations:

1. **Option A: Use Render Shell**
   - Go to your service → Shell
   - Run: `npm run db:push`

2. **Option B: Use Drizzle Kit locally**
   - Connect to your production database
   - Run: `npm run db:push`

## Step 5: Verify Deployment

1. Visit your Render service URL (e.g., `https://your-app.onrender.com`)
2. Test the application:
   - Register/Login
   - Send a chat message
   - Verify AI responses work

## Troubleshooting

### Database Connection Issues

**Error:** "Missing required environment variable: DB_HOST"

**Solution:** 
- Verify all database environment variables are set in Render dashboard
- Check that variable names match exactly (case-sensitive)

### Port Issues

**Error:** "Port already in use"

**Solution:**
- Don't set `PORT` environment variable manually
- Render automatically provides the `PORT` variable
- The app is configured to use `process.env.PORT` automatically

### CORS Issues

**Error:** "CORS policy blocked"

**Solution:**
- Set `FRONTEND_URL` environment variable to your Render service URL
- Ensure `credentials: true` is set (already configured in code)

### Session Issues

**Error:** "SESSION_SECRET not set"

**Solution:**
- Set `SESSION_SECRET` environment variable
- Use a strong random string (32+ characters)
- Generate: `openssl rand -base64 32`

### Build Failures

**Error:** Build fails during deployment

**Solution:**
- Check build logs in Render dashboard
- Ensure `package.json` has correct build scripts
- Verify Node.js version (requires >= 18.0.0)

## Render-Specific Configuration

### Auto-Deploy
- Render automatically deploys on every push to your main branch
- You can disable this in service settings

### Health Checks
- Render automatically checks if your service is running
- The app listens on `0.0.0.0` to accept connections from Render

### Environment
- `NODE_ENV` is automatically set to `production` on Render
- You can override it if needed

### Logs
- View real-time logs in Render dashboard
- Logs are available under "Logs" tab in your service

## Cost Optimization

### Free Tier Limits:
- 750 hours/month (enough for 24/7 operation)
- 512 MB RAM
- Sleeps after 15 minutes of inactivity (free tier)

### Paid Tier Benefits:
- Always-on service (no sleep)
- More RAM and CPU
- Better performance

## Security Checklist

- ✅ All hardcoded passwords removed
- ✅ Session secret required in production
- ✅ CORS configured properly
- ✅ Environment variables validated on startup
- ✅ Database credentials stored securely
- ✅ API keys stored in environment variables

## Next Steps

1. Set up a custom domain (optional)
2. Configure SSL (automatic on Render)
3. Set up monitoring and alerts
4. Configure backups for your database

## Support

If you encounter issues:
1. Check Render service logs
2. Verify all environment variables are set
3. Test database connection separately
4. Review the troubleshooting section above

---

**Last Updated:** Based on current codebase configuration
**Render Documentation:** https://render.com/docs

