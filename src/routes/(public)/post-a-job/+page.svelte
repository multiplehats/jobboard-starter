<script lang="ts">
	import { submitJobPosting } from '$lib/features/jobs/actions/post-job.remote.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Section from '$lib/components/ui/section';
	import * as Intro from '$lib/components/ui/intro';
	import { jobTypesList } from '$lib/features/jobs/constants';
	import PrefillFromUrlAction from '$lib/features/jobs/components/prefill-from-url-action.svelte';
	import type { PrefillResult } from '$lib/features/jobs/actions/prefill-from-url.remote';
	import { page } from '$app/state';
	import { magicalTextReveal } from '$lib/utils/motion.js';
	import { tick } from 'svelte';
	import { parseDate, getLocalTimeZone, type CalendarDate } from '@internationalized/date';
	import type { PageData } from './$types';
	import { SvelteSet } from 'svelte/reactivity';

	// Import extracted components
	import {
		JobInformationSection,
		LocationSection,
		WorkingPermitsSection,
		SalarySection,
		CompanyInformationSection,
		UpsellsSection
	} from '$lib/features/jobs/components/job-posting/form-sections';
	import { OrderSummary } from '$lib/features/jobs/components/job-posting/preview';
	import type { PublicJobPostingFields } from '$lib/features/jobs/components/job-posting/types';
	import { useDraftManager } from '$lib/features/jobs/components/job-posting/draft/use-draft-manager.svelte';

	// Icons
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';

	// Get page data (includes pricing config with translated upsells)
	let { data }: { data: PageData } = $props();

	// Pricing configuration from server
	const pricing = data.pricing;
	const BASE_PRICE = pricing.price;
	const ENABLED_UPSELLS = pricing.upsells.filter((u) => u.enabled);

	// Job type options (for preview data)
	const jobTypes = jobTypesList();

	// Pure UI state (not duplicating form fields)
	let selectedUpsells = $state<Set<string>>(new Set());

	// Initialize draft manager with simplified rune-based approach
	const draftManager = useDraftManager({
		form: submitJobPosting,
		getUIState: () => ({
			selectedUpsells
		}),
		setUIState: (state) => {
			selectedUpsells = state.selectedUpsells;
		}
	});

	// Scroll to first field with error
	function scrollToFirstError() {
		// Wait for the next tick to ensure error messages are rendered
		tick().then(() => {
			// Find the first field with data-invalid="true"
			const firstInvalidField = document.querySelector('[data-invalid="true"]');

			if (firstInvalidField) {
				// Scroll to the field with smooth behavior and offset for header
				firstInvalidField.scrollIntoView({
					behavior: 'smooth',
					block: 'center'
				});

				// Try to focus the first input/textarea/select in the invalid field
				const focusableElement = firstInvalidField.querySelector<HTMLElement>(
					'input:not([type="hidden"]), textarea, select, button'
				);

				if (focusableElement) {
					// Delay focus slightly to ensure scroll completes
					setTimeout(() => {
						focusableElement.focus();
					}, 300);
				}
			}
		});
	}

	// Prefill state
	let prefilledFields = $state<Set<string>>(new Set());
	let isPrefilling = $state(false);

	// Handler for prefill reset
	function handlePrefillReset() {
		// Clear all form fields that were prefilled
		prefilledFields.clear();
		prefilledFields = new SvelteSet(); // Trigger reactivity

		// Reset form fields directly with proper types
		submitJobPosting.fields.job.title.set('');
		submitJobPosting.fields.job.description.set('');
		submitJobPosting.fields.job.appLinkOrEmail.set('');
		submitJobPosting.fields.job.seniority.set([]);
		submitJobPosting.fields.job.applicationDeadline.set('');
		submitJobPosting.fields.locationType.set('remote');
		submitJobPosting.fields.hiringLocation.type.set('worldwide');
		submitJobPosting.fields.hiringLocation.timezones.set([]);
		submitJobPosting.fields.workingPermits.type.set('no-specific');
		submitJobPosting.fields.salary.currency.set('USD');
		submitJobPosting.fields.salary.min.set(50000);
		submitJobPosting.fields.salary.max.set(150000);
		submitJobPosting.fields.organization.name.set('');
		submitJobPosting.fields.organization.url.set('');
		submitJobPosting.fields.organization.logo.set('');
	}

	// Handler for prefill success
	async function handlePrefillSuccess(result: PrefillResult) {
		if (!result.success || !result.data) return;

		isPrefilling = true;
		const data = result.data;
		let animationDelay = 0;
		const delayIncrement = 150; // Stagger animations

		// Wait for next tick to ensure elements are rendered
		await tick();

		// Animate job title
		if (data.job?.title) {
			const titleInput = document.getElementById('job-title') as HTMLInputElement;
			if (titleInput) {
				magicalTextReveal(titleInput, data.job.title, {
					delay: animationDelay,
					charDelay: 20
				});
				prefilledFields.add('job.title');
				animationDelay += delayIncrement;
			}
		}

		// Set job type
		if (data.job?.type) {
			const jobType = data.job.type;
			setTimeout(() => {
				submitJobPosting.fields.job.type.set(jobType);
				prefilledFields.add('job.type');
			}, animationDelay);
			animationDelay += delayIncrement;
		}

		// Set seniority levels
		if (data.job?.seniority && data.job.seniority.length > 0) {
			const seniority = data.job.seniority;
			setTimeout(() => {
				submitJobPosting.fields.job.seniority.set(seniority);
				prefilledFields.add('job.seniority');
			}, animationDelay);
			animationDelay += delayIncrement;
		}

		// Set job description (editor is now managed inside JobInformationSection)
		if (data.job?.description) {
			setTimeout(() => {
				// Store as plain text/HTML - the editor will pick it up
				submitJobPosting.fields.job.description.set(data.job!.description!);
				prefilledFields.add('job.description');
			}, animationDelay);
			animationDelay += delayIncrement;
		}

		// Animate application link/email
		if (data.job?.appLinkOrEmail) {
			const appInput = document.getElementById('job-application') as HTMLInputElement;
			if (appInput) {
				magicalTextReveal(appInput, data.job.appLinkOrEmail, {
					delay: animationDelay,
					charDelay: 15
				});
				prefilledFields.add('job.appLinkOrEmail');
				animationDelay += delayIncrement;
			}
		}

		// Set application deadline
		if (data.job?.applicationDeadline) {
			setTimeout(() => {
				try {
					const deadline = parseDate(data.job!.applicationDeadline!);
					submitJobPosting.fields.job.applicationDeadline.set(
						deadline.toDate(getLocalTimeZone()).toISOString()
					);
					prefilledFields.add('job.applicationDeadline');
				} catch (e) {
					console.error('Failed to parse deadline:', e);
				}
			}, animationDelay);
			animationDelay += delayIncrement;
		}

		// Set location type
		if (data.locationType) {
			setTimeout(() => {
				submitJobPosting.fields.locationType.set(data.locationType!);
				prefilledFields.add('locationType');
			}, animationDelay);
			animationDelay += delayIncrement;
		}

		// Set hiring location
		if (data.hiringLocation?.type) {
			setTimeout(() => {
				submitJobPosting.fields.hiringLocation.type.set(data.hiringLocation!.type!);
				prefilledFields.add('hiringLocation.type');
			}, animationDelay);
			animationDelay += delayIncrement;
		}

		// Set working permits
		if (data.workingPermits?.type) {
			setTimeout(() => {
				submitJobPosting.fields.workingPermits.type.set(data.workingPermits!.type!);
				prefilledFields.add('workingPermits.type');
			}, animationDelay);
			animationDelay += delayIncrement;
		}

		// Animate salary range
		if (data.salary?.min !== undefined || data.salary?.max !== undefined) {
			setTimeout(() => {
				if (data.salary?.min !== undefined) {
					submitJobPosting.fields.salary.min.set(data.salary.min);
					prefilledFields.add('salary.min');
				}
				if (data.salary?.max !== undefined) {
					submitJobPosting.fields.salary.max.set(data.salary.max);
					prefilledFields.add('salary.max');
				}
			}, animationDelay);
			animationDelay += delayIncrement;
		}

		// Set currency
		if (data.salary?.currency) {
			setTimeout(() => {
				submitJobPosting.fields.salary.currency.set(data.salary!.currency!);
				prefilledFields.add('salary.currency');
			}, animationDelay);
			animationDelay += delayIncrement;
		}

		// Animate company name
		if (data.organization?.name) {
			const companyInput = document.getElementById('company-name') as HTMLInputElement;
			if (companyInput) {
				magicalTextReveal(companyInput, data.organization.name, {
					delay: animationDelay,
					charDelay: 20
				});
				prefilledFields.add('organization.name');
				animationDelay += delayIncrement;
			}
		}

		// Animate company URL
		if (data.organization?.url) {
			const urlInput = document.getElementById('company-url') as HTMLInputElement;
			if (urlInput) {
				magicalTextReveal(urlInput, data.organization.url, {
					delay: animationDelay,
					charDelay: 15
				});
				prefilledFields.add('organization.url');
				animationDelay += delayIncrement;
			}
		}

		// Animate company logo
		if (data.organization?.logo) {
			const logoInput = document.getElementById('company-logo') as HTMLInputElement;
			if (logoInput) {
				magicalTextReveal(logoInput, data.organization.logo, {
					delay: animationDelay,
					charDelay: 15,
					onComplete: () => {
						isPrefilling = false;
					}
				});
				prefilledFields.add('organization.logo');
			}
		} else {
			// If no logo, end the prefilling state
			setTimeout(() => {
				isPrefilling = false;
			}, animationDelay);
		}
	}

	// Preview data for order summary (uses form field values directly)
	const previewData = $derived.by(() => {
		const selectedJobType = submitJobPosting.fields.job.type.value();
		const jobTypeLabel = jobTypes.find((t) => t.value === selectedJobType)?.label || 'Full Time';
		return {
			companyName: submitJobPosting.fields.organization.name.value() || 'Your Company Inc.',
			jobTitle: submitJobPosting.fields.job.title.value() || 'Job Title',
			salaryRange: [
				submitJobPosting.fields.salary.min.value() ?? 0,
				submitJobPosting.fields.salary.max.value() ?? 0
			] as [number, number],
			currency: submitJobPosting.fields.salary.currency.value() || 'USD',
			jobType: jobTypeLabel
		};
	});

	// Calculate total price based on selected upsells
	const totalPrice = $derived.by(() => {
		let total = BASE_PRICE;
		ENABLED_UPSELLS.forEach((upsell) => {
			if (selectedUpsells.has(upsell.id)) {
				total += upsell.price;
			}
		});
		return total;
	});
