import 'dotenv/config'
import { tcgImporter } from '../lib/tcg-importer'

async function runImport() {
  try {
    console.log('🚀 Starting TCG data import...')
    
    // Import all TCG data
    await tcgImporter.importAllTCGData()
    
    console.log('🎉 Import completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  }
}

runImport()