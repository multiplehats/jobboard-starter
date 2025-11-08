# JobBoardStarter Backend Architecture

> **Note**: For filtering implementation details, see [filtering.md](./filtering.md)

## Overview

This document outlines the backend architecture for JobBoardStarter using SvelteKit, Drizzle ORM, and PostgreSQL. We follow a pragmatic approach that balances clean architecture principles with simplicity, avoiding unnecessary complexity while maintaining maintainability and scalability.

## Core Principles

1. **Start Simple, Evolve When Needed**: Begin with straightforward implementations and add abstractions only when complexity demands it
2. **Feature-First Organization**: Group related code by feature rather than technical layers
3. **Type Safety Throughout**: Leverage TypeScript and Zod for end-to-end type safety
4. **Testability Without Overhead**: Structure code to be testable without complex dependency injection
5. **Performance by Default**: Optimize for read-heavy operations typical of inspiration galleries

## Table of Contents

1. [Project Structure](#project-structure)
2. [Layer Definitions](#layer-definitions)
3. [Data Flow Architecture](#data-flow-architecture)
4. [Error Handling](#error-handling)
5. [Pagination Strategy](#pagination-strategy)
6. [Development Workflow](#development-workflow)

For detailed information on:

- **Modal Stack System**: See [modal-stack.md](./modal-stack.md)
- **Type System Template**: See [type-system-template.md](./type-system-template.md)
- **ShadCN Svelte**: Use context7 MCP to check the shadcn-svelte documentation

---

## Project Structure

This architecture uses a **feature-first** approach, where each feature contains all related code (server logic, components, validators, types) in a single directory.

```
src/
├── lib/
│   ├── features/                    # Feature-based organization
│   │   ├── websites/
│   │   │   ├── server/              # Server-only code (SvelteKit protected)
│   │   │   │   ├── repository.ts
│   │   │   │   ├── queries.ts
│   │   │   │   └── mutations.ts
│   │   │   ├── components/          # Feature-specific UI components
│   │   │   ├── validators.ts        # Shared (client + server)
│   │   │   └── types.ts             # Shared (client + server)
│   │   │
│   │   ├── pagebuilders/
│   │   └── [other-features]/
│   │
│   ├── server/                      # Global server-only utilities
│   │   ├── db/
│   │   │   ├── schema/              # Drizzle schema definitions
│   │   │   ├── migrations/          # SQL migrations
│   │   │   └── client.ts            # Database connection
│   │   │
│   │   └── utils/                   # Global server utilities
│   │       ├── errors.ts
│   │       ├── logger.ts
│   │       └── pagination.ts
│   │
│   └── components/                  # Global shared UI components
│       └── ui/                      # ShadCN components
```

### Key Organizational Principles

**Feature Directory Structure:**

```
lib/features/<feature-name>/
├── server/           # Server-only code (protected by SvelteKit)
├── components/       # Feature-specific UI components
├── validators.ts     # SHARED - Use on client AND server
├── types.ts          # SHARED - Use on client AND server
└── index.ts          # Optional - Clean public API exports
```

**Why This Works:**

1. **SvelteKit Native Protection**: Any `server/` folder is automatically protected from client imports
2. **True Feature Cohesion**: Everything related to a feature lives in one place
3. **Clear Boundaries**: `server/` = server-only, `components/` = client-only, root level = shared
4. **Easy Refactoring**: Want to delete/extract a feature? Just move/delete its folder

### Import Path Conventions

**Always use absolute paths with the `$lib` alias:**

```typescript
// ✅ CORRECT
import { websiteRepository } from '$lib/features/websites/server/repository';
import { insertWebsiteSchema } from '$lib/features/websites/validators';

// ❌ AVOID: Relative paths
import { websiteRepository } from './repository';
```

**Benefits:**

- Consistency
- Better IDE support
- Easy to search/refactor
- No `../../../` issues

---

## Layer Definitions

### 1. Database Schema Layer

Drizzle schema definitions that serve as the single source of truth for database structure.

Located in: `lib/server/db/schema/`

```typescript
// lib/server/db/schema/websites.ts
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const websites = pgTable('websites', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').unique().notNull()
	// ... other fields
});

// Auto-generate Zod schemas
export const insertWebsiteSchema = createInsertSchema(websites);
export const selectWebsiteSchema = createSelectSchema(websites);
```

### 2. Repository Layer

Lightweight data access layer that encapsulates database queries.

Located in: `lib/features/*/server/repository.ts`

```typescript
// lib/features/websites/server/repository.ts
export const websiteRepository = {
	async findAll(options?: { limit?: number; offset?: number }) {
		return db
			.select()
			.from(websites)
			.limit(options?.limit ?? 20)
			.offset(options?.offset ?? 0);
	},

	async findById(id: number): Promise<Website | null> {
		const [website] = await db.select().from(websites).where(eq(websites.id, id)).limit(1);
		return website ?? null;
	}
};
```

### 3. Query Layer

Complex read operations that may involve joins, aggregations, or business logic.

Located in: `lib/features/*/server/queries.ts`

### 4. Mutation Layer

Write operations with business logic, validation, and side effects.

Located in: `lib/features/*/server/mutations.ts`

---

## Data Flow Architecture

### Configuration

Enable remote functions in `svelte.config.js`:

```javascript
kit: {
	experimental: {
		remoteFunctions: true;
	}
}
```

### Data Flow Patterns

**For Reading Data (Queries):**

- Use SvelteKit **page loads** (`+page.server.ts` or `+layout.server.ts`)
- Data is loaded server-side and passed to components via `data` prop

**For Writing Data (Mutations):**

- Use SvelteKit **remote functions** (form and command)
- Type-safe, validated mutations callable from components

### Reading Data with Page Loads

```typescript
// routes/websites/+page.server.ts
import type { PageServerLoad } from './$types';
import { websiteRepository } from '$lib/features/websites/server/repository';

export const load: PageServerLoad = async ({ url }) => {
	const limit = Number(url.searchParams.get('limit')) || 20;
	const websites = await websiteRepository.findAll({ limit });

	return { websites };
};
```

**Usage in components:**

```svelte
<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

{#each data.websites as website}
	<article>{website.name}</article>
{/each}
```

### Benefits of This Architecture

1. **Clear Separation**: Page loads for reads, remote functions for writes
2. **Type Safety**: Full type inference from server to client
3. **Built-in Validation**: Zod schemas integrated into remote functions
4. **SSR by Default**: All data loaded server-side automatically

---

## Error Handling

Centralized error handling with custom error classes.

```typescript
// lib/server/utils/errors.ts
export class AppError extends Error {
	constructor(
		message: string,
		public statusCode: number = 500,
		public code?: string
	) {
		super(message);
		this.name = 'AppError';
	}
}

export class NotFoundError extends AppError {
	constructor(resource: string) {
		super(`${resource} not found`, 404, 'NOT_FOUND');
	}
}
```

---

## Pagination Strategy

Standardized pagination approach for all list queries with type-safe helpers.

See [CLAUDE.md](../CLAUDE.md) for detailed pagination implementation including:

- Pagination schemas and types
- Helper functions
- Usage in repositories
- Usage in components

### Quick Example

```typescript
import { getPaginationParams, buildPaginatedQuery } from '$lib/server/utils/pagination';

async findAll(pagination?: PaginationParams): Promise<PaginatedResult<Website>> {
  const query = db.select().from(websites)
    .limit(getPaginationParams(pagination).limit)
    .offset(getPaginationParams(pagination).offset);

  const countQuery = db.select({ count: sql`count(*)` }).from(websites);

  return await buildPaginatedQuery(query, countQuery, pagination);
}
```

---

## Development Workflow

1. **Local Development:**

   ```bash
   pnpm run dev        # Start SvelteKit dev server
   pnpm run db:studio  # Open Drizzle Studio
   ```

2. **Adding New Features:**
   - Create feature folder under `lib/features/` (use kebab-case)
   - Add schema to `lib/server/db/schema/`
   - Generate migration: `pnpm run db:generate`
   - Implement repository, queries, and mutations
   - Add page load functions in routes
   - Write tests alongside implementation

3. **Database Changes:**
   ```bash
   pnpm run db:generate  # Generate migration files
   pnpm run db:migrate   # Apply migrations
   pnpm run db:push      # Push schema changes (dev only)
   ```

---

## Summary

This architecture provides:

- **Simplicity**: No unnecessary abstractions
- **Scalability**: Easy to add complexity where needed
- **Maintainability**: Clear separation of concerns
- **Type Safety**: End-to-end type safety
- **Performance**: Optimized for read-heavy operations

### Recommended Approach

1. **Page Loads for Reads**: Use `+page.server.ts` for all data fetching
2. **Remote Functions for Writes**: Use `form` and `command` functions
3. **Feature-First Organization**: Co-locate all feature code
4. **Kebab-Case File Names**: Use kebab-case for files/folders
5. **Evolve as Needed**: Add abstractions only when complexity demands it