</script>

<Intro.Root>
	<Intro.Title>Post a Job</Intro.Title>
	<Intro.Description>
		Your job post will be pinned to the top and highlighted in relevant search results for {pricing.duration}
		days.
	</Intro.Description>
</Intro.Root>

<Section.Root>
	<Section.Content animate={true} animateDelay={0.45}>
		{#if page.data.config.flags.prefillJobFromURL}
			<PrefillFromUrlAction
				title="Prefill from ATS or Job URL"
				description="Save time by pasting a job URL. We automatically extract job details for you."
				onSuccess={handlePrefillSuccess}
				onReset={handlePrefillReset}
			/>
		{/if}

		<form
			{...submitJobPosting}
			class="w-full"
			onsubmit={(e) => {
				// After form validation runs, scroll to first error if any exist
				setTimeout(() => {
					scrollToFirstError();
				}, 0);
			}}
		>
			<Field.Group>
				<JobInformationSection fields={submitJobPosting.fields as PublicJobPostingFields} />
				<Field.Separator />

				<LocationSection fields={submitJobPosting.fields as PublicJobPostingFields} />
				<Field.Separator />

				<WorkingPermitsSection fields={submitJobPosting.fields as PublicJobPostingFields} />
				<Field.Separator />

				<SalarySection fields={submitJobPosting.fields as PublicJobPostingFields} />
				<Field.Separator />

				<CompanyInformationSection fields={submitJobPosting.fields as PublicJobPostingFields} />
				<Field.Separator />

				{#if ENABLED_UPSELLS.length > 0}
					<UpsellsSection
						fields={submitJobPosting.fields as PublicJobPostingFields}
						bind:selectedUpsells
						enabledUpsells={ENABLED_UPSELLS}
					/>
					<Field.Separator />
				{/if}

				<Field.Field orientation="horizontal">
					<Button type="button" variant="outline" size="lg" onclick={draftManager.saveDraft}>
						Save as Draft
					</Button>
					<Button type="submit" size="lg" class="bg-gradient-to-r from-primary to-primary/80">
						<CheckCircleIcon class="mr-2 size-5" />
						Publish Job Posting
					</Button>
				</Field.Field>
			</Field.Group>
		</form>
	</Section.Content>

	<Section.Sidebar animate={true} animateDelay={0.5}>
		<OrderSummary {pricing} {previewData} {totalPrice} {selectedUpsells} />
	</Section.Sidebar>
</Section.Root>
