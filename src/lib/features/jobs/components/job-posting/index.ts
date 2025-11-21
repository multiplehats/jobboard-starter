/**
 * Job Posting Components
 *
 * Reusable components for creating and managing job postings.
 * Used in both public job posting page and admin panel.
 */

// Form sections
export {
	JobInformationSection,
	LocationSection,
	WorkingPermitsSection,
	SalarySection,
	CompanyInformationSection,
	UpsellsSection
} from './form-sections';

// Preview components
export { OrderSummary, JobPreviewCard, PricingBreakdown } from './preview';

// Draft management
export { DraftManager } from './draft';

// Types
export type {
	PublicJobPostingFields,
	JobInformationSectionProps,
	CompanyInformationSectionProps,
	LocationSectionProps,
	SalarySectionProps,
	WorkingPermitsSectionProps,
	UpsellsSectionProps,
	JobPreviewData,
	JobPreviewCardProps,
	OrderSummaryProps,
	PricingBreakdownProps,
	DraftData,
	DraftManagerProps
} from './types';
