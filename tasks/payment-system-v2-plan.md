# Payment System v2: Starter-Friendly Architecture

**Created**: 2025-11-21
**Status**: Planning
**Goal**: Build a simple, mergeable, config-driven payment system for job board starters

---

## Core Principles

1. **Configuration Over Code** - Users customize config files, never touch core code
2. **Simple First** - Job postings only in v1, subscriptions/credits as add-ons
3. **Clear Boundaries** - Explicit markers: `← CORE (don't modify)` vs `← CUSTOMIZE`
4. **Hook-Based** - Lifecycle hooks for custom logic, no switch statement modifications
5. **Merge-Friendly** - Upstream updates won't conflict with user customizations
6. **DI Over Singletons** - Dependency injection, no global state
7. **CLI-Powered** - Tools for syncing, testing, and managing payments

---

## Architecture Overview

### Layer 1: Configuration (User Customizes)

```
src/lib/config/products/
├── schema.server.ts           ← CORE (Zod validation schema)
├── constants.server.ts        ← CORE (predefined upsell IDs)
├── products.config.ts         ← USER CUSTOMIZES (products, prices, providers)
├── i18n.ts                    ← CORE (i18n enrichment)
└── index.ts                   ← CORE (barrel export)
```

**Note**: This unified config serves BOTH payment system AND display layer.
See `tasks/unified-products-config-plan.md` for full details.

### Layer 2: Payment Core (Upstream Maintains)

**Following `docs/backend-architecture.md` patterns:**

```
src/lib/features/payments/
├── server/                    ← SvelteKit protected
│   ├── repository.ts          ← CORE (data access)
│   ├── queries.ts             ← CORE (complex reads)
│   ├── mutations.ts           ← CORE (write logic)
│   ├── checkout.ts            ← CORE (checkout logic)
│   ├── webhooks.ts            ← CORE (webhook processing)
│   ├── handlers.ts            ← CORE (event handlers)
│   ├── system.ts              ← CORE (PaymentSystem class)
│   └── adapters/
│       ├── adapter.ts         ← CORE (interface)
│       └── stripe.ts          ← CORE (Stripe implementation)
├── actions/                   ← Remote functions
│   └── create-order.remote.ts ← CORE (create order remote function)
├── components/                ← Feature UI components (if any)
├── validators.ts              ← SHARED (client + server validation)
├── types.ts                   ← SHARED (client + server types)
└── index.ts                   ← CORE (public API exports)
```

**Data Flow**:

- ✅ **Remote functions** for mutations (createOrder, processRefund)
- ✅ **Page loads** for queries (order history, order details)
- ✅ **API routes** ONLY for webhooks (external Stripe/provider callbacks)

### Layer 3: Database (Simple Schema)

```
src/lib/server/db/schema/payments.ts
- orders         (purchase intent + fulfillment data)
- payments       (transactions)

NOTE: We can remove job_payments table entirely and store job-specific
data in order.metadata instead. This simplifies the schema significantly.
```

### Layer 4: Routes

**Following backend architecture data flow patterns:**

```
src/routes/
├── (app)/
│   └── account/
│       └── orders/
│           ├── +page.server.ts        ← Page load (query user orders)
│           ├── +page.svelte           ← Display orders
│           └── [id]/
│               ├── +page.server.ts    ← Page load (query order details)
│               └── +page.svelte       ← Display order + refund button
│
├── (public)/
│   └── post-a-job/
│       └── +page.svelte               ← Uses remote function to create order
│
├── admin/
│   └── payments/
│       └── orders/
│           ├── +page.server.ts        ← Page load (all orders, admin view)
│           └── +page.svelte           ← Admin orders list
│
└── api/
    └── webhooks/
        └── [provider]/+server.ts      ← ONLY for external webhooks
```

**Key Pattern**:

- ❌ NO `/api/checkout` route
- ✅ Use `createOrderRemote()` remote function instead
- ✅ Page loads for all queries
- ✅ API routes ONLY for webhooks (external services)

### Layer 5: CLI Tools

```
src/lib/cli/payments/
├── sync-products.ts           ← Sync config to Stripe
├── test-webhook.ts            ← Test webhook handlers locally
└── generate-types.ts          ← Generate types from config
```

---

## Important: Unified Products Config

**Before starting implementation**, read `tasks/unified-products-config-plan.md`.

We use a **unified products configuration** that serves both:

- ✅ Payment system (prices, provider mappings)
- ✅ Display layer (upsells, badges, i18n)

This eliminates duplication and ensures one source of truth.

The products config lives in `src/lib/config/products/` (renamed from `pricing/`).

---

## Phase 1: Foundation (Week 1)

### 1.1 Products Configuration (Already Exists!)

The products configuration system is ALREADY built in `src/lib/config/pricing/`.

**Migration Steps**:

1. Rename `src/lib/config/pricing/` → `src/lib/config/products/`
2. Update schema to add provider mappings
3. Change from dollars to cents (e.g., `99` → `9900`)
4. Add `stripe` and `dodopayments` fields to each product

See `tasks/unified-products-config-plan.md` for detailed schema.

**Skip to Phase 1.2** if you've already migrated the config.

### 1.2 Payment Types (Previously 1.1 Payment Configuration System)

**File**: `src/lib/config/payments/schema.server.ts` ← CORE

```typescript
import { z } from 'zod';

/**
 * Zod schema for payment configuration
 * DO NOT MODIFY - Used for validation
 */

export const providerProductSchema = z.object({
	productId: z.string().min(1, 'Product ID is required'),
	priceId: z.string().min(1, 'Price ID is required')
});

export const jobPostingProductSchema = z.object({
	enabled: z.boolean().default(true),
	price: z.number().int().positive(),
	currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).default('USD'),
	duration: z.number().int().positive().default(30),

	// Provider mappings
	stripe: providerProductSchema.optional(),
	dodopayments: providerProductSchema.optional()
});

export const upsellProductSchema = z.object({
	id: z.string().min(1),
	enabled: z.boolean().default(true),
	price: z.number().int().positive(),

	// Provider mappings
	stripe: providerProductSchema.optional(),
	dodopayments: providerProductSchema.optional()
});

export const paymentsConfigSchema = z.object({
	// Default provider
	defaultProvider: z.enum(['stripe', 'dodopayments']).default('stripe'),

	// Products
	jobPosting: jobPostingProductSchema,
	upsells: z.array(upsellProductSchema).default([]),

	// Webhook configuration
	webhooks: z.object({
		verifySignature: z.boolean().default(true),
		retryFailedEvents: z.boolean().default(true),
		logEvents: z.boolean().default(true)
	}).optional()
});

export type PaymentsConfig = z.infer<typeof paymentsConfigSchema>;
export type JobPostingProduct = z.infer<typeof jobPostingProductSchema>;
export type UpsellProduct = z.infer<typeof upsellProductSchema>;
```

**File**: `src/lib/config/payments/payments.config.ts` ← USER CUSTOMIZES

