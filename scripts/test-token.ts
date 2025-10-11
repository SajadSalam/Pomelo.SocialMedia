#!/usr/bin/env tsx

/**
 * Script to test Facebook/Instagram access token permissions
 * Usage: npx tsx scripts/test-token.ts YOUR_ACCESS_TOKEN
 */

import axios from 'axios'

const GRAPH_API_VERSION = 'v21.0'
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

async function testToken(accessToken: string) {
  console.log('🔍 Testing Access Token...\n')

  try {
    // 1. Debug token
    console.log('1️⃣ Checking token validity...')
    const debugResponse = await axios.get(
      `${GRAPH_API_BASE}/debug_token`,
      {
        params: {
          input_token: accessToken,
          access_token: accessToken,
        },
      },
    )

    const tokenData = debugResponse.data.data

    if (!tokenData.is_valid) {
      console.error('❌ Token is INVALID or EXPIRED\n')
      return
    }

    console.log('✅ Token is VALID')
    console.log(`   Type: ${tokenData.type}`)
    console.log(`   App ID: ${tokenData.app_id}`)
    console.log(`   Expires: ${tokenData.expires_at ? new Date(tokenData.expires_at * 1000).toLocaleString() : 'Never'}`)
    console.log(`   User ID: ${tokenData.user_id}`)

    // 2. Check permissions
    console.log('\n2️⃣ Checking permissions...')
    const scopes = tokenData.scopes || []
    console.log(`   Granted: ${scopes.join(', ') || 'none'}`)

    // 3. Check for Facebook Page permissions
    console.log('\n3️⃣ Facebook Page Requirements:')
    const fbRequired = ['pages_read_engagement', 'pages_manage_posts']
    const fbMissing = fbRequired.filter(p => !scopes.includes(p))

    if (fbMissing.length === 0) {
      console.log('   ✅ Has all Facebook Page permissions')
    }
    else {
      console.log(`   ❌ Missing: ${fbMissing.join(', ')}`)
    }

    // 4. Check for Instagram permissions
    console.log('\n4️⃣ Instagram Requirements:')
    const igRequired = ['pages_read_engagement', 'pages_manage_posts', 'instagram_basic', 'instagram_content_publish']
    const igMissing = igRequired.filter(p => !scopes.includes(p))

    if (igMissing.length === 0) {
      console.log('   ✅ Has all Instagram permissions')
    }
    else {
      console.log(`   ❌ Missing: ${igMissing.join(', ')}`)
    }

    // 5. Get pages (if it's a user token)
    if (tokenData.type === 'USER') {
      console.log('\n5️⃣ Getting your pages...')
      try {
        const pagesResponse = await axios.get(
          `${GRAPH_API_BASE}/me/accounts`,
          {
            params: {
              access_token: accessToken,
            },
          },
        )

        const pages = pagesResponse.data.data
        if (pages.length > 0) {
          console.log(`   Found ${pages.length} page(s):`)
          pages.forEach((page: any, i: number) => {
            console.log(`   ${i + 1}. ${page.name} (ID: ${page.id})`)
            console.log(`      Page Token: ${page.access_token.substring(0, 20)}...`)
          })
          console.log('\n   ⚠️  You should use a PAGE TOKEN, not a USER TOKEN!')
          console.log('      Copy one of the page access_tokens above.')
        }
      }
      catch (error: any) {
        console.log('   ❌ Could not fetch pages')
      }
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`)
    console.log(JSON.stringify(tokenData, null, 2))
    if (fbMissing.length === 0 && tokenData.type === 'USER') {
      console.log('✅ TOKEN IS READY FOR FACEBOOK PAGE POSTING!')
    }
    else if (igMissing.length === 0 && tokenData.type === 'USER') {
      console.log('✅ TOKEN IS READY FOR INSTAGRAM POSTING!')
    }
    else {
      console.log('❌ TOKEN NEEDS TO BE UPDATED')
      console.log('\n📋 How to get the correct token:')
      console.log('1. Go to: https://developers.facebook.com/tools/explorer/')
      console.log('2. Select your Facebook App')
      console.log('3. Click "Get Token" → "Get Page Access Token"')
      console.log('4. Select your page and grant permissions')
      console.log('5. Copy the token and use it!')
    }
    console.log(`${'='.repeat(60)}\n`)
  }
  catch (error: any) {
    console.error('❌ Error testing token:', error.response?.data || error.message)
  }
}

// Get token from command line
const token = process.argv[2]

if (!token) {
  console.log('Usage: npx tsx scripts/test-token.ts YOUR_ACCESS_TOKEN')
  console.log('\nOr set it inline:')
  console.log('npx tsx scripts/test-token.ts "EAA..."')
  process.exit(1)
}

testToken(token)
