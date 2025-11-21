import { getAllCountries } from 'countries-and-timezones';

export interface CountryOption {
	code: string;
	name: string;
	flagUrl: string;
	searchText: string;
}

// Cache for country options (countries don't change at runtime)
let cachedCountryOptions: CountryOption[] | null = null;

/**
 * Get all countries formatted for use in a combobox
 * @returns Array of country options with code, name, flagUrl, and searchText
 */
export function getCountryOptions(): CountryOption[] {
	// Return cached options if available
	if (cachedCountryOptions) {
		return cachedCountryOptions;
	}

	const countries = getAllCountries();

	const options = Object.entries(countries)
		.map(([code, country]) => {
			// Use lowercase country code for flag URL
			const flagUrl = `https://react-circle-flags.pages.dev/${code.toLowerCase()}.svg`;

			// Create searchable text including the country code and name
			const searchText = `${code} ${country.name}`.toLowerCase();

			return {
				code,
				name: country.name,
				flagUrl,
				searchText
			};
		})
		.sort((a, b) => a.name.localeCompare(b.name));

	// Cache the result
	cachedCountryOptions = options;
	return options;
}

/**
 * Get a country name by country code
 * @param countryCode - The ISO 3166-1 alpha-2 country code (e.g., "US", "GB")
 * @returns Country name or the original code if not found
 */
export function getCountryName(countryCode: string): string {
	const countries = getAllCountries();
	const country = countries[countryCode as keyof ReturnType<typeof getAllCountries>];

	if (!country) {
		return countryCode;
	}

	return country.name;
}

/**
 * Get a country's flag URL by country code
 * @param countryCode - The ISO 3166-1 alpha-2 country code (e.g., "US", "GB")
 * @returns Flag URL
 */
export function getCountryFlagUrl(countryCode: string): string {
	return `https://react-circle-flags.pages.dev/${countryCode.toLowerCase()}.svg`;
}
