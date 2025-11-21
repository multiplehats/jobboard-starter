import { getAllTimezones, getAllCountries } from 'countries-and-timezones';

export interface TimezoneOption {
	value: string;
	label: string;
	offset: string;
	searchText: string;
}

// City aliases for better searchability (timezone ID -> additional city names)
const CITY_ALIASES: Record<string, string[]> = {
	'Europe/Brussels': ['Amsterdam', 'Brussels', 'Luxembourg'],
	'Europe/London': ['London'],
	'Europe/Paris': ['Paris'],
	'Europe/Berlin': ['Berlin'],
	'Europe/Rome': ['Rome'],
	'Europe/Madrid': ['Madrid'],
	'America/New_York': ['New York', 'NYC'],
	'America/Los_Angeles': ['Los Angeles', 'LA'],
	'America/Chicago': ['Chicago'],
	'Asia/Tokyo': ['Tokyo'],
	'Asia/Shanghai': ['Shanghai', 'Beijing'],
	'Asia/Hong_Kong': ['Hong Kong'],
	'Asia/Singapore': ['Singapore'],
	'Australia/Sydney': ['Sydney']
};

// Cache for timezone options (timezones don't change at runtime)
let cachedTimezoneOptions: TimezoneOption[] | null = null;

/**
 * Get all timezones formatted for use in a combobox
 * @returns Array of timezone options with value, label, offset, and searchText
 */
export function getTimezoneOptions(): TimezoneOption[] {
	// Return cached options if available
	if (cachedTimezoneOptions) {
		return cachedTimezoneOptions;
	}

	const timezones = getAllTimezones();
	const countries = getAllCountries();

	const options = Object.entries(timezones)
		.map(([id, tz]) => {
			// Calculate offset in hours and minutes
			const offsetMinutes = tz.utcOffset;
			const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
			const offsetMins = Math.abs(offsetMinutes) % 60;
			const sign = offsetMinutes >= 0 ? '+' : '-';
			const offset = `UTC${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;

			// Format the label: "America/New_York (UTC-05:00)"
			const label = `${id.replace(/_/g, ' ')} (${offset})`;

			// Create searchable text including the city name, country codes, country names, and offset
			const cityName = id.split('/').pop()?.replace(/_/g, ' ') || '';
			const countryNames = tz.countries
				.map((code) => countries[code]?.name || '')
				.filter(Boolean)
				.join(' ');
			const aliases = CITY_ALIASES[id]?.join(' ') || '';

			const searchText = `${id} ${cityName} ${offset} ${tz.countries.join(' ')} ${countryNames} ${aliases}`.toLowerCase();

			return {
				value: id,
				label,
				offset,
				searchText
			};
		})
		.sort((a, b) => {
			// Sort by offset first, then by name
			const offsetA = parseInt(a.offset.replace(/[^-\d]/g, ''));
			const offsetB = parseInt(b.offset.replace(/[^-\d]/g, ''));

			if (offsetA !== offsetB) {
				return offsetA - offsetB;
			}

			return a.value.localeCompare(b.value);
		});

	// Cache the result
	cachedTimezoneOptions = options;
	return options;
}

/**
 * Get a formatted timezone label by timezone ID
 * @param timezoneId - The IANA timezone identifier (e.g., "America/New_York")
 * @returns Formatted label or the original ID if not found
 */
export function getTimezoneLabel(timezoneId: string): string {
	const timezones = getAllTimezones();
	const tz = timezones[timezoneId as keyof ReturnType<typeof getAllTimezones>];

	if (!tz) {
		return timezoneId;
	}

	const offsetMinutes = tz.utcOffset;
	const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
	const offsetMins = Math.abs(offsetMinutes) % 60;
	const sign = offsetMinutes >= 0 ? '+' : '-';
	const offset = `UTC${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;

	return `${timezoneId.replace(/_/g, ' ')} (${offset})`;
}

/**
 * Get the user's current timezone
 * @returns IANA timezone identifier or 'UTC' as fallback
 */
export function getUserTimezone(): string {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
	} catch {
		return 'UTC';
	}
}
