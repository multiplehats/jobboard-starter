# Scraper System Documentation

## Overview

The scraper system automatically discovers and imports website inspiration from multiple sources (SaasPo, Land-book, etc.) using Firecrawl's API. It supports infinite scroll, various scraping strategies, and runs daily via cron on Railway.

## Architecture

The scraper follows the **feature-first architecture** pattern, with all code organized under `src/lib/features/scraper/`. It uses the **repository pattern** for database operations and **service layer** for business logic.

### Components

1. **Database Schema** (`src/lib/server/db/schema/scraper.ts`)
   - `scraper_sources`: Configured scraping sources
   - `scraper_queue`: Queue of discovered websites to process

2. **Repository Layer** (`src/lib/features/scraper/server/repository.ts`)
   - All database operations for scraper sources and queue
   - Queue management (add, update status, get stats)
   - Website import operations
   - Handles deduplication and retry logic

3. **Service Layer**
   - **Discovery Service** (`src/lib/features/scraper/server/discovery.service.ts`)
     - Business logic for discovering links from sources
     - Orchestrates adapters and repository
   - **Queue Processor Service** (`src/lib/features/scraper/server/queue-processor.service.ts`)
     - Business logic for processing queue items
     - Integrates with centralized website import system
     - Handles FIFO processing, retries, and error handling

4. **Firecrawl Client** (`src/lib/features/scraper/server/firecrawl-client.ts`)
   - Wrapper around Firecrawl API (@mendable/firecrawl-js)
   - Infinite scroll support
   - Metadata extraction with AI-powered structured data
   - Company information extraction (name, mission, type)

5. **Adapters** (`src/lib/features/scraper/adapters/`)
   - **BaseAdapter**: Abstract base class with common functionality
   - **SaasPoAdapter**: Infinite scroll support for SaasPo.com
   - **CommerceCreamAdapter**: Hybrid approach for CommerceCream.com (Firecrawl for listings, Cheerio for detail pages)
   - **LandingsDevAdapter**: Fully optimized Cheerio-only approach for Landings.dev (no Firecrawl needed!)
   - **LandBookAdapter**: Fully optimized Cheerio-only approach for Land-book.com (no Firecrawl needed!)

6. **CLI Scripts** (`scripts/`)
   - **scraper-discover.ts**: Discovers links from active sources
   - **scraper-process-queue.ts**: Processes queue and imports websites
   - **scraper-add-saaspo.ts**: Adds SaasPo as a scraper source
   - **scraper-add-commercecream.ts**: Adds Commerce Cream as a scraper source
   - **scraper-add-landingsdev.ts**: Adds Landings.dev as a scraper source
   - **scraper-add-landbook.ts**: Adds Land-book as a scraper source

## Setup

### 1. Environment Variables

Add to `.env`:

```env
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
CRON_SECRET=your_secret_for_cron_endpoints
```

### 2. Database Migration

Generate and push the schema:

```bash
pnpm run db:generate
pnpm run db:push
```

### 3. Add Scraper Sources

Add SaasPo as a source:

```bash
pnpm run scraper:add-saaspo
```

Add Commerce Cream as a source:

```bash
pnpm run scraper:add-commercecream
```

Add Landings.dev as a source:

```bash
pnpm run scraper:add-landingsdev
```

Add Land-book as a source:

```bash
pnpm run scraper:add-landbook
```

## Usage

### Discover Links

Discover links from all active sources:

```bash
pnpm run scraper:discover
```

Discover from a specific source:

```bash
pnpm run scraper:discover saaspo          # Discover from SaasPo
pnpm run scraper:discover commercecream   # Discover from Commerce Cream
pnpm run scraper:discover landingsdev     # Discover from Landings.dev
pnpm run scraper:discover landbook        # Discover from Land-book
```

### Process Queue

Process the queue and import websites:

```bash
pnpm run scraper:process-queue      # Process 4 items (default daily limit)
pnpm run scraper:process-queue 10   # Process 10 items
```

The processor:

- Processes items in FIFO order (oldest first)
- Checks if websites are accessible before importing
- Uses the centralized import system with screenshots and metadata
- Handles retries (3 attempts by default) and error logging
- Skips duplicate websites automatically

## Production Setup

### Adding Sources to Production Database

To add Commerce Cream to the production database, you can either:

**Option 1: Run the script with production DATABASE_URL**

```bash
DATABASE_URL="your_production_database_url" pnpm run scraper:add-commercecream
```

**Option 2: SSH into production and run**

```bash
# On Railway or your production server
pnpm run scraper:add-commercecream
```

**Option 3: Manually insert via SQL**

```sql
-- Connect to production database
DATABASE_URL="your_production_database_url" psql

-- Insert Commerce Cream source
INSERT INTO scraper_sources (name, slug, base_url, scraper_type, config, is_active)
VALUES (
  'Commerce Cream',
  'commercecream',
  'https://commercecream.com',
  'pagination',
  '{"maxPages": 50, "excludeDomains": ["commercecream.com", "facebook.com", "twitter.com", "instagram.com", "linkedin.com", "youtube.com", "shopify.com", "pointercreative.com", "themes.shopify.com"]}',
  true
);
```

### Testing in Production

Once added to production:

```bash
# Discover links (will be limited by maxPages in config)
pnpm run scraper:discover commercecream

# Process the queue (will import to production database)
pnpm run scraper:process-queue
```

## Cron Integration (Railway)

The system includes a cron endpoint for automated processing:

### Endpoint

```
POST /api/cron/process-queue
```

**Headers:**

- `Authorization: Bearer {CRON_SECRET}`

**Query Parameters:**

- `limit` (optional): Override default limit of 4 items

**Response:**

```json
{
  "success": true,
  "stats": {
    "processed": 4,
    "imported": 3,
    "skipped": 1,
    "failed": 0
  },
  "processedItems": [...],
  "queueRemaining": 42,
  "dailyLimit": 4
}
```

### Railway Setup

1. Add environment variables:
   - `FIRECRAWL_API_KEY`
   - `CRON_SECRET`

2. Configure cron job in Railway:

   ```bash
   # Run daily at 2am UTC
   0 2 * * * curl -X POST https://your-domain.com/api/cron/process-queue \
     -H "Authorization: Bearer $CRON_SECRET"
   ```

3. Monitor logs for processing results

## Adding New Sources

### 1. Add Source to Database

Create a script similar to `scripts/scraper-add-saaspo.ts`:

```typescript
await repository.insertSource({
	name: 'Land-book',
	slug: 'landbook',
	baseUrl: 'https://land-book.com',
	scraperType: 'pagination', // or 'infinite_scroll', 'homepage_links', 'custom'
	config: {
		// Source-specific configuration
		scrollIterations: 5,
		waitFor: 1000,
		excludeDomains: ['land-book.com', 'facebook.com'],
		maxPages: 2
	},
	isActive: true
});
```

### 2. Create Adapter

Create a new adapter in `src/lib/features/scraper/adapters/`:

```typescript
import { BaseAdapter } from './base-adapter';
import type { DiscoveredWebsite } from '../types';

export class LandBookAdapter extends BaseAdapter {
	async discoverLinks(): Promise<DiscoveredWebsite[]> {
		// Implement discovery logic
		// Use this.firecrawl methods
		// Use this.filterLinks() to clean up
		// Return DiscoveredWebsite[]
	}
}
```

### 3. Register in Discovery Service

Update `src/lib/features/scraper/server/discovery.service.ts` to use the new adapter:

```typescript
if (config.slug === 'landbook') {
	adapter = new LandBookAdapter(config, firecrawlApiKey);
}
```

## Firecrawl Integration

### Key Features

1. **Link Discovery**: `formats: ["links"]` extracts all links from a page
2. **Infinite Scroll**: Uses `waitFor` to load dynamic content
3. **Metadata Extraction**: Scrapes title, description, OG tags, favicon
4. **AI-Powered Structured Data**: Extracts company information using JSON schema
   - Company name and mission
   - Business type detection (SaaS, Open Source, Agency, Personal Website)

### Example: Infinite Scroll

