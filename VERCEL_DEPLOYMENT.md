# Vercel Frontend Deployment Guide

## ✅ Fixed Issues

1. **404 Routing Errors** - Fixed by creating `vercel.json` with proper rewrites
2. **Client-side routing** - All routes now serve `index.html` so React Router works

## 📋 Deployment Checklist

### 1. Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

**Required:**
- `VITE_API_URL` = `https://fm-backend-six.vercel.app/api`
  - This tells your frontend where to find the backend API

**Optional:**
- `VITE_APP_NAME` = `Factory Management System` (or your app name)

### 2. Build Configuration

Vercel should auto-detect:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

If not auto-detected, set manually in Vercel Dashboard → Settings → General

### 3. Deployment Steps

1. **Commit and push** `vercel.json` file
2. **Set environment variables** in Vercel Dashboard
3. **Redeploy** or wait for automatic deployment
4. **Test routes:**
   - `/login` - Should work ✅
   - `/admin/login` - Should work ✅
   - `/admin/dashboard` - Should work ✅ (after login)
   - `/user/main-dashboard` - Should work ✅ (after login)

## 🔧 Configuration Files

### vercel.json
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures all routes serve `index.html`, allowing React Router to handle routing client-side.

## 🐛 Troubleshooting

### Issue: 404 errors on routes
- ✅ **Fixed** - `vercel.json` now handles all routes

### Issue: API calls failing
- Check `VITE_API_URL` environment variable is set
- Check backend CORS allows your frontend domain
- Check browser console for CORS errors

### Issue: Build fails
- Check Node.js version (should be 18.x or 20.x)
- Check `package.json` has correct build script
- Check Vercel logs for specific errors

## 📝 Environment Variables Summary

### Frontend (Vercel)
- `VITE_API_URL` - Backend API URL

### Backend (Vercel) 
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `NODE_ENV` - Set to `production`

## ✅ After Deployment

1. Test login: `https://fm-frontend-seven.vercel.app/login`
2. Test API connection: Check browser console for API calls
3. Verify CORS: Backend should allow frontend domain