```typescript
import type { PaymentsConfig } from './schema.server';

/**
 * Payment System Configuration
 *
 * SAFE TO CUSTOMIZE - This file contains your payment products and pricing.
 *
 * Setup Instructions:
 * 1. Configure your products and prices below
 * 2. Set environment variables for provider product/price IDs
 * 3. Run: pnpm run payments:sync (to sync products to Stripe)
 * 4. Run: pnpm run payments:test (to test webhook handling)
 *
 * Environment Variables Required:
 * - STRIPE_PRODUCT_JOB_POSTING_BASE
 * - STRIPE_PRICE_JOB_POSTING_BASE
 * - STRIPE_PRODUCT_UPSELL_EMAIL_BLAST (for each upsell)
 * - STRIPE_PRICE_UPSELL_EMAIL_BLAST
 *
 * Note: Product/price IDs are auto-generated when you run `pnpm run payments:sync`
 */

export const paymentsConfig: PaymentsConfig = {
	defaultProvider: 'stripe',

	jobPosting: {
		enabled: true,
		price: 9900, // $99.00 in cents
		currency: 'USD',
		duration: 30, // days

		stripe: {
			productId: process.env.STRIPE_PRODUCT_JOB_POSTING_BASE || '',
			priceId: process.env.STRIPE_PRICE_JOB_POSTING_BASE || ''
		}
	},

	upsells: [
		{
			id: 'email_blast',
			enabled: true,
			price: 4900, // $49.00
			stripe: {
				productId: process.env.STRIPE_PRODUCT_UPSELL_EMAIL_BLAST || '',
				priceId: process.env.STRIPE_PRICE_UPSELL_EMAIL_BLAST || ''
			}
		},
		{
			id: 'priority_listing',
			enabled: true,
			price: 2900, // $29.00
			stripe: {
				productId: process.env.STRIPE_PRODUCT_UPSELL_PRIORITY || '',
				priceId: process.env.STRIPE_PRICE_UPSELL_PRIORITY || ''
			}
		}
	],

	webhooks: {
		verifySignature: true,
		retryFailedEvents: true,
		logEvents: true
	}
};

/**
 * Get validated payment configuration
 */
export function getPaymentsConfig(): PaymentsConfig {
	// Validation happens in index.ts
	return paymentsConfig;
}
```

**File**: `src/lib/config/payments/index.ts` ← CORE

```typescript
import { paymentsConfigSchema } from './schema.server';
import { paymentsConfig } from './payments.config';

export { getPaymentsConfig } from './payments.config';
export * from './schema.server';

// Validate config on import
const result = paymentsConfigSchema.safeParse(paymentsConfig);

if (!result.success) {
	console.error('❌ Invalid payment configuration:', result.error.format());
	throw new Error('Invalid payment configuration. Check src/lib/config/payments/payments.config.ts');
}
```

---

### 1.2 Shared Validators

**File**: `src/lib/features/payments/validators.ts` ← SHARED

```typescript
import { z } from 'zod';

/**
 * Payment Validators
 * SHARED - Can be used on client AND server
 */

export const orderItemSchema = z.object({
	productId: z.string().min(1),
	quantity: z.number().int().positive().default(1),
	metadata: z.record(z.unknown()).optional()
});

export const createOrderSchema = z.object({
	items: z.array(orderItemSchema).min(1),
	successUrl: z.string().url(),
	cancelUrl: z.string().url()
});

export const checkoutParamsSchema = z.object({
	orderId: z.string(),
	provider: z.string().optional()
});

// Export types
export type OrderItem = z.infer<typeof orderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CheckoutParams = z.infer<typeof checkoutParamsSchema>;
```

---

### 1.3 Shared Types

**File**: `src/lib/features/payments/types.ts` ← SHARED

```typescript
/**
 * Payment System Types
 * SHARED - Can be used on client AND server
 */

// Re-export database types
import type { Order, Payment } from '$lib/server/db/schema/payments';
export type { Order, Payment };

// ============================================================================
// Order/Payment Status Types
// ============================================================================

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'canceled';
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';

// ============================================================================
// Order Metadata
// ============================================================================

export interface OrderMetadata {
	jobIds?: string[];
	upsells?: string[];
	[key: string]: unknown;
}

// ============================================================================
// Checkout Types
// ============================================================================

export interface CheckoutSession {
	sessionId: string;
	url: string;
}

// ============================================================================
// Webhook Types (Server-only but defined here)
// ============================================================================

export interface WebhookEvent {
	id: string;
	type: string;
	provider: string;
	data: unknown;
	metadata?: Record<string, string>;
}

// ============================================================================
// Payment Context (for event handlers)
// ============================================================================

export interface PaymentContext {
	event: WebhookEvent;
	order: Order;
	payment: Payment;
	provider: string;
}

// ============================================================================
// Handler Types
// ============================================================================

export type PaymentHandler = (ctx: PaymentContext) => Promise<void>;
```

---

### 1.4 Payment Adapter Interface

**File**: `src/lib/features/payments/server/adapters/adapter.ts` ← CORE

```typescript
/**
 * Payment Adapter Interface
 * DO NOT MODIFY - Core interface for payment providers
 *
 * To add a new provider:
 * 1. Create a new file: src/lib/features/payments/adapters/yourprovider.server.ts
 * 2. Implement the PaymentAdapter interface
 * 3. Register in getPaymentAdapter() factory function
 */

export interface LineItem {
	priceId: string;
	quantity: number;
}

export interface CheckoutSessionParams {
	lineItems: LineItem[];
	successUrl: string;
	cancelUrl: string;
	metadata?: Record<string, string>;
	mode?: 'payment' | 'subscription';
}

export interface CheckoutSession {
	sessionId: string;
	url: string;
}

export interface RefundParams {
	paymentId: string;
	amount?: number; // Optional partial refund
	reason?: string;
}

export interface Refund {
	refundId: string;
	amount: number;
	status: string;
}

/**
 * Payment provider adapter interface
 */
export interface PaymentAdapter {
	/** Provider name (e.g., 'stripe', 'dodopayments') */
	readonly name: string;

	/** Create a checkout session */
	createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSession>;

	/** Verify webhook signature */
	verifyWebhook(request: Request): Promise<boolean>;

	/** Parse webhook event */
	parseWebhook(request: Request): Promise<WebhookEvent>;

	/** Process a refund */
	refund(params: RefundParams): Promise<Refund>;
}

/**
 * Webhook event from provider
 */
export interface WebhookEvent {
	id: string;
	type: string;
	data: any;
	metadata?: Record<string, string>;
}
```

---

### 1.5 Stripe Adapter

**File**: `src/lib/features/payments/server/adapters/stripe.ts` ← CORE

