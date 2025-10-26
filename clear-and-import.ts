import { prisma } from './lib/prisma';
import { FullTCGImporter } from './import-all-cards';

async function clearDatabase() {
  console.log('🗑️  Clearing existing database...');
  
  try {
    // Delete all card prices first (foreign key constraint)
    const deletedPrices = await prisma.cardPrice.deleteMany({});
    console.log(`   🗑️  Deleted ${deletedPrices.count} card prices`);
    
    // Delete all data imports
    const deletedImports = await prisma.dataImport.deleteMany({});
    console.log(`   🗑️  Deleted ${deletedImports.count} import records`);
    
  // Delete collection items and collections first (foreign key relations)
  const deletedCollectionCards = await prisma.collectionCard.deleteMany({});
  console.log(`   🗑️  Deleted ${deletedCollectionCards.count} collection-card links`);

  const deletedCollections = await prisma.collection.deleteMany({});
  console.log(`   🗑️  Deleted ${deletedCollections.count} collections`);

  // Now delete all cards
  const deletedCards = await prisma.card.deleteMany({});
  console.log(`   🗑️  Deleted ${deletedCards.count} cards`);
    
    console.log('✅ Database cleared successfully!');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

async function clearAndImport() {
  console.log('🚀 FRESH START: Clearing database and importing new cards...');
  console.log('================================================');
  console.log('');
  
  try {
    // Step 1: Clear the database
    await clearDatabase();
    
    // Step 2: Run the import
    console.log('🎯 Starting fresh import...');
    const importer = new FullTCGImporter();
    await importer.importAllCards();
    
    console.log('');
    console.log('🎉 FRESH IMPORT COMPLETED!');
    console.log('💾 Your database now has fresh cards from all three games!');
    
  } catch (error) {
    console.error('💥 Clear and import failed:', error);
    process.exit(1);
  }
}

// Run the clear and import
if (require.main === module) {
  clearAndImport();
}

export { clearAndImport };