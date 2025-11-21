import type { PageServerLoad } from './$types';
import { getUserOrders } from '$lib/features/payments/server/queries';
import { redirect } from '@sveltejs/kit';

/**
 * Load user's order history
 * Following backend-architecture.md pattern (page loads for queries)
 */
export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();
	if (!session?.user) {
		throw redirect(302, '/auth/sign-in');
	}

	const orders = await getUserOrders(session.user.id);

	return { orders };
};