```typescript
import Stripe from 'stripe';
import type { PaymentAdapter, CheckoutSessionParams, RefundParams } from './adapter';
import { env } from '$env/dynamic/private';

/**
 * Stripe Payment Adapter
 * DO NOT MODIFY - Core Stripe integration
 */
export class StripeAdapter implements PaymentAdapter {
	readonly name = 'stripe';
	private stripe: Stripe;

	constructor() {
		if (!env.STRIPE_SECRET_KEY) {
			throw new Error('STRIPE_SECRET_KEY environment variable is required');
		}

		this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
			apiVersion: '2024-11-20.acacia'
		});
	}

	async createCheckoutSession(params: CheckoutSessionParams) {
		const session = await this.stripe.checkout.sessions.create({
			line_items: params.lineItems,
			mode: params.mode || 'payment',
			success_url: params.successUrl,
			cancel_url: params.cancelUrl,
			metadata: params.metadata
		});

		return {
			sessionId: session.id,
			url: session.url!
		};
	}

	async verifyWebhook(request: Request): Promise<boolean> {
		const signature = request.headers.get('stripe-signature');
		if (!signature) return false;

		if (!env.STRIPE_WEBHOOK_SECRET) {
			throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
		}

		try {
			const body = await request.text();
			this.stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
			return true;
		} catch {
			return false;
		}
	}

	async parseWebhook(request: Request) {
		const signature = request.headers.get('stripe-signature')!;
		const body = await request.text();

		const event = this.stripe.webhooks.constructEvent(
			body,
			signature,
			env.STRIPE_WEBHOOK_SECRET!
		);

		return {
			id: event.id,
			type: event.type,
			data: event.data.object,
			metadata: (event.data.object as any).metadata || {}
		};
	}

	async refund(params: RefundParams) {
		const refund = await this.stripe.refunds.create({
			payment_intent: params.paymentId,
			amount: params.amount,
			reason: params.reason as Stripe.RefundCreateParams.Reason
		});

		return {
			refundId: refund.id,
			amount: refund.amount,
			status: refund.status
		};
	}
}
```

---

### 1.6 Database Schema

**File**: `src/lib/server/db/schema/payments.ts` ← CORE

```typescript
import { pgTable, text, integer, timestamp, json, index } from 'drizzle-orm/pg-core';
import { user } from './auth';

/**
 * Payment Database Schema
 * SIMPLIFIED - No job_payments table, all data in order.metadata
 */

// ============================================================================
// Orders Table
// ============================================================================

export const orders = pgTable(
	'orders',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),

		// Order details
		items: json('items').$type<OrderItem[]>().notNull(),
		totalAmount: integer('total_amount').notNull(), // In cents
		currency: text('currency').default('USD').notNull(),

		// Status (text for easier extension)
		status: text('status').default('pending').notNull(), // pending, paid, failed, refunded, canceled

		// Provider reference
		provider: text('provider'), // stripe, dodopayments, etc.
		providerSessionId: text('provider_session_id'),

		// Metadata (extensible) - stores job IDs, upsells, etc.
		metadata: json('metadata').$type<OrderMetadata>(),

		// Timestamps
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		completedAt: timestamp('completed_at')
	},
	(table) => ({
		userIdx: index('orders_user_idx').on(table.userId),
		statusIdx: index('orders_status_idx').on(table.status),
		providerSessionIdx: index('orders_provider_session_idx').on(table.providerSessionId)
	})
);

// ============================================================================
// Payments Table
// ============================================================================

export const payments = pgTable(
	'payments',
	{
		id: text('id').primaryKey(),
		orderId: text('order_id')
			.references(() => orders.id, { onDelete: 'cascade' })
			.notNull(),

		// Payment provider details
		provider: text('provider').notNull(),
		providerPaymentId: text('provider_payment_id').notNull().unique(),
		providerCustomerId: text('provider_customer_id'),

		// Amount
		amount: integer('amount').notNull(), // In cents
		currency: text('currency').default('USD').notNull(),

		// Status (text for easier extension)
		status: text('status').default('pending').notNull(), // pending, processing, succeeded, failed, refunded

		// Metadata (extensible)
		metadata: json('metadata'),

		// Timestamps
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		completedAt: timestamp('completed_at')
	},
	(table) => ({
		orderIdx: index('payments_order_idx').on(table.orderId),
		providerPaymentIdx: index('payments_provider_payment_idx').on(table.providerPaymentId),
		statusIdx: index('payments_status_idx').on(table.status)
	})
);

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Order metadata types
 */
export type OrderMetadata = {
	// Job posting specific
	jobIds?: string[]; // Jobs associated with this order
	upsells?: string[]; // Selected upsell IDs

	// Extensible for future product types
	[key: string]: unknown;
};

// Type exports
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
```

---

## Phase 2: Core Payment System (Week 2)

### 2.1 Repository Layer

**File**: `src/lib/features/payments/server/repository.ts` ← CORE

```typescript
import { db } from '$lib/server/db';
import { orders, payments } from '$lib/server/db/schema/payments';
import { eq, desc } from 'drizzle-orm';
import type { NewOrder, NewPayment } from '$lib/server/db/schema/payments';

/**
 * Payments Repository
 * Lightweight data access layer following backend-architecture.md pattern
 */
export const paymentsRepository = {
	// ============================================================================
	// Orders
	// ============================================================================

	async findOrderById(id: string) {
		const [order] = await db
			.select()
			.from(orders)
			.where(eq(orders.id, id))
			.limit(1);
		return order ?? null;
	},

	async findOrdersByUser(userId: string) {
		return db
			.select()
			.from(orders)
			.where(eq(orders.userId, userId))
			.orderBy(desc(orders.createdAt));
	},

	async findOrderByProviderSessionId(sessionId: string) {
		const [order] = await db
			.select()
			.from(orders)
			.where(eq(orders.providerSessionId, sessionId))
			.limit(1);
		return order ?? null;
	},

	async createOrder(data: NewOrder) {
		const [order] = await db.insert(orders).values(data).returning();
		return order;
	},

	async updateOrder(id: string, data: Partial<NewOrder>) {
		const [order] = await db
			.update(orders)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(orders.id, id))
			.returning();
		return order;
	},

	// ============================================================================
	// Payments
	// ============================================================================

	async findPaymentById(id: string) {
		const [payment] = await db
			.select()
			.from(payments)
			.where(eq(payments.id, id))
			.limit(1);
		return payment ?? null;
	},

	async findPaymentByProviderPaymentId(providerPaymentId: string) {
		const [payment] = await db
			.select()
			.from(payments)
			.where(eq(payments.providerPaymentId, providerPaymentId))
			.limit(1);
		return payment ?? null;
	},

	async findPaymentsByOrder(orderId: string) {
		return db
			.select()
			.from(payments)
			.where(eq(payments.orderId, orderId))
			.orderBy(desc(payments.createdAt));
	},

	async createPayment(data: NewPayment) {
		const [payment] = await db.insert(payments).values(data).returning();
		return payment;
	},

	async updatePayment(id: string, data: Partial<NewPayment>) {
		const [payment] = await db
			.update(payments)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(payments.id, id))
			.returning();
		return payment;
	}
};
```

