# Troubleshooting Guide

## 401 "Invalid credentials" Error After Logout

If you're getting a 401 error after logging out and trying to log back in, here are the steps to fix it:

### Common Causes:

1. **Wrong Password**: You're using a different password than when you registered
2. **Username Case Sensitivity**: Usernames are case-insensitive, but make sure you're using the same username
3. **Stale Browser Data**: Browser cache might be interfering

### Solutions:

#### Option 1: Register a New Account
- Use a different username
- Use a password that's at least 6 characters long

#### Option 2: Clear Browser Data
1. Open browser developer tools (F12)
2. Go to Application/Storage tab
3. Clear Local Storage
4. Refresh the page
5. Try logging in again

#### Option 3: Check Server Logs
- Look at the server console for `[AUTH]` log messages
- They will show what username is being used and if password matches

### How Authentication Works:

1. **New User**: If username doesn't exist, a new account is created with the password you provide
2. **Existing User**: If username exists, password must match the stored password hash
3. **Password Requirements**: Minimum 6 characters

### Debug Steps:

1. Check server console for `[AUTH]` messages
2. Try registering with a completely new username
3. Make sure password is at least 6 characters
4. Clear browser cache and localStorage

