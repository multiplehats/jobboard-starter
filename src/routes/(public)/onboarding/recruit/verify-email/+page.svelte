<script lang="ts">
	import { verifyWorkEmail, resendVerificationEmail, getOrganization } from '../onboard.remote';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Intro from '$lib/components/ui/intro';

	// Icons
	import MailIcon from '@lucide/svelte/icons/mail';
	import BuildingIcon from '@lucide/svelte/icons/building-2';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';

	// Get organization from URL params
	const orgId = $derived($page.url.searchParams.get('orgId') || '');
	const orgName = $derived($page.url.searchParams.get('orgName') || '');

	// State
	let emailPrefix = $state('');
	let organization = $state<any>(null);
	let domain = $state('');
	let isLoading = $state(true);
	let verificationSent = $state(false);
	let autoVerified = $state(false);

	// Helper to safely get field issues
	function getIssues(field: any) {
		return field?.issues?.() ?? [];
	}

	// Load organization details
	onMount(async () => {
		if (!orgId) {
			goto('/onboarding/recruit/find-company');
			return;
		}

		try {
			const result = await getOrganization(orgId) as any;
			if (result.success && result.organization) {
				organization = result.organization;
				// Extract domain from organization metadata or use a default
				const metadata = organization.metadata ? JSON.parse(organization.metadata) : {};
				const website = metadata.website || '';
				// Extract domain from website URL
				if (website) {
					const url = new URL(website);
					domain = `@${url.hostname.replace('www.', '')}`;
				} else {
					domain = '@example.com';
				}
			}
		} catch (error) {
			console.error('Failed to load organization:', error);
		} finally {
			isLoading = false;
		}
	});

	// Computed full email
	const fullEmail = $derived(emailPrefix ? `${emailPrefix}${domain}` : '');

	// Handle form submission result
	$effect(() => {
		if (verifyWorkEmail.result && verifyWorkEmail.result.success) {
			if (verifyWorkEmail.result.autoVerified) {
				autoVerified = true;
				// Auto-navigate to next step after a short delay
				setTimeout(() => {
					goto(`/onboarding/recruit/invite-team?orgId=${orgId}&orgName=${encodeURIComponent(orgName)}`);
				}, 2000);
			} else {
				verificationSent = true;
			}
		}
	});

	// Handle verification complete (user clicked link in email or auto-verified)
	function handleContinue() {
		goto(`/onboarding/recruit/invite-team?orgId=${orgId}&orgName=${encodeURIComponent(orgName)}`);
	}

	// Go back to find company
	function handleBack() {
		goto('/onboarding/recruit/find-company');
	}
</script>

<Intro.Root>
	<Intro.Title>Verify Your Email</Intro.Title>
	<Intro.Description>
		Confirm your work email to join {orgName || 'your company'}
	</Intro.Description>
</Intro.Root>

