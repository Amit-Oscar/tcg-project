'use client'

import { useState, useEffect } from 'react'

interface PriceData {
  price: number
  condition: string
  source: string
  currency: string
  lastUpdated: Date
}

interface CardWithPrice {
  id: number
  name: string
  set: string
  cardNumber: string
  currentPrice?: PriceData
  priceHistory?: PriceData[]
}

interface CardPriceDisplayProps {
  cardId: number
}

// Client-side price formatting function
function formatPrice(price: number, currency = 'USD'): string {
  const amount = price / 100 // Convert from cents to dollars
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

export default function CardPriceDisplay({ cardId }: CardPriceDisplayProps) {
  const [cardData, setCardData] = useState<CardWithPrice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCardPrice() {
      try {
        const response = await fetch(`/api/cards/${cardId}/price`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch card price')
        }

        const data = await response.json()
        setCardData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchCardPrice()
  }, [cardId])

  if (loading) {
    return (
      <div className="p-4 border rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-600">Error: {error}</p>
      </div>
    )
  }

  if (!cardData) {
    return (
      <div className="p-4 border rounded-lg">
        <p className="text-gray-500">Card not found</p>
      </div>
    )
  }

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">{cardData.name}</h3>
          <p className="text-sm text-gray-600">
            {cardData.set} #{cardData.cardNumber}
          </p>
        </div>
        
        {cardData.currentPrice && (
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(cardData.currentPrice.price, cardData.currentPrice.currency)}
            </div>
            <div className="text-xs text-gray-500">
              {cardData.currentPrice.condition} • {cardData.currentPrice.source}
            </div>
            <div className="text-xs text-gray-400">
              Updated: {new Date(cardData.currentPrice.lastUpdated).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {cardData.priceHistory && cardData.priceHistory.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Price History</h4>
          <div className="space-y-1">
            {cardData.priceHistory.slice(0, 5).map((price, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-500">
                  {new Date(price.lastUpdated).toLocaleDateString()}
                </span>
                <span className="font-medium">
                  {formatPrice(price.price, price.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}