import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine class names with Tailwind's merging logic
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date as a time string (e.g., "10:30 AM")
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Copy text to clipboard
 */
export const copyToClipboard = (text: string): Promise<void> => {
  return navigator.clipboard.writeText(text);
};

/**
 * Get initials from a string (e.g., "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  return name.split(' ')
    .map(part => part[0]?.toUpperCase() || '')
    .slice(0, 2)
    .join('');
}

/**
 * Get single initial from a string (e.g., "John" -> "J")
 */
export function getSingleInitial(name: string): string {
  if (!name || !name.length) return '';
  return name[0].toUpperCase();
}

/**
 * Get a stored value from localStorage with fallback
 */
export function getStoredValue(key: string): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    // Try to parse as JSON, fallback to raw string
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return null;
  }
}

/**
 * Set a value in localStorage
 */
export function setStoredValue<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error setting localStorage key "${key}":`, error);
  }
}

export function removeStoredValue(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
}
