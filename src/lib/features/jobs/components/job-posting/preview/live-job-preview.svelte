<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import BuildingIcon from '@lucide/svelte/icons/building-2';
	import DollarSignIcon from '@lucide/svelte/icons/dollar-sign';
	import type { JobPreviewCardProps } from '../types';

	let { previewData }: JobPreviewCardProps = $props();
</script>

<div class="relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm">
	<!-- Job Title -->
	<h4 class="mb-3 text-lg font-bold leading-tight text-foreground line-clamp-2">
		{previewData.jobTitle}
	</h4>

	<!-- Job Details -->
	<div class="mb-4 flex flex-wrap gap-2">
		<Badge variant="secondary" class="gap-1">
			{previewData.jobType}
		</Badge>

		{#if previewData.salaryRange[0] > 0 || previewData.salaryRange[1] > 0}
			<Badge variant="outline" class="gap-1">
				<DollarSignIcon class="h-3 w-3" />
				{previewData.salaryRange[0].toLocaleString()} - {previewData.salaryRange[1].toLocaleString()}
				<span class="text-xs">{previewData.currency}</span>
			</Badge>
		{/if}
	</div>

	<!-- Company Info -->
	<div class="flex items-center gap-3 border-t pt-3">
		<Avatar.Root class="h-10 w-10">
			<Avatar.Image
				src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=400&fit=crop"
				alt={previewData.companyName}
			/>
			<Avatar.Fallback class="bg-muted text-muted-foreground">
				<BuildingIcon class="h-4 w-4" />
			</Avatar.Fallback>
		</Avatar.Root>

		<div class="flex-1 min-w-0">
			<p class="text-sm font-semibold text-foreground truncate">
				{previewData.companyName}
			</p>
			<p class="text-xs text-muted-foreground">Company Profile</p>
		</div>
	</div>
</div>
