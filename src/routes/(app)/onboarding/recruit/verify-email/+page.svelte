<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
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

	let emailPrefix = $state('');
	let isSending = $state(false);
	let emailSent = $state(false);

	// Get organization from data or redirect if missing
	onMount(() => {
		if (!data.organization) {
			const orgId = sessionStorage.getItem('selectedOrgId');
			if (!orgId) {
				goto('/onboarding/recruit/find-company');
			}
		}
	});

	function getEmailDomain(): string {
		if (!data.organization?.metadata) {
			return 'company.com';
		}

		const metadata = typeof data.organization.metadata === 'string'
			? JSON.parse(data.organization.metadata)
			: data.organization.metadata;

		if (metadata.website) {
			try {
				const url = new URL(metadata.website.startsWith('http') ? metadata.website : `https://${metadata.website}`);
				return url.hostname.replace('www.', '');
			} catch {
				return 'company.com';
			}
		}

		return 'company.com';
	}

	let emailDomain = $derived(getEmailDomain());
	let fullEmail = $derived(emailPrefix ? `${emailPrefix}@${emailDomain}` : '');

	function goBack() {
		goto('/onboarding/recruit/find-company');
	}
</script>

<div class="container mx-auto max-w-2xl py-8 px-4">
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Verify your work email</h1>
		<p class="text-muted-foreground">
			We'll send a verification email to confirm you work at {data.organization?.name || 'your company'}.
		</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Enter your work email</CardTitle>
			<CardDescription>
				Use your company email address to verify your affiliation
			</CardDescription>
		</CardHeader>

		<CardContent class="space-y-6">
			{#if !emailSent}
				<form method="POST" action="?/sendVerification" use:enhance={() => {
					isSending = true;
					return async ({ result }) => {
						isSending = false;
						if (result.type === 'success') {
							emailSent = true;
						}
					};
				}} class="space-y-4">
					<div class="space-y-2">
						<Label for="emailPrefix">Your email address</Label>
						<div class="flex items-center gap-2">
							<Input
								id="emailPrefix"
								name="emailPrefix"
								type="text"
								placeholder="chris"
								bind:value={emailPrefix}
								required
								class="flex-1"
							/>
							<span class="text-muted-foreground">@{emailDomain}</span>
						</div>
						{#if fullEmail}
							<p class="text-sm text-muted-foreground">
								We'll send a verification email to: <strong>{fullEmail}</strong>
							</p>
						{/if}
					</div>

					{#if form?.error}
						<div class="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
							{form.error}
						</div>
					{/if}

					<div class="flex gap-2">
						<Button type="submit" disabled={isSending || !emailPrefix.trim()}>
							{isSending ? 'Sending...' : 'Send verification email'}
						</Button>
						<Button type="button" variant="outline" onclick={goBack}>
							Change company
						</Button>
					</div>
				</form>
			{:else}
				<div class="space-y-4">
					<div class="p-4 bg-primary/10 border border-primary/20 rounded-lg">
						<div class="flex items-start gap-3">
							<div class="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
								<svg
									class="h-4 w-4 text-primary"
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
							<div class="flex-1">
								<h3 class="font-semibold mb-1">Verification email sent!</h3>
								<p class="text-sm text-muted-foreground">
									We've sent a verification email to <strong>{fullEmail}</strong>.
									Check your inbox and click the verification link to continue.
								</p>
							</div>
						</div>
					</div>

					<div class="p-4 border rounded-lg bg-muted/50">
						<p class="text-sm mb-2">
							<strong>What happens next?</strong>
						</p>
						<ol class="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
							<li>Check your email inbox for our verification message</li>
							<li>Click the verification link in the email</li>
							<li>You'll be automatically added to your company's team</li>
							<li>Complete your profile setup</li>
						</ol>
					</div>

					<div class="flex gap-2">
						<form method="POST" action="?/sendVerification" use:enhance={() => {
							isSending = true;
							return async ({ result }) => {
								isSending = false;
							};
						}}>
							<input type="hidden" name="emailPrefix" value={emailPrefix} />
							<Button type="submit" variant="outline" disabled={isSending}>
								{isSending ? 'Resending...' : 'Resend email'}
							</Button>
						</form>
						<Button variant="ghost" onclick={goBack}>
							Use different email
						</Button>
					</div>

					<div class="pt-4 border-t">
						<p class="text-sm text-muted-foreground mb-2">
							Already verified? Continue to the next step:
						</p>
						<Button onclick={() => goto('/onboarding/recruit/invite-team')}>
							Continue to team invites
						</Button>
					</div>
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Help text -->
	<div class="mt-6 p-4 border rounded-lg bg-muted/50">
		<p class="text-sm text-muted-foreground">
			<strong>Note:</strong> You can skip email verification for now and complete it later from your dashboard settings.
		</p>
	</div>
</div>
