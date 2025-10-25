import 'dotenv/config';
import { PrismaClient } from '../app/generated/prisma/client';

const prisma = new PrismaClient();

async function getStats() {
  try {
    const totalCards = await prisma.card.count();
    const cardsByGame = await prisma.card.groupBy({
      by: ['game'],
      _count: { game: true }
    });
    const totalPrices = await prisma.cardPrice.count();
    
    console.log('Database Statistics:');
    console.log('==================');
    console.log('Total Cards:', totalCards);
    console.log('Cards by Game:');
    cardsByGame.forEach(g => console.log(`  ${g.game}: ${g._count.game}`));
    console.log('Total Price Records:', totalPrices);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getStats();