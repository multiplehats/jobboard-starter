# Payment System: Backend Architecture Alignment

**Issue**: The payment system v2 plan doesn't fully align with `docs/backend-architecture.md`

---

## Required Changes

### 1. Feature-First Organization ✅ → ⚠️ Needs Refinement

**Current Plan**:
```
src/lib/features/payments/
├── types.ts
├── system.server.ts
├── checkout.server.ts
├── webhooks.server.ts
├── handlers.server.ts
└── adapters/
```

**Should Be** (following backend-architecture.md):
```
src/lib/features/payments/
├── server/                    # SvelteKit protected
│   ├── repository.ts          # Data access (orders, payments)
│   ├── queries.ts             # Complex reads (order history, stats)
│   ├── mutations.ts           # Writes (createOrder, processPayment)
│   ├── checkout.ts            # Checkout logic
│   ├── webhooks.ts            # Webhook processing
│   ├── handlers.ts            # Payment event handlers
│   └── adapters/
│       ├── adapter.ts
│       └── stripe.ts
├── components/                # UI components (if any)
├── validators.ts              # SHARED (client + server)
├── types.ts                   # SHARED (client + server)
└── index.ts                   # Public API exports
```

---

### 2. Repository Pattern ❌ Missing

**Need to Add**: `lib/features/payments/server/repository.ts`

```typescript
import { db } from '$lib/server/db';
import { orders, payments } from '$lib/server/db/schema/payments';
import { eq } from 'drizzle-orm';

/**
 * Payments Repository
 * Lightweight data access layer for payment-related queries
 */
export const paymentsRepository = {
	// Orders
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

	async createOrder(data: NewOrder) {
		const [order] = await db.insert(orders).values(data).returning();
		return order;
	},

	// Payments
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

	async createPayment(data: NewPayment) {
		const [payment] = await db.insert(payments).values(data).returning();
		return payment;
	},

	async updateOrderStatus(id: string, status: OrderStatus) {
		const [order] = await db
			.update(orders)
			.set({ status, updatedAt: new Date() })
			.where(eq(orders.id, id))
			.returning();
		return order;
	}
};
```

---

### 3. Query/Mutation Split ❌ Missing

**Need to Add**: `lib/features/payments/server/queries.ts`

```typescript
import { paymentsRepository } from './repository';
import type { PaginationParams, PaginatedResult } from '$lib/server/utils/pagination';

/**
 * Payment Queries
 * Complex read operations with business logic
 */

export async function getOrderWithDetails(orderId: string) {
	const order = await paymentsRepository.findOrderById(orderId);
	if (!order) return null;

	// Could join with payments, jobs, etc.
	return order;
}

export async function getUserOrders(
	userId: string,
	pagination?: PaginationParams
): Promise<PaginatedResult<Order>> {
	// Complex query with pagination, filtering, etc.
	// Uses buildPaginatedQuery from backend-architecture.md
}

export async function getOrderStats(userId: string) {
	// Aggregations, stats, etc.
}
```

**Need to Add**: `lib/features/payments/server/mutations.ts`

```typescript
import { paymentsRepository } from './repository';
import { getProductsConfig } from '$lib/config/products';
import { generateId } from '$lib/server/utils/id';
import type { OrderItem } from '../types';

/**
 * Payment Mutations
 * Write operations with business logic and validation
 */

export async function createOrder(userId: string, items: OrderItem[]) {
	const config = getProductsConfig();

	// Calculate total
	let totalAmount = 0;
	for (const item of items) {
		const price = calculateItemPrice(item);
		totalAmount += price * item.quantity;
	}

	// Create order
	return paymentsRepository.createOrder({
		id: generateId('order'),
		userId,
		items,
		totalAmount,
		currency: config.jobPosting.currency,
		status: 'pending'
	});
}

export async function processPaymentSuccess(webhookEvent: WebhookEvent) {
	// Business logic for payment success
	// Uses repository for data access
}
```

---

### 4. Remote Functions for Mutations ❌ Missing

**Current Plan**: Uses API routes for everything

**Should Use** (following backend-architecture.md):
- **Remote functions** for mutations (createOrder, etc.)
- **Page loads** for queries (order history)
- **API routes** ONLY for webhooks (external services)

**Example**: `lib/features/payments/server/mutations.remote.ts`

```typescript
import { form } from '@sveltejs/kit';
import { createOrderSchema } from '../validators';
import { createOrder } from './mutations';

/**
 * Create Order (Remote Function)
 * Type-safe mutation callable from components
 */
export const createOrderRemote = form(createOrderSchema, async (data, { locals }) => {
	const session = await locals.auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const order = await createOrder(session.user.id, data.items);

	// Create checkout session
	const checkout = await createCheckoutSession({
		orderId: order.id,
		successUrl: data.successUrl,
		cancelUrl: data.cancelUrl
	});

	return checkout;
});
```

**Usage in Component**:

