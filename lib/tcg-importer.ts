import { prisma } from '../lib/prisma'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse'
import { pokemonAPI } from './apis/pokemon-tcg-api'
import { scryfallAPI } from './apis/scryfall-api'
import { getOnePieceCards, onePieceCardToCard } from './apis/onepiece-tcg-api'

export interface CardImportData {
  name: string
  set: string
  setCode?: string
  rarity: string
  cardNumber: string
  imageUrl?: string
  description?: string
  type?: string
  cost?: string
  power?: string
  life?: string
  attribute?: string
  tcgId?: string
  scryfall_id?: string
  ptcgio_id?: string
  optcg_id?: string
  game: 'ONE_PIECE' | 'POKEMON' | 'MAGIC_THE_GATHERING'
}

export interface PriceImportData {
  tcgId: string
  buyPrice?: number
  sellPrice: number
  marketPrice?: number
  lowPrice?: number
  highPrice?: number
  condition?: string
  source: string
  currency?: string
}

export class TCGDataImporter {
  /**
   * Import One Piece cards from external API or CSV
   */
  async importOnePieceCards(): Promise<void> {
    console.log('🏴‍☠️ Starting One Piece card import...')
    
    const importRecord = await prisma.dataImport.create({
      data: {
        game: 'ONE_PIECE',
        source: 'optcg-api',
        status: 'IN_PROGRESS'
      }
    })

    try {
      let allCards: any[] = []
      let page = 1
      let hasMore = true
      
      // Fetch all One Piece cards with pagination
      while (hasMore) {
        console.log(`📦 Fetching One Piece cards page ${page}...`)
        const result = await getOnePieceCards(page, 100)
        
        allCards.push(...result.data)
        hasMore = result.hasMore
        page++
        
        // Add delay to avoid rate limiting
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      console.log(`📦 Retrieved ${allCards.length} One Piece cards from API`)

      // Convert to our format and import with async pricing
      const cardsToImport = []
      
      // Process cards in batches to avoid overwhelming the pricing API
      const batchSize = 20
      for (let i = 0; i < allCards.length; i += batchSize) {
        const batch = allCards.slice(i, i + batchSize)
        console.log(`🔄 Processing One Piece cards batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allCards.length / batchSize)}...`)
        
        const batchPromises = batch.map(async (card) => {
          const convertedCard = await onePieceCardToCard(card)
          const cardData: CardImportData = {
            name: convertedCard.name,
            set: convertedCard.set,
            setCode: convertedCard.setCode,
            rarity: convertedCard.rarity,
            cardNumber: convertedCard.id,
            imageUrl: convertedCard.imageUrl,
            description: convertedCard.oracleText,
            type: convertedCard.types?.[0] || 'Character',
            cost: convertedCard.manaCost,
            power: convertedCard.power,
            life: '', // One Piece doesn't have life
            attribute: card.attribute,
            optcg_id: convertedCard.id,
            game: 'ONE_PIECE' as const
          }
          
          return {
            card: cardData,
            pricing: convertedCard.prices
          }
        })
        
        const batchResults = await Promise.all(batchPromises)
        cardsToImport.push(...batchResults)
        
        // Add delay between batches to be respectful to pricing APIs
        if (i + batchSize < allCards.length) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      
      await this.importCardsWithPricing(cardsToImport, importRecord.id)
      
      await prisma.dataImport.update({
        where: { id: importRecord.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          totalCards: cardsToImport.length,
          importedCards: cardsToImport.length
        }
      })

      console.log(`✅ Imported ${allCards.length} One Piece cards`)
    } catch (error) {
      await prisma.dataImport.update({
        where: { id: importRecord.id },
        data: {
          status: 'FAILED',
          errorLog: JSON.stringify({ error: String(error) })
        }
      })
      throw error
    }
  }

  /**
   * Import Pokemon cards from PokemonTCG API
   */
  async importPokemonCards(): Promise<void> {
    console.log('⚡ Starting Pokemon card import from API...')
    
    const importRecord = await prisma.dataImport.create({
      data: {
        game: 'POKEMON',
        source: 'pokemontcg-api',
        status: 'IN_PROGRESS'
      }
    })

    try {
      // Get all Pokemon cards from API (this will be a large dataset)
      const pokemonCards = await pokemonAPI.getAllCards()
      console.log(`📦 Retrieved ${pokemonCards.length} Pokemon cards from API`)

      // Convert to our format and import in batches
      const cardsToImport = pokemonCards.map(card => pokemonAPI.convertToCardImportData(card))
      
      await this.importCardsWithPricing(cardsToImport, importRecord.id)
      
      await prisma.dataImport.update({
        where: { id: importRecord.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          totalCards: cardsToImport.length,
          importedCards: cardsToImport.length
        }
      })

      console.log(`✅ Imported ${cardsToImport.length} Pokemon cards`)
    } catch (error) {
      await prisma.dataImport.update({
        where: { id: importRecord.id },
        data: {
          status: 'FAILED',
          errorLog: JSON.stringify({ error: String(error) })
        }
      })
      throw error
    }
  }

  /**
   * Import Magic: The Gathering cards from Scryfall API
   */
  async importMTGCards(): Promise<void> {
    console.log('🔮 Starting Magic: The Gathering card import from API...')
    
    const importRecord = await prisma.dataImport.create({
      data: {
        game: 'MAGIC_THE_GATHERING',
        source: 'scryfall-api',
        status: 'IN_PROGRESS'
      }
    })

    try {
      // Get all Magic cards from Scryfall API (this will be a very large dataset)
      const mtgCards = await scryfallAPI.getAllCards()
      console.log(`📦 Retrieved ${mtgCards.length} Magic cards from API`)

      // Convert to our format and import in batches
      const cardsToImport = mtgCards.map(card => scryfallAPI.convertToCardImportData(card))
      
      await this.importCardsWithPricing(cardsToImport, importRecord.id)
      
      await prisma.dataImport.update({
        where: { id: importRecord.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          totalCards: cardsToImport.length,
          importedCards: cardsToImport.length
        }
      })

      console.log(`✅ Imported ${cardsToImport.length} MTG cards`)
    } catch (error) {
      await prisma.dataImport.update({
        where: { id: importRecord.id },
        data: {
          status: 'FAILED',
          errorLog: JSON.stringify({ error: String(error) })
        }
      })
      throw error
    }
  }

  /**
   * Import cards from CSV file
   */
  async importFromCSV(filePath: string, game: 'ONE_PIECE' | 'POKEMON' | 'MAGIC_THE_GATHERING'): Promise<void> {
    console.log(`📄 Importing ${game} cards from CSV: ${filePath}`)
    
    const importRecord = await prisma.dataImport.create({
      data: {
        game,
        source: 'csv',
        fileName: path.basename(filePath),
        status: 'IN_PROGRESS'
      }
    })

    try {
      const cards: CardImportData[] = []
      
      return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(parse({ 
            columns: true,
            skip_empty_lines: true 
          }))
          .on('data', (row: any) => {
            const card: CardImportData = {
              name: row.name || '',
              set: row.set || '',
              setCode: row.setCode || row.set_code,
              rarity: row.rarity || '',
              cardNumber: row.cardNumber || row.card_number || '',
              imageUrl: row.imageUrl || row.image_url,
              description: row.description || row.text,
              type: row.type,
              cost: row.cost,
              power: row.power,
              life: row.life || row.hp || row.toughness,
              attribute: row.attribute || row.color || row.colors,
              tcgId: row.tcgId || row.tcg_id,
              scryfall_id: row.scryfall_id,
              ptcgio_id: row.ptcgio_id,
              optcg_id: row.optcg_id,
              game
            }
            cards.push(card)
          })
          .on('end', async () => {
            try {
              await this.importCards(cards, importRecord.id)
              
              await prisma.dataImport.update({
                where: { id: importRecord.id },
                data: {
                  status: 'COMPLETED',
                  completedAt: new Date(),
                  totalCards: cards.length,
                  importedCards: cards.length
                }
              })

              console.log(`✅ Imported ${cards.length} cards from CSV`)
              resolve()
            } catch (error) {
              reject(error)
            }
          })
          .on('error', reject)
      })
    } catch (error) {
      await prisma.dataImport.update({
        where: { id: importRecord.id },
        data: {
          status: 'FAILED',
          errorLog: JSON.stringify({ error: String(error) })
        }
      })
      throw error
    }
  }

