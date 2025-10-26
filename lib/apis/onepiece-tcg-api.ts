import { getTCGPlayerPricing, type TCGPlayerPricing } from './tcgplayer-pricing';

export interface OnePieceCard {
  id: string;
  name: string;
  set: string;
  setCode: string;
  rarity: string;
  color: string;
  type: string;
  cost: number;
  power: number;
  attribute?: string;
  effect?: string;
  images?: {
    small?: string;
    large?: string;
  };
}

export interface OnePieceCardPricing {
  sellPrice: number;
  marketPrice?: number;
  lowPrice?: number;
  highPrice?: number;
  condition: string;
  source: string;
  currency: string;
}

interface ApiTcgOnePieceCard {
  id: string;
  code: string;
  rarity: string;
  type: string;
  name: string;
  images: {
    small: string;
    large: string;
  };
  cost: number;
  attribute?: {
    name: string;
    image: string;
  };
  power: number;
  counter: string;
  color: string;
  family: string;
  ability: string;
  trigger: string;
  set: {
    name: string;
  };
  notes: string[];
}

interface ApiTcgResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: ApiTcgOnePieceCard[];
}

// Real One Piece card data using API TCG (with API key support)
export async function getOnePieceCards(page: number = 1, pageSize: number = 100): Promise<{
  data: OnePieceCard[];
  total: number;
  hasMore: boolean;
}> {
  try {
    // Check for API key in environment variables
    const apiKey = process.env.API_TCG_KEY;
    
    if (!apiKey) {
      console.warn('API_TCG_KEY not found in environment variables. Using fallback data...');
      return await getFallbackOnePieceCards(page, pageSize);
    }

    // API TCG uses 25 as default limit, we'll adjust accordingly
    const apiLimit = Math.min(pageSize, 100);
    const response = await fetch(`https://apitcg.com/api/one-piece/cards?page=${page}&limit=${apiLimit}`, {
      headers: {
        'x-api-key': apiKey
      }
    });
    
    if (!response.ok) {
      console.warn(`API TCG request failed: ${response.status}. Using fallback data...`);
      return await getFallbackOnePieceCards(page, pageSize);
    }

    const data: ApiTcgResponse = await response.json();

    const cards: OnePieceCard[] = data.data.map((card: ApiTcgOnePieceCard) => ({
      id: card.id,
      name: card.name,
      set: card.set?.name || 'Unknown Set',
      setCode: card.code.split('-')[0] || 'UNKNOWN', // Extract set code from card code like "OP03-070" -> "OP03"
      rarity: card.rarity,
      color: card.color,
      type: card.type,
      cost: card.cost || 0,
      power: card.power || 0,
      attribute: card.attribute?.name,
      effect: card.ability || undefined,
      images: {
        small: card.images?.small,
        large: card.images?.large || card.images?.small
      }
    }));

    return {
      data: cards,
      total: data.total,
      hasMore: data.page < data.totalPages
    };
  } catch (error) {
    console.error('Error fetching One Piece cards from API TCG:', error);
    return await getFallbackOnePieceCards(page, pageSize);
  }
}

// Fallback One Piece card data when API is not available - using real API from onepiece-cardgame.dev
async function getFallbackOnePieceCards(page: number = 1, pageSize: number = 100): Promise<{
  data: OnePieceCard[];
  total: number;
  hasMore: boolean;
}> {
  try {
    console.log('Fetching real One Piece cards from onepiece-cardgame.dev API...');
    
    // Fetch real card data from the working API
    const response = await fetch('https://onepiece-cardgame.dev/cards.json');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const apiCards: any[] = await response.json();
    console.log(`Fetched ${apiCards.length} real One Piece cards from API`);
    
    // Convert API format to our format
    const convertedCards: OnePieceCard[] = apiCards.map((apiCard): OnePieceCard => ({
      id: apiCard.cid || `OP-${Math.random().toString(36).substr(2, 9)}`,
      name: apiCard.n || 'Unknown Card',
      set: apiCard.srcN || 'Unknown Set',
      setCode: apiCard.cid ? apiCard.cid.split('-')[0] : 'OP01',
      rarity: getRarityFromCode(apiCard.r),
      color: getColorFromCode(apiCard.col),
      type: getTypeFromCode(apiCard.t),
      cost: parseInt(apiCard.cs) || 0,
      power: parseInt(apiCard.p) || 0,
      attribute: apiCard.tr || undefined,
      effect: apiCard.e || undefined,
      images: {
        small: apiCard.iu || `https://onepiece-cardgame.dev/images/cards/${apiCard.cid}_jp.jpg`,
        large: apiCard.iu || `https://onepiece-cardgame.dev/images/cards/${apiCard.cid}_jp.jpg`
      }
    }));
    
    // Calculate pagination
    const total = convertedCards.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const hasMore = end < total;
    
    return {
      data: convertedCards.slice(start, end),
      total,
      hasMore
    };
  } catch (error) {
    console.error('Failed to fetch real One Piece cards, falling back to generated data:', error);
    
    // If the real API fails, fall back to generated sample cards
    const sampleCards: OnePieceCard[] = generateSampleOnePieceCards(1000);
    
    const total = sampleCards.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const hasMore = end < total;
    
    return {
      data: sampleCards.slice(start, end),
      total,
      hasMore
    };
  }
}

// Helper functions to convert API codes to readable formats
function getRarityFromCode(rarityCode: string): string {
  switch (rarityCode) {
    case '1': return 'Leader';
    case '2': return 'Common';
    case '3': return 'Uncommon';
    case '4': return 'Rare';
    case '5': return 'Super Rare';
    case '6': return 'Secret Rare';
    case '7': return 'Special';
    case '8': return 'Parallel';
    default: return 'Common';
  }
}

function getColorFromCode(colorCode: string): string {
  switch (colorCode) {
    case '1': return 'Red';
    case '2': return 'Green';
    case '3': return 'Blue';
    case '4': return 'Purple';
    case '5': return 'Black';
    case '6': return 'White';
    case '7': return 'Yellow';
    case '8': return 'Pink';
    case '12': return 'Black';
    case '13': return 'Multi';
    case '16': return 'Yellow';
    case '21': return 'Pink';
    default: return 'Red';
  }
}

function getTypeFromCode(typeCode: string): string {
  switch (typeCode) {
    case '1': return 'Leader';
    case '2': return 'Character';
    case '3': return 'Event';
    case '4': return 'Stage';
    default: return 'Character';
  }
}

// Generate sample One Piece cards for fallback
function generateSampleOnePieceCards(count: number): OnePieceCard[] {
  const characters = [
    'Monkey.D.Luffy', 'Roronoa.Zoro', 'Nami', 'Usopp', 'Sanji', 'Tony Tony.Chopper', 'Nico.Robin', 'Franky', 'Brook', 'Jinbe',
    'Portgas.D.Ace', 'Sabo', 'Shanks', 'Dracule.Mihawk', 'Crocodile', 'Buggy', 'Alvida', 'Arlong', 'Don Krieg', 'Kuro',
    'Whitebeard', 'Marco', 'Blackbeard', 'Trafalgar.Law', 'Eustass.Kid', 'Killer', 'X.Drake', 'Basil.Hawkins', 'Capone.Bege',
    'Jewelry.Bonney', 'Urouge', 'Scratchmen.Apoo', 'Garp', 'Sengoku', 'Aokiji', 'Kizaru', 'Akainu', 'Smoker', 'Tashigi',
    'Koby', 'Helmeppo', 'Vivi', 'Karoo', 'Igaram', 'Pell', 'Chaka', 'Dalton', 'Dr.Kureha', 'Hiluluk', 'Wapol',
    'Gan.Fall', 'Wyper', 'Enel', 'Ohm', 'Satori', 'Gedatsu', 'Shura', 'Tom', 'Iceburg', 'Franky', 'Paulie',
    'Lucci', 'Kaku', 'Kalifa', 'Jabra', 'Kumadori', 'Fukurou', 'Spandam', 'Moria', 'Perona', 'Absalom', 'Ryuma',
    'Rayleigh', 'Shakky', 'Camie', 'Pappag', 'Hatchan', 'Duval', 'Hancock', 'Marigold', 'Sandersonia', 'Marguerite',
    'Ivankov', 'Inazuma', 'Bentham', 'Daz.Bones', 'Miss.Doublefinger', 'Miss.Merry.Christmas', 'Miss.Goldenweek'
  ];
  
  const sets = [
    { name: 'Romance Dawn', code: 'OP01', maxCards: 120 },
    { name: 'Paramount War', code: 'OP02', maxCards: 114 },
    { name: 'Pillars of Strength', code: 'OP03', maxCards: 120 },
    { name: 'Kingdoms of Intrigue', code: 'OP04', maxCards: 119 },
    { name: 'Awakening of the New Era', code: 'OP05', maxCards: 120 },
    { name: 'Wings of the Captain', code: 'OP06', maxCards: 120 },
    { name: 'Starter Deck Straw Hat Crew', code: 'ST01', maxCards: 17 },
    { name: 'Starter Deck Seven Warlords of the Sea', code: 'ST02', maxCards: 17 }
  ];
  
  const rarities = ['C', 'UC', 'R', 'SR', 'SEC', 'L', 'SP'];
  const colors = ['Red', 'Blue', 'Purple', 'Green', 'Yellow', 'Black'];
  const types = ['Character', 'Event', 'Stage', 'Leader'];
  const attributes = ['Straw Hat Crew', 'Whitebeard Pirates', 'Red Hair Pirates', 'Animal Kingdom Pirates', 'Big Mom Pirates', 'Revolutionary Army', 'Marine'];

  const cards: OnePieceCard[] = [];
  let cardIndex = 0;
  
  // Generate cards more realistically based on actual set sizes
  for (const set of sets) {
    for (let cardNum = 1; cardNum <= Math.min(set.maxCards, Math.ceil(count / sets.length)); cardNum++) {
      if (cardIndex >= count) break;
      
      const character = characters[cardIndex % characters.length];
      const cardNumber = String(cardNum).padStart(3, '0');
      const id = `${set.code}-${cardNumber}`;
      
      cards.push({
        id,
        name: character,
        set: set.name,
        setCode: set.code,
        rarity: rarities[Math.floor(Math.random() * rarities.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        type: types[Math.floor(Math.random() * types.length)],
        cost: Math.floor(Math.random() * 10) + 1,
        power: Math.floor(Math.random() * 8000) + 2000,
        attribute: attributes[Math.floor(Math.random() * attributes.length)],
        effect: `[On Play] ${character} special effect that activates when this card enters play.`,
        images: {
          // Use realistic One Piece card images based on actual card patterns
          small: `https://en.onepiece-cardgame.com/images/cardlist/card/${id}.png`,
          large: `https://en.onepiece-cardgame.com/images/cardlist/card/${id}.png`
        }
      });
      
      cardIndex++;
    }
    if (cardIndex >= count) break;
  }

  return cards;
}

// TCGPlayer API integration for One Piece card pricing
export async function getOnePieceCardPricing(cardName: string, setName: string): Promise<OnePieceCardPricing> {
  try {
    // Use the centralized TCGPlayer pricing service
    const tcgPricing = await getTCGPlayerPricing(cardName, setName, 'ONEPIECE');
    
    // Convert USD pricing to CAD
    const USD_TO_CAD = 1.37;
    
    return {
      sellPrice: tcgPricing.sellPrice * USD_TO_CAD,
      marketPrice: tcgPricing.marketPrice ? tcgPricing.marketPrice * USD_TO_CAD : undefined,
      lowPrice: tcgPricing.lowPrice ? tcgPricing.lowPrice * USD_TO_CAD : undefined,
      highPrice: tcgPricing.highPrice ? tcgPricing.highPrice * USD_TO_CAD : undefined,
      condition: tcgPricing.condition,
      source: tcgPricing.source,
      currency: 'CAD'
    };
    
  } catch (error) {
    console.error('Error fetching One Piece pricing:', error);
    return getFallbackPricing(cardName);
  }
}

// Fallback pricing for when APIs are unavailable
function getFallbackPricing(cardName: string): OnePieceCardPricing {
  // Convert fallback USD pricing to CAD
  const USD_TO_CAD = 1.37;
  
  return {
    sellPrice: 1.99 * USD_TO_CAD,
    marketPrice: 1.99 * USD_TO_CAD,
    lowPrice: 0.99 * USD_TO_CAD,
    highPrice: 3.99 * USD_TO_CAD,
    condition: 'NM',
    source: 'fallback',
    currency: 'CAD'
  };
}

// Function to validate and fix One Piece image URLs
async function getValidOnePieceImageUrl(card: OnePieceCard, validateAsync: boolean = false): Promise<string> {
  // Try to use the API provided images first
  if (card.images?.large && isValidImageUrl(card.images.large)) {
    if (!validateAsync) {
      // For non-async validation, trust the URL format
      return card.images.large;
    } else if (await testImageUrl(card.images.large)) {
      return card.images.large;
    }
  }
  
  if (card.images?.small && isValidImageUrl(card.images.small)) {
    if (!validateAsync) {
      // For non-async validation, trust the URL format
      return card.images.small;
    } else if (await testImageUrl(card.images.small)) {
      return card.images.small;
    }
  }
  
  // If no valid API image, try different URL patterns for One Piece cards
  const cardId = card.id;
  const setCode = card.setCode || 'OP01';
  
  // Try different image URL patterns that commonly work for One Piece
  const possibleUrls = [
    // Official One Piece TCG website patterns (most reliable)
    `https://en.onepiece-cardgame.com/images/cardlist/card/${cardId}.png`,
    `https://onepiece-cardgame.com/images/cardlist/card/${cardId}.png`,
    `https://en.onepiece-cardgame.com/images/cardlist/card/${cardId}.jpg`,
    // Alternative API patterns
    `https://api.onepiece-cardgame.com/images/cards/${cardId}.png`,
    `https://onepiece-cardgame.dev/images/${setCode}/${cardId}.png`,
    // TCG API patterns
    `https://apitcg.com/api/one-piece/images/${cardId}`,
  ];
  
  // If async validation is enabled, test each URL
  if (validateAsync) {
    for (const url of possibleUrls) {
      if (await testImageUrl(url)) {
        return url;
      }
    }
  } else {
    // For non-async, return the most reliable URL format
    return possibleUrls[0];
  }
  
  // Return the most reliable URL (official One Piece TCG) or placeholder as last resort
  const primaryUrl = possibleUrls[0];
  
  // For cards with invalid IDs, use placeholder
  if (!cardId || cardId === 'undefined' || !cardId.match(/^[A-Z0-9-]+$/)) {
    return `https://via.placeholder.com/400x560/1e40af/ffffff?text=${encodeURIComponent(card.name)}+${setCode}`;
  }
  
  return primaryUrl;
}

// Async function to test if an image URL is accessible
async function testImageUrl(url: string): Promise<boolean> {
  try {
    // Make a HEAD request to check if the image exists without downloading it
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'TCG-App/1.0'
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    // Check if response is successful and content type is an image
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      return contentType ? contentType.startsWith('image/') : true;
    }
    
    return false;
  } catch (error) {
    // If there's an error (network, timeout, etc.), consider the URL invalid
    return false;
  }
}

// Simple validation for image URLs (synchronous version for basic checks)
function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  // Check if it's a valid URL format
  try {
    new URL(url);
  } catch {
    return false;
  }
  
  // Skip validation for placeholder URLs (they're always valid)
  if (url.includes('placeholder.com')) {
    return true;
  }
  
  // Check if it looks like an image URL
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
  const hasImageExtension = imageExtensions.some(ext => 
    url.toLowerCase().includes(ext)
  );
  
  // Also allow URLs that might be API endpoints returning images
  const isApiEndpoint = url.includes('/api/') || url.includes('/images/');
  
  return hasImageExtension || isApiEndpoint;
}
// Helper function to convert One Piece card to database format
export async function onePieceCardToCard(card: OnePieceCard, validateImages: boolean = false): Promise<any> {
  // Get real pricing data
  const pricing = await getOnePieceCardPricing(card.name, card.set);
  
  // Get a validated image URL (disable async validation for faster processing)
  const imageUrl = await getValidOnePieceImageUrl(card, false);
  
  return {
    id: card.id,
    name: card.name,
    set: card.set,
    setCode: card.setCode,
    rarity: card.rarity,
    types: [card.type],
    colors: [card.color],
    convertedManaCost: card.cost,
    manaCost: card.cost.toString(),
    oracleText: card.effect || '',
    power: card.power?.toString(),
    toughness: '', // One Piece doesn't have toughness
    loyalty: '', // One Piece doesn't have loyalty
    imageUrl: imageUrl,
    cardFaces: [], // One Piece cards don't have faces
    legalities: {}, // We'll handle this separately
    prices: pricing,
    game: 'ONEPIECE' as const
  };
}

// Utility function to validate and fix existing One Piece image URLs in the database
export async function validateOnePieceImages(): Promise<void> {
  const { prisma } = await import('../prisma');
  
  console.log('🔍 Validating One Piece card images...');
  
  const onePieceCards = await prisma.card.findMany({
    where: { game: 'ONE_PIECE' },
    select: {
      id: true,
      name: true,
      cardNumber: true,
      imageUrl: true,
      set: true,
      setCode: true
    }
  });
  
  console.log(`📦 Found ${onePieceCards.length} One Piece cards to validate`);
  
  let fixedCount = 0;
  let invalidCount = 0;
  
  for (const card of onePieceCards) {
    try {
      if (!card.imageUrl || card.imageUrl === '') {
        console.log(`❌ Missing image for ${card.name} (${card.cardNumber})`);
        invalidCount++;
        continue;
      }
      
      // Test if the current image URL is accessible
      const isValid = await testImageUrl(card.imageUrl);
      
      if (!isValid) {
        console.log(`🔧 Fixing broken image for ${card.name} (${card.cardNumber})`);
        
        // Create a mock OnePieceCard object to generate a new URL
        const mockCard: OnePieceCard = {
          id: card.cardNumber,
          name: card.name,
          set: card.set,
          setCode: card.setCode || 'OP01',
          rarity: 'C', // Default rarity
          color: 'Red', // Default color
          type: 'Character', // Default type
          cost: 1,
          power: 1000,
          images: { small: card.imageUrl, large: card.imageUrl }
        };
        
        const newImageUrl = await getValidOnePieceImageUrl(mockCard, true);
        
        if (newImageUrl !== card.imageUrl) {
          await prisma.card.update({
            where: { id: card.id },
            data: { imageUrl: newImageUrl }
          });
          
          console.log(`✅ Fixed image for ${card.name}: ${newImageUrl}`);
          fixedCount++;
        } else {
          invalidCount++;
        }
      }
    } catch (error) {
      console.error(`❌ Error validating ${card.name}:`, error);
      invalidCount++;
    }
  }
  
  console.log(`\n🎉 Image validation complete!`);
  console.log(`✅ Fixed: ${fixedCount} cards`);
  console.log(`❌ Invalid: ${invalidCount} cards`);
  console.log(`📦 Total: ${onePieceCards.length} cards`);
}

// Search function for One Piece cards
export async function searchOnePieceCards(query: string, limit: number = 20): Promise<OnePieceCard[]> {
  try {
    const apiKey = process.env.API_TCG_KEY;
    
    if (!apiKey) {
      console.warn('API_TCG_KEY not found. Using fallback search...');
      return searchFallbackOnePieceCards(query, limit);
    }

    // Search by name using the API
    const response = await fetch(`https://apitcg.com/api/one-piece/cards?name=${encodeURIComponent(query)}&limit=${limit}`, {
      headers: {
        'x-api-key': apiKey
      }
    });
    
    if (!response.ok) {
      console.warn(`Search request failed: ${response.status}. Using fallback search...`);
      return searchFallbackOnePieceCards(query, limit);
    }

    const data: ApiTcgResponse = await response.json();

    return data.data.map((card: ApiTcgOnePieceCard) => ({
      id: card.id,
      name: card.name,
      set: card.set?.name || 'Unknown Set',
      setCode: card.code.split('-')[0] || 'UNKNOWN',
      rarity: card.rarity,
      color: card.color,
      type: card.type,
      cost: card.cost || 0,
      power: card.power || 0,
      attribute: card.attribute?.name,
      effect: card.ability || undefined,
      images: {
        small: card.images?.small,
        large: card.images?.large || card.images?.small
      }
    }));
  } catch (error) {
    console.error('Error searching One Piece cards:', error);
    return searchFallbackOnePieceCards(query, limit);
  }
}

// Fallback search for One Piece cards
function searchFallbackOnePieceCards(query: string, limit: number = 20): OnePieceCard[] {
  const allCards = generateSampleOnePieceCards(1000);
  const lowercaseQuery = query.toLowerCase();
  
  return allCards
    .filter(card => 
      card.name.toLowerCase().includes(lowercaseQuery) ||
      card.set.toLowerCase().includes(lowercaseQuery) ||
      card.type.toLowerCase().includes(lowercaseQuery) ||
      card.rarity.toLowerCase().includes(lowercaseQuery) ||
      card.color.toLowerCase().includes(lowercaseQuery) ||
      (card.effect && card.effect.toLowerCase().includes(lowercaseQuery)) ||
      (card.attribute && card.attribute.toLowerCase().includes(lowercaseQuery))
    )
    .slice(0, limit);
}