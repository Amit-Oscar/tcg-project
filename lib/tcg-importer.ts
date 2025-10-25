import { prisma } from '../lib/prisma'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse'

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
      // Mock data for now - replace with actual API calls
      const onePieceCards: CardImportData[] = [
        {
          name: 'Monkey D. Luffy',
          set: 'Romance Dawn',
          setCode: 'ST01',
          rarity: 'Leader',
          cardNumber: 'ST01-001',
          imageUrl: 'https://onepiece-cardgame.dev/images/cards/ST01-001.jpg',
          description: '[DON!! x1] [When Attacking] Give up to 1 of your Leader or Character cards +1000 power during this turn.',
          type: 'Character',
          cost: '0',
          power: '5000',
          life: '5',
          attribute: 'Straw Hat Crew',
          optcg_id: 'ST01-001',
          game: 'ONE_PIECE'
        },
        {
          name: 'Roronoa Zoro',
          set: 'Romance Dawn',
          setCode: 'ST01',
          rarity: 'Super Rare',
          cardNumber: 'ST01-013',
          imageUrl: 'https://onepiece-cardgame.dev/images/cards/ST01-013.jpg',
          description: '[On Play] K.O. up to 1 of your opponent\'s Characters with 3000 power or less.',
          type: 'Character',
          cost: '4',
          power: '5000',
          life: '0',
          attribute: 'Straw Hat Crew',
          optcg_id: 'ST01-013',
          game: 'ONE_PIECE'
        },
        {
          name: 'Nami',
          set: 'Romance Dawn',
          setCode: 'ST01',
          rarity: 'Rare',
          cardNumber: 'ST01-007',
          imageUrl: 'https://onepiece-cardgame.dev/images/cards/ST01-007.jpg',
          description: '[On Play] Draw 1 card.',
          type: 'Character',
          cost: '1',
          power: '2000',
          life: '0',
          attribute: 'Straw Hat Crew',
          optcg_id: 'ST01-007',
          game: 'ONE_PIECE'
        }
      ]

      await this.importCards(onePieceCards, importRecord.id)
      
      await prisma.dataImport.update({
        where: { id: importRecord.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          totalCards: onePieceCards.length,
          importedCards: onePieceCards.length
        }
      })

      console.log(`✅ Imported ${onePieceCards.length} One Piece cards`)
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
    console.log('⚡ Starting Pokemon card import...')
    
    const importRecord = await prisma.dataImport.create({
      data: {
        game: 'POKEMON',
        source: 'pokemontcg-api',
        status: 'IN_PROGRESS'
      }
    })

    try {
      // Mock data - replace with actual Pokemon TCG API calls
      const pokemonCards: CardImportData[] = [
        {
          name: 'Pikachu',
          set: 'Base Set',
          setCode: 'BAS',
          rarity: 'Common',
          cardNumber: '25',
          imageUrl: 'https://images.pokemontcg.io/base1/25.png',
          description: 'When several of these POKéMON gather, their electricity could build and cause lightning storms.',
          type: 'Lightning',
          cost: '1',
          power: '40',
          life: '60',
          attribute: 'Electric',
          ptcgio_id: 'base1-25',
          game: 'POKEMON'
        },
        {
          name: 'Charizard',
          set: 'Base Set',
          setCode: 'BAS',
          rarity: 'Rare Holo',
          cardNumber: '4',
          imageUrl: 'https://images.pokemontcg.io/base1/4.png',
          description: 'Spits fire that is hot enough to melt boulders. Known to cause forest fires unintentionally.',
          type: 'Fire',
          cost: '4',
          power: '100',
          life: '120',
          attribute: 'Fire',
          ptcgio_id: 'base1-4',
          game: 'POKEMON'
        }
      ]

      await this.importCards(pokemonCards, importRecord.id)
      
      await prisma.dataImport.update({
        where: { id: importRecord.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          totalCards: pokemonCards.length,
          importedCards: pokemonCards.length
        }
      })

      console.log(`✅ Imported ${pokemonCards.length} Pokemon cards`)
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
    console.log('🔮 Starting Magic: The Gathering card import...')
    
    const importRecord = await prisma.dataImport.create({
      data: {
        game: 'MAGIC_THE_GATHERING',
        source: 'scryfall-api',
        status: 'IN_PROGRESS'
      }
    })

    try {
      // Mock data - replace with actual Scryfall API calls
      const mtgCards: CardImportData[] = [
        {
          name: 'Lightning Bolt',
          set: 'Alpha',
          setCode: 'LEA',
          rarity: 'Common',
          cardNumber: '161',
          imageUrl: 'https://cards.scryfall.io/normal/front/c/e/ce711943-c1a1-43a0-8b89-8d169cfb8e06.jpg',
          description: 'Lightning Bolt deals 3 damage to any target.',
          type: 'Instant',
          cost: 'R',
          power: '',
          life: '',
          attribute: 'Red',
          scryfall_id: 'ce711943-c1a1-43a0-8b89-8d169cfb8e06',
          game: 'MAGIC_THE_GATHERING'
        },
        {
          name: 'Black Lotus',
          set: 'Alpha',
          setCode: 'LEA',
          rarity: 'Rare',
          cardNumber: '232',
          imageUrl: 'https://cards.scryfall.io/normal/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg',
          description: '{T}, Sacrifice Black Lotus: Add three mana of any one color.',
          type: 'Artifact',
          cost: '0',
          power: '',
          life: '',
          attribute: 'Colorless',
          scryfall_id: 'bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd',
          game: 'MAGIC_THE_GATHERING'
        }
      ]

      await this.importCards(mtgCards, importRecord.id)
      
      await prisma.dataImport.update({
        where: { id: importRecord.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          totalCards: mtgCards.length,
          importedCards: mtgCards.length
        }
      })

      console.log(`✅ Imported ${mtgCards.length} MTG cards`)
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
            buyPrice: priceData.buyPrice,
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