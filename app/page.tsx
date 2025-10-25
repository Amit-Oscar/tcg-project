import Link from 'next/link'
import { prisma } from '../lib/prisma'

async function getDbStats() {
  try {
    const totalCards = await prisma.card.count()
    const cardsByGame = await prisma.card.groupBy({
      by: ['game'],
      _count: { game: true }
    })
    const totalPrices = await prisma.cardPrice.count()
    const latestImport = await prisma.dataImport.findFirst({
      orderBy: { createdAt: 'desc' },
      where: { status: 'COMPLETED' }
    })
    
    return {
      totalCards,
      cardsByGame,
      totalPrices,
      latestImport
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    return {
      totalCards: 0,
      cardsByGame: [],
      totalPrices: 0,
      latestImport: null
    }
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function Home() {
  const stats = await getDbStats()
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            TCG Card Price Tracker
          </h1>
          <p className="text-lg text-gray-600">
            Search and track pricing for One Piece, Pokemon, and Magic: The Gathering cards
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalCards}</div>
            <div className="text-gray-600">Total Cards</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.totalPrices}</div>
            <div className="text-gray-600">Price Records</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.cardsByGame.length}</div>
            <div className="text-gray-600">TCG Games</div>
          </div>
        </div>

        {/* Game Statistics */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Cards by Game</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.cardsByGame.map((game) => (
              <div key={game.game} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">
                    {game.game === 'ONE_PIECE' && '🏴‍☠️'}
                    {game.game === 'POKEMON' && '⚡'}
                    {game.game === 'MAGIC_THE_GATHERING' && '🔮'}
                  </span>
                  <span className="font-medium">
                    {game.game.replace('_', ' ').replace('MAGIC THE GATHERING', 'Magic: The Gathering')}
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-900">{game._count.game}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Get Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link 
              href="/search" 
              className="block p-6 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              <h3 className="text-xl font-semibold text-blue-800 mb-2">🔍 Search Cards</h3>
              <p className="text-blue-600">
                Search through your card collection with advanced filters for game, set, rarity, and price range.
              </p>
            </Link>
            <div className="p-6 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-xl font-semibold text-green-800 mb-2">💰 Live Pricing</h3>
              <p className="text-green-600">
                View both buying and selling prices with historical tracking and market trends.
              </p>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-4">System Status</h2>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">✅ System Ready</h3>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• Next.js 16 with TypeScript and Turbopack</li>
                <li>• Prisma ORM with enhanced search capabilities</li>
                <li>• Multi-TCG support (One Piece, Pokemon, MTG)</li>
                <li>• Buy/Sell price tracking with historical data</li>
                <li>• Advanced search with filters and pagination</li>
              </ul>
            </div>

            {stats.latestImport && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">� Latest Import</h3>
                <p className="text-blue-700 text-sm">
                  {stats.latestImport.game.replace('_', ' ')} cards imported from {stats.latestImport.source} 
                  <span className="text-gray-600 ml-2">
                    ({new Date(stats.latestImport.createdAt).toLocaleDateString()})
                  </span>
                </p>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">� Next Features</h3>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• CSV export/import functionality</li>
                <li>• Real-time API integrations</li>
                <li>• Automated price updates</li>
                <li>• Collection management</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
