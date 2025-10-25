-- CreateTable
CREATE TABLE "CardPrice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cardId" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "condition" TEXT NOT NULL DEFAULT 'NM',
    "source" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CardPrice_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Card" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "set" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "imageUrl" TEXT,
    "tcgId" TEXT,
    "game" TEXT NOT NULL DEFAULT 'ONE_PIECE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Card" ("cardNumber", "createdAt", "id", "imageUrl", "name", "rarity", "set") SELECT "cardNumber", "createdAt", "id", "imageUrl", "name", "rarity", "set" FROM "Card";
DROP TABLE "Card";
ALTER TABLE "new_Card" RENAME TO "Card";
CREATE UNIQUE INDEX "Card_set_cardNumber_key" ON "Card"("set", "cardNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CardPrice_cardId_createdAt_idx" ON "CardPrice"("cardId", "createdAt");
