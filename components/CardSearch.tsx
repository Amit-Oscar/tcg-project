'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SearchFilters } from '@/app/api/search/route'

interface CardResult {
  id: number
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
  game: string
  currentPrice?: {
    buyPrice?: number
    sellPrice: number
    marketPrice?: number
    condition: string
    source: string
    currency: string
    updatedAt: string
  }
}

interface SearchResults {
  cards: CardResult[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    applied: SearchFilters
    available: {
      games: string[]
      sets: string[]
      rarities: string[]
      types: string[]
    }
  }
}

export default function CardSearch() {
  const router = useRouter()
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    game: 'ALL',
    set: '',
    rarity: '',
    type: '',
    minPrice: undefined,
    maxPrice: undefined,
    condition: '',
    sort: 'name',
    page: 1,
    limit: 20
  })

  const searchCards = async (newFilters: SearchFilters = filters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== 'ALL') {
          params.append(key === 'query' ? 'q' : key, value.toString())
        }
      })

      const response = await fetch(`/api/search?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initial search
  useEffect(() => {
    searchCards()
  }, [])

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 }
    setFilters(newFilters)
    searchCards(newFilters)
  }

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page }
    setFilters(newFilters)
    searchCards(newFilters)
  }

  const formatPrice = (price: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(price)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          TCG Card Search
        </h1>
        <p className="text-gray-600">
          Search across One Piece, Pokemon, and Magic: The Gathering cards with live pricing
        </p>
      </div>

      {/* Search Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search Query */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.query || ''}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              placeholder="Card name, type, description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Game Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Game
            </label>
            <select
              value={filters.game || 'ALL'}
              onChange={(e) => handleFilterChange('game', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Games</option>
              <option value="ONE_PIECE">One Piece</option>
              <option value="POKEMON">Pokemon</option>
              <option value="MAGIC_THE_GATHERING">Magic: The Gathering</option>
            </select>
          </div>

          {/* Set Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Set
            </label>
            <select
              value={filters.set || ''}
              onChange={(e) => handleFilterChange('set', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sets</option>
              {results?.filters.available.sets.map(set => (
                <option key={set} value={set}>{set}</option>
              ))}
            </select>
          </div>

          {/* Rarity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rarity
            </label>
            <select
              value={filters.rarity || ''}
              onChange={(e) => handleFilterChange('rarity', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Rarities</option>
              {results?.filters.available.rarities.map(rarity => (
                <option key={rarity} value={rarity}>{rarity}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Price ($)
            </label>
            <input
              type="number"
              value={filters.minPrice || ''}
              onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="0.00"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Price ($)
            </label>
            <input
              type="number"
              value={filters.maxPrice || ''}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="1000.00"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={filters.sort || 'name'}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Name</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="set">Set</option>
              <option value="rarity">Rarity</option>
            </select>
          </div>

          {/* Results per page */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Results per page
            </label>
            <select
              value={filters.limit || 20}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Searching cards...</p>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <p className="text-gray-600">
              Showing {results.cards.length} of {results.pagination.total} cards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.cards.map((card) => (
              <div key={card.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                {card.imageUrl && (
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{card.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {card.set} • {card.rarity}
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    {card.game.replace('_', ' ')} • #{card.cardNumber}
                  </p>
                  
                  {card.description && (
                    <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                      {card.description}
                    </p>
                  )}

                  {card.currentPrice && (
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Sell Price:</span>
                        <span className="font-semibold text-green-600">
                          {formatPrice(card.currentPrice.sellPrice, card.currentPrice.currency)}
                        </span>
                      </div>
                      {card.currentPrice.buyPrice && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Buy Price:</span>
                          <span className="font-semibold text-blue-600">
                            {formatPrice(card.currentPrice.buyPrice, card.currentPrice.currency)}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {card.currentPrice.condition} • {card.currentPrice.source}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {results.pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(results.pagination.page - 1)}
                  disabled={results.pagination.page === 1}
                  className="px-3 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {[...Array(Math.min(5, results.pagination.totalPages))].map((_, i) => {
                  const page = i + 1
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        page === results.pagination.page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => handlePageChange(results.pagination.page + 1)}
                  disabled={results.pagination.page === results.pagination.totalPages}
                  className="px-3 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}

      {/* No Results */}
      {results && !loading && results.cards.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No cards found matching your search criteria.</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  )
}