---

### 2.2 Query Layer

**File**: `src/lib/features/payments/server/queries.ts` ← CORE

```typescript
import { paymentsRepository } from './repository';
import type { Order, Payment } from '$lib/server/db/schema/payments';

/**
 * Payment Queries
 * Complex read operations with business logic
 * Following backend-architecture.md pattern
 */

/**
 * Get order with full details (payments, related jobs, etc.)
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
 */
export async function getUserOrders(userId: string) {
	return paymentsRepository.findOrdersByUser(userId);
}

/**
 * Get order stats for user
 */
export async function getUserOrderStats(userId: string) {
	const orders = await paymentsRepository.findOrdersByUser(userId);

	return {
		total: orders.length,
		paid: orders.filter(o => o.status === 'paid').length,
		pending: orders.filter(o => o.status === 'pending').length,
		failed: orders.filter(o => o.status === 'failed').length,
		totalSpent: orders
			.filter(o => o.status === 'paid')
			.reduce((sum, o) => sum + o.totalAmount, 0)
	};
}
```

---

### 2.3 Mutation Layer

**File**: `src/lib/features/payments/server/mutations.ts` ← CORE

```typescript
import { paymentsRepository } from './repository';
import { getProductsConfig } from '$lib/config/products';
import { generateId } from '$lib/server/utils/id';
import type { OrderItem } from '../validators';
import type { Order } from '$lib/server/db/schema/payments';

/**
 * Payment Mutations
 * Write operations with business logic
 * Following backend-architecture.md pattern
 */

/**
 * Create a new order
 */
export async function createOrder(
	userId: string,
	items: OrderItem[]
): Promise<Order> {
	const config = getProductsConfig();

	// Calculate total
	let totalAmount = 0;
	for (const item of items) {
		const price = calculateItemPrice(item.productId);
		totalAmount += price * item.quantity;
	}

	// Validate items
	if (items.length === 0) {
		throw new Error('Order must have at least one item');
	}

	if (totalAmount < 0) {
		throw new Error('Invalid order total');
	}

	// Create order
	const order = await paymentsRepository.createOrder({
		id: generateId('order'),
		userId,
		items,
		totalAmount,
		currency: config.jobPosting.currency,
		status: 'pending',
		metadata: extractOrderMetadata(items)
	});

	return order;
}

/**
 * Update order with provider session
 */
export async function updateOrderWithSession(
	orderId: string,
	provider: string,
	sessionId: string
) {
	return paymentsRepository.updateOrder(orderId, {
		provider,
		providerSessionId: sessionId
	});
}

/**
 * Mark order as paid
 */
export async function markOrderPaid(orderId: string) {
	return paymentsRepository.updateOrder(orderId, {
		status: 'paid',
		completedAt: new Date()
	});
}

/**
 * Mark order as failed
 */
export async function markOrderFailed(orderId: string) {
	return paymentsRepository.updateOrder(orderId, {
		status: 'failed'
	});
}

// Helper functions
function calculateItemPrice(productId: string): number {
	const config = getProductsConfig();

	if (productId === 'job_posting_base') {
		return config.jobPosting.price;
	}

	const upsell = config.upsells.find(u => u.id === productId);
	if (upsell) {
		return upsell.price;
	}

	throw new Error(`Unknown product: ${productId}`);
}

function extractOrderMetadata(items: OrderItem[]) {
	// Extract job IDs and upsells from items
	const jobIds: string[] = [];
	const upsells: string[] = [];

	for (const item of items) {
		if (item.metadata?.jobId) {
			jobIds.push(item.metadata.jobId as string);
		}
		if (item.productId !== 'job_posting_base') {
			upsells.push(item.productId);
		}
	}

	return {
		jobIds,
		upsells
	};
}
```

---

### 2.4 Remote Functions

**File**: `src/lib/features/payments/actions/create-order.remote.ts` ← CORE

```typescript
import { form } from '@sveltejs/kit';
import { createOrderSchema } from '../validators';
import { createOrder } from '../server/mutations';
import { createCheckoutSession } from '../server/checkout';

/**
 * Payment Remote Functions
 * Type-safe mutations callable from components
 * Following backend-architecture.md pattern
 */

/**
 * Create order and checkout session
 * Used by job posting form
 */
export const createOrderRemote = form(createOrderSchema, async (data, { locals }) => {
	const session = await locals.auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	// Create order
	const order = await createOrder(session.user.id, data.items);

	// Create checkout session
	const checkout = await createCheckoutSession({
		orderId: order.id,
		successUrl: data.successUrl,
		cancelUrl: data.cancelUrl
	});

	return {
		orderId: order.id,
		checkoutUrl: checkout.url,
		sessionId: checkout.sessionId
	};
});
```

---

### 2.5 Payment System Class

**File**: `src/lib/features/payments/server/system.ts` ← CORE

```typescript
import type { PaymentAdapter } from './adapters/adapter';
import type { PaymentHandler, WebhookEvent } from './types';
import { StripeAdapter } from './adapters/stripe.server';

/**
 * Payment System
 * DO NOT MODIFY - Core payment system implementation
 *
 * Usage:
 * const paymentSystem = createPaymentSystem();
 * paymentSystem.on('payment.succeeded', async (ctx) => { ... });
 */
export class PaymentSystem {
	private adapters = new Map<string, PaymentAdapter>();
	private handlers = new Map<string, PaymentHandler[]>();

	constructor() {
		this.registerDefaultAdapters();
	}

	private registerDefaultAdapters() {
		this.registerAdapter(new StripeAdapter());
		// Add more adapters as they're implemented
	}

	/**
	 * Register a payment adapter
	 */
	registerAdapter(adapter: PaymentAdapter) {
		this.adapters.set(adapter.name, adapter);
	}

	/**
	 * Get adapter by provider name
	 */
	getAdapter(provider: string): PaymentAdapter {
		const adapter = this.adapters.get(provider);
		if (!adapter) {
			throw new Error(`Payment adapter not found: ${provider}`);
		}
		return adapter;
	}

	/**
	 * Register event handler
	 */
	on(eventType: string, handler: PaymentHandler) {
		const handlers = this.handlers.get(eventType) || [];
		handlers.push(handler);
		this.handlers.set(eventType, handlers);
	}

	/**
	 * Execute handlers for event
	 */
	async emit(eventType: string, ctx: PaymentContext) {
		const handlers = this.handlers.get(eventType) || [];

		for (const handler of handlers) {
			try {
				await handler(ctx);
			} catch (error) {
				console.error(`Error in payment handler for ${eventType}:`, error);
				throw error;
			}
		}
	}
}

// Singleton instance
let paymentSystem: PaymentSystem;

/**
 * Get payment system instance
 */
export function getPaymentSystem(): PaymentSystem {
	if (!paymentSystem) {
		paymentSystem = new PaymentSystem();
	}
	return paymentSystem;
}
```

---

### 2.6 Checkout Service

