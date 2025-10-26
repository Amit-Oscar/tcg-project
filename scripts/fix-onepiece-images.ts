#!/usr/bin/env tsx

import { validateOnePieceImages } from '../lib/apis/onepiece-tcg-api';

async function main() {
  console.log('🏴‍☠️ One Piece Image Validator & Fixer');
  console.log('=====================================');
  console.log('');
  
  try {
    await validateOnePieceImages();
  } catch (error) {
    console.error('❌ Error during image validation:', error);
    process.exit(1);
  }
}

main();