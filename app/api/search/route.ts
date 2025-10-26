import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface SearchFilters {
  query?: string
  game?: 'ONE_PIECE' | 'POKEMON' | 'MAGIC_THE_GATHERING' | 'ALL'
  set?: string
  rarity?: string
  type?: string
  minPrice?: number
  maxPrice?: number
  condition?: string
  sort?: 'name' | 'price_asc' | 'price_desc' | 'set' | 'rarity'
  page?: number
  limit?: number
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const filters: SearchFilters = {
      query: searchParams.get('q') || undefined,
      game: (searchParams.get('game') as any) || 'ALL',
      set: searchParams.get('set') || undefined,
      rarity: searchParams.get('rarity') || undefined,
      type: searchParams.get('type') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      condition: searchParams.get('condition') || undefined,
      sort: (searchParams.get('sort') as any) || 'name',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    }

    // Build where clause
    const where: any = {}
    
    // Text search
    if (filters.query) {
      where.OR = [
        { name: { contains: filters.query } },
        { description: { contains: filters.query } },
        { type: { contains: filters.query } },
        { set: { contains: filters.query } }
      ]
    }

    // Game filter
    if (filters.game && filters.game !== 'ALL') {
      where.game = filters.game
    }

    // Set filter
    if (filters.set) {
      where.set = { contains: filters.set }
    }

    // Rarity filter
    if (filters.rarity) {
      where.rarity = { contains: filters.rarity }
    }

    // Type filter
    if (filters.type) {
      where.type = { contains: filters.type }
    }

    // Build price filter
    const priceFilter: any = {}
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined || filters.condition) {
      if (filters.minPrice !== undefined) {
        priceFilter.sellPrice = { gte: filters.minPrice }
      }
      if (filters.maxPrice !== undefined) {
        priceFilter.sellPrice = { 
          ...priceFilter.sellPrice, 
          lte: filters.maxPrice 
        }
      }
      if (filters.condition) {
        priceFilter.condition = { contains: filters.condition }
      }
    }

    // Build order by
    let orderBy: any = { name: 'asc' }
    switch (filters.sort) {
      case 'price_asc':
        orderBy = { prices: { _count: 'desc' } } // Cards with prices first, then by latest price
        break
      case 'price_desc':
        orderBy = { prices: { _count: 'desc' } }
        break
      case 'set':
        orderBy = [{ set: 'asc' }, { cardNumber: 'asc' }]
        break
      case 'rarity':
        orderBy = { rarity: 'asc' }
        break
      default:
        orderBy = { name: 'asc' }
    }

    // Calculate pagination
    const skip = ((filters.page || 1) - 1) * (filters.limit || 20)

    // Execute search
    const [cards, totalCount] = await Promise.all([
      prisma.card.findMany({
        where,
        include: {
          prices: {
            where: Object.keys(priceFilter).length > 0 ? priceFilter : undefined,
            orderBy: { createdAt: 'desc' },
            take: 1 // Get latest price
          }
        },
        orderBy,
        skip,
        take: filters.limit || 20
      }),
      prisma.card.count({ where })
    ])

    // Filter cards that have prices if price filters are applied
    let filteredCards = cards
    if (Object.keys(priceFilter).length > 0) {
      filteredCards = cards.filter(card => card.prices.length > 0)
    }

    // Format response
    const formattedCards = filteredCards.map(card => ({
      id: card.id,
      name: card.name,
      set: card.set,
      setCode: card.setCode,
      rarity: card.rarity,
      cardNumber: card.cardNumber,
      imageUrl: card.imageUrl,
      description: card.description,
      type: card.type,
      cost: card.cost,
      power: card.power,
      life: card.life,
      attribute: card.attribute,
      game: card.game,
      currentPrice: card.prices[0] ? {
        sellPrice: card.prices[0].sellPrice,
        marketPrice: card.prices[0].marketPrice,
        condition: card.prices[0].condition,
        source: card.prices[0].source,
        currency: card.prices[0].currency,
        updatedAt: card.prices[0].updatedAt
      } : null
    }))

    return NextResponse.json({
      cards: formattedCards,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total: totalCount,
        totalPages: Math.ceil(totalCount / (filters.limit || 20))
      },
      filters: {
        applied: filters,
        available: {
          games: ['ONE_PIECE', 'POKEMON', 'MAGIC_THE_GATHERING'],
          sets: await prisma.card.findMany({
            select: { set: true },
            distinct: ['set'],
            orderBy: { set: 'asc' }
          }).then(sets => sets.map(s => s.set)),
          rarities: await prisma.card.findMany({
            select: { rarity: true },
            distinct: ['rarity'],
            orderBy: { rarity: 'asc' }
          }).then(rarities => rarities.map(r => r.rarity)),
          types: await prisma.card.findMany({
            select: { type: true },
            distinct: ['type'],
            where: { type: { not: null } },
            orderBy: { type: 'asc' }
          }).then(types => types.map(t => t.type))
        }
      }
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}