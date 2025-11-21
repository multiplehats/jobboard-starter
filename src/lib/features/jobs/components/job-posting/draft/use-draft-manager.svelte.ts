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
import { SvelteSet } from 'svelte/reactivity';
import type { RemoteForm } from '@sveltejs/kit';
import type { CreateJobInput } from '$lib/features/jobs/validators';

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
	 * Uses proper types from RemoteFormFields - both containers and leaf fields
	 * implement RemoteFormFieldMethods which includes set() and value()
	 */
	function setFormValue(path: string, value: unknown) {
		try {
			const keys = path.split('.');

			// Type-safe navigation: Each field object has a set() method via RemoteFormFieldMethods
			// We use a minimal interface type and explicit unknown cast for safe navigation
			type FieldObject = { set(input: unknown): unknown; [key: string]: unknown };
			let current = form.fields as unknown as FieldObject;

			// Navigate to the target field
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				const field = current[key];

				if (field === undefined || field === null) {
					console.warn(`Path not found: ${path} (failed at ${key})`);
					return;
				}

				// If this is the last key, set the value
				if (i === keys.length - 1) {
					if (typeof field === 'object' && field !== null && 'set' in field) {
						(field as FieldObject).set(value);
					} else {
						console.warn(`Field ${path} does not have a set method`);
					}
				} else {
					// Continue navigation
					current = field as FieldObject;
				}
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
	 * Recursively flatten nested object into dot-notation paths
	 */
	function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
		const result: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(obj)) {
			const path = prefix ? `${prefix}.${key}` : key;

			if (value && typeof value === 'object' && !Array.isArray(value)) {
				// Recursively flatten nested objects
				Object.assign(result, flattenObject(value as Record<string, unknown>, path));
			} else {
				// Store primitive values and arrays
				result[path] = value;
			}
		}

		return result;
	}

	/**
	 * Load draft on mount
	 */
	$effect(() => {
		if (!hasLoadedDraft && draftState.current) {
			const draft = draftState.current;

			// 1. Restore form field values first
			if (draft.formValues) {
				// Flatten the nested structure to dot-notation paths
				const flattenedValues = flattenObject(draft.formValues);

				// Set each field value
				Object.entries(flattenedValues).forEach(([path, value]) => {
					setFormValue(path, value);
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
