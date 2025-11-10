<script lang="ts">
	import { inviteTeamMembers } from '../onboard.remote';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Intro from '$lib/components/ui/intro';

	// Icons
	import UsersIcon from '@lucide/svelte/icons/users';
	import PlusCircleIcon from '@lucide/svelte/icons/plus-circle';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import SendIcon from '@lucide/svelte/icons/send';
	import PartyPopperIcon from '@lucide/svelte/icons/party-popper';

	// Get organization from URL params
	const orgId = $derived($page.url.searchParams.get('orgId') || '');
	const orgName = $derived($page.url.searchParams.get('orgName') || '');

	// State
	let emailInputs = $state<string[]>(['', '', '']);
	let invitesSent = $state(false);

	// Helper to safely get field issues
	function getIssues(field: any) {
		return field?.issues?.() ?? [];
	}

	// Add another email field
	function addEmailField() {
		if (emailInputs.length < 10) {
			emailInputs = [...emailInputs, ''];
		}
	}

	// Remove an email field
	function removeEmailField(index: number) {
		if (emailInputs.length > 1) {
			emailInputs = emailInputs.filter((_, i) => i !== index);
		}
	}

	// Get valid emails (non-empty)
	const validEmails = $derived(emailInputs.filter((email) => email.trim() !== ''));
	const canSubmit = $derived(validEmails.length > 0);

	// Handle form submission
	$effect(() => {
		if (inviteTeamMembers.result && inviteTeamMembers.result.success) {
			invitesSent = true;
		}
	});

	// Skip this step
	function handleSkip() {
		// TODO: Navigate to dashboard or next onboarding step
		goto('/dashboard');
	}

	// Complete onboarding
	function handleComplete() {
		// TODO: Navigate to dashboard
		goto('/dashboard');
	}

	// Redirect if no organization selected
	$effect(() => {
		if (!orgId) {
			goto('/onboarding/recruit/find-company');
		}
	});
</script>

<Intro.Root>
	<Intro.Title>Invite Your Team</Intro.Title>
	<Intro.Description>
		Build your team by inviting colleagues to join {orgName || 'your organization'}
	</Intro.Description>
</Intro.Root>

<div class="mx-auto max-w-2xl space-y-6">
	<!-- Progress Indicator -->
	<div class="flex items-center justify-center gap-2">
		<Badge variant="default">Step 3 of 3</Badge>
	</div>

	<!-- Success Message -->
	<Card.Root class="border-2 border-green-500/20 bg-green-50/50">
		<Card.Content class="py-6">
			<div class="flex items-start gap-4">
				<div class="rounded-full bg-green-100 p-3">
					<CheckCircleIcon class="size-6 text-green-600" />
				</div>
				<div class="flex-1">
					<h3 class="font-semibold text-green-900">You've been added to {orgName}!</h3>
					<p class="mt-1 text-sm text-green-700">
						Your account has been successfully linked to your organization. You can now start posting
						jobs and managing candidates.
					</p>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	{#if invitesSent}
		<!-- Invites Sent Success -->
		<Card.Root class="border-2 border-primary/20">
			<Card.Content class="py-12 text-center">
				<PartyPopperIcon class="mx-auto size-16 text-primary" />
				<h3 class="mt-4 text-xl font-semibold">Invitations Sent!</h3>
				<p class="mt-2 text-muted-foreground">
					{inviteTeamMembers.result?.message || 'Your team members will receive their invitations shortly.'}
				</p>
				<Button class="mt-6" onclick={handleComplete}>
					Continue to Dashboard
				</Button>
			</Card.Content>
		</Card.Root>
	{:else}
		<!-- Invite Team Form -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<UsersIcon class="size-5" />
					Invite Team Members
				</Card.Title>
				<Card.Description>
					Add your colleagues so they can help manage jobs and candidates
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<form {...inviteTeamMembers} class="space-y-6">
					<!-- Hidden organization ID -->
					<input {...inviteTeamMembers.fields.organizationId.as('text')} type="hidden" value={orgId} />

					<Field.Group class="space-y-3">
						<Field.Label>Team Member Emails</Field.Label>

						{#each emailInputs as email, index (index)}
							<div class="flex items-start gap-2">
								<div class="flex-1">
									<Input
										id="email-{index}"
										type="email"
										placeholder="colleague@{orgName.toLowerCase().replace(/\s+/g, '')}.com"
										bind:value={emailInputs[index]}
									/>
								</div>
								{#if emailInputs.length > 1}
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onclick={() => removeEmailField(index)}
									>
										<XCircleIcon class="size-4" />
									</Button>
								{/if}
							</div>
						{/each}

						{#if emailInputs.length < 10}
							<Button
								type="button"
								variant="outline"
								size="sm"
								class="w-full"
								onclick={addEmailField}
							>
								<PlusCircleIcon class="mr-2 size-4" />
								Add Another Email
							</Button>
						{/if}

						<Field.Description>
							You can invite up to 10 team members at once
						</Field.Description>

						{#each getIssues(inviteTeamMembers.fields.emails) as issue, i (i)}
							<Field.Error>{issue.message}</Field.Error>
						{/each}
					</Field.Group>

					<!-- Hidden field to pass emails array -->
					<input
						type="hidden"
						name="emails"
						value={JSON.stringify(validEmails)}
					/>

					<!-- Info Box -->
					<div class="rounded-lg border bg-muted/50 p-4">
						<h4 class="text-sm font-semibold">What happens next?</h4>
						<ul class="mt-2 space-y-1 text-sm text-muted-foreground">
							<li>• Your team members will receive an invitation email</li>
							<li>• They can click the link to join {orgName}</li>
							<li>• You can always invite more people later</li>
						</ul>
					</div>

					<!-- Form Actions -->
					<div class="flex flex-col gap-3">
						<Button type="submit" disabled={!canSubmit}>
							<SendIcon class="mr-2 size-4" />
							Send {validEmails.length > 0 ? `${validEmails.length} ` : ''}Invitation{validEmails.length !== 1 ? 's' : ''}
						</Button>
						<Button type="button" variant="outline" onclick={handleSkip}>
							Skip for Now
						</Button>
					</div>

					{#if inviteTeamMembers.result && !inviteTeamMembers.result.success}
						<div class="rounded-lg border border-destructive bg-destructive/10 p-3">
							<p class="text-sm text-destructive">{inviteTeamMembers.result.error}</p>
						</div>
					{/if}
				</form>
			</Card.Content>
		</Card.Root>

		<Separator class="my-6" />

		<!-- Optional: Skip Section -->
		<div class="text-center">
			<p class="text-sm text-muted-foreground">
				You can always invite team members later from your dashboard
			</p>
		</div>
	{/if}
</div>
