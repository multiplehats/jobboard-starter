# Feature Type System Template

This template demonstrates the **scalable, DRY** approach to creating types for new features.

## Key Principles

1. **Single Source of Truth**: Types derive from database schema
2. **No Manual Duplication**: Use Drizzle's `InferSelectModel`
3. **Reusable Utilities**: Use patterns from `type-helpers.ts`
4. **Clear Naming Convention**: Base → List → Detail
5. **Nullable at Repository, Non-null at Component**: Type narrowing at boundaries

## Quick Template

### 1. Define Database Schema

```typescript
// src/lib/server/db/schema/[feature].ts
export const articles = pgTable('articles', {
	id: serial('id').primaryKey(),
	title: varchar('title', { length: 200 }).notNull(),
	slug: varchar('slug', { length: 200 }).unique().notNull()
	// ... other fields
});
```

### 2. Create Feature Types

```typescript
// src/lib/features/[feature]/types.ts
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import type { InferSelectModel } from 'drizzle-orm';

// Zod Schemas
export const selectArticleSchema = createSelectSchema(articles);
export const insertArticleSchema = createInsertSchema(articles);

// Base Types (Single Source of Truth)
export type Article = z.infer<typeof selectArticleSchema>;
export type NewArticle = z.infer<typeof insertArticleSchema>;

// List View Types (minimal relations)
export type ArticleWithAuthor = Article & {
	author: AuthorListItem | null;
};

// Detail View Types (all relations)
export type ArticleWithAllRelations = DetailItemWithRelations<
	Article,
	{
		author: Author | null;
		comments: Comment[];
		commentCount: number;
	}
>;

// Non-null version for components
export type ArticleDetailData = NonNullable<ArticleWithAllRelations>;
```

### 3. Repository with Explicit Return Types

```typescript
// src/lib/features/[feature]/server/repository.ts
export const articleRepository = {
	async findAllWithAuthor(): Promise<PaginatedResult<ArticleWithAuthor>> {
		// ... implementation
	},

	async findBySlugWithRelations(slug: string): Promise<ArticleWithAllRelations | null> {
		// ... returns null if not found
	}
};
```

### 4. Page Load with Type Narrowing

```typescript
// src/routes/articles/[slug]/+page.server.ts
export const load: PageServerLoad = async ({ params }) => {
	const articleResult = await articleRepository.findBySlugWithRelations(params.slug);

	if (!articleResult) {
		error(404, 'Article not found');
	}

	// Type narrowing: now guaranteed non-null
	const article: ArticleDetailData = articleResult;

	return { article };
};
```

### 5. Component with Non-Null Props

```svelte
<script lang="ts">
	import type { PageData } from './$types';
	import type { ArticleDetailData } from '$lib/features/articles/types';

	let { data }: { data: PageData } = $props();

	// article is guaranteed non-null here
	const article: ArticleDetailData = data.article;
</script>

<h1>{article.title}</h1>
```

## Checklist for New Feature

- [ ] Define database schema in `src/lib/server/db/schema/[feature].ts`
- [ ] Create `types.ts` using this template pattern
- [ ] Use `InferSelectModel` for related entities
- [ ] Create Zod schemas for validation
- [ ] Define List types (minimal relations)
- [ ] Define Detail types (all relations)
- [ ] Add explicit return types to repository methods
- [ ] Use type narrowing in page loads (after `error(404)`)
- [ ] Component props use non-null types
- [ ] Run `pnpm run check` to verify

## Benefits

- **Scalability**: Reusable pattern across all features
- **Maintainability**: Schema changes propagate automatically
- **Type Safety**: Null safety and compiler help
- **Performance**: Only fetch what's needed

For detailed examples and flow diagrams, see [CLAUDE.md](../CLAUDE.md).