```typescript
const firecrawl = new FirecrawlClient(apiKey);
const links = await firecrawl.scrapeWithInfiniteScroll(
	'https://saaspo.com',
	10, // scroll iterations
	1000 // wait between scrolls (ms)
);
```

### Example: Metadata Extraction

```typescript
const metadata = await firecrawl.scrapeMetadata('https://example.com');
// Returns: {
//   url, title, description, language,
//   ogTitle, ogDescription, ogImageUrl, faviconUrl,
//   companyName, companyMission,
//   isSaas, isOpenSource, isAgency, isPersonalWebsite
// }
```

## Cost Optimization: Hybrid Scraping Approach

For sites that use client-side rendering (JavaScript), we use a cost-effective **hybrid approach** combining Firecrawl and Cheerio:

### Commerce Cream Example

Commerce Cream uses client-side rendering for its listing pages but static HTML for detail pages. The `CommerceCreamAdapter` uses:

1. **Firecrawl for Listing Pages** (unavoidable)
   - Listing pages require JavaScript rendering to display content
   - Used only for extracting site detail page URLs from paginated listings
   - Example: `https://commercecream.com?page=1`

2. **Cheerio for Detail Pages** (cost-efficient!)
   - Detail pages have the "Visit Site ↗" link in static HTML
   - No JavaScript rendering needed - much faster and cheaper
   - Processes 20+ pages in parallel using native `fetch` + Cheerio
   - Example: `https://commercecream.com/sites/collider`

**Cost Savings**: Using Cheerio for detail pages reduces API costs by ~50-70% compared to using Firecrawl for everything.

### Implementation Pattern

```typescript
// Step 1: Use Firecrawl for JavaScript-rendered listing pages
const links = await this.firecrawl.scrapeWithInfiniteScroll(listingUrl, 1, 2000);

// Step 2: Use Cheerio for static HTML detail pages
const html = await fetch(detailUrl).then((r) => r.text());
const $ = cheerio.load(html);
const websiteUrl = $('a:contains("Visit Site")').first().attr('href');
```

### Landings.dev Example (Best Case: 100% Cost Savings!)

Landings.dev is the ideal scenario - it uses static HTML for both listing pages AND detail pages. The `LandingsDevAdapter` uses:

1. **Cheerio for Listing Pages** (pagination)
   - Listing pages have all the `/post/{slug}` links in static HTML
   - No JavaScript rendering needed
   - Example: `https://landings.dev?page=1`

2. **Cheerio for Detail Pages** (website URLs)
   - Detail pages have the "Visit Website" link in static HTML
   - No JavaScript rendering needed
   - Example: `https://landings.dev/post/vite`

**Cost Savings**: Using Cheerio for everything means **ZERO Firecrawl API costs** for discovery! This is the most cost-efficient adapter possible.

### Implementation Pattern

```typescript
// Step 1: Use Cheerio for static HTML listing pages
const html = await fetch(listingUrl).then((r) => r.text());
const $ = cheerio.load(html);
const detailUrls = $('a[href^="/post/"]')
	.map((_, el) => $(el).attr('href'))
	.get();

// Step 2: Use Cheerio for static HTML detail pages
const detailHtml = await fetch(detailUrl).then((r) => r.text());
const $detail = cheerio.load(detailHtml);
const websiteUrl = $detail('a:contains("Visit Website")').first().attr('href');
```

### Land-book Example (Another 100% Cost Savings!)

Land-book.com is another ideal scenario - it uses static HTML for both listing pages AND detail pages. The `LandBookAdapter` uses:

1. **Cheerio for Listing Pages** (pagination)
   - Listing pages have all the `/websites/{id}-{slug}` links in static HTML
   - No JavaScript rendering needed
   - Example: `https://land-book.com?page=1`

2. **Cheerio for Detail Pages** (website URLs)
   - Detail pages have the actual website link in static HTML
   - No JavaScript rendering needed
   - Example: `https://land-book.com/websites/12345-example-site`

3. **Ad Filtering**
   - Filters out framer.link, framer.com, webflow.grsm.io, shopify.pxf.io ads
   - Filters out template marketplaces (lemonsqueezy.com, mediumrare.shop)
   - Removes referral query parameters (?ref=land-book.com)

