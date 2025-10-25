/*
  Warnings:

  - You are about to drop the column `price` on the `CardPrice` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Card` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellPrice` to the `CardPrice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CardPrice` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "DataImport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "game" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "fileName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalCards" INTEGER NOT NULL DEFAULT 0,
    "importedCards" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errorLog" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Card" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "set" TEXT NOT NULL,
    "setCode" TEXT,
    "rarity" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "imageUrl" TEXT,
    "description" TEXT,
    "type" TEXT,
    "cost" TEXT,
    "power" TEXT,
    "life" TEXT,
    "attribute" TEXT,
    "tcgId" TEXT,
    "scryfall_id" TEXT,
    "ptcgio_id" TEXT,
    "optcg_id" TEXT,
    "game" TEXT NOT NULL DEFAULT 'ONE_PIECE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Card" ("cardNumber", "createdAt", "game", "id", "imageUrl", "name", "rarity", "set", "tcgId", "updatedAt") 
SELECT "cardNumber", "createdAt", "game", "id", "imageUrl", "name", "rarity", "set", "tcgId", CURRENT_TIMESTAMP FROM "Card";
DROP TABLE "Card";
ALTER TABLE "new_Card" RENAME TO "Card";
CREATE INDEX "Card_name_idx" ON "Card"("name");
CREATE INDEX "Card_set_idx" ON "Card"("set");
CREATE INDEX "Card_game_idx" ON "Card"("game");
CREATE INDEX "Card_rarity_idx" ON "Card"("rarity");
CREATE INDEX "Card_tcgId_idx" ON "Card"("tcgId");
CREATE UNIQUE INDEX "Card_set_cardNumber_game_key" ON "Card"("set", "cardNumber", "game");
CREATE TABLE "new_CardPrice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cardId" INTEGER NOT NULL,
    "buyPrice" REAL,
    "sellPrice" REAL NOT NULL DEFAULT 0,
    "marketPrice" REAL,
    "lowPrice" REAL,
    "highPrice" REAL,
    "condition" TEXT NOT NULL DEFAULT 'NM',
    "source" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CardPrice_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Migrate existing price data: use the old 'price' as 'sellPrice'
INSERT INTO "new_CardPrice" ("cardId", "condition", "createdAt", "currency", "id", "source", "sellPrice", "updatedAt") 
SELECT "cardId", "condition", "createdAt", "currency", "id", "source", COALESCE("price", 0), CURRENT_TIMESTAMP FROM "CardPrice";
DROP TABLE "CardPrice";
ALTER TABLE "new_CardPrice" RENAME TO "CardPrice";
CREATE INDEX "CardPrice_cardId_createdAt_idx" ON "CardPrice"("cardId", "createdAt");
CREATE INDEX "CardPrice_source_createdAt_idx" ON "CardPrice"("source", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "DataImport_game_createdAt_idx" ON "DataImport"("game", "createdAt");
