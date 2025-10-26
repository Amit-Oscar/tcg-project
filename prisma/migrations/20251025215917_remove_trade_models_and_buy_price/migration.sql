/*
  Warnings:

  - You are about to drop the `Trade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TradeItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `buyPrice` on the `CardPrice` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Trade";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TradeItem";
PRAGMA foreign_keys=on;

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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Card" ("attribute", "cardNumber", "cost", "createdAt", "description", "game", "id", "imageUrl", "life", "name", "optcg_id", "power", "ptcgio_id", "rarity", "scryfall_id", "set", "setCode", "tcgId", "type", "updatedAt") SELECT "attribute", "cardNumber", "cost", "createdAt", "description", "game", "id", "imageUrl", "life", "name", "optcg_id", "power", "ptcgio_id", "rarity", "scryfall_id", "set", "setCode", "tcgId", "type", "updatedAt" FROM "Card";
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
    "sellPrice" REAL NOT NULL,
    "marketPrice" REAL,
    "lowPrice" REAL,
    "highPrice" REAL,
    "condition" TEXT NOT NULL DEFAULT 'NM',
    "source" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CardPrice_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CardPrice" ("cardId", "condition", "createdAt", "currency", "highPrice", "id", "lowPrice", "marketPrice", "sellPrice", "source", "updatedAt") SELECT "cardId", "condition", "createdAt", "currency", "highPrice", "id", "lowPrice", "marketPrice", "sellPrice", "source", "updatedAt" FROM "CardPrice";
DROP TABLE "CardPrice";
ALTER TABLE "new_CardPrice" RENAME TO "CardPrice";
CREATE INDEX "CardPrice_cardId_createdAt_idx" ON "CardPrice"("cardId", "createdAt");
CREATE INDEX "CardPrice_source_createdAt_idx" ON "CardPrice"("source", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