**Cost Savings**: Using Cheerio for everything means **ZERO Firecrawl API costs** for discovery! This is the most cost-efficient adapter possible.

### Implementation Pattern

```typescript
// Step 1: Use Cheerio for static HTML listing pages
const html = await fetch(listingUrl).then((r) => r.text());
const $ = cheerio.load(html);
const detailUrls = $('a[href^="/websites/"]')
	.map((_, el) => $(el).attr('href'))
	.get();

// Step 2: Use Cheerio for static HTML detail pages
const detailHtml = await fetch(detailUrl).then((r) => r.text());
const $detail = cheerio.load(detailHtml);
// Extract first non-ad link
const websiteUrl = extractFirstValidWebsiteUrl($detail);
```

When adding new sources, always check if you can use Cheerio for some or all pages to reduce costs!

## File Structure

```
src/lib/features/scraper/
├── types.ts                      # TypeScript types
├── server/
│   ├── firecrawl-client.ts      # Firecrawl API wrapper
│   ├── repository.ts             # Database operations (repository pattern)
│   ├── discovery.service.ts      # Discovery business logic
│   └── queue-processor.service.ts # Queue processor business logic
├── adapters/
│   ├── base-adapter.ts           # Abstract base class
│   ├── saaspo-adapter.ts         # SaasPo implementation
│   ├── commercecream-adapter.ts  # Commerce Cream implementation (hybrid approach)
│   ├── landingsdev-adapter.ts    # Landings.dev implementation (fully optimized Cheerio-only)
│   └── landbook-adapter.ts       # Land-book implementation (fully optimized Cheerio-only)

scripts/
├── scraper-discover.ts           # Link discovery CLI
├── scraper-process-queue.ts      # Queue processor CLI
├── scraper-add-saaspo.ts         # Add SaasPo source CLI
├── scraper-add-commercecream.ts  # Add Commerce Cream source CLI
├── scraper-add-landingsdev.ts    # Add Landings.dev source CLI
└── scraper-add-landbook.ts       # Add Land-book source CLI

src/lib/server/db/schema/
└── scraper.ts                    # Database schema (sources & queue)
```

## Integration with Website Import System

The queue processor integrates with the centralized website import system (`src/lib/features/import/`):

1. **Accessibility Check**: Verifies website is online before processing
2. **Full Import**: Uses `importWebsite()` with screenshots and technology detection
3. **Duplicate Handling**: Automatically skips if website already exists
4. **Error Handling**: Retries failed imports (3 attempts by default)

## Next Steps

1. ~~**Add Land-book Adapter**~~ - ✅ Completed! Uses fully optimized Cheerio-only approach (100% cost savings)
2. ~~**Add Commerce Cream Adapter**~~ - ✅ Completed! Uses hybrid Firecrawl + Cheerio approach for cost optimization
3. ~~**Add Landings.dev Adapter**~~ - ✅ Completed! Uses fully optimized Cheerio-only approach (100% cost savings)
4. **Configure Daily Cron** - Set up automatic daily discovery and processing on Railway
5. **Monitoring & Alerts** - Track scraper health and failures via logs
6. **Rate Limiting** - Implement Firecrawl API rate limit handling
7. **Admin UI** - Add admin interface to manage sources and view queue status
8. **Enhanced Metadata** - Store and use company information from Firecrawl extraction

## Troubleshooting

### Firecrawl API Errors

- Check API key is valid
- Verify API rate limits
- Check Firecrawl status page

### No Links Discovered

- Verify source URL is correct
- Check infinite scroll configuration
- Test with fewer scroll iterations
- Inspect Firecrawl response for errors

### Database Errors

- Ensure migrations are up to date
- Check DATABASE_URL is correct
- Verify schema exports

## Resources

- [Firecrawl Documentation](https://docs.firecrawl.dev)
- [Railway Cron Jobs](https://docs.railway.app/guides/cron-jobs)
- [Drizzle ORM](https://orm.drizzle.team)
