/**
 * Character matching utility for incomplete OCR detections
 * Finds matching characters in a reference set and suggests replacements
 */

/**
 * Find matching characters in class names for a given character
 * @param detectedChar - The character detected by OCR
 * @param classNames - Reference medication names
 * @returns Array of matching characters with their frequencies
 */
export function findMatchingCharacters(
  detectedChar: string,
  classNames: string[]
): { char: string; frequency: number }[] {
  const charFrequency: Record<string, number> = {};
  const detectedLower = detectedChar.toLowerCase();

  // Extract all characters from class names
  for (const className of classNames) {
    for (const char of className.toLowerCase()) {
      if (/[a-z0-9+\-\s]/.test(char)) {
        // Only consider alphanumeric, +, -, and spaces
        if (char === detectedLower) {
          charFrequency[char] = (charFrequency[char] || 0) + 1;
        }
      }
    }
  }

  return Object.entries(charFrequency)
    .map(([char, frequency]) => ({
      char,
      frequency,
    }))
    .sort((a, b) => b.frequency - a.frequency);
}

/**
 * Get character replacement suggestion if 3+ matches found
 * @param detectedChar - The character detected by OCR
 * @param classNames - Reference medication names
 * @param minOccurrences - Minimum occurrences required (default: 3)
 * @returns Suggested replacement character or null
 */
export function getCharacterReplacement(
  detectedChar: string,
  classNames: string[],
  minOccurrences: number = 3
): string | null {
  const matches = findMatchingCharacters(detectedChar, classNames);

  // Return the matching character if it appears 3+ times
  if (matches.length > 0 && matches[0].frequency >= minOccurrences) {
    return matches[0].char;
  }

  return null;
}

/**
 * Correct detected text by replacing incomplete/uncertain characters
 * @param detectedText - Raw OCR text
 * @param classNames - Reference medication names
 * @param minOccurrences - Minimum occurrences required for replacement (default: 3)
 * @returns Corrected text with replacements
 */
export function correctTextWithCharacterMatching(
  detectedText: string,
  classNames: string[],
  minOccurrences: number = 3
): { correctedText: string; replacements: Map<string, string> } {
  const replacements = new Map<string, string>();
  let correctedText = detectedText;

  // Process each character in the text
  for (const char of detectedText) {
    if (!/[a-z0-9+\-\s]/i.test(char)) {
      // Skip non-alphanumeric characters
      continue;
    }

    const lowerChar = char.toLowerCase();

    if (replacements.has(lowerChar)) {
      // Use cached replacement
      const replacement = replacements.get(lowerChar)!;
      correctedText = correctedText.replaceAll(
        new RegExp(lowerChar, "gi"),
        replacement
      );
    } else {
      // Check for replacement
      const replacement = getCharacterReplacement(
        char,
        classNames,
        minOccurrences
      );

      if (replacement) {
        replacements.set(lowerChar, replacement);
        correctedText = correctedText.replaceAll(
          new RegExp(lowerChar, "gi"),
          replacement
        );
      }
    }
  }

  return { correctedText, replacements };
}

/**
 * Get detailed analysis of character corrections
 * @param detectedText - Raw OCR text
 * @param classNames - Reference medication names
 * @returns Detailed analysis with all replacements and their reasoning
 */
export function analyzeCharacterCorrections(
  detectedText: string,
  classNames: string[],
  minOccurrences: number = 3
): {
  original: string;
  corrected: string;
  corrections: Array<{
    original: string;
    replacement: string;
    frequency: number;
  }>;
} {
  const corrections: Array<{
    original: string;
    replacement: string;
    frequency: number;
  }> = [];
  const seen = new Set<string>();

  for (const char of detectedText) {
    const lowerChar = char.toLowerCase();

    if (seen.has(lowerChar) || !/[a-z0-9+\-\s]/i.test(char)) {
      continue;
    }

    seen.add(lowerChar);

    const matches = findMatchingCharacters(char, classNames);

    if (matches.length > 0 && matches[0].frequency >= minOccurrences) {
      corrections.push({
        original: char,
        replacement: matches[0].char,
        frequency: matches[0].frequency,
      });
    }
  }

  const { correctedText } = correctTextWithCharacterMatching(
    detectedText,
    classNames,
    minOccurrences
  );

  return {
    original: detectedText,
    corrected: correctedText,
    corrections,
  };
}
