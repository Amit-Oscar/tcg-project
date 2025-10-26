# Scripts Directory

This directory contains all the import, fix, and utility scripts for the TCG project.

## 📦 Import Scripts

### `import-all-cards.ts`
**Main card import script**
- Imports 200 cards each from Pokemon, Magic, and One Piece
- Includes real pricing data from APIs
- **Usage**: `npx tsx scripts/import-all-cards.ts`

### `clear-and-import.ts`
**Fresh database import**
- Clears entire database and imports fresh cards
- Useful for complete reset
- **Usage**: `npx tsx scripts/clear-and-import.ts`

### `import-tcg-data.ts`
**Legacy import script**
- Original import script (may be outdated)
- Use `import-all-cards.ts` instead

## 🔧 Fix Scripts

### `fix-magic-prices.ts`
**Magic card pricing fix**
- Fixes missing prices for Magic: The Gathering cards
- Uses Scryfall API + fallback pricing
- **Usage**: `npx tsx scripts/fix-magic-prices.ts`

### `fix-onepiece-images.ts`
**One Piece image validation**
- Validates and fixes One Piece card images
- **Note**: Image issues have been resolved with real API data
- **Usage**: `npx tsx scripts/fix-onepiece-images.ts`

## 🧪 Test Scripts

### `test-apis.ts`
**API integration testing**
- Tests all three TCG APIs (Pokemon, Magic, One Piece)
- Validates API responses and data conversion
- **Usage**: `npx tsx scripts/test-apis.ts`

### `test-import.ts`
**Import process testing**
- Tests the card import workflow
- **Usage**: `npx tsx scripts/test-import.ts`

### `test-magic.ts`
**Magic API testing**
- Specific tests for Scryfall API integration
- **Usage**: `npx tsx scripts/test-magic.ts`

### `test-pokemon.ts`
**Pokemon API testing**
- Specific tests for Pokemon TCG API
- **Usage**: `npx tsx scripts/test-pokemon.ts`

## 📊 Utility Scripts

### `get-stats.ts`
**Database statistics**
- Shows card counts, pricing data, and database stats
- **Usage**: `npx tsx scripts/get-stats.ts`

## 🚀 Quick Start

1. **Fresh Import (Recommended)**:
   ```bash
   npx tsx scripts/clear-and-import.ts
   ```

2. **Add More Cards**:
   ```bash
   npx tsx scripts/import-all-cards.ts
   ```

3. **Fix Missing Prices**:
   ```bash
   npx tsx scripts/fix-magic-prices.ts
   ```

4. **Check Database Stats**:
   ```bash
   npx tsx scripts/get-stats.ts
   ```

## 💰 Currency

All new imports use **CAD (Canadian Dollar)** pricing:
- Exchange rates: USD → CAD (1.37), EUR → CAD (1.5)
- Existing USD data remains unchanged in database
- UI displays all prices as CAD

## 📋 Notes

- All scripts require `dotenv/config` for environment variables
- Scripts use `../lib/` import paths (relative to scripts directory)
- Run scripts from project root with `npx tsx scripts/script-name.ts`
- Some scripts may take several minutes to complete due to API rate limiting