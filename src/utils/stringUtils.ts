/**
 * Safely converts a value to a string, handling null, undefined, and non-string types
 * @param value - The value to convert to string
 * @returns A string representation of the value, or empty string if value is null/undefined
 */
export function safeString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'object' && value !== null) {
    // Handle objects that might have a string property
    if ('business_rule' in value && typeof (value as any).business_rule === 'string') {
      return (value as any).business_rule;
    }
    
    // For other objects, try to stringify them
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  
  return String(value);
}

/**
 * Safely trims a string value, handling non-string types
 * @param value - The value to trim
 * @returns The trimmed string, or empty string if value is null/undefined
 */
export function safeTrim(value: unknown): string {
  return safeString(value).trim();
}

/**
 * Checks if a value is a non-empty string after trimming
 * @param value - The value to check
 * @returns True if the value is a non-empty string after trimming
 */
export function isNonEmptyString(value: unknown): boolean {
  return safeTrim(value).length > 0;
}