  /**
   * Import price data for existing cards
   */
  async importPriceData(prices: PriceImportData[]): Promise<void> {
    console.log(`💰 Importing ${prices.length} price records...`)

    for (const priceData of prices) {
      try {
        // Find the card by tcgId
        const card = await prisma.card.findFirst({
          where: {
            OR: [
              { tcgId: priceData.tcgId },
              { scryfall_id: priceData.tcgId },
              { ptcgio_id: priceData.tcgId },
              { optcg_id: priceData.tcgId }
            ]
          }
        })

        if (!card) {
          console.warn(`⚠️ Card not found for tcgId: ${priceData.tcgId}`)
          continue
        }

        await prisma.cardPrice.create({
          data: {
            cardId: card.id,
            sellPrice: priceData.sellPrice,
            marketPrice: priceData.marketPrice,
            lowPrice: priceData.lowPrice,
            highPrice: priceData.highPrice,
            condition: priceData.condition || 'NM',
            source: priceData.source,
            currency: priceData.currency || 'USD'
          }
        })
      } catch (error) {
        console.error(`❌ Error importing price for ${priceData.tcgId}:`, error)
      }
    }

    console.log('✅ Price import completed')
  }

  /**
   * Import all TCG data at startup
   */
  async importAllTCGData(): Promise<void> {
    console.log('🚀 Starting full TCG data import...')
    
    try {
      await this.importOnePieceCards()
      await this.importPokemonCards()
      await this.importMTGCards()
      
      console.log('🎉 All TCG data imported successfully!')
    } catch (error) {
      console.error('❌ Error during TCG data import:', error)
      throw error
    }
  }

