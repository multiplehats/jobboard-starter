/**
 * Centralized TypeScript types for job posting form components
 *
 * This file provides properly typed props interfaces for all form section components,
 * preview components, and the draft manager. All types integrate with SvelteKit's
 * RemoteFormFields type system for type-safe form handling.
 */

import type { RemoteFormFields } from '@sveltejs/kit';
import type { PublicJobPostingInput } from '../../validators';
import type { JobType, SeniorityLevel } from '../../constants';
import type { CalendarDate } from '@internationalized/date';
import type { Editor, Content } from '@tiptap/core';
import type { PricingConfig } from '$lib/config/pricing';

/**
 * Type alias for the form fields from the public job posting schema
 */
export type PublicJobPostingFields = RemoteFormFields<PublicJobPostingInput>;

/**
 * Props for the JobInformationSection component
 * Handles job title, type, seniority, description, application method, and deadline
 * Now simplified to work directly with form fields - no intermediate state
 */
export interface JobInformationSectionProps {
	// Properly typed fields from RemoteForm - works directly with .value() and .set()
	fields: PublicJobPostingFields;
}

/**
 * Props for the CompanyInformationSection component
 * Handles company name, URL, logo, and customer email
 */
export interface CompanyInformationSectionProps {
	// Properly typed fields - includes both organization and customerEmail
	fields: PublicJobPostingFields;
}

/**
 * Props for the LocationSection component
 * Handles location type and hiring location constraints
 * Now simplified to work directly with form fields - no intermediate state
 */
export interface LocationSectionProps {
	// Properly typed fields - works directly with .value() and .set()
	fields: PublicJobPostingFields;
}

/**
 * Props for the SalarySection component
 * Handles salary range and currency selection
 * Now simplified to work directly with form fields - no intermediate state
 */
export interface SalarySectionProps {
	// Properly typed fields - works directly with .value() and .set()
	fields: PublicJobPostingFields;
}

/**
 * Props for the WorkingPermitsSection component
 * Handles working permit requirements
 * Now simplified to work directly with form fields - no intermediate state
 */
export interface WorkingPermitsSectionProps {
	// Properly typed fields - works directly with .value() and .set()
	fields: PublicJobPostingFields;
}

/**
 * Props for the UpsellsSection component
 * Handles job posting upgrades/add-ons
 */
export interface UpsellsSectionProps {
	// Properly typed fields
	fields: PublicJobPostingFields;

	// Enabled upsells from pricing config
	enabledUpsells: PricingConfig['jobPosting']['upsells'];

	// UI state (bindable)
	selectedUpsells: Set<string>;

	// Callbacks for state changes (optional - not needed when using $bindable)
	onSelectedUpsellsChange?: (value: Set<string>) => void;
}

/**
 * Preview data structure for job preview card
 */
export interface JobPreviewData {
	companyName: string;
	jobTitle: string;
	salaryRange: [number, number];
	currency: string;
	jobType: string;
}

/**
 * Props for the JobPreviewCard component
 */
export interface JobPreviewCardProps {
	previewData: JobPreviewData;
}

/**
 * Props for the OrderSummary component
 */
export interface OrderSummaryProps {
	pricing: PricingConfig['jobPosting'];
	previewData: JobPreviewData;
	totalPrice: number;
	selectedUpsells: Set<string>;
}

/**
 * Props for the PricingBreakdown component
 */
export interface PricingBreakdownProps {
	pricing: PricingConfig['jobPosting'];
	selectedUpsells: Set<string>;
	totalPrice: number;
	currency: string;
}

/**
 * Draft data structure for local storage persistence
 */
export interface DraftData {
	selectedJobType?: JobType;
	selectedSeniority: SeniorityLevel[];
	selectedLocationType: string;
	selectedHiringLocationType: string;
	selectedTimezones: string[];
	selectedWorkingPermitsType: string;
	selectedCurrency: string;
	salaryRange: [number, number];
	applicationDeadline?: string;
	jobDescriptionJSON: string;
	selectedUpsells: string[];
	formValues: Record<string, unknown>;
}

/**
 * Props for the DraftManager component
 */
export interface DraftManagerProps {
	// Form state
	selectedJobType?: JobType;
	selectedSeniority: SeniorityLevel[];
	selectedLocationType: string;
	selectedHiringLocationType: string;
	selectedTimezones: string[];
	selectedWorkingPermitsType: string;
	selectedCurrency: string;
	salaryRange: [number, number];
	applicationDeadline?: CalendarDate;
	selectedUpsells: Set<string>;

	// Editor state
	jobDescriptionEditor?: Editor;
	jobDescriptionJSON: string;

	// Remote function reference (must have .fields property)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	submitJobPosting: any;

	// Callbacks
	onDraftLoaded?: (draft: DraftData) => void;
	onDraftSaved?: () => void;

	// Children
	children?: import('svelte').Snippet<[{ saveDraft: () => void }]>;
}

/**
 * Props for the PrefillFromUrlAction component
 */
export interface PrefillFromUrlActionProps {
	title: string;
	description: string;
	onHide?: () => void;
	onSuccess?: (result: unknown) => void;
	onReset?: () => void;
}
