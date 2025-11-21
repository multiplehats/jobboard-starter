import type { PageServerLoad } from './$types';
import { getOrderDetails } from '$lib/features/payments/server/queries';
import { error, redirect } from '@sveltejs/kit';

/**
 * Load order details
 * Following backend-architecture.md pattern (page loads for queries)
 */
export const load: PageServerLoad = async ({ params, locals }) => {
	const session = await locals.auth();
	if (!session?.user) {
		throw redirect(302, '/auth/sign-in');
	}

	const orderDetails = await getOrderDetails(params.id);

	if (!orderDetails) {
		throw error(404, 'Order not found');
	}

	// Verify order belongs to user
	if (orderDetails.userId !== session.user.id) {
		throw error(403, 'Forbidden');
	}

	return { order: orderDetails };
};
