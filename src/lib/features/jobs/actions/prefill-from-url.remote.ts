import { form } from '$app/server';
import { generateText } from 'ai';
import { getFirecrawlClient } from '$lib/server/firecrawl';
import { getOpenRouterClient } from '$lib/server/openrouter';
import { siteConfig } from '$lib/config/site.server';
import { htmlToTiptapJson } from '$lib/utils/tiptap';
import { z } from 'zod';
import {
	JOB_TYPES,
	SENIORITY_LEVELS,
	LOCATION_TYPES,
	HIRING_LOCATION_TYPES,
	WORKING_PERMITS_TYPES,
	CURRENCIES
} from '$lib/features/jobs/constants';

const prefillFromURLSchema = z.object({
	url: z.string().url()
});

/**
 * Schema for extracting job data from a URL using Firecrawl
 * Matches the structure of PublicJobPostingInput where possible
 */
const jobExtractionSchema = {
	type: 'object' as const,
	properties: {
		job: {
			type: 'object' as const,
			properties: {
				title: {
					type: 'string' as const,
					description:
						'The job title in proper title case (e.g., "Senior Software Engineer", not "SENIOR SOFTWARE ENGINEER")'
				},
				type: {
					type: 'string' as const,
					enum: JOB_TYPES,
					description: `Job type: ${JOB_TYPES.join(', ')}`
				},
				seniority: {
					type: 'array' as const,
					items: {
						type: 'string' as const,
						enum: SENIORITY_LEVELS
					},
					description: `Seniority levels (can be multiple): ${SENIORITY_LEVELS.join(', ')}`
				},
				appLinkOrEmail: {
					type: 'string' as const,
					description: 'Application URL or email address for candidates to apply'
				},
				applicationDeadline: {
					type: 'string' as const,
					description: 'Application deadline in ISO date format (YYYY-MM-DD)'
				}
			}
		},
		locationType: {
			type: 'string' as const,
			enum: LOCATION_TYPES,
			description: `Location type: ${LOCATION_TYPES.join(', ')}`
		},
		city: {
			type: 'string' as const,
			description:
				'City and region where the office is located (e.g., "San Francisco, CA" or "London" or "Arnhem") - required for onsite/hybrid positions'
		},
		country: {
			type: 'string' as const,
			description:
				'2-letter ISO 3166-1 alpha-2 country code (e.g., "US", "UK", "NL", "DE", "FR"). IMPORTANT: Must be exactly 2 uppercase letters, NOT full country names like "Nederland" or "United States".'
		},
		hiringLocation: {
			type: 'object' as const,
			properties: {
				type: {
					type: 'string' as const,
					enum: HIRING_LOCATION_TYPES,
					description: 'Whether hiring worldwide or specific timezones'
				},
				timezones: {
					type: 'array' as const,
					items: { type: 'string' as const },
					description: 'List of allowed timezones if type is "timezone"'
				}
			}
		},
		workingPermits: {
			type: 'object' as const,
			properties: {
				type: {
					type: 'string' as const,
					enum: WORKING_PERMITS_TYPES,
					description: 'Whether specific work permits are required'
				},
				permits: {
					type: 'array' as const,
					items: { type: 'string' as const },
					description: 'List of required work permits if type is "required"'
				}
			}
		},
		salary: {
			type: 'object' as const,
			properties: {
				min: {
					type: 'number' as const,
					description: 'Minimum annual salary'
				},
				max: {
					type: 'number' as const,
					description: 'Maximum annual salary'
				},
				currency: {
					type: 'string' as const,
					enum: CURRENCIES,
					description: 'Salary currency'
				}
			}
		},
		organization: {
			type: 'object' as const,
			properties: {
				name: {
					type: 'string' as const,
					description:
						'Company or organization name in proper case (e.g., "Acme Corporation", not "ACME CORPORATION")'
				},
				url: {
					type: 'string' as const,
					description: 'Company website URL'
				},
				logo: {
					type: 'string' as const,
					description: 'Company logo URL (if available)'
				}
			}
		}
	}
};

