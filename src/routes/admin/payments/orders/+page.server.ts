import type { PageServerLoad } from './$types';
import { getAllOrders } from '$lib/features/payments/server/queries';
import { redirect } from '@sveltejs/kit';

/**
 * Load all orders (admin view)
 * Following backend-architecture.md pattern (page loads for queries)
 */
export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();
	if (!session?.user) {
		throw redirect(302, '/auth/sign-in');
	}

	// TODO: Add admin permission check
	// For now, any authenticated user can access
	// Add this when permissions are implemented:
	// if (!session.user.isAdmin) {
	//   throw error(403, 'Forbidden');
	// }

	const orders = await getAllOrders(100); // Get last 100 orders

	return { orders };
};
