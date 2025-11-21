/**
 * Currency formatting utilities
 * Handles conversion from cents to dollars and formatting
 */

/**
 * Format price from cents to currency string
 * @param cents - Price in cents
 * @param currency - Currency code (USD, EUR, etc.)
 * @returns Formatted price string (e.g., "$99.00")
 */
export function formatPrice(cents: number, currency: string = 'USD'): string {
	const dollars = cents / 100;

	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
	}).format(dollars);
}

/**
 * Format price from cents to currency string with currency code
 * @param cents - Price in cents
 * @param currency - Currency code (USD, EUR, etc.)
 * @returns Formatted price string with code (e.g., "$99 USD")
 */
export function formatPriceWithCode(cents: number, currency: string = 'USD'): string {
	const price = formatPrice(cents, currency);
	return `${price} ${currency}`;
}