```svelte
<script lang="ts">
	import { createOrderRemote } from '$lib/features/payments/server/mutations.remote';

	async function handleSubmit() {
		const result = await createOrderRemote({
			items: [/* ... */],
			successUrl: '/success',
			cancelUrl: '/cancel'
		});

		if (result.ok) {
			window.location.href = result.data.url;
		}
	}
</script>
```

---

### 5. Shared Validators ❌ Missing

**Need to Add**: `lib/features/payments/validators.ts`

```typescript
import { z } from 'zod';

/**
 * Payment Validators
 * SHARED - Can be used on client AND server
 */

export const orderItemSchema = z.object({
	productId: z.string(),
	quantity: z.number().int().positive(),
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

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
```

---

### 6. Kebab-Case Naming ⚠️ Inconsistent

**Fix**:
- `checkout.server.ts` → `checkout.ts` (already in `server/` folder)
- `webhooks.server.ts` → `webhooks.ts`
- `handlers.server.ts` → `handlers.ts`
- Remote functions: `mutations.remote.ts` (follows pattern)

---

### 7. Data Flow Patterns ❌ Not Following

**Current Plan**:
- Uses `/api/checkout` API route

**Should Be**:
- Use **remote function** for createOrder
- Use **page load** for order history
- Use **API route** ONLY for webhooks

**Fix**:

```typescript
// ❌ OLD: API route for checkout
// src/routes/api/checkout/+server.ts
export const POST: RequestHandler = async ({ request, locals }) => {
	// ...
};

// ✅ NEW: Remote function
// lib/features/payments/server/mutations.remote.ts
export const createOrderRemote = form(createOrderSchema, async (data, { locals }) => {
	// ...
});

// ✅ Page load for order history
// routes/(app)/account/orders/+page.server.ts
export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();
	const orders = await getUserOrders(session.user.id);
	return { orders };
};

// ✅ API route ONLY for webhooks
// routes/api/webhooks/[provider]/+server.ts
export const POST: RequestHandler = async ({ request, params }) => {
	// External webhook - can't use remote functions
};
```

---

## Updated File Structure

```
src/
├── lib/
│   ├── features/
│   │   └── payments/
│   │       ├── server/                    # SvelteKit protected
│   │       │   ├── repository.ts          # ✅ Data access
│   │       │   ├── queries.ts             # ✅ Complex reads
│   │       │   ├── mutations.ts           # ✅ Write logic
│   │       │   ├── mutations.remote.ts    # ✅ Remote functions
│   │       │   ├── checkout.ts            # Checkout logic
│   │       │   ├── webhooks.ts            # Webhook processing
│   │       │   ├── handlers.ts            # Event handlers
│   │       │   ├── system.ts              # PaymentSystem class
│   │       │   └── adapters/
│   │       │       ├── adapter.ts
│   │       │       └── stripe.ts
│   │       ├── components/                # UI (if any)
│   │       ├── validators.ts              # ✅ SHARED validation
│   │       ├── types.ts                   # ✅ SHARED types
│   │       └── index.ts                   # Public exports
│   │
│   ├── config/
│   │   └── products/                      # Products config
│   │
│   └── server/
│       └── db/
│           └── schema/
│               └── payments.ts            # Database schema
│
└── routes/
    ├── (app)/
    │   └── account/
    │       └── orders/
    │           └── +page.server.ts        # ✅ Page load (queries)
    │
    ├── (public)/
    │   └── post-a-job/
    │       └── +page.svelte               # ✅ Uses remote function
    │
    └── api/
        └── webhooks/
            └── [provider]/
                └── +server.ts             # ✅ API route (webhooks only)
```

---

## Summary of Changes

### ✅ Add These Files

1. `lib/features/payments/server/repository.ts` - Data access
2. `lib/features/payments/server/queries.ts` - Complex reads
3. `lib/features/payments/server/mutations.ts` - Write logic
4. `lib/features/payments/server/mutations.remote.ts` - Remote functions
5. `lib/features/payments/validators.ts` - Shared validation

### 🔄 Refactor These

1. Move checkout logic to use remote functions
2. Use page loads for order history
3. Split current monolithic files into repository/queries/mutations
4. Remove API routes except webhooks

### 📝 Update Naming

1. Remove `.server` suffix from files in `server/` folder
2. Ensure all files use kebab-case

---

## Benefits of Alignment

✅ **Consistency** - Matches existing backend patterns
✅ **Type Safety** - Remote functions provide full type inference
✅ **Testability** - Repository pattern easy to test/mock
✅ **Maintainability** - Clear separation of concerns
✅ **SvelteKit Native** - Uses built-in features, not workarounds

---

## Next Steps

1. Update `payment-system-v2-plan.md` with this structure
2. Ensure all code examples follow backend architecture
3. Add remote function examples
4. Document page load patterns for order history
5. Keep webhooks as API routes (external, can't use remote functions)