**File**: `src/lib/features/payments/server/checkout.ts` ← CORE

```typescript
import { paymentsRepository } from './repository';
import { updateOrderWithSession } from './mutations';
import { getPaymentSystem } from './system';
import { getProductsConfig } from '$lib/config/products';
import type { CheckoutParams } from '../validators';
import type { LineItem } from './adapters/adapter';

/**
 * Create checkout session
 * Uses repository for data access
 */
export async function createCheckoutSession(params: CheckoutParams) {
	const config = getProductsConfig();
	const provider = params.provider || config.payment?.defaultProvider || 'stripe';

	// Get order via repository
	const order = await paymentsRepository.findOrderById(params.orderId);
	if (!order) {
		throw new Error(`Order not found: ${params.orderId}`);
	}

	// Convert order items to provider line items
	const lineItems = orderToLineItems(order, provider);

	// Get adapter via payment system
	const paymentSystem = getPaymentSystem();
	const adapter = paymentSystem.getAdapter(provider);

	// Create checkout session
	const session = await adapter.createCheckoutSession({
		lineItems,
		successUrl: params.successUrl,
		cancelUrl: params.cancelUrl,
		metadata: {
			orderId: order.id,
			userId: order.userId
		}
	});

	// Update order with session ID via mutation
	await updateOrderWithSession(order.id, provider, session.sessionId);

	return session;
}

/**
 * Convert order to provider line items
 */
function orderToLineItems(order: any, provider: string): LineItem[] {
	const config = getProductsConfig();
	const lineItems: LineItem[] = [];

	for (const item of order.items) {
		let priceId: string | undefined;

		if (item.productId === 'job_posting_base') {
			priceId = config.jobPosting[provider]?.priceId;
		} else {
			// Check upsells
			const upsell = config.upsells.find(u => u.id === item.productId);
			priceId = upsell?.[provider]?.priceId;
		}

		if (!priceId) {
			throw new Error(
				`Price ID not configured for ${item.productId} on provider ${provider}`
			);
		}

		lineItems.push({
			priceId,
			quantity: item.quantity
		});
	}

	return lineItems;
}
```

---

### 2.3 Webhook Handler

**File**: `src/lib/features/payments/webhooks.server.ts` ← CORE

```typescript
import { getPaymentSystem } from './system.server';
import { db } from '$lib/server/db';
import { orders, payments } from '$lib/server/db/schema/payments';
import { generateId } from '$lib/server/utils/id';
import { eq } from 'drizzle-orm';
import type { WebhookEvent } from './types';

/**
 * Process webhook event
 */
export async function processWebhook(request: Request, provider: string) {
	const paymentSystem = getPaymentSystem();
	const adapter = paymentSystem.getAdapter(provider);

	// Verify webhook signature
	const isValid = await adapter.verifyWebhook(request);
	if (!isValid) {
		throw new Error('Invalid webhook signature');
	}

	// Parse webhook event
	const event = await adapter.parseWebhook(request);

	// Route event to appropriate handler
	await routeWebhookEvent(event, provider);
}

/**
 * Route webhook event to handlers
 */
async function routeWebhookEvent(event: WebhookEvent, provider: string) {
	// Normalize event types across providers
	const normalizedType = normalizeEventType(event.type, provider);

	switch (normalizedType) {
		case 'payment.succeeded':
			await handlePaymentSucceeded(event, provider);
			break;

		case 'payment.failed':
			await handlePaymentFailed(event, provider);
			break;

		case 'payment.refunded':
			await handlePaymentRefunded(event, provider);
			break;

		default:
			console.log(`Unhandled webhook event: ${event.type}`);
	}
}

/**
 * Normalize event types across providers
 */
function normalizeEventType(eventType: string, provider: string): string {
	if (provider === 'stripe') {
		const mapping: Record<string, string> = {
			'checkout.session.completed': 'payment.succeeded',
			'payment_intent.succeeded': 'payment.succeeded',
			'payment_intent.payment_failed': 'payment.failed',
			'charge.refunded': 'payment.refunded'
		};
		return mapping[eventType] || eventType;
	}

	return eventType;
}

/**
 * Handle payment succeeded
 */
async function handlePaymentSucceeded(event: WebhookEvent, provider: string) {
	const orderId = event.metadata?.orderId;
	if (!orderId) {
		throw new Error('Order ID not found in webhook metadata');
	}

	// Check for duplicate processing (idempotency)
	const existingPayment = await db.query.payments.findFirst({
		where: (payments, { eq }) => eq(payments.providerPaymentId, event.data.id)
	});

	if (existingPayment) {
		console.log('Payment already processed, skipping:', event.data.id);
		return;
	}

	// Get order
	const order = await db.query.orders.findFirst({
		where: (orders, { eq }) => eq(orders.id, orderId)
	});

	if (!order) {
		throw new Error(`Order not found: ${orderId}`);
	}

	// Create payment record
	const paymentId = generateId('payment');
	const [payment] = await db.insert(payments).values({
		id: paymentId,
		orderId: order.id,
		provider,
		providerPaymentId: event.data.id,
		providerCustomerId: event.data.customer,
		amount: order.totalAmount,
		currency: order.currency,
		status: 'succeeded',
		completedAt: new Date()
	}).returning();

	// Update order status
	await db.update(orders)
		.set({
			status: 'paid',
			completedAt: new Date()
		})
		.where(eq(orders.id, orderId));

	// Emit event for custom handlers
	const paymentSystem = getPaymentSystem();
	await paymentSystem.emit('payment.succeeded', {
		event,
		order,
		payment,
		provider
	});
}

/**
 * Handle payment failed
 */
async function handlePaymentFailed(event: WebhookEvent, provider: string) {
	const orderId = event.metadata?.orderId;
	if (!orderId) return;

	await db.update(orders)
		.set({ status: 'failed' })
		.where(eq(orders.id, orderId));

	const paymentSystem = getPaymentSystem();
	await paymentSystem.emit('payment.failed', {
		event,
		order: await getOrder(orderId),
		payment: null as any,
		provider
	});
}

/**
 * Handle payment refunded
 */
async function handlePaymentRefunded(event: WebhookEvent, provider: string) {
	const paymentId = event.data.payment_intent;

	const payment = await db.query.payments.findFirst({
		where: (payments, { eq }) => eq(payments.providerPaymentId, paymentId)
	});

	if (!payment) return;

	// Update payment status
	await db.update(payments)
		.set({ status: 'refunded' })
		.where(eq(payments.id, payment.id));

	// Update order status
	await db.update(orders)
		.set({ status: 'refunded' })
		.where(eq(orders.id, payment.orderId));

	const paymentSystem = getPaymentSystem();
	await paymentSystem.emit('payment.refunded', {
		event,
		order: await getOrder(payment.orderId),
		payment,
		provider
	});
}
```

---

### 2.4 Default Payment Handlers

**File**: `src/lib/features/payments/handlers.server.ts` ← CORE

