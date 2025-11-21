<script lang="ts">
	import { Heading } from '$lib/components/ui/heading/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import JobPreviewCard from './job-preview-card.svelte';
	import PricingBreakdown from './pricing-breakdown.svelte';
	import type { OrderSummaryProps } from '../types';

	let { pricing, previewData, totalPrice, selectedUpsells }: OrderSummaryProps = $props();
	const CURRENCY = pricing.currency;
</script>

<div class="relative flex h-full w-full flex-col bg-muted/40 p-5 pt-8 xl:p-6">
	<div class="flex flex-col items-center">
		<Heading as="h3" size="h4" class="mb-5">Order summary</Heading>
	</div>

	<div class="flex flex-col gap-y-5">
		<PricingBreakdown {pricing} {selectedUpsells} {totalPrice} currency={CURRENCY} />

		<JobPreviewCard {previewData} />

		<Button type="button">Post job for ${totalPrice} {CURRENCY}</Button>
		<div class="w-full border-t border-gray-100"></div>
		<div class="flex flex-col gap-y-5">
			<div>
				<div class="mb-1 flex flex-row items-center gap-x-2">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						class="text-primary-700 h-5 w-5"
						><path
							d="M1 10h22M3 4h18a2 2 0 012 2v12a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2z"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						></path></svg
					>
					<p class="text-base font-medium text-gray-700">Secure checkout powered by Stripe</p>
				</div>
				<p class="text-sm text-gray-600">
					The same payment processor trusted by millions of companies including Amazon, Google,
					and Shopify.
				</p>
			</div>
			<div class="hidden [@media(min-height:760px)]:block">
				<div class="mb-1 flex flex-row items-center gap-x-2">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						class="text-primary-700 h-5 w-5"
						><path
							d="M12.0004 15L12.0004 22M8.00043 7.30813V9.43875C8.00043 9.64677 8.00043 9.75078 7.98001 9.85026C7.9619 9.93852 7.93194 10.0239 7.89095 10.1042C7.84474 10.1946 7.77977 10.2758 7.64982 10.4383L6.08004 12.4005C5.4143 13.2327 5.08143 13.6487 5.08106 13.9989C5.08073 14.3035 5.21919 14.5916 5.4572 14.7815C5.73088 15 6.26373 15 7.32943 15H16.6714C17.7371 15 18.27 15 18.5437 14.7815C18.7817 14.5916 18.9201 14.3035 18.9198 13.9989C18.9194 13.6487 18.5866 13.2327 17.9208 12.4005L16.351 10.4383C16.2211 10.2758 16.1561 10.1946 16.1099 10.1042C16.0689 10.0239 16.039 9.93852 16.0208 9.85026C16.0004 9.75078 16.0004 9.64677 16.0004 9.43875V7.30813C16.0004 7.19301 16.0004 7.13544 16.0069 7.07868C16.0127 7.02825 16.0223 6.97833 16.0357 6.92937C16.0507 6.87424 16.0721 6.8208 16.1149 6.71391L17.1227 4.19423C17.4168 3.45914 17.5638 3.09159 17.5025 2.79655C17.4489 2.53853 17.2956 2.31211 17.0759 2.1665C16.8247 2 16.4289 2 15.6372 2H8.36368C7.57197 2 7.17611 2 6.92494 2.1665C6.70529 2.31211 6.55199 2.53853 6.49838 2.79655C6.43707 3.09159 6.58408 3.45914 6.87812 4.19423L7.88599 6.71391C7.92875 6.8208 7.95013 6.87424 7.96517 6.92937C7.97853 6.97833 7.98814 7.02825 7.99392 7.07868C8.00043 7.13544 8.00043 7.19301 8.00043 7.30813Z"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						></path></svg
					>
					<p class="text-base font-medium text-gray-700">Pinned to the top of search results</p>
				</div>
				<p class="text-sm text-gray-600">
					Pinned jobs appear at the top of our main page and relevant searches, resulting in 20x
					the number of clicks.
				</p>
			</div>
			<div class="hidden [@media(min-height:800px)]:block">
				<div class="mb-1 flex flex-row items-center gap-x-2">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						class="text-primary-700 h-5 w-5"
						><path
							d="M4.5 22v-5m0-10V2M2 4.5h5m-5 15h5M13 3l-1.734 4.509c-.282.733-.423 1.1-.643 1.408a3 3 0 01-.706.707c-.308.219-.675.36-1.408.642L4 12l4.509 1.734c.733.282 1.1.423 1.408.643.273.194.512.433.707.706.219.308.36.675.642 1.408L13 21l1.734-4.509c.282-.733.423-1.1.643-1.408.194-.273.433-.512.706-.707.308-.219.675-.36 1.408-.642L22 12l-4.509-1.734c-.733-.282-1.1-.423-1.408-.642a3 3 0 01-.706-.707c-.22-.308-.36-.675-.643-1.408L13 3z"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						></path></svg
					>
					<p class="text-base font-medium text-gray-700">
						Highlighted border to attract attention
					</p>
				</div>
				<p class="text-sm text-gray-600">
					Paid jobs are highlighted in purple to maximise the number of people who see your job.
				</p>
			</div>
		</div>
	</div>
</div>
