# 🔑 How to Fix Facebook/Instagram Token Permissions Error

## The Problem

You're seeing this error:

```
(#200) If posting to a page, requires both pages_read_engagement
and pages_manage_posts as an admin with sufficient administrative permission
```

**This means:** Your Facebook Page Access Token doesn't have the required permissions to create posts.

---

## ✅ Quick Solution (5 minutes)

### Step 1: Test Your Current Token

Run this command with your current token:

```bash
npx tsx scripts/test-token.ts "YOUR_CURRENT_TOKEN_HERE"
```

This will show you:

- ✅ If the token is valid
- 📋 What permissions it has
- ❌ What permissions are missing
- 🔧 How to fix it

### Step 2: Get a New Token with Correct Permissions

#### Option A: Using Graph API Explorer (Easiest)

1. **Go to Graph API Explorer:**
   https://developers.facebook.com/tools/explorer/

2. **Select Your App:**
   In the top dropdown, select your Facebook App (ID: `2615534738796190`)

3. **Get Page Access Token:**
   - Click the "Get Token" button
   - Select "Get Page Access Token"
   - Choose your Facebook Page from the list

4. **Grant Permissions:**
   Make sure these are checked:
   - ✅ `pages_read_engagement`
   - ✅ `pages_manage_posts`

   For Instagram, also add:
   - ✅ `instagram_basic`
   - ✅ `instagram_content_publish`

5. **Copy the Token:**
   Copy the generated access token (starts with `EAA...`)

6. **Convert to Long-Lived Token (60 days):**

   ```bash
   curl "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=2615534738796190&client_secret=YOUR_APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN"
   ```

   Replace:
   - `YOUR_APP_SECRET` with your app secret
   - `SHORT_LIVED_TOKEN` with the token you just copied

7. **Test the New Token:**

   ```bash
   npx tsx scripts/test-token.ts "YOUR_NEW_LONG_LIVED_TOKEN"
   ```

   You should see: ✅ TOKEN IS READY FOR FACEBOOK PAGE POSTING!

### Step 3: Update Your Channel

#### Option 1: Via Database (SQLite)

```bash
npx prisma studio
```

1. Open the `Channel` table
2. Find your Facebook Page channel (ID: `751032664752682`)
3. Replace the `accessToken` field with your new long-lived token
4. Save

#### Option 2: Via SQL

```bash
npx prisma db execute --stdin <<EOF
UPDATE Channel
SET accessToken = 'YOUR_NEW_LONG_LIVED_TOKEN'
WHERE externalId = '751032664752682';
EOF
```

#### Option 3: Via API (if you add an update endpoint)

```bash
curl -X PUT http://localhost:3001/api/channels/YOUR_CHANNEL_ID \
  -H "Content-Type: application/json" \
  -d '{"accessToken": "YOUR_NEW_LONG_LIVED_TOKEN"}'
```

### Step 4: Validate the Channel Token

Use the new validation endpoint:

```bash
curl -X POST http://localhost:3001/api/channels/YOUR_CHANNEL_ID/validate-token
```

You should see:

```json
{
  "validation": {
    "isValid": true,
    "hasAllPermissions": true,
    "errors": []
  }
}
```

### Step 5: Test Publishing!

Now try publishing a post again. It should work! 🎉

---

## 🔍 Understanding Token Types

### ❌ Wrong Token Types:

- **User Access Token** - Can't post to pages
- **App Access Token** - Can't post to pages
- **Token without permissions** - Missing required scopes

### ✅ Correct Token:

- **Page Access Token** with these permissions:
  - `pages_read_engagement`
  - `pages_manage_posts`
  - (For Instagram: also `instagram_basic`, `instagram_content_publish`)

---

## 🛠️ Troubleshooting

### "Token is invalid or expired"

- Tokens expire! Short-lived tokens last ~2 hours
- Long-lived tokens last ~60 days
- Always convert to long-lived tokens in production

### "Wrong token type: expected PAGE token, got USER"

- You're using a User Access Token
- You need to exchange it for a Page Access Token
- Go to Graph API Explorer → Get Page Access Token

### "I'm an admin but still getting permission errors"

- Your token needs permissions, not just page admin role
- Re-generate the token with correct permissions
- Make sure you click "Grant Access" when Facebook asks

### "Token works in Graph API Explorer but not in the app"

- Make sure you copied the FULL token (they're long!)
- Make sure you're using the PAGE token, not USER token
- Test with the provided script: `npx tsx scripts/test-token.ts`

---

## 📚 Additional Resources

- [Facebook Page Access Tokens](https://developers.facebook.com/docs/pages/access-tokens)
- [Instagram Content Publishing](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

---

## 🎯 Quick Checklist

- [ ] Token is a **Page Access Token** (not User token)
- [ ] Token has **pages_read_engagement** permission
- [ ] Token has **pages_manage_posts** permission
- [ ] Token is **long-lived** (60 days, not 2 hours)
- [ ] You're an **admin** of the Facebook Page
- [ ] Token is updated in the **database**
- [ ] Tested with **test-token.ts script**
- [ ] Validated with **/api/channels/.../validate-token endpoint**

Once all checkboxes are ✅, publishing will work!
