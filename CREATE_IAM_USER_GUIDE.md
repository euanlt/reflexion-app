# How to Create an IAM User for Huawei Cloud SIS

## Why You Need This

You're currently using your domain name (`hid_wh5ae_cq83lo0xy`) as both the username and domain name. This causes a 401 authentication error.

**You need:**
- Domain Name: `hid_wh5ae_cq83lo0xy` ✅ (You already have this)
- IAM Username: A separate user within your account ❌ (Need to create/find this)

## Step-by-Step: Create IAM User

### Step 1: Go to IAM Console

1. Log in to Huawei Cloud Console: https://console.huaweicloud.com/iam
2. In the left navigation, click **Users**

### Step 2: Check for Existing Users

- If you see users in the list (e.g., `admin`, `hwcloud-admin`), you can use one of these!
- If the list is empty or you want a dedicated user, continue to create one

### Step 3: Create New User

1. Click **Create User** (top right)

2. **User Information:**
   - Username: `sis_user` (or any name you prefer, e.g., `reflexion_app`)
   - Credential Type: Select **"Password"**
   - Access Type: Select **"Programmatic access and management console access"**

3. **Password Settings:**
   - Set a password (remember this - you'll need it for `.env.local`)
   - Example: `MySecurePass123!`
   - Uncheck "User must change password on first login" (for easier testing)

4. Click **Next**

### Step 4: Add Permissions

1. On the "Permissions" page, choose **"Add User to Groups"** or **"Assign Roles"**

2. **Recommended: Assign Roles Directly**
   - Click **"Assign Roles Directly"**
   - Search for and select: **"Tenant Administrator"** or **"SIS FullAccess"**
   - Select Scope: **"All resources"** or your specific region (e.g., `ap-southeast-3`)

3. Click **Next**

### Step 5: Review and Create

1. Review the user information
2. Click **OK** to create the user
3. **Save the username and password!**

### Step 6: Get Your Credentials

After creating the user, you now have:

```bash
# Domain Name (Account Name) - from My Credentials
HUAWEI_IAM_DOMAIN_NAME=hid_wh5ae_cq83lo0xy

# IAM Username - the user you just created
HUAWEI_IAM_USERNAME=sis_user

# IAM Password - the password you set
HUAWEI_IAM_PASSWORD=MySecurePass123!

# Project Name - same as region
HUAWEI_IAM_PROJECT_NAME=ap-southeast-3
```

## Alternative: Use Existing IAM User

If you already have an IAM user but don't know the password:

### Reset Password

1. Go to **IAM** > **Users**
2. Click on the username
3. Go to **Security Settings** tab
4. Click **Reset Password**
5. Set a new password
6. Use this password in `.env.local`

## Common Scenarios

### Scenario 1: "I only see my domain name in Users"

- You need to create an IAM user (follow Step 3 above)
- Domain names appear in IAM console but they are NOT IAM users

### Scenario 2: "I see 'hwcloud-admin' or similar"

- This is likely a default IAM user created by Huawei
- You can use this! Just need to know/reset its password
- Go to that user > Security Settings > Reset Password

### Scenario 3: "I created a user but still get 401"

Double-check:
1. Username is EXACTLY as shown in IAM > Users (case-sensitive!)
2. Password is correct (no extra spaces)
3. Domain name is from My Credentials > Domain Name
4. Project name matches your region
5. You restarted the dev server after updating `.env.local`

## Final `.env.local` Template

```bash
# SIS Configuration
HUAWEI_SIS_PROJECT_ID=your_project_id_here
HUAWEI_SIS_REGION=ap-southeast-3

# IAM Token Authentication
HUAWEI_IAM_USERNAME=sis_user                    # ← NEW IAM user (NOT domain name!)
HUAWEI_IAM_PASSWORD=MySecurePass123!            # ← Password you set
HUAWEI_IAM_DOMAIN_NAME=hid_wh5ae_cq83lo0xy     # ← Your domain name (stays same)
HUAWEI_IAM_PROJECT_NAME=ap-southeast-3          # ← Your region

# ModelArts (Optional)
HUAWEI_MODELARTS_ENDPOINT=https://your-endpoint.apig.ap-southeast-3.huaweicloudapis.com
```

## Test After Creating User

1. Update `.env.local` with new IAM username and password
2. Restart dev server: `npm run dev`
3. Test: `http://localhost:3000/api/test-token`

**Expected success:**
```json
{
  "success": true,
  "message": "IAM token generated successfully! ✓"
}
```

## Video Guide (Official Huawei)

For visual instructions, search Huawei Cloud docs for "Creating an IAM User"
Link: https://support.huaweicloud.com/intl/en-us/usermanual-iam/iam_02_0001.html

