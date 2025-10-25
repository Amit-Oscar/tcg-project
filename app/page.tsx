export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            TCG Card Price Tracker
          </h1>
          <p className="text-lg text-gray-600">
            Track your Trading Card Game collection with live pricing data
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-4">Welcome to Your TCG Project!</h2>
          <div className="space-y-4">
            <p className="text-gray-600">
              🎉 Your Next.js app with Prisma is set up successfully!
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">✅ What's Ready:</h3>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• Next.js 16 with TypeScript</li>
                <li>• Prisma ORM with SQLite database</li>
                <li>• Card pricing schema with historical tracking</li>
                <li>• Tailwind CSS for styling</li>
                <li>• API routes for price data</li>
                <li>• React components for card display</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">🚀 Next Steps:</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Run database migrations: <code className="bg-blue-100 px-1 rounded">npm run db:migrate</code></li>
                <li>• Seed with test data: <code className="bg-blue-100 px-1 rounded">npm run db:seed</code></li>
                <li>• Open Prisma Studio: <code className="bg-blue-100 px-1 rounded">npm run db:studio</code></li>
                <li>• Connect to real pricing APIs (One Piece, TCGPlayer, etc.)</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">📁 Key Files:</h3>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• <code>prisma/schema.prisma</code> - Database models</li>
                <li>• <code>lib/prisma.ts</code> - Database client</li>
                <li>• <code>lib/server-price-service.ts</code> - Price fetching logic</li>
                <li>• <code>app/api/cards/[cardId]/price/route.ts</code> - Price API</li>
                <li>• <code>components/CardPriceDisplay.tsx</code> - Card UI component</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
