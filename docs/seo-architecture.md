# SEO Meta Tags Architecture

The application uses `svelte-meta-tags` to manage SEO metadata across all pages. The architecture follows a **three-layer configuration system** that eliminates repetition while allowing page-specific overrides.

For detailed implementation plan, see [tasks/seo-meta-tags-architecture.md](../tasks/seo-meta-tags-architecture.md).

## File Structure

```
src/lib/seo/
├── config.ts                    # Global SEO configuration and defaults
├── types.ts                     # TypeScript types for SEO config
├── validators.ts                # Zod schemas for validation
├── utils.ts                     # Helper functions
├── builders/                    # Config builders for specific entities
│   ├── website-seo.ts          # Build SEO from Website entity
│   └── home-seo.ts             # Build SEO for homepage
└── index.ts                     # Public API exports
```

## Three-Layer Configuration System

1. **Layer 1: Global Base Config** (`src/routes/+layout.server.ts`)
   - Site-wide defaults (site name, base URL, default OG images)
   - Twitter card defaults
   - Canonical URL generation
   - Applied to ALL pages automatically

2. **Layer 2: Page-Specific Config** (page `+page.server.ts` files)
   - Return `seo` object from page load function
   - Override base config with page-specific data
   - Use builder utilities for common patterns

3. **Layer 3: Deep Merge** (`src/routes/+layout.svelte`)
   - Combines base + page configs using `deepMerge()`
   - Renders final meta tags with `<MetaTags />` component

## Usage

### Adding SEO to a New Page

1. **In your page load function** (`+page.server.ts`):

```typescript
import { buildWebsiteSEO } from '$lib/seo';

export const load: PageServerLoad = async ({ params, url }) => {
	const data = await fetchYourData(params.id);

	return {
		data,
		seo: {
			title: data.title,
			description: data.description,
			openGraph: {
				images: [{ url: data.imageUrl, width: 1200, height: 630 }]
			}
		}
	};
};
```

2. **That's it!** The layout automatically merges and renders the meta tags.

### Using Builder Utilities

For common patterns, use the builder utilities:

```typescript
// For website detail pages
import { buildWebsiteSEO } from '$lib/seo';

const seo = buildWebsiteSEO(
	{
		title: website.name,
		url: website.slug,
		description: website.metaDescription,
		primaryImageUrl: website.primaryImage
	},
	url
);

// For homepage
import { buildHomeSEO } from '$lib/seo';

const seo = buildHomeSEO({ totalWebsites: count }, url);
```

## Required Fields

Every page **must** provide:

- `title` (string, 1-60 characters)
- `description` (string, 50-160 characters)

TypeScript enforces these requirements at compile time.

## Key Features

- **DRY**: No repetition - base config in one place
- **Type-Safe**: TypeScript + Zod validation
- **Colocated**: SEO config lives with page data
- **Smart Defaults**: Auto-generated canonical URLs, fallback images
- **Easy to Override**: Deep merge allows granular control

## Global Configuration

Edit `src/lib/seo/config.ts` to update site-wide defaults:

```typescript
export const siteConfig = {
	name: 'Landing.Gallery',
	description: 'The biggest landing page library for inspiration',
	url: 'https://landing.gallery'
	// ... other defaults
};
```
