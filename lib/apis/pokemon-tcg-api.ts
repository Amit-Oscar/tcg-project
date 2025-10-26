/**
 * Pokemon TCG API Integration
 * Official API: https://pokemontcg.io/
 */

export interface PokemonCard {
  id: string
  name: string
  supertype: string
  subtypes: string[]
  hp?: string
  types?: string[]
  attacks?: Array<{
    name: string
    cost: string[]
    convertedEnergyCost: number
    damage: string
    text: string
  }>
  weaknesses?: Array<{
    type: string
    value: string
  }>
  resistances?: Array<{
    type: string
    value: string
  }>
  retreatCost?: string[]
  convertedRetreatCost?: number
  set: {
    id: string
    name: string
    series: string
    printedTotal: number
    total: number
    legalities: {
      unlimited?: string
      standard?: string
      expanded?: string
    }
    ptcgoCode?: string
    releaseDate: string
    updatedAt: string
    images: {
      symbol: string
      logo: string
    }
  }
  number: string
  artist?: string
  rarity: string
  flavorText?: string
  nationalPokedexNumbers?: number[]
  legalities: {
    unlimited?: string
    standard?: string
    expanded?: string
  }
  images: {
    small: string
    large: string
  }
  tcgplayer?: {
    url: string
    updatedAt: string
    prices?: {
      holofoil?: {
        low: number
        mid: number
        high: number
        market: number
        directLow?: number
      }
      reverseHolofoil?: {
        low: number
        mid: number
        high: number
        market: number
        directLow?: number
      }
      normal?: {
        low: number
        mid: number
        high: number
        market: number
        directLow?: number
      }
      '1stEditionHolofoil'?: {
        low: number
        mid: number
        high: number
        market: number
        directLow?: number
      }
      '1stEditionNormal'?: {
        low: number
        mid: number
        high: number
        market: number
        directLow?: number
      }
    }
  }
  cardmarket?: {
    url: string
    updatedAt: string
    prices: {
      averageSellPrice: number
      lowPrice: number
      trendPrice: number
      germanProLow: number
      suggestedPrice: number
      reverseHoloSell?: number
      reverseHoloLow?: number
      reverseHoloTrend?: number
      lowPriceExPlus: number
      avg1: number
      avg7: number
      avg30: number
      reverseHoloAvg1?: number
      reverseHoloAvg7?: number
      reverseHoloAvg30?: number
    }
  }
}

export interface PokemonAPIResponse {
  data: PokemonCard[]
  page: number
  pageSize: number
  count: number
  totalCount: number
}

