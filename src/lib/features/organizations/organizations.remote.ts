import * as z from 'zod';
import { query } from '$app/server';
import { searchOrganizations } from './server/repository';
import { getRequestEvent } from '$app/server';

/**
 * Search for organizations by query string
 * Remote function for organization search
 */
export const searchOrgs = query(
	z.string().min(1, 'Search query must not be empty'),
	async (searchQuery) => {
		const event = getRequestEvent();

		if (!event.locals.user) {
			throw new Error('Unauthorized');
		}

		const organizations = await searchOrganizations(searchQuery);
		return organizations;
	}
);
