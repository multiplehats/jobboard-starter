import { db } from '$lib/server/db/index.js';
import { orders, payments } from '$lib/server/db/schema/payments.js';
import { eq, desc } from 'drizzle-orm';
import type { NewOrder, NewPayment, Order, Payment } from '$lib/server/db/schema/payments.js';

/**
 * Payments Repository
 *
 * Lightweight data access layer for orders and payments.
 * Follows the backend architecture pattern with simple CRUD operations.
 */
export const paymentsRepository = {
	// ============================================================================
	// Orders
	// ============================================================================

	/**
	 * Find a single order by ID
	 *
	 * @param id - The order ID
	 * @returns The order or null if not found
	 */
	async findOrderById(id: string): Promise<Order | null> {
		const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);

		return order ?? null;
	},

	/**
	 * Find all orders for a user
	 *
	 * @param userId - The user ID
	 * @returns Array of orders ordered by createdAt desc
	 */
	async findOrdersByUser(userId: string): Promise<Order[]> {
		const results = await db
			.select()
			.from(orders)
			.where(eq(orders.userId, userId))
			.orderBy(desc(orders.createdAt));

		return results;
	},

	/**
	 * Find all orders (admin only)
	 *
	 * @param limit - Maximum number of orders to return
	 * @returns Array of orders ordered by createdAt desc
	 */
	async findAllOrders(limit: number = 50): Promise<Order[]> {
		const results = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);

		return results;
	},

	/**
	 * Find order by provider session ID
	 *
	 * @param sessionId - The provider session ID
	 * @returns The order or null if not found
	 */
	async findOrderByProviderSessionId(sessionId: string): Promise<Order | null> {
		const [order] = await db
			.select()
			.from(orders)
			.where(eq(orders.providerSessionId, sessionId))
			.limit(1);

		return order ?? null;
	},

	/**
	 * Create a new order
	 *
	 * @param data - The order data to insert
	 * @returns The created order
	 */
	async createOrder(data: NewOrder): Promise<Order> {
		const [order] = await db.insert(orders).values(data).returning();

		if (!order) {
			throw new Error('Failed to create order');
		}

		return order;
	},

	/**
	 * Update an order by ID
	 *
	 * @param id - The order ID
	 * @param data - Partial order data to update
	 * @returns The updated order or null if not found
	 */
	async updateOrder(id: string, data: Partial<NewOrder>): Promise<Order | null> {
		const [order] = await db
			.update(orders)
			.set({
				...data,
				updatedAt: new Date()
			})
			.where(eq(orders.id, id))
			.returning();

		return order ?? null;
	},

	// ============================================================================
	// Payments
	// ============================================================================

	/**
	 * Find a single payment by ID
	 *
	 * @param id - The payment ID
	 * @returns The payment or null if not found
	 */
	async findPaymentById(id: string): Promise<Payment | null> {
		const [payment] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);

		return payment ?? null;
	},

	/**
	 * Find payment by provider payment ID
	 *
	 * @param providerPaymentId - The provider payment ID
	 * @returns The payment or null if not found
	 */
	async findPaymentByProviderPaymentId(providerPaymentId: string): Promise<Payment | null> {
		const [payment] = await db
			.select()
			.from(payments)
			.where(eq(payments.providerPaymentId, providerPaymentId))
			.limit(1);

		return payment ?? null;
	},

	/**
	 * Find all payments for an order
	 *
	 * @param orderId - The order ID
	 * @returns Array of payments ordered by createdAt desc
	 */
	async findPaymentsByOrder(orderId: string): Promise<Payment[]> {
		const results = await db
			.select()
			.from(payments)
			.where(eq(payments.orderId, orderId))
			.orderBy(desc(payments.createdAt));

		return results;
	},

	/**
	 * Create a new payment
	 *
	 * @param data - The payment data to insert
	 * @returns The created payment
	 */
	async createPayment(data: NewPayment): Promise<Payment> {
		const [payment] = await db.insert(payments).values(data).returning();

		if (!payment) {
			throw new Error('Failed to create payment');
		}

		return payment;
	},

	/**
	 * Update a payment by ID
	 *
	 * @param id - The payment ID
	 * @param data - Partial payment data to update
	 * @returns The updated payment or null if not found
	 */
	async updatePayment(id: string, data: Partial<NewPayment>): Promise<Payment | null> {
		const [payment] = await db
			.update(payments)
			.set({
				...data,
				updatedAt: new Date()
			})
			.where(eq(payments.id, id))
			.returning();

		return payment ?? null;
	}
};
