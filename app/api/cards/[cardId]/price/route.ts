import { NextRequest, NextResponse } from 'next/server'
import { getCardWithPrice } from '@/lib/server-price-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const cardId = parseInt(params.cardId)
    
    if (isNaN(cardId)) {
      return NextResponse.json(
        { error: 'Invalid card ID' },
        { status: 400 }
      )
    }

    const cardWithPrice = await getCardWithPrice(cardId)
    
    if (!cardWithPrice) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(cardWithPrice)
  } catch (error) {
    console.error('Error fetching card with price:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}