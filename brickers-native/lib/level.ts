import * as SecureStore from 'expo-secure-store';

export type Level = 'L1' | 'L2' | 'L3';

const LEVEL_KEY = 'brickers_level';
const DEFAULT_LEVEL: Level = 'L2';

export async function getSavedLevel(): Promise<Level> {
  try {
    const stored = await SecureStore.getItemAsync(LEVEL_KEY);
    if (stored === 'L1' || stored === 'L2' || stored === 'L3') {
      return stored;
    }
  } catch (error) {
    console.warn('[Level] Failed to read saved level:', error);
  }
  return DEFAULT_LEVEL;
}

export async function saveLevel(level: Level): Promise<void> {
  try {
    await SecureStore.setItemAsync(LEVEL_KEY, level);
  } catch (error) {
    console.warn('[Level] Failed to save level:', error);
  }
}

export function resolveLevel(input?: string | string[] | null): Level {
  const raw = Array.isArray(input) ? input[0] : input;
  const upper = (raw || DEFAULT_LEVEL).toUpperCase();
  if (upper === 'L1' || upper === 'L2' || upper === 'L3') {
    return upper;
  }
  return DEFAULT_LEVEL;
}

