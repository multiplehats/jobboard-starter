# Project Documentation

# Project Standards

## Package Manager

- Use `pnpm` as package manager

## TypeScript

- Use `pnpm run check` to run check for Typescript errors
- It's mandatory to have zero errors, and no use of `any` unless absolutely necessary (in which case justify it in a comment)

## Icons

`lucide-svelte` does NOT exist, use `@lucide/svelte` instead. Always import the full path, e.g.:

```typescript
import ZapIcon from '@lucide/svelte/icons/zap';
```

## Quick Links

- **[SEO Architecture](./docs/seo-architecture.md)** - SEO meta tags implementation
- **[Backend Architecture](./docs/backend-architecture.md)** - Complete backend architecture guide
- **[Modal Stack](./docs/modal-stack.md)** - Modal management system
- **[Type System Template](./docs/type-system-template.md)** - Creating types for new features
- **[Pricing Configuration](./PRICING_CONFIG.md)** - Job posting pricing and upsells configuration
- **[Payment Architecture](./PAYMENT_ARCHITECTURE.md)** - Complete payment system design (job postings, subscriptions, credits)

# Svelte MCP Server

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

## Architecture Overview

### Core Technologies

- **Framework**: SvelteKit with Svelte 5
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: shadcn-svelte + Tailwind CSS
- **Package Manager**: pnpm

### Key Architectural Patterns

1. **Feature-First Organization** - All code for a feature lives in one directory
2. **Type Safety** - End-to-end TypeScript with Zod validation
3. **Server-First Data Flow** - Page loads for queries, remote functions for mutations
4. **DRY SEO** - Three-layer SEO configuration system
5. **Centralized Modals** - Promise-based modal stack

## Documentation Index

### Getting Started

- **Standards**: See [docs/standards.md](./docs/standards.md) for project standards
- **Backend Architecture**: See [docs/backend-architecture.md](./docs/backend-architecture.md) for complete backend guide

### Development

- **Filtering**: See [docs/filtering.md](./docs/filtering.md) for filtering implementation
- **Type System**: See [docs/type-system-template.md](./docs/type-system-template.md) for creating types
- **Analytics**: See [docs/analytics.md](./docs/analytics.md) for event tracking
- **Analytics Proxy**: See [docs/analytics-proxy.md](./docs/analytics-proxy.md) for proxy setup

### UI Components

- **Modal Stack**: See [docs/modal-stack.md](./docs/modal-stack.md) for modal management
- **Tiptap Editor**: See [docs/tiptap-editor.md](./docs/tiptap-editor.md) for rich text editing
- **shadcn-svelte**: Use context7 MCP to check documentation

### SEO & Meta Tags

- **SEO Architecture**: See [docs/seo-architecture.md](./docs/seo-architecture.md)
- **Detailed Plan**: See [tasks/seo-meta-tags-architecture.md](./tasks/seo-meta-tags-architecture.md)

### Svelte Development

- **Svelte MCP**: See [docs/svelte-mcp.md](./docs/svelte-mcp.md) for MCP tools

## Quick Reference

### Adding a New Feature

1. Create feature folder: `src/lib/features/<feature-name>/`
2. Add database schema: `src/lib/server/db/schema/<feature>.ts`
3. Generate migration: `pnpm run db:generate`
4. Create repository, types, validators
5. Add page load functions in routes
6. See [type-system-template.md](./docs/type-system-template.md) for detailed steps

### Adding SEO to a Page

```typescript
// In +page.server.ts
export const load: PageServerLoad = async ({ params, url }) => {
	const data = await fetchData(params.id);

	return {
		data,
		seo: {
			title: data.title,
			description: data.description
		}
	};
};
```

See [seo-architecture.md](./docs/seo-architecture.md) for details.

### Using Modals

```typescript
const modals = useModals();
const result = await modals.push('confirm', { props: {...} }).resolution;
```

See [modal-stack.md](./docs/modal-stack.md) for details.

### Analytics

**Client-Side:**

```typescript
import { clientAnalytics } from '$lib/features/analytics/client';

clientAnalytics.track('website_viewed', {
	websiteId: '123',
	websiteSlug: 'example',
	websiteName: 'Example',
	viewType: 'modal'
});
```

**Server-Side:**

```typescript
import { track, flush } from '$lib/features/analytics/server';

await track(
	event,
	'newsletter_subscribed',
	{
		email: 'user@example.com',
		source: 'newsletter_modal'
	},
	{ email: 'user@example.com' }
);

await flush(); // Always flush in serverless
```

See [analytics.md](./docs/analytics.md) for full guide.

## Development Workflow

```bash
# Start development
pnpm run dev

# Database operations
pnpm run db:studio    # Open Drizzle Studio
pnpm run db:generate  # Generate migrations
pnpm run db:push      # Push schema changes

# Type checking
pnpm run check        # Must have zero errors
```

## Need Help?

- Check the relevant documentation file in [./docs/](./docs/)
- For detailed backend patterns, see [backend-architecture.md](./docs/backend-architecture.md)
- For type system questions, see [type-system-template.md](./docs/type-system-template.md)