```typescript
import { db } from '$lib/server/db';
import { jobs } from '$lib/server/db/schema';
import { generateId } from '$lib/server/utils/id';
import { getPaymentSystem } from './system.server';
import { eq } from 'drizzle-orm';
import type { PaymentContext } from './types';

/**
 * Default payment handlers
 * These are registered automatically but can be overridden by users
 */

/**
 * Register default handlers
 */
export function registerDefaultHandlers() {
	const paymentSystem = getPaymentSystem();

	paymentSystem.on('payment.succeeded', handleJobPostingPayment);
	paymentSystem.on('payment.refunded', handleJobPostingRefund);
}

/**
 * Handle job posting payment success
 */
async function handleJobPostingPayment(ctx: PaymentContext) {
	const { order, payment } = ctx;

	// Get job IDs and upsells from order metadata
	const jobIds = order.metadata?.jobIds || [];
	const upsells = order.metadata?.upsells || [];

	for (const jobId of jobIds) {
		// Publish job
		await db.update(jobs)
			.set({
				status: 'published',
				publishedAt: new Date(),
				expiresAt: calculateExpirationDate(),
				selectedUpsells: upsells,
				// Store payment reference directly in job
				paymentId: payment.id,
				paidAmount: order.totalAmount
			})
			.where(eq(jobs.id, jobId));
	}
}

/**
 * Handle job posting refund
 */
async function handleJobPostingRefund(ctx: PaymentContext) {
	const { order, payment } = ctx;

	const jobIds = order.metadata?.jobIds || [];

	for (const jobId of jobIds) {
		// Unpublish job
		await db.update(jobs)
			.set({
				status: 'draft',
				publishedAt: null,
				expiresAt: null
			})
			.where(eq(jobs.id, jobId));
	}
}

// Helper functions
function calculateExpirationDate(): Date {
	const config = getPaymentsConfig();
	return new Date(Date.now() + config.jobPosting.duration * 24 * 60 * 60 * 1000);
}
```

---

## Phase 3: Routes (Week 3)

### 3.1 Order History Page Load

**File**: `src/routes/(app)/account/orders/+page.server.ts`

```typescript
import type { PageServerLoad } from './$types';
import { getUserOrders } from '$lib/features/payments/server/queries';

/**
 * Load user's order history
 * Following backend-architecture.md pattern (page loads for queries)
 */
export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();
	if (!session?.user) {
		throw redirect(302, '/login');
	}

	const orders = await getUserOrders(session.user.id);

	return { orders };
};
```

**File**: `src/routes/(app)/account/orders/+page.svelte`

```svelte
<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto p-6">
	<h1 class="mb-6 text-2xl font-bold">Your Orders</h1>

	<div class="space-y-4">
		{#each data.orders as order}
			<div class="rounded-lg bg-white p-4 shadow">
				<div class="flex items-start justify-between">
					<div>
						<p class="font-semibold">Order #{order.id.slice(0, 8)}</p>
						<p class="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
					</div>
					<div class="text-right">
						<p class="font-bold">${(order.totalAmount / 100).toFixed(2)}</p>
						<span
							class="rounded-full px-2 py-1 text-xs bg-{order.status === 'paid'
								? 'green'
								: 'gray'}-100"
						>
							{order.status}
						</span>
					</div>
				</div>
				<div class="mt-2">
					<a href="/account/orders/{order.id}" class="text-sm text-blue-600 hover:underline">
						View Details
					</a>
				</div>
			</div>
		{/each}
	</div>
</div>
```

---

### 3.2 Order Details Page Load

**File**: `src/routes/(app)/account/orders/[id]/+page.server.ts`

```typescript
import type { PageServerLoad } from './$types';
import { getOrderDetails } from '$lib/features/payments/server/queries';
import { error } from '@sveltejs/kit';

/**
 * Load order details
 * Following backend-architecture.md pattern (page loads for queries)
 */
export const load: PageServerLoad = async ({ params, locals }) => {
	const session = await locals.auth();
	if (!session?.user) {
		throw redirect(302, '/login');
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
```

---

### 3.3 Using Remote Function in Component

**File**: `src/routes/(public)/post-a-job/+page.svelte`

```svelte
<script lang="ts">
	import { createOrderRemote } from '$lib/features/payments/actions/create-order.remote';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);

	async function handleCheckout() {
		loading = true;
		error = null;

		try {
			// Call remote function - fully type-safe!
			const result = await createOrderRemote({
				items: [
					{ productId: 'job_posting_base', quantity: 1, metadata: { jobId: data.jobId } },
					// Add selected upsells
					...selectedUpsells.map((id) => ({ productId: id, quantity: 1 }))
				],
				successUrl: `${window.location.origin}/checkout/success`,
				cancelUrl: `${window.location.origin}/post-a-job`
			});

			if (result.ok) {
				// Redirect to Stripe checkout
				window.location.href = result.data.checkoutUrl;
			} else {
				error = 'Failed to create checkout session';
			}
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}
</script>

<button onclick={handleCheckout} disabled={loading}>
	{loading ? 'Creating checkout...' : 'Proceed to Payment'}
</button>

{#if error}
	<p class="text-red-600">{error}</p>
{/if}
```

**Benefits of Remote Functions**:

- ✅ Full type safety from server to client
- ✅ Built-in validation (Zod schemas)
- ✅ No need for manual API routes
- ✅ Proper error handling
- ✅ Works with form actions too

---

### 3.4 Webhook Route (API Route)

**File**: `src/routes/api/webhooks/[provider]/+server.ts`

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { processWebhook } from '$lib/features/payments/webhooks.server';

export const POST: RequestHandler = async ({ request, params }) => {
	const { provider } = params;

	try {
		await processWebhook(request, provider);
		return json({ received: true });
	} catch (error) {
		console.error('Webhook processing error:', error);
		return json({ error: 'Processing failed' }, { status: 500 });
	}
};
```

---

### 3.3 Admin Orders Page

**File**: `src/routes/admin/payments/orders/+page.server.ts`

```typescript
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	const orders = await db.query.orders.findMany({
		orderBy: (orders, { desc }) => [desc(orders.createdAt)],
		limit: 50,
		with: {
			payments: true
		}
	});

	return { orders };
};
```

**File**: `src/routes/admin/payments/orders/+page.svelte`

```svelte
<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto p-6">
	<h1 class="mb-6 text-2xl font-bold">Orders</h1>

	<div class="overflow-hidden rounded-lg bg-white shadow">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#each data.orders as order}
					<tr>
						<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
							{order.id}
						</td>
						<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
							${(order.totalAmount / 100).toFixed(2)}
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<span
								class="rounded-full px-2 py-1 text-xs bg-{order.status === 'paid'
									? 'green'
									: 'gray'}-100"
							>
								{order.status}
							</span>
						</td>
						<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
							{new Date(order.createdAt).toLocaleDateString()}
						</td>
						<td class="px-6 py-4 text-sm whitespace-nowrap">
							<a href="/admin/payments/orders/{order.id}" class="text-blue-600 hover:text-blue-900">
								View
							</a>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