  /**
   * Helper method to import cards with pricing into database
   */
  async importCardsWithPricing(cardsWithPricing: Array<{ card: CardImportData; pricing?: any }>, importId?: number): Promise<void> {
    console.log(`📦 Importing ${cardsWithPricing.length} cards with pricing...`)
    
    for (const { card: cardData, pricing } of cardsWithPricing) {
      try {
        // Upsert the card
        const card = await prisma.card.upsert({
          where: {
            set_cardNumber_game: {
              set: cardData.set,
              cardNumber: cardData.cardNumber,
              game: cardData.game
            }
          },
          update: {
            name: cardData.name,
            setCode: cardData.setCode,
            rarity: cardData.rarity,
            imageUrl: cardData.imageUrl,
            description: cardData.description,
            type: cardData.type,
            cost: cardData.cost,
            power: cardData.power,
            life: cardData.life,
            attribute: cardData.attribute,
            tcgId: cardData.tcgId,
            scryfall_id: cardData.scryfall_id,
            ptcgio_id: cardData.ptcgio_id,
            optcg_id: cardData.optcg_id,
            updatedAt: new Date()
          },
          create: cardData
        })

        // Add pricing if available
        if (pricing) {
          await prisma.cardPrice.create({
            data: {
              cardId: card.id,
              sellPrice: pricing.sellPrice || pricing.marketPrice || 0, // Use marketPrice as fallback, or 0
              marketPrice: pricing.marketPrice,
              lowPrice: pricing.lowPrice,
              highPrice: pricing.highPrice,
              condition: pricing.condition || "NM",
              source: pricing.source || "unknown",
              currency: pricing.currency || "USD"
            }
          })
        }
      } catch (error) {
        console.error(`❌ Error importing card ${cardData.name}:`, error)
      }
    }
  }

  /**
   * Helper method to import cards into database
   */
  private async importCards(cards: CardImportData[], importId: number): Promise<void> {
    for (const cardData of cards) {
      try {
        await prisma.card.upsert({
          where: {
            set_cardNumber_game: {
              set: cardData.set,
              cardNumber: cardData.cardNumber,
              game: cardData.game
            }
          },
          update: {
            name: cardData.name,
            setCode: cardData.setCode,
            rarity: cardData.rarity,
            imageUrl: cardData.imageUrl,
            description: cardData.description,
            type: cardData.type,
            cost: cardData.cost,
            power: cardData.power,
            life: cardData.life,
            attribute: cardData.attribute,
            tcgId: cardData.tcgId,
            scryfall_id: cardData.scryfall_id,
            ptcgio_id: cardData.ptcgio_id,
            optcg_id: cardData.optcg_id,
            updatedAt: new Date()
          },
          create: cardData
        })
      } catch (error) {
        console.error(`❌ Error importing card ${cardData.name}:`, error)
      }
    }
  }
}

export const tcgImporter = new TCGDataImporter()

// Export the method for standalone use
export async function importCardsWithPricing(cardsData: CardImportData[], game: 'ONE_PIECE' | 'POKEMON' | 'MAGIC_THE_GATHERING'): Promise<void> {
  // Convert CardImportData to the format expected by importCardsWithPricing
  const cardsWithPricing = cardsData.map(card => ({ card, pricing: null }))
  await tcgImporter.importCardsWithPricing(cardsWithPricing)
}