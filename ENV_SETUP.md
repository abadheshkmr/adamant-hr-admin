# Admin Panel Environment Setup

## Create .env File

Since `.env` files are gitignored (for security), you need to create it manually.

1. Create a file named `.env` in the `admin/` directory
2. Add the following content:

```env
# Backend API URL
# For local development, use: http://localhost:4000
# For production, use: https://adamant-backend.onrender.com
REACT_APP_API_URL=http://localhost:4000
```

## Current Configuration

- **App.js** has been updated to use `process.env.REACT_APP_API_URL`
- **Default fallback**: `http://localhost:4000` (if .env is not set)
- The admin panel will now connect to your local backend by default

## Switching Between Local and Production

### For Local Development:
```env
REACT_APP_API_URL=http://localhost:4000
```

### For Production:
```env
REACT_APP_API_URL=https://adamant-backend.onrender.com
```

## Important Notes

1. **Restart Required**: After creating/updating `.env`, you must restart your React dev server
2. **React Environment Variables**: Must start with `REACT_APP_` prefix
3. **No Quotes Needed**: Don't use quotes around the URL in .env file

## Restart Your Admin Panel

After creating the `.env` file:
```bash
cd admin
# Stop the current server (Ctrl+C)
# Then restart:
npm start
```

## Admin Panel Features

The admin panel connects to the backend to:
- ✅ Manage Services (Add, Edit, List, Delete)
- ✅ Manage Industries (Add, Edit, List, Delete)
- ✅ Manage Vacancies (Post, Manage, Delete)
- ✅ View Applicants/CVs (List, Filter, Delete, View Resumes)
- ✅ Admin Login/Authentication

All these features will now use your local backend with local MongoDB.

