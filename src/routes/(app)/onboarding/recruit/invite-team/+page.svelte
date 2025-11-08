<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import CardDescription from '$lib/components/ui/card/card-description.svelte';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import CardTitle from '$lib/components/ui/card/card-title.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let emails = $state<string[]>(['']);
	let isSending = $state(false);

	function addEmailField() {
		emails = [...emails, ''];
	}

	function removeEmailField(index: number) {
		if (emails.length > 1) {
			emails = emails.filter((_, i) => i !== index);
		}
	}

	function updateEmail(index: number, value: string) {
		emails[index] = value;
	}

	function skipInvites() {
		completeOnboarding();
	}

	async function completeOnboarding() {
		// Mark onboarding as complete
		const response = await fetch('/api/recruiter/complete-onboarding', {
			method: 'POST'
		});

		if (response.ok) {
			goto('/dashboard/recruiter');
		}
	}

	let validEmails = $derived(emails.filter((e) => e.trim() && isValidEmail(e.trim())));

	function isValidEmail(email: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}
</script>

<div class="container mx-auto max-w-2xl py-8 px-4">
	<div class="mb-8">
		<div class="flex items-center gap-3 mb-4">
			<div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
				<svg
					class="h-6 w-6 text-primary"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
			</div>
			<div>
				<h1 class="text-3xl font-bold">You've been added to {data.organization?.name || 'your company'}!</h1>
				<p class="text-muted-foreground mt-1">
					Your account is all set up. Invite your team to get started.
				</p>
			</div>
		</div>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Invite your team</CardTitle>
			<CardDescription>
				Send invitations to your colleagues to join {data.organization?.name || 'your company'} on the platform
			</CardDescription>
		</CardHeader>

		<CardContent class="space-y-6">
			<form method="POST" action="?/sendInvites" use:enhance={() => {
				isSending = true;
				return async ({ result }) => {
					isSending = false;
					if (result.type === 'success') {
						completeOnboarding();
					}
				};
			}} class="space-y-4">
				<div class="space-y-4">
					{#each emails as email, index}
						<div class="flex gap-2 items-start">
							<div class="flex-1 space-y-2">
								<Label for={`email-${index}`}>
									{index === 0 ? 'Team member email' : `Team member ${index + 1}`}
								</Label>
								<Input
									id={`email-${index}`}
									name={`email-${index}`}
									type="email"
									placeholder="colleague@company.com"
									value={email}
									oninput={(e) => updateEmail(index, (e.target as HTMLInputElement).value)}
								/>
							</div>
							{#if emails.length > 1}
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onclick={() => removeEmailField(index)}
									class="mt-8"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</Button>
							{/if}
						</div>
					{/each}
				</div>

				<Button type="button" variant="outline" onclick={addEmailField} class="w-full">
					<svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Add another email
				</Button>

				{#if form?.error}
					<div class="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
						{form.error}
					</div>
				{/if}

				{#if form?.success}
					<div class="p-3 bg-primary/10 text-primary text-sm rounded-md">
						Invitations sent successfully! Redirecting...
					</div>
				{/if}

				<div class="flex gap-2 pt-4">
					<Button type="submit" disabled={isSending || validEmails.length === 0}>
						{isSending ? 'Sending invites...' : `Send ${validEmails.length > 0 ? validEmails.length : ''} invite${validEmails.length !== 1 ? 's' : ''}`}
					</Button>
					<Button type="button" variant="ghost" onclick={skipInvites}>
						Skip for now
					</Button>
				</div>
			</form>

			<!-- Info box -->
			<div class="p-4 border rounded-lg bg-muted/50">
				<p class="text-sm mb-2">
					<strong>What happens when you send invites?</strong>
				</p>
				<ul class="text-sm text-muted-foreground space-y-1 list-disc list-inside">
					<li>Each team member will receive an email invitation</li>
					<li>They can create an account and join {data.organization?.name || 'your company'}</li>
					<li>You can manage team members from your dashboard</li>
					<li>You can send more invites later</li>
				</ul>
			</div>
		</CardContent>
	</Card>

	<!-- Success state visual -->
	<div class="mt-6 p-6 border rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
		<div class="flex items-start gap-4">
			<div class="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
				<svg class="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 10V3L4 14h7v7l9-11h-7z"
					/>
				</svg>
			</div>
			<div>
				<h3 class="font-semibold mb-1">You're all set!</h3>
				<p class="text-sm text-muted-foreground mb-3">
					Your recruiter account is ready to use. You can now:
				</p>
				<ul class="text-sm text-muted-foreground space-y-1">
					<li class="flex items-center gap-2">
						<span class="h-1.5 w-1.5 rounded-full bg-primary"></span>
						Post job listings
					</li>
					<li class="flex items-center gap-2">
						<span class="h-1.5 w-1.5 rounded-full bg-primary"></span>
						Review applications
					</li>
					<li class="flex items-center gap-2">
						<span class="h-1.5 w-1.5 rounded-full bg-primary"></span>
						Manage your team
					</li>
					<li class="flex items-center gap-2">
						<span class="h-1.5 w-1.5 rounded-full bg-primary"></span>
						Track hiring metrics
					</li>
				</ul>
			</div>
		</div>
	</div>
</div>