```

---

## Phase 4: CLI Tools (Week 3)

### 4.1 Sync Products to Stripe

**File**: `scripts/payments/sync-products.ts`

```typescript
#!/usr/bin/env tsx
import Stripe from 'stripe';
import { getPaymentsConfig } from '$lib/config/payments';
import { env } from '$env/dynamic/private';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

async function syncProducts() {
	const config = getPaymentsConfig();

	console.log('🔄 Syncing products to Stripe...\n');

	// 1. Sync job posting base
	console.log('Creating job posting base product...');
	const jobPostingProduct = await stripe.products.create({
		name: 'Job Posting',
		description: `${config.jobPosting.duration}-day job listing`
	});

	const jobPostingPrice = await stripe.prices.create({
		product: jobPostingProduct.id,
		unit_amount: config.jobPosting.price,
		currency: config.jobPosting.currency.toLowerCase()
	});

	console.log(`✅ Job Posting: ${jobPostingProduct.id} / ${jobPostingPrice.id}`);
	console.log(`   Add to .env:`);
	console.log(`   STRIPE_PRODUCT_JOB_POSTING_BASE=${jobPostingProduct.id}`);
	console.log(`   STRIPE_PRICE_JOB_POSTING_BASE=${jobPostingPrice.id}\n`);

	// 2. Sync upsells
	for (const upsell of config.upsells) {
		if (!upsell.enabled) continue;

		console.log(`Creating upsell: ${upsell.id}...`);
		const product = await stripe.products.create({
			name: `Upsell: ${upsell.id}`,
			description: `Job posting upsell`
		});

		const price = await stripe.prices.create({
			product: product.id,
			unit_amount: upsell.price,
			currency: config.jobPosting.currency.toLowerCase()
		});

		console.log(`✅ ${upsell.id}: ${product.id} / ${price.id}`);
		console.log(`   Add to .env:`);
		console.log(`   STRIPE_PRODUCT_UPSELL_${upsell.id.toUpperCase()}=${product.id}`);
		console.log(`   STRIPE_PRICE_UPSELL_${upsell.id.toUpperCase()}=${price.id}\n`);
	}

	console.log('✅ Sync complete!');
}

syncProducts().catch(console.error);
```

**Usage**: `pnpm run payments:sync`

---

### 4.2 Test Webhook Locally

**File**: `scripts/payments/test-webhook.ts`

```typescript
#!/usr/bin/env tsx
import { processWebhook } from '$lib/features/payments/webhooks.server';

async function testWebhook() {
	// Create mock webhook request
	const mockEvent = {
		id: 'evt_test',
		type: 'checkout.session.completed',
		data: {
			id: 'cs_test',
			payment_intent: 'pi_test',
			customer: 'cus_test',
			metadata: {
				orderId: 'test-order-id',
				userId: 'test-user-id'
			}
		}
	};

	console.log('🧪 Testing webhook handling...\n');
	console.log('Event:', mockEvent);

	// Process webhook (bypassing signature verification for testing)
	// Implementation here

	console.log('✅ Webhook test complete!');
}

testWebhook().catch(console.error);
```

**Usage**: `pnpm run payments:test-webhook`

---

## Environment Variables

**File**: `.env.example`

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Product/Price IDs (auto-generated by `pnpm run payments:sync`)
STRIPE_PRODUCT_JOB_POSTING_BASE=prod_...
STRIPE_PRICE_JOB_POSTING_BASE=price_...

STRIPE_PRODUCT_UPSELL_EMAIL_BLAST=prod_...
STRIPE_PRICE_UPSELL_EMAIL_BLAST=price_...

STRIPE_PRODUCT_UPSELL_PRIORITY=prod_...
STRIPE_PRICE_UPSELL_PRIORITY=price_...

# App URL (for checkout redirects)
PUBLIC_APP_URL=http://localhost:5173
```

---

## Package Scripts

**File**: `package.json` (add these scripts)

```json
{
	"scripts": {
		"payments:sync": "tsx scripts/payments/sync-products.ts",
		"payments:test-webhook": "tsx scripts/payments/test-webhook.ts"
	}
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// src/lib/features/payments/checkout.server.test.ts
describe('createCheckoutSession', () => {
	it('should create checkout session with correct line items', async () => {
		// Test implementation
	});

	it('should throw error if order not found', async () => {
		// Test implementation
	});
});

// src/lib/features/payments/webhooks.server.test.ts
describe('processWebhook', () => {
	it('should handle payment succeeded event', async () => {
		// Test implementation
	});

	it('should be idempotent (handle duplicate webhooks)', async () => {
		// Test implementation
	});
});
```

### Integration Tests

```typescript
// tests/integration/payment-flow.test.ts
describe('Payment Flow', () => {
	it('should complete job posting purchase end-to-end', async () => {
		// 1. Create order
		// 2. Create checkout session
		// 3. Simulate webhook
		// 4. Verify job published
	});
});
```

---

## User Customization Examples

### Example 1: Add Custom Logic After Payment

**File**: User's `src/lib/payments-setup.ts`

```typescript
import { getPaymentSystem } from '$lib/features/payments/system.server';
import { sendEmail } from '$lib/server/email';

// Register custom handler
const paymentSystem = getPaymentSystem();

paymentSystem.on('payment.succeeded', async ({ order, payment }) => {
	// Send custom email notification
	await sendEmail({
		to: order.userId,
		subject: 'Payment Received!',
		body: `Thank you for your payment of $${payment.amount / 100}`
	});

	// Track analytics
	await analytics.track('payment_succeeded', {
		orderId: order.id,
		amount: payment.amount
	});
});
```

### Example 2: Override Default Fulfillment

**File**: User's `src/lib/payments-setup.ts`

```typescript
import { getPaymentSystem } from '$lib/features/payments/system.server';

const paymentSystem = getPaymentSystem();

// Override default job posting handler
paymentSystem.on('payment.succeeded', async ({ order, payment }) => {
	for (const item of order.items) {
		if (item.metadata.type === 'job_posting') {
			// Custom fulfillment logic
			await customPublishJob(item.metadata.jobId, {
				requireApproval: true, // Custom: require manual approval
				sendNotification: true
			});
		}
	}
});
```

### Example 3: Add Custom Product Type

**File**: User's `payments.config.ts`

```typescript
export const paymentsConfig = {
	// ... existing config

	// Custom product type
	customProducts: [
		{
			id: 'featured_company_profile',
			price: 29900, // $299
			duration: 90,
			stripe: {
				productId: process.env.STRIPE_PRODUCT_FEATURED_PROFILE,
				priceId: process.env.STRIPE_PRICE_FEATURED_PROFILE
			}
		}
	]
};
```

---

## Migration Guide (for existing users)

### Step 1: Backup Database

```bash
pg_dump jobboard > backup.sql
```

