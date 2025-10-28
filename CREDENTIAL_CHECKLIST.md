# Huawei Cloud Credential Verification Checklist

## 🔑 Step-by-Step Verification

### 1. IAM Username
**Where to find:** IAM > Users > Username column

**Common mistakes:**
- ❌ Using your account name (e.g., "my-account")
- ❌ Using your email (e.g., "user@email.com")
- ❌ Using the "Login Name" instead of "Username"

**Example:**
```bash
# ❌ WRONG
HUAWEI_IAM_USERNAME=my-account-name
HUAWEI_IAM_USERNAME=user@email.com

# ✅ CORRECT (IAM username from IAM > Users)
HUAWEI_IAM_USERNAME=iam_user_01
```

**Action:** Open Huawei Console > IAM > Users and copy the EXACT username

---

### 2. IAM Password
**Where to find:** The password YOU set when creating the IAM user

**Common mistakes:**
- ❌ Using your account login password
- ❌ Password with special characters that need escaping
- ❌ Extra spaces before/after the password

**Example:**
```bash
# ❌ WRONG - extra spaces
HUAWEI_IAM_PASSWORD= MyPassword123 

# ✅ CORRECT - no spaces, exact password
HUAWEI_IAM_PASSWORD=MyPassword123
```

**Action:** If unsure, reset the IAM user's password in IAM > Users > [username] > Security Settings > Reset Password

---

### 3. Domain Name (Account Name)
**Where to find:** Click your username (top-right) > My Credentials > Domain Name

**Common mistakes:**
- ❌ Using Account ID (long hex string)
- ❌ Using your email
- ❌ Adding ".com" or other suffixes

**Example:**
```bash
# ❌ WRONG - this is Account ID
HUAWEI_IAM_DOMAIN_NAME=0a1b2c3d4e5f6789

# ❌ WRONG - this is email
HUAWEI_IAM_DOMAIN_NAME=user@example.com

# ✅ CORRECT - domain name exactly as shown
HUAWEI_IAM_DOMAIN_NAME=my-domain-name
```

**Action:** 
1. Click your username (top-right corner of console)
2. Click "My Credentials"
3. Copy the EXACT "Domain Name" shown (NOT Account ID)

---

### 4. Project Name (MUST Equal Region!)
**Where to find:** Should be the same as your region

**According to Huawei's official Postman example:**
```json
"scope": {
  "project": {
    "name": "ap-southeast-3"  // <-- This is the REGION NAME
  }
}
```

**Common mistakes:**
- ❌ Using Project ID (hex string)
- ❌ Using a custom project name
- ❌ Not matching the region

**Example:**
```bash
# ❌ WRONG - this is Project ID
HUAWEI_IAM_PROJECT_NAME=0a1b2c3d4e5f

# ❌ WRONG - doesn't match region
HUAWEI_IAM_PROJECT_NAME=my-project

# ✅ CORRECT - same as region
HUAWEI_SIS_REGION=ap-southeast-3
HUAWEI_IAM_PROJECT_NAME=ap-southeast-3  # <-- MUST MATCH!
```

**Action:** Set `HUAWEI_IAM_PROJECT_NAME` to the SAME value as `HUAWEI_SIS_REGION`

---

## 📝 Your Complete `.env.local` Template

```bash
# SIS Configuration
HUAWEI_SIS_PROJECT_ID=abc123def456789
HUAWEI_SIS_REGION=ap-southeast-3

# IAM Token Authentication
HUAWEI_IAM_USERNAME=iam_user_01
HUAWEI_IAM_PASSWORD=MySecurePassword123
HUAWEI_IAM_DOMAIN_NAME=my-domain-name
HUAWEI_IAM_PROJECT_NAME=ap-southeast-3

# ModelArts (Optional)
HUAWEI_MODELARTS_ENDPOINT=https://your-endpoint.apig.ap-southeast-3.huaweicloudapis.com
```

**Critical Rules:**
- ✅ NO quotes around values
- ✅ NO spaces before/after `=`
- ✅ NO inline comments (no `#` after values)
- ✅ NO trailing spaces
- ✅ PROJECT_NAME = REGION (they must match!)

---

## 🧪 Testing Steps

### Step 1: Check what's being read
```
http://localhost:3000/api/debug-credentials
```

This will show you:
- Which values are set vs missing
- If there are spaces or hidden characters
- If PROJECT_NAME matches REGION

### Step 2: Fix any issues
- Update `.env.local` based on the checklist above
- Remove ALL spaces and comments
- Verify PROJECT_NAME = REGION

### Step 3: RESTART server
```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Step 4: Test token generation
```
http://localhost:3000/api/test-token
```

**Expected success:**
```json
{
  "success": true,
  "message": "IAM token generated successfully! ✓",
  "tokenInfo": {
    "hasToken": true,
    "tokenLength": 3000
  }
}
```

**If still 401:**
1. Go to IAM > Users > [your username]
2. Verify user status is "Enabled" (not disabled/locked)
3. Try logging into Huawei Console with the SAME username/password
4. If login fails → password is wrong, reset it

---

## 🔧 Quick Fixes for Common Issues

### Issue: "Failed to parse URL"
**Cause:** Inline comments in `.env.local`
```bash
# ❌ BAD
HUAWEI_SIS_REGION=ap-southeast-3 # my region

# ✅ GOOD
HUAWEI_SIS_REGION=ap-southeast-3
```

### Issue: "401" after fixing .env.local
**Cause:** Server not restarted
**Fix:** Stop server (Ctrl+C) and run `npm run dev` again

### Issue: Values show "NOT SET" in debug endpoint
**Cause:** Missing values or wrong file name
**Fix:** 
- Ensure file is named `.env.local` (not `env.local` or `.env`)
- Place it in the project ROOT directory
- Restart server after editing

### Issue: PROJECT_NAME ≠ REGION warning
**Cause:** Using project ID instead of region name
**Fix:** Set `HUAWEI_IAM_PROJECT_NAME` to match `HUAWEI_SIS_REGION` exactly

---

## 📞 If Still Not Working

1. **Test IAM credentials directly in console:**
   - Try logging out and back in with the IAM username/password
   - If login fails → credentials are definitely wrong

2. **Check IAM user status:**
   - IAM > Users > [username] > User Status should be "Enabled"
   
3. **Verify region is correct:**
   - Check that your services are actually in `ap-southeast-3` (or whichever region you're using)
   - My Credentials > Projects > Look for your region

4. **Share debug output:**
   - Run `/api/debug-credentials`
   - Share the output (it masks sensitive data)
   - I can help identify the exact issue

