import { prisma } from './prisma'

export interface PriceData {
  buyPrice?: number
  sellPrice: number
  marketPrice?: number
  condition: string
  source: string
  currency: string
  lastUpdated: Date
}

export interface CardWithPrice {
  id: number
  name: string
  set: string
  cardNumber: string
  currentPrice?: PriceData
  priceHistory?: PriceData[]
}

/**
 * Fetch live price for a specific card (server-side only)
 */
export async function fetchLivePrice(cardId: number): Promise<PriceData | null> {
  try {
    const card = await prisma.card.findUnique({
      where: { id: cardId }
    })

    if (!card) return null

    // Mock price data - replace with actual API calls
    const mockPrice: PriceData = {
      sellPrice: Math.floor(Math.random() * 5000) + 100, // Random price between $1-$50
      buyPrice: Math.floor(Math.random() * 3500) + 50, // Buy price lower
      condition: 'NM',
      source: 'mock-api',
      currency: 'USD',
      lastUpdated: new Date()
    }

    return mockPrice
  } catch (error) {
    console.error('Error fetching live price:', error)
    return null
  }
}

/**
 * Get card with current live price (server-side only)
 */
export async function getCardWithPrice(cardId: number): Promise<CardWithPrice | null> {
  try {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        prices: {
          orderBy: { createdAt: 'desc' },
          take: 10 // Last 10 price records
        }
      }
    })

    if (!card) return null

    // Get live price
    const livePrice = await fetchLivePrice(cardId)

    return {
      id: card.id,
      name: card.name,
      set: card.set,
      cardNumber: card.cardNumber,
      currentPrice: livePrice || undefined,
      priceHistory: card.prices.map(p => ({
        sellPrice: p.sellPrice,
        marketPrice: p.marketPrice || undefined,
        condition: p.condition,
        source: p.source,
        currency: p.currency,
        lastUpdated: p.createdAt
      }))
    }
  } catch (error) {
    console.error('Error getting card with price:', error)
    return null
  }
}

/**
 * Store price data in database for historical tracking (server-side only)
 */
export async function storePriceData(cardId: number, priceData: PriceData): Promise<void> {
  try {
    await prisma.cardPrice.create({
      data: {
        cardId,
        sellPrice: priceData.sellPrice,
        marketPrice: priceData.marketPrice,
        condition: priceData.condition,
        source: priceData.source,
        currency: priceData.currency
      }
    })
  } catch (error) {
    console.error('Error storing price data:', error)
  }
}

/**
 * Format price for display (can be used on both server and client)
 */
export function formatPrice(price: number, currency = 'USD'): string {
  const amount = price / 100 // Convert from cents to dollars
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

/**
 * Format buy/sell prices for display
 */
export function formatPriceRange(buyPrice: number | null, sellPrice: number, currency = 'USD'): string {
  const sell = formatPrice(sellPrice, currency)
  if (buyPrice) {
    const buy = formatPrice(buyPrice, currency)
    return `Buy: ${buy} | Sell: ${sell}`
  }
  return `Sell: ${sell}`
}