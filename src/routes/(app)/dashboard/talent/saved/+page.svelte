<script lang="ts">
	import { enhance } from '$app/forms';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Empty,
		EmptyContent,
		EmptyDescription,
		EmptyHeader,
		EmptyTitle
	} from '$lib/components/ui/empty';
	import { toast } from 'svelte-sonner';
	import { Trash2, Bookmark, MapPin, Briefcase } from '@lucide/svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let editingNotes = $state<Record<string, boolean>>({});
	let notesValues = $state<Record<string, string>>({});
	let submitting = $state<Record<string, boolean>>({});

	// Initialize notes values
	$effect(() => {
		const initial: Record<string, string> = {};
		data.savedJobs.forEach((savedJob) => {
			initial[savedJob.job.id] = savedJob.notes || '';
		});
		notesValues = initial;
	});

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatSalary(min: number | null, max: number | null, currency: string | null): string {
		if (!min && !max) return '';
		const curr = currency || 'USD';
		if (min && max) {
			return `${curr} ${min.toLocaleString()} - ${max.toLocaleString()}`;
		}
		if (min) {
			return `${curr} ${min.toLocaleString()}+`;
		}
		return '';
	}

	function toggleEditNotes(jobId: string) {
		editingNotes[jobId] = !editingNotes[jobId];
	}
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Saved Jobs</h1>
		<p class="text-muted-foreground">Jobs you've bookmarked for later</p>
	</div>

	{#if data.savedJobs.length === 0}
		<Empty>
			<EmptyContent>
				<EmptyHeader>
					<Bookmark class="h-12 w-12" />
					<EmptyTitle>No saved jobs yet</EmptyTitle>
				</EmptyHeader>
				<EmptyDescription>
					Browse jobs and click the bookmark icon to save them here
				</EmptyDescription>
				<Button href="/jobs" class="mt-4">Browse Jobs</Button>
			</EmptyContent>
		</Empty>
	{:else}
		<div class="space-y-4">
			{#each data.savedJobs as savedJob (savedJob.id)}
				<Card>
					<CardHeader>
						<div class="flex items-start justify-between gap-4">
							<div class="flex-1 space-y-1">
								<CardTitle class="text-xl">
									{savedJob.job.title}
								</CardTitle>
								<p class="text-sm font-medium text-muted-foreground">
									{savedJob.job.organization.name}
								</p>
								<div class="flex flex-wrap gap-2 text-sm text-muted-foreground">
									{#if savedJob.job.location}
										<span class="flex items-center gap-1">
											<MapPin class="h-3 w-3" />
											{savedJob.job.location}
										</span>
									{/if}
									{#if savedJob.job.jobType}
										<span class="flex items-center gap-1">
											<Briefcase class="h-3 w-3" />
											{savedJob.job.jobType}
										</span>
									{/if}
								</div>
								{#if savedJob.job.salaryMin || savedJob.job.salaryMax}
									<p class="text-sm font-medium">
										{formatSalary(
											savedJob.job.salaryMin,
											savedJob.job.salaryMax,
											savedJob.job.salaryCurrency
										)}
									</p>
								{/if}
							</div>
							<div class="flex gap-2">
								<Button href="/jobs/{savedJob.job.slug}" variant="outline" size="sm">
									View Job
								</Button>
								<form
									method="POST"
									action="?/unsave"
									use:enhance={() => {
										submitting[savedJob.job.id] = true;
										return async ({ result }) => {
											submitting[savedJob.job.id] = false;
											if (result.type === 'success') {
												toast.success('Job unsaved successfully');
											} else if (result.type === 'failure') {
												toast.error('Failed to unsave job');
											}
										};
									}}
								>
									<input type="hidden" name="jobId" value={savedJob.job.id} />
									<Button
										type="submit"
										variant="ghost"
										size="icon"
										disabled={submitting[savedJob.job.id]}
									>
										<Trash2 class="h-4 w-4" />
										<span class="sr-only">Unsave job</span>
									</Button>
								</form>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<label for="notes-{savedJob.job.id}" class="text-sm font-medium">
									Private Notes
								</label>
								{#if !editingNotes[savedJob.job.id]}
									<Button
										variant="ghost"
										size="sm"
										onclick={() => toggleEditNotes(savedJob.job.id)}
									>
										{savedJob.notes ? 'Edit' : 'Add Note'}
									</Button>
								{/if}
							</div>
							{#if editingNotes[savedJob.job.id]}
								<form
									method="POST"
									action="?/updateNotes"
									use:enhance={() => {
										submitting[savedJob.job.id] = true;
										return async ({ result }) => {
											submitting[savedJob.job.id] = false;
											if (result.type === 'success') {
												toast.success('Notes updated successfully');
												editingNotes[savedJob.job.id] = false;
											} else if (result.type === 'failure') {
												toast.error('Failed to update notes');
											}
										};
									}}
								>
									<input type="hidden" name="jobId" value={savedJob.job.id} />
									<Textarea
										id="notes-{savedJob.job.id}"
										name="notes"
										bind:value={notesValues[savedJob.job.id]}
										placeholder="Add your private notes about this job..."
										rows={3}
										class="mb-2"
									/>
									<div class="flex gap-2">
										<Button type="submit" size="sm" disabled={submitting[savedJob.job.id]}>
											Save Notes
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onclick={() => {
												notesValues[savedJob.job.id] = savedJob.notes || '';
												toggleEditNotes(savedJob.job.id);
											}}
										>
											Cancel
										</Button>
									</div>
								</form>
							{:else if savedJob.notes}
								<p class="rounded-md bg-muted p-3 text-sm">
									{savedJob.notes}
								</p>
							{:else}
								<p class="text-sm text-muted-foreground italic">No notes added yet</p>
							{/if}
							<p class="text-xs text-muted-foreground">
								Saved {formatDate(savedJob.createdAt)}
							</p>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