<div class="mx-auto max-w-2xl space-y-6">
	<!-- Progress Indicator -->
	<div class="flex items-center justify-center gap-2">
		<Badge variant="default">Step 2 of 3</Badge>
	</div>

	{#if isLoading}
		<Card.Root>
			<Card.Content class="py-12 text-center text-muted-foreground">
				Loading organization details...
			</Card.Content>
		</Card.Root>
	{:else if !organization}
		<Card.Root>
			<Card.Content class="py-12 text-center">
				<AlertCircleIcon class="mx-auto size-12 text-destructive" />
				<p class="mt-4 text-sm font-medium">Organization not found</p>
				<Button class="mt-4" onclick={handleBack}>
					<ArrowLeftIcon class="mr-2 size-4" />
					Back to Search
				</Button>
			</Card.Content>
		</Card.Root>
	{:else}
		<!-- Selected Company Display -->
		<Card.Root>
			<Card.Content class="pt-6">
				<div class="flex items-center gap-4">
					{#if organization.logo}
						<img src={organization.logo} alt={organization.name} class="size-16 rounded-lg" />
					{:else}
						<div class="flex size-16 items-center justify-center rounded-lg bg-muted">
							<BuildingIcon class="size-8 text-muted-foreground" />
						</div>
					{/if}
					<div class="flex-1">
						<h3 class="text-lg font-semibold">{organization.name}</h3>
						<p class="text-sm text-muted-foreground">You're joining this organization</p>
					</div>
					<Button variant="ghost" size="sm" onclick={handleBack}>
						<ArrowLeftIcon class="mr-2 size-4" />
						Change
					</Button>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Auto-Verified Success -->
		{#if autoVerified}
			<Card.Root class="border-2 border-green-500/20 bg-green-50/50">
				<Card.Content class="py-8 text-center">
					<CheckCircleIcon class="mx-auto size-16 text-green-600" />
					<h3 class="mt-4 text-lg font-semibold">You've been verified!</h3>
					<p class="mt-2 text-sm text-muted-foreground">
						{verifyWorkEmail.result?.message}
					</p>
					<p class="mt-2 text-sm text-muted-foreground">Redirecting...</p>
				</Card.Content>
			</Card.Root>
		{:else if verificationSent}
			<!-- Verification Email Sent -->
			<Card.Root class="border-2 border-primary/20">
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<MailIcon class="size-5" />
						Check Your Email
					</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="rounded-lg bg-muted p-4">
						<p class="text-sm">We sent a verification email to:</p>
						<p class="mt-1 font-mono text-lg font-semibold">{fullEmail}</p>
					</div>

					<div class="space-y-2 text-sm text-muted-foreground">
						<p>1. Check your inbox for an email from us</p>
						<p>2. Click the verification link in the email</p>
						<p>3. Return here to continue</p>
					</div>

					<Separator />

					<div class="flex flex-col gap-3">
						<Button onclick={handleContinue}>
							I've Verified My Email
							<ArrowRightIcon class="ml-2 size-4" />
						</Button>
						<Button
							type="button"
							variant="outline"
							onclick={async () => {
								await resendVerificationEmail(fullEmail);
							}}
						>
							Resend Verification Email
						</Button>
						<Button type="button" variant="ghost" onclick={handleBack}>
							<ArrowLeftIcon class="mr-2 size-4" />
							Change Company
						</Button>
					</div>
				</Card.Content>
			</Card.Root>
		{:else}
			<!-- Email Verification Form -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<MailIcon class="size-5" />
						Enter Your Work Email
					</Card.Title>
					<Card.Description>
						We'll verify your email to confirm you work at {organization.name}
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<form {...verifyWorkEmail} class="space-y-6">
						<!-- Hidden fields for organization -->
						<input {...verifyWorkEmail.fields.organizationId.as('text')} type="hidden" value={orgId} />
						<input {...verifyWorkEmail.fields.domain.as('text')} type="hidden" value={domain} />

						<Field.Group>
							<!-- Email Prefix -->
							<Field.Field data-invalid={getIssues(verifyWorkEmail.fields.emailPrefix).length > 0}>
								<Field.Label for="email-prefix">Your Email</Field.Label>
								<div class="flex items-center gap-2">
									<Input
										id="email-prefix"
										placeholder="chris"
										{...verifyWorkEmail.fields.emailPrefix.as('text')}
										oninput={(e) => {
											emailPrefix = e.currentTarget.value;
										}}
										aria-invalid={getIssues(verifyWorkEmail.fields.emailPrefix).length > 0}
										class="flex-1"
									/>
									<span class="text-lg font-medium text-muted-foreground">{domain}</span>
								</div>
								{#if fullEmail}
									<Field.Description class="mt-2">
										Your work email: <span class="font-mono font-semibold">{fullEmail}</span>
									</Field.Description>
								{/if}
								{#each getIssues(verifyWorkEmail.fields.emailPrefix) as issue, i (i)}
									<Field.Error>{issue.message}</Field.Error>
								{/each}
							</Field.Field>
						</Field.Group>

						<!-- Info Box -->
						<div class="rounded-lg border bg-muted/50 p-4">
							<h4 class="text-sm font-semibold">What happens next?</h4>
							<ul class="mt-2 space-y-1 text-sm text-muted-foreground">
								<li>• If you're already a member, you'll be auto-verified</li>
								<li>• Otherwise, we'll send a verification email</li>
								<li>• You'll need to click the link to verify</li>
							</ul>
						</div>

						<!-- Form Actions -->
						<div class="flex flex-col gap-3">
							<Button type="submit" disabled={!emailPrefix.trim()}>
								Send Verification Email
								<ArrowRightIcon class="ml-2 size-4" />
							</Button>
							<Button type="button" variant="outline" onclick={handleBack}>
								<ArrowLeftIcon class="mr-2 size-4" />
								Change Company
							</Button>
						</div>

						{#if verifyWorkEmail.result && !verifyWorkEmail.result.success}
							<div class="rounded-lg border border-destructive bg-destructive/10 p-3">
								<p class="text-sm text-destructive">{verifyWorkEmail.result.error}</p>
							</div>
						{/if}
					</form>
				</Card.Content>
			</Card.Root>
		{/if}
	{/if}
</div>
