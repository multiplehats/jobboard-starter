<script lang="ts">
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import type { JobPreviewCardProps } from '../types';

	let { previewData }: JobPreviewCardProps = $props();
</script>

<Item.Root class="border-primary bg-background">
	<Item.Content class="flex flex-col flex-wrap justify-between">
		<Item.Media class="justify-start">
			<Avatar.Root class="size-10">
				<Avatar.Image
					src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60"
					alt="Company Logo"
				/>
				<Avatar.Fallback>CI</Avatar.Fallback>
			</Avatar.Root>
		</Item.Media>

		<Item.Header class="flex-col items-start">
			<Item.Title class="text-lg md:text-xl">
				{previewData.jobTitle}
			</Item.Title>
		</Item.Header>

		<div class="">
			<p class="mb-2 font-medium text-gray-700">
				{previewData.companyName}
			</p>
		</div>
		<div class="mb-6 flex h-6 flex-wrap gap-4 overflow-y-hidden">
			<p class="inline-flex items-center text-gray-600">
				{previewData.salaryRange[0]} - {previewData.salaryRange[1]}
				{previewData.currency}
			</p>
		</div>
	</Item.Content>
	<Item.Footer class="flex">
		<Badge variant="secondary">
			{previewData.jobType}
		</Badge>
	</Item.Footer>
</Item.Root>