### Step 2: Run Migrations

```bash
pnpm run db:generate
pnpm run db:push
```

### Step 3: Configure Products

```bash
# Copy example config
cp src/lib/config/payments/payments.config.example.ts src/lib/config/payments/payments.config.ts

# Edit config with your prices
# vim src/lib/config/payments/payments.config.ts
```

### Step 4: Sync to Stripe

```bash
pnpm run payments:sync
```

### Step 5: Update Environment Variables

```bash
# Copy output from sync command to .env
```

### Step 6: Test

```bash
pnpm run payments:test-webhook
```

---

## Documentation

### For End Users

**File**: `docs/payments-setup.md`

````markdown
# Payment Setup Guide

## Quick Start

1. **Configure products**
   Edit `src/lib/config/payments/payments.config.ts`

2. **Sync to Stripe**
   ```bash
   pnpm run payments:sync
   ```
````

3. **Add environment variables**
   Copy output from sync command to `.env`

4. **Test webhooks**
   ```bash
   pnpm run payments:test-webhook
   ```

## Customization

### Adding Custom Logic

Create `src/lib/payments-setup.ts`:

```typescript
import { getPaymentSystem } from '$lib/features/payments/system.server';

const paymentSystem = getPaymentSystem();

paymentSystem.on('payment.succeeded', async (ctx) => {
  // Your custom logic here
});
```

```

---

## Success Criteria

### ✅ Phase 1 Complete When:
- [ ] Config system working (with validation)
- [ ] Payment types defined
- [ ] Stripe adapter implemented
- [ ] Database migrations run
- [ ] All tests passing

### ✅ Phase 2 Complete When:
- [ ] Checkout sessions creating successfully
- [ ] Webhooks processing correctly
- [ ] Job postings publishing after payment
- [ ] Idempotency working (duplicate webhooks handled)
- [ ] Error handling robust

### ✅ Phase 3 Complete When:
- [ ] API routes functional
- [ ] Admin UI displaying orders
- [ ] Refunds working
- [ ] All integration tests passing

### ✅ Phase 4 Complete When:
- [ ] CLI tools working
- [ ] Documentation complete
- [ ] User customization examples tested
- [ ] Migration guide verified

---

## Timeline

- **Week 1**: Phase 1 (Foundation)
- **Week 2**: Phase 2 (Core System)
- **Week 3**: Phase 3 (Routes) + Phase 4 (CLI)
- **Week 4**: Testing, documentation, polish

---

## Future Enhancements (Post-v1)

### v2: Credit System (Add-on Package)
- User credits balance
- Credit purchases
- Credit deduction for job postings

### v3: Subscriptions (Add-on Package)
- Monthly/annual plans
- Recurring credits
- Subscription management UI

### v4: Advanced Features
- DodoPayments adapter
- Coupon codes
- Bulk discounts
- Analytics dashboard

---

## Files Summary

### Core Files (Upstream Maintains)
```

src/lib/config/payments/
├── schema.server.ts ← CORE
└── index.ts ← CORE

src/lib/features/payments/
├── types.ts ← CORE
├── system.server.ts ← CORE
├── checkout.server.ts ← CORE
├── webhooks.server.ts ← CORE
├── handlers.server.ts ← CORE
└── adapters/
├── adapter.ts ← CORE
└── stripe.server.ts ← CORE

```

### User Customizes
```

src/lib/config/payments/
└── payments.config.ts ← USER CUSTOMIZES

src/lib/payments-setup.ts ← USER CREATES (optional)

```

### Routes (Minimal Changes Expected)
```

src/routes/api/
├── checkout/+server.ts
└── webhooks/[provider]/+server.ts

src/routes/admin/payments/
└── orders/+page.svelte

```

---

## Key Differences from v1 Architecture

| Aspect | v1 (Original) | v2 (This Plan) |
|--------|---------------|----------------|
| Complexity | 5 layers, 6+ tables | 3 layers, 3 tables |
| Product Definition | Hardcoded in ProductRegistry | Config file |
| Extensibility | Switch statements | Event handlers |
| DB Enums | PostgreSQL enums | Text fields + Zod |
| Customization | Edit core files | Edit config + hooks |
| Merge Conflicts | High risk | Low risk |
| Scope | Job postings + subscriptions + credits | Job postings only |
| Timeline | 3 weeks (ambitious) | 3 weeks (realistic) |

---

## Notes

- **Keep it simple**: Job postings only for v1
- **Config-driven**: Users edit config, not core
- **Event-based**: Hooks instead of switch statements
- **DI over singletons**: Better testability
- **CLI tools**: Make setup easy
- **Clear boundaries**: Mark what's core vs customizable
- **Merge-friendly**: Upstream updates won't conflict

This is a **starter-friendly** architecture that's easy to understand, customize, and merge! 🚀

---

## Backend Architecture Alignment ✅

This payment system now fully follows `docs/backend-architecture.md` patterns:

### Feature-First Organization
```

lib/features/payments/
├── server/ # SvelteKit protected
│ ├── repository.ts # ✅ Data access layer
│ ├── queries.ts # ✅ Complex reads
│ ├── mutations.ts # ✅ Write logic
│ ├── checkout.ts
│ ├── webhooks.ts
│ ├── handlers.ts
│ ├── system.ts
│ └── adapters/
├── actions/ # ✅ Remote functions
│ └── create-order.remote.ts
├── components/ # UI components (if any)
├── validators.ts # ✅ SHARED (client + server)
├── types.ts # ✅ SHARED (client + server)
└── index.ts # Public exports

```

### Data Flow Patterns
- ✅ **Page loads** for queries (getUserOrders, getOrderDetails)
- ✅ **Remote functions** for mutations (createOrderRemote)
- ✅ **API routes** ONLY for webhooks (external provider callbacks)
- ❌ No `/api/checkout` route (replaced with remote function)

### Repository Pattern
- ✅ Lightweight data access layer (`paymentsRepository`)
- ✅ Encapsulates all database queries
- ✅ Easy to test and mock
- ✅ Returns domain objects, not raw SQL

### Query/Mutation Split
- ✅ `queries.ts` - Read operations (getOrderDetails, getUserOrders)
- ✅ `mutations.ts` - Write operations (createOrder, markOrderPaid)
- ✅ Clear separation of concerns
- ✅ Business logic in mutations, not repository

### Shared Validators
- ✅ `validators.ts` can be used on client AND server
- ✅ Zod schemas for all input validation
- ✅ Type-safe with automatic type inference
- ✅ Integrated with remote functions

### Type Safety Throughout
- ✅ Types exported from database schema
- ✅ Re-used across all layers
- ✅ Full type inference from server to client
- ✅ No type assertions or `any` types

### File Naming
- ✅ Kebab-case for all files
- ✅ No `.server.ts` suffix in `server/` folder (redundant)
- ✅ `.remote.ts` suffix for remote functions (clear intent)

**Result**: Fully consistent with existing codebase patterns! 🎉
```
