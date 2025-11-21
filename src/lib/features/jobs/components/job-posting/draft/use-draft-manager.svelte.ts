/**
 * Svelte 5 rune-based draft manager for job posting form
 *
 * Simplified approach that separates concerns:
 * - Form data: All form field values (job, salary, organization, etc.)
 * - UI state: Only non-form state (deadlines as CalendarDate, editor instance, upsells)
 *
 * This avoids duplication since form.fields.value() already gives us all form data.
 */

import { PersistedState } from 'runed';
import { toast } from 'svelte-sonner';
import type { PublicJobPostingFields } from '../types';
import { SvelteSet } from 'svelte/reactivity';
import type { RemoteForm } from '@sveltejs/kit';
import { submitJobPosting } from '$lib/features/jobs/actions/post-job.remote.js';
import type { CreateJobInput, publicJobPostingSchema } from '$lib/features/jobs/validators';

/**
 * Pure UI state that's NOT stored in the form
 */
interface UIState {
	// Selected upsells (stored as Set for UI, array for storage)
	selectedUpsells: Set<string>;
}

/**
 * Draft data structure for localStorage persistence
 */
interface DraftData {
	// All form field values (from form.fields.value())
	formValues: Record<string, unknown>;
	// Pure UI state (not in form)
	uiState: {
		selectedUpsells: string[]; // Stored as array
	};
}

interface DraftManagerOptions {
	// The remote form instance
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	form: RemoteForm<CreateJobInput, any>;

	// Get pure UI state (not form field data)
	getUIState: () => UIState;

	// Set pure UI state (not form field data)
	setUIState: (state: UIState) => void;

	// Callbacks
	onDraftLoaded?: (draft: DraftData) => void;
	onDraftSaved?: () => void;
}

export function useDraftManager(options: DraftManagerOptions) {
	const { form, getUIState, setUIState, onDraftLoaded, onDraftSaved } = options;

	// Persisted state with simplified structure
	const draftState = new PersistedState<DraftData>('job-posting-draft', {
		formValues: {},
		uiState: {
			selectedUpsells: []
		}
	});

	let hasLoadedDraft = $state(false);
	let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

	/**
	 * Get all form field values - simplified using .value()
	 */
	function getFormValues(): Record<string, unknown> {
		try {
			// Simply get all field values using the remote form's built-in method
			return form.fields.value() || {};
		} catch (e) {
			console.error('Failed to get form values:', e);
			return {};
		}
	}

	/**
	 * Set form field values by navigating the field structure
	 */
	function setFormValue(path: string, value: unknown) {
		try {
			const keys = path.split('.');
			let current = form.fields.value();

			for (let i = 0; i < keys.length - 1; i++) {
				current = current[keys[i]];
				if (!current) return;
			}

			const lastKey = keys[keys.length - 1];
			if (current[lastKey]?.value?.set && typeof value === 'string') {
				current[lastKey].value.set(value);
			}
		} catch (e) {
			console.error(`Failed to set form value at ${path}:`, e);
		}
	}

	/**
	 * Auto-save with debouncing
	 */
	function scheduleSave() {
		if (autoSaveTimeout) {
			clearTimeout(autoSaveTimeout);
		}

		autoSaveTimeout = setTimeout(() => {
			const uiState = getUIState();

			draftState.current = {
				formValues: getFormValues(),
				uiState: {
					selectedUpsells: Array.from(uiState.selectedUpsells)
				}
			};
		}, 500);
	}

	/**
	 * Manual save (for button click)
	 */
	function saveDraft() {
		if (autoSaveTimeout) {
			clearTimeout(autoSaveTimeout);
		}

		const uiState = getUIState();

		draftState.current = {
			formValues: getFormValues(),
			uiState: {
				selectedUpsells: Array.from(uiState.selectedUpsells)
			}
		};

		toast.success('Draft saved successfully!', {
			description: 'Your progress has been saved and will be restored when you return.'
		});

		onDraftSaved?.();
	}

	/**
	 * Load draft on mount
	 */
	$effect(() => {
		if (!hasLoadedDraft && draftState.current) {
			const draft = draftState.current;

			// 1. Restore form field values first
			if (draft.formValues) {
				Object.entries(draft.formValues).forEach(([key, value]) => {
					setFormValue(key, value);
				});
			}

			// 2. Restore pure UI state
			const restoredUIState: UIState = {
				selectedUpsells: new SvelteSet(draft?.uiState?.selectedUpsells || [])
			};

			setUIState(restoredUIState);

			hasLoadedDraft = true;
			onDraftLoaded?.(draft);
		}
	});

	/**
	 * Auto-save effect - tracks UI state changes
	 * Simplified to only track pure UI state (not form fields)
	 */
	$effect(() => {
		const uiState = getUIState();

		// Track pure UI state to trigger auto-save
		uiState.selectedUpsells;

		// Don't save on initial load
		if (hasLoadedDraft) {
			scheduleSave();
		}
	});

	return {
		saveDraft,
		hasLoadedDraft: () => hasLoadedDraft
	};
}