export type PrefillJobData = {
	job?: {
		title?: string;
		description?: string;
		type?: (typeof JOB_TYPES)[number];
		seniority?: Array<(typeof SENIORITY_LEVELS)[number]>;
		appLinkOrEmail?: string;
		applicationDeadline?: string;
	};
	locationType?: (typeof LOCATION_TYPES)[number];
	city?: string;
	country?: string;
	hiringLocation?: {
		type?: (typeof HIRING_LOCATION_TYPES)[number];
		timezones?: string[];
	};
	workingPermits?: {
		type?: (typeof WORKING_PERMITS_TYPES)[number];
		permits?: string[];
	};
	salary?: {
		min?: number;
		max?: number;
		currency?: (typeof CURRENCIES)[number];
	};
	organization?: {
		name?: string;
		url?: string;
		logo?: string;
	};
};

export type PrefillResult = {
	success: boolean;
	data?: PrefillJobData;
	filledFields?: string[];
	missingFields?: string[];
	error?: string;
};

/**
 * Helper to truncate long strings for logging
 */
function truncate(str: string | undefined, maxLength = 60): string {
	if (!str) return '(empty)';
	if (str.length <= maxLength) return str;
	return str.substring(0, maxLength) + '...';
}

/**
 * Normalize text that's in ALL CAPS to Title Case
 * Handles special cases like acronyms (USA, UK, etc.)
 */
function normalizeAllCaps(text: string): string {
	if (!text) return text;

	// Check if the entire string is uppercase (with potential spaces, commas, etc.)
	const isAllCaps = text === text.toUpperCase() && text !== text.toLowerCase();

	if (!isAllCaps) return text;

	// List of common acronyms/abbreviations that should stay uppercase
	const keepUppercase = new Set([
		'USA',
		'UK',
		'US',
		'EU',
		'UAE',
		'NYC',
		'LA',
		'SF',
		'DC',
		'IT',
		'HR',
		'CEO',
		'CTO',
		'CFO',
		'AI',
		'ML',
		'API',
		'NL',
		'DE',
		'FR',
		'ES',
		'PT',
		'BE'
	]);

	// Common lowercase words that should not be capitalized in titles
	const lowercaseWords = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);

	// Split by spaces and handle each word
	const words = text.split(' ');
	return words
		.map((word, index) => {
			// Keep punctuation
			const hasTrailingPunctuation = /[,;:.]$/.test(word);
			const cleanWord = word.replace(/[,;:.]$/, '');

			// If it's a known acronym, keep it uppercase
			if (keepUppercase.has(cleanWord)) {
				return word;
			}

			// Check if it's likely a country/state code (2-3 uppercase letters)
			if (cleanWord.length <= 3 && /^[A-Z]+$/.test(cleanWord)) {
				return word;
			}

			// Convert to lowercase first
			const lower = cleanWord.toLowerCase();

			// Keep certain words lowercase unless they're the first word
			if (index !== 0 && lowercaseWords.has(lower)) {
				return hasTrailingPunctuation ? lower + word.slice(-1) : lower;
			}

			// Convert to title case
			const titleCase = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();

			return hasTrailingPunctuation ? titleCase + word.slice(-1) : titleCase;
		})
		.join(' ');
}

/**
 * Pretty print extracted data for debugging
 */
