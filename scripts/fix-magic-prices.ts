#!/usr/bin/env tsx

import 'dotenv/config'
import { prisma } from '../lib/prisma'
import { scryfallAPI } from '../lib/apis/scryfall-api'

async function fixMagicPrices() {
  console.log('🔮 Fixing missing Magic: The Gathering prices...')
  
  try {
    // Find Magic cards without pricing
    const cardsWithoutPrices = await prisma.card.findMany({
      where: {
        game: 'MAGIC_THE_GATHERING',
        prices: {
          none: {}
        }
      },
      include: {
        prices: true
      }
    })

    console.log(`📊 Found ${cardsWithoutPrices.length} Magic cards without pricing`)

    if (cardsWithoutPrices.length === 0) {
      console.log('✅ All Magic cards already have pricing!')
      return
    }

    let updated = 0
    let failed = 0

    for (const card of cardsWithoutPrices) {
      try {
        // Try to fetch the card from Scryfall by ID or name
        let scryfallCard = null
        
        if (card.scryfall_id) {
          try {
            const response = await fetch(`https://api.scryfall.com/cards/${card.scryfall_id}`)
            if (response.ok) {
              scryfallCard = await response.json()
            }
          } catch (error) {
            console.log(`⚠️  Could not fetch by ID for ${card.name}`)
          }
        }

        // If we have Scryfall data, use the improved pricing logic
        if (scryfallCard) {
          const cardData = scryfallAPI.convertToCardImportData(scryfallCard)
          
          if (cardData.pricing) {
            await prisma.cardPrice.create({
              data: {
                cardId: card.id,
                sellPrice: cardData.pricing.sellPrice,
                marketPrice: cardData.pricing.marketPrice,
                lowPrice: cardData.pricing.lowPrice,
                highPrice: cardData.pricing.highPrice,
                condition: cardData.pricing.condition,
                source: cardData.pricing.source,
                currency: cardData.pricing.currency
              }
            })
            console.log(`✅ Added pricing for ${card.name}: $${cardData.pricing.sellPrice} (${cardData.pricing.source})`)
            updated++
          } else {
            console.log(`⚠️  No pricing available for ${card.name}`)
            failed++
          }
        } else {
          // Fallback: Generate estimated pricing based on rarity
          let fallbackPrice = 0.25
          
          // Exchange rate USD to CAD
          const USD_TO_CAD = 1.37
          
          switch (card.rarity?.toLowerCase()) {
            case 'common':
              fallbackPrice = Math.random() * 0.5 + 0.1
              break
            case 'uncommon':
              fallbackPrice = Math.random() * 1.5 + 0.3
              break
            case 'rare':
              fallbackPrice = Math.random() * 8 + 1
              break
            case 'mythic':
            case 'mythic rare':
              fallbackPrice = Math.random() * 25 + 3
              break
            default:
              fallbackPrice = Math.random() * 2 + 0.5
          }

          // Convert to CAD and round to realistic price
          fallbackPrice = fallbackPrice * USD_TO_CAD
          fallbackPrice = Math.round(fallbackPrice * 100) / 100

          await prisma.cardPrice.create({
            data: {
              cardId: card.id,
              sellPrice: fallbackPrice,
              marketPrice: fallbackPrice,
              lowPrice: Math.max(0.15, fallbackPrice * 0.7), // At least 15 cents CAD
              highPrice: fallbackPrice * 1.5,
              condition: 'Near Mint',
              source: 'Estimated (CAD)',
              currency: 'CAD'
            }
          })
          
          console.log(`🎲 Generated estimated price for ${card.name}: $${fallbackPrice}`)
          updated++
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`❌ Error updating ${card.name}:`, error)
        failed++
      }
    }

    console.log('\n📊 Summary:')
    console.log(`✅ Updated: ${updated} cards`)
    console.log(`❌ Failed: ${failed} cards`)

    // Final verification
    const remainingWithoutPrices = await prisma.card.count({
      where: {
        game: 'MAGIC_THE_GATHERING',
        prices: {
          none: {}
        }
      }
    })

    console.log(`📈 Magic cards still without prices: ${remainingWithoutPrices}`)

  } catch (error) {
    console.error('❌ Error during price fixing:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixMagicPrices()