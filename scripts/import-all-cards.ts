import { TCGDataImporter } from '../lib/tcg-importer';
import { pokemonAPI } from '../lib/apis/pokemon-tcg-api';
import { scryfallAPI } from '../lib/apis/scryfall-api';
import { getOnePieceCards, onePieceCardToCard, OnePieceCard } from '../lib/apis/onepiece-tcg-api';

class FullTCGImporter {
  private importedCounts = {
    onepiece: 0,
    pokemon: 0,
    magic: 0
  };
  
  private tcgImporter = new TCGDataImporter();

  async importAllCards() {
    console.log('🚀 Starting TCG DATABASE IMPORT (200 cards per game)...');
    console.log('📊 This will import ~600 cards total for testing!');
    console.log('');

    const startTime = Date.now();

    try {
      // Import One Piece cards first (smallest dataset)
      await this.importOnePieceCards();
      
      // Import Pokemon cards (medium dataset)
      await this.importPokemonCards();
      
      // Import Magic cards (largest dataset - we'll limit to 200)
      await this.importMagicCards();

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      console.log('');
      console.log('🎉 IMPORT COMPLETED!');
      console.log('📊 Import Summary:');
      console.log(`   📦 One Piece: ${this.importedCounts.onepiece} cards`);
      console.log(`   ⚡ Pokemon: ${this.importedCounts.pokemon} cards`);
      console.log(`   🔮 Magic: ${this.importedCounts.magic} cards`);
      console.log(`   ⏱️  Total time: ${duration.toFixed(1)} seconds`);
      console.log(`   💾 Total cards: ${this.importedCounts.onepiece + this.importedCounts.pokemon + this.importedCounts.magic}`);

    } catch (error) {
      console.error('❌ Error during import:', error);
      throw error;
    }
  }

  private async importOnePieceCards() {
    console.log('🏴‍☠️ Importing One Piece cards (limit 200)...');
    
    try {
      // Get One Piece cards with pagination
      let allCards: OnePieceCard[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore && allCards.length < 200) {
        const result = await getOnePieceCards(page, 100);
        allCards.push(...result.data);
        hasMore = result.hasMore;
        page++;
        
        if (hasMore && allCards.length < 200) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
        }
      }
      
      const limitedCards = allCards.slice(0, 200); // Limit to 200 cards
      console.log(`📦 Retrieved ${limitedCards.length} One Piece cards`);
      
      // Process cards with pricing in batches to handle async pricing
      const cardsWithPricing = [];
      const batchSize = 20; // Process in smaller batches for pricing API
      
      for (let i = 0; i < limitedCards.length; i += batchSize) {
        const batch = limitedCards.slice(i, i + batchSize);
        console.log(`📦 Processing One Piece pricing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(limitedCards.length/batchSize)}...`);
        
        const batchWithPricing = await Promise.all(
          batch.map(async (card: OnePieceCard) => {
            const converted = await onePieceCardToCard(card);
            return {
              card: {
                name: converted.name,
                set: converted.set,
                setCode: converted.setCode,
                rarity: converted.rarity,
                cardNumber: converted.id,
                imageUrl: converted.imageUrl,
                description: converted.oracleText,
                type: converted.types?.[0] || 'Character',
                cost: converted.manaCost,
                power: converted.power,
                life: '', // One Piece doesn't have life
                attribute: card.attribute,
                optcg_id: converted.id,
                game: 'ONE_PIECE' as const
              },
              pricing: converted.prices
            };
          })
        );
        
        cardsWithPricing.push(...batchWithPricing);
        
        // Small delay between batches to respect rate limits
        if (i + batchSize < limitedCards.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      await this.tcgImporter.importCardsWithPricing(cardsWithPricing);
      
      this.importedCounts.onepiece = limitedCards.length;
      console.log(`✅ Imported ${limitedCards.length} One Piece cards`);
    } catch (error) {
      console.error('❌ Error importing One Piece cards:', error);
      throw error;
    }
  }

  private async importPokemonCards() {
    console.log('⚡ Importing Pokemon cards (limit 200)...');
    console.log('📡 Fetching from Pokemon TCG API...');
    
    try {
      // Get first 200 Pokemon cards from first few pages
      const allCards: any[] = [];
      let page = 1;
      const pageSize = 100; // Smaller page size for better control
      
      while (allCards.length < 200) {
        try {
          console.log(`📦 Fetching Pokemon page ${page}...`);
          const response = await fetch(`https://api.pokemontcg.io/v2/cards?pageSize=${pageSize}&page=${page}`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          allCards.push(...data.data);
          
          if (data.data.length < pageSize || allCards.length >= 200) {
            break; // No more cards or we have enough
          }
          
          page++;
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`❌ Error fetching Pokemon page ${page}:`, error);
          break;
        }
      }
      
      const limitedCards = allCards.slice(0, 200); // Limit to exactly 200 cards
      console.log(`📦 Retrieved ${limitedCards.length} Pokemon cards`);
      
      // Process in smaller batches
      const batchSize = 50;
      let importedCount = 0;
      
      for (let i = 0; i < limitedCards.length; i += batchSize) {
        const batch = limitedCards.slice(i, i + batchSize);
        const cardsWithPricing = batch.map(card => pokemonAPI.convertToCardImportData(card));
        
        console.log(`📦 Importing Pokemon batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(limitedCards.length/batchSize)} (${batch.length} cards)...`);
        await this.tcgImporter.importCardsWithPricing(cardsWithPricing);
        
        importedCount += batch.length;
        
        // Small delay between batches
        if (i + batchSize < limitedCards.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      this.importedCounts.pokemon = importedCount;
      console.log(`✅ Imported ${importedCount} Pokemon cards`);
    } catch (error) {
      console.error('❌ Error importing Pokemon cards:', error);
      throw error;
    }
  }

  private async importMagicCards() {
    console.log('🔮 Importing Magic: The Gathering cards (limit 200)...');
    console.log('📡 Fetching from Scryfall API...');
    
    try {
      // Get cards from a few popular sets and limit to 200 total
      const popularSets = ['lea', 'dom', 'war']; // Just 3 sets to start
      let totalImported = 0;
      const targetLimit = 200;

      for (const setCode of popularSets) {
        if (totalImported >= targetLimit) break;
        
        try {
          console.log(`📦 Importing Magic set: ${setCode}...`);
          const cards = await scryfallAPI.getCardsBySet(setCode);
          
          // Calculate how many cards we can take from this set
          const remainingSlots = targetLimit - totalImported;
          const cardsToTake = Math.min(cards.length, remainingSlots);
          const limitedCards = cards.slice(0, cardsToTake);
          
          console.log(`   Retrieved ${limitedCards.length} cards from ${setCode} (${cards.length} available)`);
          
          if (limitedCards.length > 0) {
            const cardsWithPricing = limitedCards.map(card => scryfallAPI.convertToCardImportData(card));
            await this.tcgImporter.importCardsWithPricing(cardsWithPricing);
            totalImported += limitedCards.length;
            console.log(`   ✅ Imported ${limitedCards.length} cards from ${setCode}`);
          }
          
          // Delay between sets to respect Scryfall rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`   ⚠️ Error importing set ${setCode}:`, error);
          // Continue with next set instead of failing completely
        }
      }
      
      this.importedCounts.magic = totalImported;
      console.log(`✅ Imported ${totalImported} Magic cards from ${popularSets.length} sets`);
    } catch (error) {
      console.error('❌ Error importing Magic cards:', error);
      throw error;
    }
  }
}

// Run the import
async function runImport() {
  const importer = new FullTCGImporter();
  
  try {
    await importer.importAllCards();
    console.log('');
    console.log('🎯 Your TCG database is now populated with ~600 real cards and pricing!');
    console.log('🔍 You can now search across Pokemon, Magic, and One Piece cards!');
    console.log('💡 To import ALL cards later, update the limits in import-all-cards.ts');
    process.exit(0);
  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  runImport();
}

export { FullTCGImporter };