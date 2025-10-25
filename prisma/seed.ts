import { PrismaClient } from '../app/generated/prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create some example users
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      username: 'alice',
    },
  })

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      username: 'bob',
    },
  })

  // Create some example cards
  const card1 = await prisma.card.upsert({
    where: { 
      set_cardNumber_game: { 
        set: 'Base Set', 
        cardNumber: '001',
        game: 'POKEMON'
      } 
    },
    update: {},
    create: {
      name: 'Charizard',
      set: 'Base Set',
      rarity: 'Rare Holo',
      cardNumber: '001',
      imageUrl: 'https://example.com/charizard.jpg',
      game: 'POKEMON',
    },
  })

  const card2 = await prisma.card.upsert({
    where: { 
      set_cardNumber_game: { 
        set: 'Base Set', 
        cardNumber: '002',
        game: 'POKEMON'
      } 
    },
    update: {},
    create: {
      name: 'Blastoise',
      set: 'Base Set',
      rarity: 'Rare Holo',
      cardNumber: '002',
      imageUrl: 'https://example.com/blastoise.jpg',
      game: 'POKEMON',
    },
  })

  // Create a collection for Alice
  const aliceCollection = await prisma.collection.create({
    data: {
      name: "Alice's Collection",
      userId: alice.id,
      cards: {
        create: [
          { cardId: card1.id, quantity: 2 },
          { cardId: card2.id, quantity: 1 },
        ],
      },
    },
  })

  console.log({ alice, bob, card1, card2, aliceCollection })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })