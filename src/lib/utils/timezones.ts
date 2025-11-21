import { getAllTimezones } from 'countries-and-timezones';

export interface TimezoneOption {
	value: string;
	label: string;
	offset: string;
	searchText: string;
}

/**
 * Get all timezones formatted for use in a combobox
 * @returns Array of timezone options with value, label, offset, and searchText
 */
export function getTimezoneOptions(): TimezoneOption[] {
	const timezones = getAllTimezones();

	return Object.entries(timezones)
		.map(([id, tz]) => {
			// Calculate offset in hours and minutes
			const offsetMinutes = tz.utcOffset;
			const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
			const offsetMins = Math.abs(offsetMinutes) % 60;
			const sign = offsetMinutes >= 0 ? '+' : '-';
			const offset = `UTC${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;

			// Format the label: "America/New_York (UTC-05:00)"
			const label = `${id.replace(/_/g, ' ')} (${offset})`;

			// Create searchable text including the city name, country, and offset
			const cityName = id.split('/').pop()?.replace(/_/g, ' ') || '';
			const searchText = `${id} ${cityName} ${offset} ${tz.countries.join(' ')}`.toLowerCase();

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
