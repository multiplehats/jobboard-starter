import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchOrganizations } from '$lib/features/organizations/server/repository';

export const GET: RequestHandler = async ({ url, locals }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const query = url.searchParams.get('q') || '';

	if (!query.trim()) {
		return json({ organizations: [] });
	}

	try {
		const organizations = await searchOrganizations(query);
		return json({ organizations });
	} catch (error) {
		console.error('Organization search error:', error);
		return json({ error: 'Search failed' }, { status: 500 });
	}
};
