/**
 * String utility functions for safe type conversion and validation
 * These functions provide defensive programming patterns for handling
 * unknown types and ensuring type safety.
 */

/**
 * Safely converts an unknown value to a string.
 * Returns an empty string if the value is null, undefined, or cannot be converted.
 *
 * @param value - The value to convert to a string
 * @returns A string representation of the value, or empty string if conversion fails
 *
 * @example
 * safeString("hello") // "hello"
 * safeString(123) // "123"
 * safeString(null) // ""
 * safeString(undefined) // ""
 * safeString({}) // "[object Object]"
 */
export function safeString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  // For objects, arrays, etc., convert to string
  try {
    return String(value);
  } catch {
    return "";
  }
}

/**
 * Safely trims whitespace from a string value.
 * Returns an empty string if the value is null, undefined, or cannot be converted.
 *
 * @param value - The value to trim
 * @returns A trimmed string, or empty string if conversion fails
 *
 * @example
 * safeTrim("  hello  ") // "hello"
 * safeTrim("test") // "test"
 * safeTrim(null) // ""
 * safeTrim(undefined) // ""
 */
export function safeTrim(value: unknown): string {
  const str = safeString(value);
  return str.trim();
}

/**
 * Type guard that checks if a value is a non-empty string.
 * Can be used for type narrowing in TypeScript.
 *
 * @param value - The value to check
 * @returns True if value is a string with length > 0, false otherwise
 *
 * @example
 * isNonEmptyString("hello") // true
 * isNonEmptyString("") // false
 * isNonEmptyString(null) // false
 * isNonEmptyString(undefined) // false
 * isNonEmptyString("   ") // true (whitespace-only strings are considered non-empty)
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

