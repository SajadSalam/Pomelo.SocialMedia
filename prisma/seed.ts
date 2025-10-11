import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create test user
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      settings: {
        create: {},
      },
    },
  })

  console.log('✅ Created user:', user.email)

  // Create test clients
  const client1 = await prisma.client.create({
    data: {
      name: 'Test Client 1',
      notes: 'This is a test client for development',
    },
  })

  const client2 = await prisma.client.create({
    data: {
      name: 'Test Client 2',
      notes: 'Another test client',
    },
  })

  console.log('✅ Created clients:', client1.name, client2.name)

  // Create test channels (you'll need to add real credentials later)
  const channel1 = await prisma.channel.create({
    data: {
      clientId: client1.id,
      type: 'FACEBOOK_PAGE',
      externalId: '123456789',
      name: 'Test Facebook Page',
      isEnabled: false, // Disabled by default until real credentials are added
    },
  })

  const channel2 = await prisma.channel.create({
    data: {
      clientId: client1.id,
      type: 'INSTAGRAM_BUSINESS',
      externalId: '987654321',
      name: 'Test Instagram Account',
      isEnabled: false,
    },
  })

  console.log('✅ Created channels:', channel1.name, channel2.name)

  // Create a test media asset (placeholder)
  const mediaAsset = await prisma.mediaAsset.create({
    data: {
      filename: 'test-image.jpg',
      mimeType: 'image/jpeg',
      bytes: 1024,
      url: '/uploads/test-image.jpg',
      thumbUrl: '/uploads/test-image.jpg',
    },
  })

  console.log('✅ Created test media asset')

  // Create a test post
  const post = await prisma.postRequest.create({
    data: {
      clientId: client1.id,
      kind: 'SINGLE_IMAGE',
      caption: 'This is a test post created by the seed script! 🚀',
      mediaIds: JSON.stringify([mediaAsset.id]),
      status: 'DRAFT',
      createdVia: 'dashboard',
    },
  })

  console.log('✅ Created test post')

  console.log('\n✨ Database seeded successfully!')
  console.log('\n📝 Login credentials:')
  console.log('   Email: admin@example.com')
  console.log('   Password: password123')
  console.log('\n⚠️  Remember to configure your Meta API credentials in the settings!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

