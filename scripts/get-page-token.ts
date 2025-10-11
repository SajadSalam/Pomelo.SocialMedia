#!/usr/bin/env tsx

/**
 * Get full page access tokens from a user access token
 */

import axios from 'axios'

const GRAPH_API_VERSION = 'v21.0'
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

async function getPageTokens(userAccessToken: string) {
  try {
    const response = await axios.get(
      `${GRAPH_API_BASE}/me/accounts`,
      {
        params: {
          access_token: userAccessToken,
        },
      },
    )

    const pages = response.data.data

    console.log('📋 Your Facebook Pages:\n')

    pages.forEach((page: any, i: number) => {
      console.log(`${i + 1}. ${page.name}`)
      console.log(`   Page ID: ${page.id}`)
      console.log(`   Page Access Token:`)
      console.log(`   ${page.access_token}`)
      console.log()
    })

    console.log('✅ Copy the FULL page access token above and update your channel!')
  }
  catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message)
  }
}

const userToken = process.argv[2]

if (!userToken) {
  console.log('Usage: npx tsx scripts/get-page-token.ts YOUR_USER_TOKEN')
  process.exit(1)
}

getPageTokens(userToken)
