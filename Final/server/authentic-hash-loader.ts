/**
 * Authentic THC GROWERZ Hash List Loader
 * Loads the real 2,420 mint addresses from the official hash list
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for loaded hash list to avoid repeated file reads
let cachedHashList: string[] | null = null;

/**
 * Load authentic THC GROWERZ mint addresses from official hash list
 * Returns array of 2,420 real mint addresses
 */
export function loadAuthenticHashList(): string[] {
  if (cachedHashList) {
    return cachedHashList;
  }

  try {
    // Load the authentic hash list file
    const hashListPath = path.join(__dirname, 'growerz_hashlist_revised_12.09.24_1753671139244.json');
    
    if (!fs.existsSync(hashListPath)) {
      console.log('❌ Authentic THC GROWERZ hash list not found at:', hashListPath);
      return [];
    }

    const hashListData = fs.readFileSync(hashListPath, 'utf-8');
    const mintAddresses = JSON.parse(hashListData);

    if (!Array.isArray(mintAddresses)) {
      console.log('❌ Invalid hash list format - expected array of mint addresses');
      return [];
    }

    console.log(`✅ Loaded ${mintAddresses.length} authentic THC GROWERZ mint addresses from hash list`);
    cachedHashList = mintAddresses;
    return mintAddresses;

  } catch (error) {
    console.log('❌ Error loading authentic hash list:', error);
    return [];
  }
}

/**
 * Get specific mint address by index (0-2419)
 */
export function getMintByIndex(index: number): string | null {
  const hashList = loadAuthenticHashList();
  if (index >= 0 && index < hashList.length) {
    return hashList[index];
  }
  return null;
}

/**
 * Validate if a mint address is in the authentic collection
 */
export function isAuthenticGROWERZ(mintAddress: string): boolean {
  const hashList = loadAuthenticHashList();
  return hashList.includes(mintAddress);
}

/**
 * Get collection size (should be 2,420 for complete collection)
 */
export function getCollectionSize(): number {
  return loadAuthenticHashList().length;
}