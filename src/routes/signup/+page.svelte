<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
</script>

<div class="container mx-auto px-4 py-16">
	<div class="mx-auto max-w-4xl text-center">
		<h1 class="mb-4 text-5xl font-bold">Sign up to JobBoardStarter</h1>
		<p class="mb-12 text-xl text-muted-foreground">Choose how you want to get started</p>

		<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
			<!-- Talent Option -->
			<Card.Root class="transition-shadow hover:shadow-lg">
				<Card.Header class="pb-4">
					<div class="mb-4 text-6xl">🔍</div>
					<Card.Title class="text-2xl">I'm looking for a job</Card.Title>
				</Card.Header>
				<Card.Content>
					<p class="mb-6 text-muted-foreground">
						Get matched with jobs for free. Save listings, track applications, and discover
						opportunities from top companies.
					</p>
				</Card.Content>
				<Card.Footer>
					<Button
						href="/auth/sign-up?userType=talent&callbackUrl=/onboarding/talent"
						size="lg"
						class="w-full"
					>
						Find Jobs →
					</Button>
				</Card.Footer>
			</Card.Root>

			<!-- Recruiter Option -->
			<Card.Root class="transition-shadow hover:shadow-lg">
				<Card.Header class="pb-4">
					<div class="mb-4 text-6xl">🏢</div>
					<Card.Title class="text-2xl">I'm hiring</Card.Title>
				</Card.Header>
				<Card.Content>
					<p class="mb-6 text-muted-foreground">
						Connect with top talent. Post jobs, manage applications, and build your team with
						qualified candidates.
					</p>
				</Card.Content>
				<Card.Footer>
					<Button
						href="/auth/sign-up?userType=recruiter&callbackUrl=/onboarding/recruit"
						size="lg"
						class="w-full"
						variant="secondary"
					>
						Post Jobs →
					</Button>
				</Card.Footer>
			</Card.Root>
		</div>

		<p class="mt-8 text-sm text-muted-foreground">
			Already have an account? <a href="/auth/sign-in" class="text-primary hover:underline"
				>Log in</a
			>
		</p>
	</div>
</div>
