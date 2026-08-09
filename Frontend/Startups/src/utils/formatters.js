/**
 * Utility functions for formatting strings and currency
 */

export function formatCurrency(val) {
  if (!val) return '₹0';
  return val;
}

export function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
