import { describe, it, expect } from 'vitest';
import { buildPublicJobPostingSchema } from './validators';
import {
	REMOTE_FIRST_PRESET,
	LOCAL_ONLY_PRESET,
	HYBRID_FIRST_PRESET
} from '$lib/config/jobs/presets.server';

describe('Dynamic Job Validators', () => {
	const baseJob = {
		job: {
			title: 'Senior Engineer',
			description: 'Great role',
			type: 'full_time' as const,
			seniority: ['senior' as const],
			appLinkOrEmail: 'apply@company.com',
			applicationDeadline: '2025-12-31'
		},
		organization: { name: 'ACME Inc', url: 'https://acme.com' },
		customerEmail: 'recruiter@acme.com',
		selectedUpsells: []
	};

	describe('Remote-First Preset', () => {
		const schema = buildPublicJobPostingSchema(REMOTE_FIRST_PRESET);

		it('allows remote job without city/country', () => {
			const job = {
				...baseJob,
				locationType: 'remote',
				hiringLocation: { type: 'worldwide', timezones: [] },
				workingPermits: { type: 'no-specific', permits: [] },
				salary: { currency: 'USD' }
			};

			expect(() => schema.parse(job)).not.toThrow();
		});

		it('requires city and country for onsite job', () => {
			const job = {
				...baseJob,
				locationType: 'onsite',
				hiringLocation: { type: 'worldwide', timezones: [] },
				workingPermits: { type: 'no-specific', permits: [] },
				salary: { currency: 'USD' }
			};

			expect(() => schema.parse(job)).toThrow(/City is required/);
		});

		it('accepts onsite job with city and country', () => {
			const job = {
				...baseJob,
				locationType: 'onsite',
				city: 'San Francisco, CA',
				country: 'US',
				hiringLocation: { type: 'worldwide', timezones: [] },
				workingPermits: { type: 'no-specific', permits: [] },
				salary: { currency: 'USD' }
			};

			expect(() => schema.parse(job)).not.toThrow();
		});

		it('requires city and country for hybrid job', () => {
			const job = {
				...baseJob,
				locationType: 'hybrid',
				hiringLocation: { type: 'worldwide', timezones: [] },
				workingPermits: { type: 'no-specific', permits: [] },
				salary: { currency: 'USD' }
			};

			expect(() => schema.parse(job)).toThrow(/City is required/);
		});

		it('requires timezones when hiring by timezone', () => {
			const job = {
				...baseJob,
				locationType: 'remote',
				hiringLocation: { type: 'timezone', timezones: [] },
				workingPermits: { type: 'no-specific', permits: [] },
				salary: { currency: 'USD' }
			};

			expect(() => schema.parse(job)).toThrow(/timezone is required/);
		});

		it('accepts timezone hiring with timezones', () => {
			const job = {
				...baseJob,
				locationType: 'remote',
				hiringLocation: { type: 'timezone', timezones: ['America/New_York'] },
				workingPermits: { type: 'no-specific', permits: [] },
				salary: { currency: 'USD' }
			};

			expect(() => schema.parse(job)).not.toThrow();
		});

		it('rejects city over 255 characters', () => {
			const job = {
				...baseJob,
				locationType: 'onsite',
				city: 'a'.repeat(256),
				country: 'US',
				hiringLocation: { type: 'worldwide', timezones: [] },
				workingPermits: { type: 'no-specific', permits: [] },
				salary: { currency: 'USD' }
			};

			expect(() => schema.parse(job)).toThrow(/under 255 characters/);
		});

		it('rejects invalid country code', () => {
			const job = {
				...baseJob,
				locationType: 'onsite',
				city: 'San Francisco',
				country: 'USA', // Should be "US" (2 letters)
				hiringLocation: { type: 'worldwide', timezones: [] },
				workingPermits: { type: 'no-specific', permits: [] },
				salary: { currency: 'USD' }
			};

			expect(() => schema.parse(job)).toThrow(/2-letter ISO code/);
		});
	});

	describe('Local-Only Preset', () => {
		const schema = buildPublicJobPostingSchema(LOCAL_ONLY_PRESET);

		it('requires city and country for onsite job', () => {
			const job = {
				...baseJob,
				locationType: 'onsite',
				salary: { currency: 'USD' }
			};

			expect(() => schema.parse(job)).toThrow(/City is required/);
		});

		it('accepts onsite job with city and country', () => {
			const job = {
				...baseJob,
				locationType: 'onsite',
				city: 'New York, NY',
				country: 'US',
				salary: { currency: 'USD' }
			};

			expect(() => schema.parse(job)).not.toThrow();
		});

		it('schema only allows onsite location type', () => {
			const job = {
				...baseJob,
				locationType: 'remote' as any, // Should fail - not allowed
				city: 'New York',
				country: 'US',
				salary: { currency: 'USD' }
			};

			expect(() => schema.parse(job)).toThrow();
		});

		it('does not include hiringLocation in schema', () => {
			const job = {
				...baseJob,
				locationType: 'onsite',
				city: 'New York',
				country: 'US',
				hiringLocation: { type: 'worldwide', timezones: [] }, // Should be ignored
				salary: { currency: 'USD' }
			};

			const result = schema.parse(job);
			expect(result).not.toHaveProperty('hiringLocation');
		});
	});

	describe('Hybrid-First Preset', () => {
		const schema = buildPublicJobPostingSchema(HYBRID_FIRST_PRESET);

		it('requires city and country for hybrid job', () => {
			const job = {
				...baseJob,
				locationType: 'hybrid',
				hiringLocation: { type: 'worldwide', timezones: [] },
				workingPermits: { type: 'no-specific', permits: [] },
				salary: { currency: 'USD' }
			};

			expect(() => schema.parse(job)).toThrow(/City is required/);
		});

		it('accepts hybrid job with city and country', () => {
			const job = {
				...baseJob,
				locationType: 'hybrid',
				city: 'Austin, TX',
				country: 'US',
				hiringLocation: { type: 'worldwide', timezones: [] },
				workingPermits: { type: 'no-specific', permits: [] },
				salary: { currency: 'USD' }
			};

			expect(() => schema.parse(job)).not.toThrow();
		});

		it('defaults to hybrid location type', () => {
			const job = {
				...baseJob,
				city: 'Austin, TX',
				country: 'US',
				hiringLocation: { type: 'worldwide', timezones: [] },
				workingPermits: { type: 'no-specific', permits: [] },
				salary: { currency: 'USD' }
			};

			const result = schema.parse(job);
			expect(result.locationType).toBe('hybrid');
		});
	});
});
