import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function populateTestData() {
  try {
    // Update existing cards with TCG IDs and add price data
    const cards = await prisma.card.findMany()
    
    for (const card of cards) {
      // Add mock TCG ID
      await prisma.card.update({
        where: { id: card.id },
        data: {
          tcgId: `mock-${card.id}`,
          game: 'ONE_PIECE'
        }
      })

      // Add some mock historical price data
      const prices = [
        { price: 1500, date: new Date('2024-01-01') },
        { price: 1750, date: new Date('2024-06-01') },
        { price: 2000, date: new Date('2024-10-01') },
      ]

      for (const priceData of prices) {
        await prisma.cardPrice.create({
          data: {
            cardId: card.id,
            price: priceData.price,
            condition: 'NM',
            source: 'mock-tcg',
            currency: 'USD',
            createdAt: priceData.date
          }
        })
      }
    }

    // Create some additional One Piece cards
    const onePieceCards = [
      {
        name: 'Monkey D. Luffy',
        set: 'Romance Dawn',
        rarity: 'Super Rare',
        cardNumber: 'ST01-001',
        tcgId: 'op-rd-001'
      },
      {
        name: 'Roronoa Zoro',
        set: 'Romance Dawn',
        rarity: 'Rare',
        cardNumber: 'ST01-013',
        tcgId: 'op-rd-013'
      },
      {
        name: 'Nami',
        set: 'Romance Dawn', 
        rarity: 'Common',
        cardNumber: 'ST01-007',
        tcgId: 'op-rd-007'
      }
    ]

    for (const cardData of onePieceCards) {
      const card = await prisma.card.create({
        data: {
          ...cardData,
          game: 'ONE_PIECE',
          imageUrl: `https://onepiece-cardgame.dev/images/cards/${cardData.tcgId}.jpg`
        }
      })

      // Add current price
      await prisma.cardPrice.create({
        data: {
          cardId: card.id,
          price: Math.floor(Math.random() * 3000) + 500, // $5-$35
          condition: 'NM',
          source: 'optcg-api',
          currency: 'USD'
        }
      })
    }

    console.log('✅ Test data populated successfully!')
    
    // Show summary
    const totalCards = await prisma.card.count()
    const totalPrices = await prisma.cardPrice.count()
    console.log(`📊 Summary: ${totalCards} cards, ${totalPrices} price records`)

  } catch (error) {
    console.error('❌ Error populating test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

populateTestData()