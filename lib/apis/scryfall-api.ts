/**
 * Scryfall API Integration for Magic: The Gathering
 * Official API: https://scryfall.com/docs/api
 */

export interface ScryfallCard {
  id: string
  oracle_id: string
  multiverse_ids: number[]
  mtgo_id?: number
  arena_id?: number
  tcgplayer_id?: number
  cardmarket_id?: number
  name: string
  lang: string
  released_at: string
  uri: string
  scryfall_uri: string
  layout: string
  highres_image: boolean
  image_status: string
  image_uris?: {
    small: string
    normal: string
    large: string
    png: string
    art_crop: string
    border_crop: string
  }
  mana_cost?: string
  cmc: number
  type_line: string
  oracle_text?: string
  power?: string
  toughness?: string
  colors: string[]
  color_identity: string[]
  keywords: string[]
  legalities: Record<string, string>
  games: string[]
  reserved: boolean
  foil: boolean
  nonfoil: boolean
  finishes: string[]
  oversized: boolean
  promo: boolean
  reprint: boolean
  variation: boolean
  set_id: string
  set: string
  set_name: string
  set_type: string
  set_uri: string
  set_search_uri: string
  scryfall_set_uri: string
  rulings_uri: string
  prints_search_uri: string
  collector_number: string
  digital: boolean
  rarity: string
  flavor_text?: string
  card_back_id: string
  artist?: string
  artist_ids: string[]
  illustration_id?: string
  border_color: string
  frame: string
  security_stamp?: string
  full_art: boolean
  textless: boolean
  booster: boolean
  story_spotlight: boolean
  edhrec_rank?: number
  preview?: {
    source: string
    source_uri: string
    previewed_at: string
  }
  prices: {
    usd?: string
    usd_foil?: string
    usd_etched?: string
    eur?: string
    eur_foil?: string
    tix?: string
  }
  related_uris: {
    gatherer?: string
    tcgplayer_infinite_articles?: string
    tcgplayer_infinite_decks?: string
    edhrec?: string
  }
  purchase_uris: {
    tcgplayer?: string
    cardmarket?: string
    cardhoarder?: string
  }
}

export interface ScryfallAPIResponse {
  object: string
  total_cards: number
  has_more: boolean
  next_page?: string
  data: ScryfallCard[]
}

export class ScryfallAPI {
  private baseUrl = 'https://api.scryfall.com'
  private rateLimitDelay = 100 // Scryfall requests 50-100ms between requests

  private async makeRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    // Rate limiting - Scryfall asks for 50-100ms between requests
    await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay))

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TCG-Project/1.0'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Scryfall API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getAllCards(): Promise<ScryfallCard[]> {
    const allCards: ScryfallCard[] = []
    let nextPageUrl: string | undefined = '/cards'

    console.log('🔄 Fetching all Magic: The Gathering cards from Scryfall...')

    while (nextPageUrl) {
      try {
        const endpoint: string = nextPageUrl.startsWith('http') 
          ? nextPageUrl.replace(this.baseUrl, '') 
          : nextPageUrl

        const response: ScryfallAPIResponse = await this.makeRequest<ScryfallAPIResponse>(endpoint)
        
        allCards.push(...response.data)
        console.log(`📦 Fetched ${response.data.length} cards (${allCards.length}/${response.total_cards} total)`)

        nextPageUrl = response.has_more ? response.next_page : undefined
      } catch (error) {
        console.error(`❌ Error fetching Magic cards:`, error)
        break
      }
    }

    console.log(`✅ Completed Magic card fetch: ${allCards.length} total cards`)
    return allCards
  }

  async getCardsBySet(setCode: string): Promise<ScryfallCard[]> {
    try {
      const response = await this.makeRequest<ScryfallAPIResponse>('/cards/search', {
        q: `set:${setCode}`,
        order: 'set'
      })
      return response.data
    } catch (error) {
      console.error(`❌ Error fetching cards for set ${setCode}:`, error)
      return []
    }
  }

  async searchCards(query: string): Promise<ScryfallCard[]> {
    try {
      const response = await this.makeRequest<ScryfallAPIResponse>('/cards/search', {
        q: query
      })
      return response.data
    } catch (error) {
      console.error(`❌ Error searching Magic cards:`, error)
      return []
    }
  }

  async getSets() {
    try {
      const response = await this.makeRequest<{ data: any[] }>('/sets')
      return response.data
    } catch (error) {
      console.error(`❌ Error fetching Magic sets:`, error)
      return []
    }
  }

  // Convert Scryfall card to our database format
  convertToCardImportData(scryfallCard: ScryfallCard) {
    // Get the best available price
    let sellPrice: number | undefined
    let marketPrice: number | undefined
    let lowPrice: number | undefined
    let highPrice: number | undefined

    if (scryfallCard.prices.usd) {
      sellPrice = parseFloat(scryfallCard.prices.usd)
      marketPrice = sellPrice
      lowPrice = sellPrice * 0.8 // Estimate 20% below market
      highPrice = sellPrice * 1.3 // Estimate 30% above market
    } else if (scryfallCard.prices.usd_foil) {
      sellPrice = parseFloat(scryfallCard.prices.usd_foil)
      marketPrice = sellPrice
      lowPrice = sellPrice * 0.8
      highPrice = sellPrice * 1.3
    }

    return {
      card: {
        name: scryfallCard.name,
        set: scryfallCard.set_name,
        setCode: scryfallCard.set,
        rarity: scryfallCard.rarity,
        cardNumber: scryfallCard.collector_number,
        imageUrl: scryfallCard.image_uris?.large || scryfallCard.image_uris?.normal,
        description: scryfallCard.oracle_text,
        type: scryfallCard.type_line,
        cost: scryfallCard.mana_cost,
        power: scryfallCard.power,
        life: scryfallCard.toughness,
        attribute: scryfallCard.colors.join(', ') || 'Colorless',
        scryfall_id: scryfallCard.id,
        game: 'MAGIC_THE_GATHERING' as const
      },
      pricing: sellPrice ? {
        sellPrice,
        marketPrice,
        lowPrice,
        highPrice,
        condition: 'Near Mint',
        source: 'Scryfall',
        currency: 'USD'
      } : undefined
    }
  }
}

export const scryfallAPI = new ScryfallAPI()