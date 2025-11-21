/**
 * Common application constants that can be used both client and server side.
 * These enum values are the source of truth and are used to create PostgreSQL enums in the schema.
 */

import { generateList } from '$lib/utils/generators';
import * as m from '$lib/paraglide/messages';

// ============================================================================
// Enum Values (source of truth for both client and database)
// ============================================================================

export const APPLICATION_STATUSES = ['modal_shown', 'cta_clicked', 'external_opened'] as const;
export const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded'] as const;
export const PROFILE_VISIBILITY = ['public', 'private'] as const;

// ============================================================================
// TypeScript Types
// ============================================================================

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type ProfileVisibility = (typeof PROFILE_VISIBILITY)[number];

// ============================================================================
// Generated List Functions (using Paraglide messages from en.json)
// ============================================================================

export const applicationStatusesList = <K extends string = 'label', V extends string = 'value'>(
	keyName: K = 'label' as K,
	valueName: V = 'value' as V
) =>
	generateList(
		APPLICATION_STATUSES,
		{
			modal_shown: m['enums.application_statuses.modal_shown'](),
			cta_clicked: m['enums.application_statuses.cta_clicked'](),
			external_opened: m['enums.application_statuses.external_opened']()
		},
		keyName,
		valueName
	);

export const paymentStatusesList = <K extends string = 'label', V extends string = 'value'>(
	keyName: K = 'label' as K,
	valueName: V = 'value' as V
) =>
	generateList(
		PAYMENT_STATUSES,
		{
			pending: m['enums.payment_statuses.pending'](),
			completed: m['enums.payment_statuses.completed'](),
			failed: m['enums.payment_statuses.failed'](),
			refunded: m['enums.payment_statuses.refunded']()
		},
		keyName,
		valueName
	);

export const profileVisibilityList = <K extends string = 'label', V extends string = 'value'>(
	keyName: K = 'label' as K,
	valueName: V = 'value' as V
) =>
	generateList(
		PROFILE_VISIBILITY,
		{
			public: m['enums.profile_visibility.public'](),
			private: m['enums.profile_visibility.private']()
		},
		keyName,
		valueName
	);
