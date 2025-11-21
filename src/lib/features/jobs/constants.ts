/**
 * Job-related constants that can be used both client and server side.
 * These enum values are the source of truth and are used to create PostgreSQL enums in the schema.
 */

import { generateList } from '$lib/utils/generators';
import * as m from '$lib/paraglide/messages';

// ============================================================================
// Enum Values (source of truth for both client and database)
// ============================================================================

export const LOCATION_TYPES = ['remote', 'hybrid', 'onsite'] as const;
export const JOB_TYPES = ['full_time', 'part_time', 'contract', 'freelance'] as const;
export const JOB_STATUSES = [
	'draft',
	'awaiting_payment',
	'awaiting_approval',
	'published',
	'rejected',
	'expired'
] as const;
export const SENIORITY_LEVELS = [
	'entry-level',
	'mid-level',
	'senior',
	'manager',
	'director',
	'executive'
] as const;
export const HIRING_LOCATION_TYPES = ['worldwide', 'timezone'] as const;
export const WORKING_PERMITS_TYPES = ['no-specific', 'required'] as const;
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] as const;
export const SALARY_PERIODS = ['year', 'month', 'hour'] as const;

// ============================================================================
// TypeScript Types
// ============================================================================

export type LocationType = (typeof LOCATION_TYPES)[number];
export type JobType = (typeof JOB_TYPES)[number];
export type JobStatus = (typeof JOB_STATUSES)[number];
export type SeniorityLevel = (typeof SENIORITY_LEVELS)[number];
export type HiringLocationType = (typeof HIRING_LOCATION_TYPES)[number];
export type WorkingPermitsType = (typeof WORKING_PERMITS_TYPES)[number];
export type Currency = (typeof CURRENCIES)[number];
export type SalaryPeriod = (typeof SALARY_PERIODS)[number];

// ============================================================================
// Generated List Functions (using Paraglide messages from en.json)
// ============================================================================

export const locationTypesList = <K extends string = 'label', V extends string = 'value'>(
	keyName: K = 'label' as K,
	valueName: V = 'value' as V
) =>
	generateList(
		LOCATION_TYPES,
		{
			remote: m['enums.location_types.remote'](),
			hybrid: m['enums.location_types.hybrid'](),
			onsite: m['enums.location_types.onsite']()
		},
		keyName,
		valueName
	);

export const jobTypesList = <K extends string = 'label', V extends string = 'value'>(
	keyName: K = 'label' as K,
	valueName: V = 'value' as V
) =>
	generateList(
		JOB_TYPES,
		{
			full_time: m['enums.job_types.full_time'](),
			part_time: m['enums.job_types.part_time'](),
			contract: m['enums.job_types.contract'](),
			freelance: m['enums.job_types.freelance']()
		},
		keyName,
		valueName
	);

export const jobStatusesList = <K extends string = 'label', V extends string = 'value'>(
	keyName: K = 'label' as K,
	valueName: V = 'value' as V
) =>
	generateList(
		JOB_STATUSES,
		{
			draft: m['enums.job_statuses.draft'](),
			awaiting_payment: m['enums.job_statuses.awaiting_payment'](),
			awaiting_approval: m['enums.job_statuses.awaiting_approval'](),
			published: m['enums.job_statuses.published'](),
			rejected: m['enums.job_statuses.rejected'](),
			expired: m['enums.job_statuses.expired']()
		},
		keyName,
		valueName
	);

export const seniorityLevelsList = <K extends string = 'label', V extends string = 'value'>(
	keyName: K = 'label' as K,
	valueName: V = 'value' as V
) =>
	generateList(
		SENIORITY_LEVELS,
		{
			'entry-level': m['enums.seniority_levels.entry_level'](),
			'mid-level': m['enums.seniority_levels.mid_level'](),
			senior: m['enums.seniority_levels.senior'](),
			manager: m['enums.seniority_levels.manager'](),
			director: m['enums.seniority_levels.director'](),
			executive: m['enums.seniority_levels.executive']()
		},
		keyName,
		valueName
	);

export const hiringLocationTypesList = <K extends string = 'label', V extends string = 'value'>(
	keyName: K = 'label' as K,
	valueName: V = 'value' as V
) =>
	generateList(
		HIRING_LOCATION_TYPES,
		{
			worldwide: m['enums.hiring_location_types.worldwide'](),
			timezone: m['enums.hiring_location_types.timezone']()
		},
		keyName,
		valueName
	);

export const workingPermitsTypesList = <K extends string = 'label', V extends string = 'value'>(
	keyName: K = 'label' as K,
	valueName: V = 'value' as V
) =>
	generateList(
		WORKING_PERMITS_TYPES,
		{
			'no-specific': m['enums.working_permits_types.no_specific'](),
			required: m['enums.working_permits_types.required']()
		},
		keyName,
		valueName
	);

export const currenciesList = <K extends string = 'label', V extends string = 'value'>(
	keyName: K = 'label' as K,
	valueName: V = 'value' as V
) =>
	generateList(
		CURRENCIES,
		{
			USD: m['enums.currencies.usd'](),
			EUR: m['enums.currencies.eur'](),
			GBP: m['enums.currencies.gbp'](),
			CAD: m['enums.currencies.cad'](),
			AUD: m['enums.currencies.aud']()
		},
		keyName,
		valueName
	);

export const salaryPeriodsList = <K extends string = 'label', V extends string = 'value'>(
	keyName: K = 'label' as K,
	valueName: V = 'value' as V
) =>
	generateList(
		SALARY_PERIODS,
		{
			year: m['enums.salary_periods.year'](),
			month: m['enums.salary_periods.month'](),
			hour: m['enums.salary_periods.hour']()
		},
		keyName,
		valueName
	);