export class PokemonTCGAPI {
  private baseUrl = 'https://api.pokemontcg.io/v2'
  private apiKey?: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey
  }

  private async makeRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (this.apiKey) {
      headers['X-Api-Key'] = this.apiKey
    }

    const response = await fetch(url.toString(), { headers })
    
    if (!response.ok) {
      throw new Error(`Pokemon TCG API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getAllCards(pageSize = 250): Promise<PokemonCard[]> {
    const allCards: PokemonCard[] = []
    let page = 1
    let hasMore = true

    console.log('🔄 Fetching all Pokemon cards from API...')

    while (hasMore) {
      try {
        const response = await this.makeRequest<PokemonAPIResponse>('/cards', {
          pageSize: pageSize.toString(),
          page: page.toString(),
          orderBy: 'set.releaseDate,number'
        })

        allCards.push(...response.data)
        console.log(`📦 Fetched page ${page}: ${response.data.length} cards (${allCards.length}/${response.totalCount} total)`)

        hasMore = response.data.length === pageSize && allCards.length < response.totalCount
        page++

        // Rate limiting - Pokemon TCG API allows 20,000 requests per hour
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay
        }
      } catch (error) {
        console.error(`❌ Error fetching page ${page}:`, error)
        hasMore = false
      }
    }

    console.log(`✅ Completed Pokemon card fetch: ${allCards.length} total cards`)
    return allCards
  }

  async getCardsBySet(setId: string): Promise<PokemonCard[]> {
    try {
      const response = await this.makeRequest<PokemonAPIResponse>('/cards', {
        q: `set.id:${setId}`,
        pageSize: '250',
        orderBy: 'number'
      })
      return response.data
    } catch (error) {
      console.error(`❌ Error fetching cards for set ${setId}:`, error)
      return []
    }
  }

  async searchCards(query: string): Promise<PokemonCard[]> {
    try {
      const response = await this.makeRequest<PokemonAPIResponse>('/cards', {
        q: query,
        pageSize: '250'
      })
      return response.data
    } catch (error) {
      console.error(`❌ Error searching Pokemon cards:`, error)
      return []
    }
  }

  async getSets() {
    try {
      const response = await this.makeRequest<{ data: any[] }>('/sets')
      return response.data
    } catch (error) {
      console.error(`❌ Error fetching Pokemon sets:`, error)
      return []
    }
  }

  // Convert Pokemon API card to our database format
  convertToCardImportData(pokemonCard: PokemonCard) {
    // Get the best available price
    let sellPrice: number | undefined
    let marketPrice: number | undefined
    let condition = 'Near Mint'
    let source = 'Pokemon TCG API'

    // Exchange rate USD to CAD (approximate)
    const USD_TO_CAD = 1.37

    if (pokemonCard.tcgplayer?.prices) {
      const prices = pokemonCard.tcgplayer.prices
      // Prefer holofoil, then normal, then any available
      const priceData = prices.holofoil || prices.normal || prices.reverseHolofoil || prices['1stEditionHolofoil'] || prices['1stEditionNormal']
      
      if (priceData) {
        sellPrice = (priceData.market || priceData.mid || priceData.high) * USD_TO_CAD
        marketPrice = (priceData.market || priceData.mid) * USD_TO_CAD
        source = 'TCGPlayer'
      }
    } else if (pokemonCard.cardmarket?.prices) {
      // Cardmarket prices are in EUR, convert to CAD
      const EUR_TO_CAD = 1.5
      sellPrice = pokemonCard.cardmarket.prices.averageSellPrice * EUR_TO_CAD
      marketPrice = pokemonCard.cardmarket.prices.trendPrice * EUR_TO_CAD
      source = 'Cardmarket (EUR→CAD)'
    }

    // Convert price ranges to CAD
    let lowPrice: number | undefined
    let highPrice: number | undefined
    
    if (pokemonCard.tcgplayer?.prices) {
      const prices = pokemonCard.tcgplayer.prices
      const priceData = prices.holofoil || prices.normal || prices.reverseHolofoil
      if (priceData) {
        lowPrice = priceData.low ? priceData.low * USD_TO_CAD : undefined
        highPrice = priceData.high ? priceData.high * USD_TO_CAD : undefined
      }
    }

    return {
      card: {
        name: pokemonCard.name,
        set: pokemonCard.set.name,
        setCode: pokemonCard.set.id,
        rarity: pokemonCard.rarity,
        cardNumber: pokemonCard.number,
        imageUrl: pokemonCard.images.large,
        description: pokemonCard.flavorText || pokemonCard.attacks?.[0]?.text,
        type: pokemonCard.types?.[0] || pokemonCard.supertype,
        cost: pokemonCard.convertedRetreatCost?.toString(),
        power: pokemonCard.hp,
        life: pokemonCard.convertedRetreatCost?.toString(),
        attribute: pokemonCard.subtypes?.join(', '),
        ptcgio_id: pokemonCard.id,
        game: 'POKEMON' as const
      },
      pricing: sellPrice ? {
        sellPrice,
        marketPrice,
        lowPrice,
        highPrice,
        condition,
        source,
        currency: 'CAD'
      } : undefined
    }
  }
}

export const pokemonAPI = new PokemonTCGAPI(process.env.POKEMON_TCG_API_KEY)