function logExtractedData(data: PrefillJobData): void {
	console.log('\n' + '='.repeat(80));
	console.log('📋 EXTRACTED JOB DATA');
	console.log('='.repeat(80));

	if (data.job) {
		console.log('\n🔹 Job Information:');
		console.log(`  Title: ${truncate(data.job.title, 50)}`);
		console.log(`  Type: ${data.job.type || '(not extracted)'}`);
		console.log(`  Seniority: ${data.job.seniority?.join(', ') || '(not extracted)'}`);
		console.log(`  Apply: ${truncate(data.job.appLinkOrEmail, 40)}`);
		console.log(`  Deadline: ${data.job.applicationDeadline || '(not extracted)'}`);
		if (data.job.description) {
			const descLength = data.job.description.length;
			console.log(`  Description: ${descLength} characters (Tiptap JSON format)`);
		} else {
			console.log(`  Description: (not extracted)`);
		}
	} else {
		console.log('\n🔹 Job Information: (none extracted)');
	}

	console.log('\n🔹 Location Details:');
	console.log(`  Type: ${data.locationType || '(not extracted)'}`);
	console.log(`  City: ${truncate(data.city, 50)}`);
	console.log(`  Country: ${data.country || '(not extracted)'}`);

	if (data.hiringLocation?.type) {
		console.log(`  Hiring: ${data.hiringLocation.type}`);
		if (data.hiringLocation.type === 'timezone' && data.hiringLocation.timezones?.length) {
			console.log(`  Timezones: ${data.hiringLocation.timezones.join(', ')}`);
		}
	} else {
		console.log(`  Hiring: (not extracted)`);
	}

	if (data.workingPermits?.type) {
		console.log('\n🔹 Working Permits:');
		console.log(`  Type: ${data.workingPermits.type}`);
		if (data.workingPermits.type === 'required' && data.workingPermits.permits?.length) {
			console.log(`  Required: ${data.workingPermits.permits.join(', ')}`);
		}
	}

	if (data.salary?.min || data.salary?.max) {
		console.log('\n🔹 Salary:');
		const min = data.salary.min ? `${data.salary.currency || 'USD'} ${data.salary.min.toLocaleString()}` : 'N/A';
		const max = data.salary.max ? `${data.salary.currency || 'USD'} ${data.salary.max.toLocaleString()}` : 'N/A';
		console.log(`  Range: ${min} - ${max}`);
	}

	if (data.organization) {
		console.log('\n🔹 Organization:');
		console.log(`  Name: ${truncate(data.organization.name, 50)}`);
		console.log(`  URL: ${truncate(data.organization.url, 50)}`);
		console.log(`  Logo: ${data.organization.logo ? 'Yes' : 'No'}`);
	}

	console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Takes any URL (does not have to be ATS-specific) and attempts to prefill job data from it.
 * It uses Firecrawl to extract relevant job information.
 */
export const submitPrefillJobFromURL = form(prefillFromURLSchema, async (data) => {
	const { url } = data;

	try {
		const firecrawlClient = await getFirecrawlClient();

		// Use Firecrawl's scrape endpoint with AI extraction
		// Request both markdown (for the job description) and JSON (for structured data)
		const scrapeResult = await firecrawlClient.scrape(url, {
			formats: [
				'markdown',
				{
					type: 'json',
					schema: jobExtractionSchema
				}
			],
			proxy: 'auto'
		});

		if (!scrapeResult.json) {
			return {
				success: false,
				error: 'Failed to scrape the URL. Please check the URL and try again.',
				data: undefined,
				filledFields: [],
				missingFields: []
			} satisfies PrefillResult;
		}

		const extractedData = scrapeResult.json as PrefillJobData;

		// Ensure job object exists for description enrichment
		if (!extractedData.job) {
			extractedData.job = {};
		}

		// Normalize ALL CAPS text fields
		if (extractedData.job?.title) {
			extractedData.job.title = normalizeAllCaps(extractedData.job.title);
		}
		if (extractedData.city) {
			extractedData.city = normalizeAllCaps(extractedData.city);
		}
		if (extractedData.organization?.name) {
			extractedData.organization.name = normalizeAllCaps(extractedData.organization.name);
		}

		// Fix applicationDeadline format: convert ISO timestamp to YYYY-MM-DD
		if (extractedData.job.applicationDeadline) {
			try {
				// Parse the date and extract just the date portion (YYYY-MM-DD)
				const date = new Date(extractedData.job.applicationDeadline);
				if (!isNaN(date.getTime())) {
					// Format as YYYY-MM-DD
					extractedData.job.applicationDeadline = date.toISOString().split('T')[0];
				}
			} catch (error) {
				console.warn('Failed to parse applicationDeadline, leaving as-is:', error);
			}
		}

		// Enrich the job description using AI if enabled and configured
		// Note: We intentionally do NOT fallback to raw markdown because it's typically low quality.
		// Better to leave the description empty for manual entry than to prefill with bad content.
		if (
			siteConfig.flags.enrichDescription &&
			siteConfig.optionalEnv.openRouterApiKey &&
			scrapeResult.markdown
		) {
			try {
				const openrouter = await getOpenRouterClient();

				// Use a fast, cost-effective model for description generation
				const model = openrouter.chat('anthropic/claude-3.5-haiku');

				const { text } = await generateText({
					model,
					prompt: `You are a professional job description writer for a job board platform.
Based on the following scraped content from a job posting URL, create a comprehensive, well-formatted job description in clean HTML format.

The job description should include:
- A brief overview/summary
- Key responsibilities (as a bulleted list)
- Required qualifications/skills (as a bulleted list)
- Nice-to-have qualifications (if mentioned)
- Benefits/perks (if mentioned)
- Any other relevant information

Use semantic HTML formatting:
- <h2> for main section headings (e.g., "Overview", "Responsibilities", "Requirements", "Benefits")
- <p> for paragraphs
- <ul> and <li> for unordered bullet lists
- <strong> for emphasis when appropriate
- <em> for subtle emphasis if needed

IMPORTANT: Generate ONLY the HTML content without any wrapper tags like <html>, <body>, or <div>. Start directly with the content (e.g., <h2>Overview</h2><p>...)

Keep the tone professional but approachable. Focus on what makes this role appealing to candidates.

SCRAPED CONTENT:
${scrapeResult.markdown}

Generate ONLY the HTML job description content, nothing else.`,
					temperature: 0.7
				});

				// Convert HTML to Tiptap JSON format
				const tiptapJson = htmlToTiptapJson(text);
				extractedData.job.description = JSON.stringify(tiptapJson);
				console.log(
					'✓ Job description successfully enriched with AI and converted to Tiptap format'
				);
			} catch (error) {
				// If AI enrichment fails, leave description empty for manual entry
				console.error('✗ Error enriching job description with AI:', error);
				console.log('→ Description will be left empty for manual entry');
				// Don't set description - leave it undefined
			}
		} else {
			// AI enrichment is disabled or not properly configured
			console.log(
				'→ AI enrichment disabled or not configured. Description will be left empty for manual entry.'
			);
			// Don't set description - leave it undefined
		}

		// Log extracted data for debugging
		logExtractedData(extractedData);

		// Analyze what fields were successfully extracted vs missing
		const filledFields: string[] = [];
		const missingFields: string[] = [];

		// Check job fields
		if (extractedData.job?.title) filledFields.push('job.title');
		else missingFields.push('job.title');

		// Description is only filled if AI enrichment succeeds
		if (extractedData.job?.description) filledFields.push('job.description');
		else missingFields.push('job.description');

		if (extractedData.job?.type) filledFields.push('job.type');
		else missingFields.push('job.type');

		if (extractedData.job?.seniority && extractedData.job.seniority.length > 0)
			filledFields.push('job.seniority');
		else missingFields.push('job.seniority');

		if (extractedData.job?.appLinkOrEmail) filledFields.push('job.appLinkOrEmail');
		else missingFields.push('job.appLinkOrEmail');

		if (extractedData.job?.applicationDeadline) filledFields.push('job.applicationDeadline');
		else missingFields.push('job.applicationDeadline');

		// Check salary fields
		if (extractedData.salary?.min !== undefined) filledFields.push('salary.min');
		if (extractedData.salary?.max !== undefined) filledFields.push('salary.max');
		if (extractedData.salary?.currency) filledFields.push('salary.currency');

		// Check organization fields
		if (extractedData.organization?.name) filledFields.push('organization.name');
		else missingFields.push('organization.name');

		if (extractedData.organization?.url) filledFields.push('organization.url');
		else missingFields.push('organization.url');

		if (extractedData.organization?.logo) filledFields.push('organization.logo');

		// Check location fields
		if (extractedData.locationType) filledFields.push('locationType');
		if (extractedData.city) filledFields.push('city');
		if (extractedData.country) filledFields.push('country');
		if (extractedData.hiringLocation?.type) filledFields.push('hiringLocation.type');
		if (extractedData.workingPermits?.type) filledFields.push('workingPermits.type');

		return {
			success: true,
			data: extractedData,
			filledFields,
			missingFields,
			error: undefined
		} satisfies PrefillResult;
	} catch (error) {
		console.error('Error prefilling job from URL:', error);

		let errorMessage = 'An unexpected error occurred while trying to extract job data.';

		if (error instanceof Error) {
			// Handle specific Firecrawl errors
			if (error.message.includes('FIRECRAWL_API_KEY')) {
				errorMessage = 'Firecrawl API key is not configured. Please contact support.';
			} else if (error.message.includes('rate limit')) {
				errorMessage = 'Rate limit exceeded. Please try again in a few moments.';
			} else if (error.message.includes('timeout')) {
				errorMessage = 'Request timed out. The website may be slow or blocking requests.';
			} else {
				errorMessage = `Failed to extract job data: ${error.message}`;
			}
		}

		return {
			success: false,
			error: errorMessage,
			data: undefined,
			filledFields: [],
			missingFields: []
		} satisfies PrefillResult;
	}
});
