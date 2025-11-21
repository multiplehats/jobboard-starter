import { paymentsRepository } from './repository';
import type { Order } from '$lib/server/db/schema/payments';

/**
 * Payment Queries
 * Complex read operations with business logic
 * Following backend-architecture.md pattern
 */

/**
 * Get order with full details (payments, related jobs, etc.)
 *
 * @param orderId - The order ID to fetch
 * @returns Order with associated payments, or null if not found
 *
 * @example
 * ```ts
 * const orderDetails = await getOrderDetails('order_abc123');
 * if (orderDetails) {
 *   console.log(`Order total: ${orderDetails.totalAmount}`);
 *   console.log(`Payments: ${orderDetails.payments.length}`);
 * }
 * ```
 */
export async function getOrderDetails(orderId: string) {
	const order = await paymentsRepository.findOrderById(orderId);
	if (!order) return null;

	const orderPayments = await paymentsRepository.findPaymentsByOrder(orderId);

	return {
		...order,
		payments: orderPayments
	};
}

/**
 * Get user's order history
 *
 * @param userId - The user ID to fetch orders for
 * @returns Array of orders ordered by createdAt desc
 *
 * @example
 * ```ts
 * const orders = await getUserOrders('user_abc123');
 * console.log(`User has ${orders.length} orders`);
 * ```
 */
export async function getUserOrders(userId: string): Promise<Order[]> {
	return paymentsRepository.findOrdersByUser(userId);
}

/**
 * Get order statistics for a user
 *
 * @param userId - The user ID to get stats for
 * @returns Statistics object with counts and totals
 *
 * @example
 * ```ts
 * const stats = await getUserOrderStats('user_abc123');
 * console.log(`Total spent: $${stats.totalSpent / 100}`);
 * console.log(`Paid orders: ${stats.paid}`);
 * ```
 */
export async function getUserOrderStats(userId: string) {
	const orders = await paymentsRepository.findOrdersByUser(userId);

	return {
		total: orders.length,
		paid: orders.filter((o) => o.status === 'paid').length,
		pending: orders.filter((o) => o.status === 'pending').length,
		failed: orders.filter((o) => o.status === 'failed').length,
		totalSpent: orders
			.filter((o) => o.status === 'paid')
			.reduce((sum, o) => sum + o.totalAmount, 0)
	};
}

/**
 * Get all orders (admin only)
 *
 * @param limit - Maximum number of orders to return (default: 50)
 * @returns Array of orders with payment information, ordered by createdAt desc
 *
 * @example
 * ```ts
 * const orders = await getAllOrders(100);
 * console.log(`Total orders: ${orders.length}`);
 * ```
 */
export async function getAllOrders(limit: number = 50) {
	const allOrders = await paymentsRepository.findAllOrders(limit);

	// Fetch payments for each order
	const ordersWithPayments = await Promise.all(
		allOrders.map(async (order) => {
			const orderPayments = await paymentsRepository.findPaymentsByOrder(order.id);
			return {
				...order,
				payments: orderPayments
			};
		})
	);

	return ordersWithPayments;
}
