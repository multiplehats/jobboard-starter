<script lang="ts">
	import { goto } from '$app/navigation';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Logo from '$lib/components/logo.svelte';
	import { authRoutes } from '$lib/utils/navigation.js';
	import * as m from '$lib/paraglide/messages.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { useSiteConfig } from '$lib/hooks/use-site-config.svelte';

	const config = useSiteConfig();
	let userType = $state<'talent' | 'recruit'>('talent');

	function handleContinue() {
		const path =
			userType === 'talent'
				? authRoutes.signUp({
						userType: 'talent',
						callbackUrl: '/onboarding/talent'
					})
				: authRoutes.signUp({
						userType: 'recruiter',
						callbackUrl: '/onboarding/recruit'
					});
		goto(path);
	}
</script>

<section class="flex flex-col gap-y-8 px-4 py-12 md:mx-auto md:w-120 md:py-24">
	<div class="flex flex-col items-center">
		<Logo wrapperClass="mb-6" />

		<h1 class="mb-2 text-center text-2xl font-medium text-gray-900 md:mb-3 md:text-3xl">
			{m['getStarted.TITLE']({
				appName: config.appName
			})}
		</h1>

		<p class="text-md text-center text-gray-500 md:text-lg">
			{m['getStarted.DESCRIPTION']({ appName: config.appName })}
		</p>
	</div>
	<div class="flex flex-col gap-5">
		<RadioGroup.Root bind:value={userType} class="flex flex-col ">
			<label class="relative cursor-pointer">
				<RadioGroup.Item
					value="talent"
					class="focus:ring-primary-600 data-[state='checked']:border-primary-600 data-[state='checked']:bg-primary-600 peer absolute top-3 right-3 aspect-square h-4 w-4 flex-shrink-0 rounded-full border border-gray-200 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:top-4 md:right-5"
				/>
				<div
					class="peer-data-[state='checked']:border-primary-600 flex flex-col items-center gap-x-4 gap-y-3 rounded-lg border border-gray-200 p-5 shadow-xs peer-data-[state='checked']:border-2 peer-data-[state='checked']:p-[1.1875rem] md:flex-row"
				>
					<div
						class="flex -space-x-2 select-none *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background *:data-[slot=avatar]:grayscale"
					>
						{#each config.featuredTalents as talent}
							<Avatar.Root class="border">
								<Avatar.Image src="{talent.avatar}?size=128" alt={talent.name} />
								<Avatar.Fallback>{talent.name.charAt(0)}</Avatar.Fallback>
							</Avatar.Root>
						{/each}
					</div>
					<div class="flex flex-col gap-y-0.5 text-center select-none md:text-left">
						<p class="font-medium">{m['getStarted.TALENT_TITLE']()}</p>
						<p class="text-sm text-gray-600">
							{m['getStarted.TALENT_DESCRIPTION']()}
						</p>
					</div>
				</div>
			</label>
			<label class="relative cursor-pointer">
				<RadioGroup.Item
					value="recruit"
					class="focus:ring-primary-600 data-[state='checked']:border-primary-600 data-[state='checked']:bg-primary-600 peer absolute top-3 right-3 aspect-square h-4 w-4 flex-shrink-0 rounded-full border border-gray-200 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:top-4 md:right-5"
				/>
				<div
					class="peer-data-[state='checked']:border-primary-600 flex flex-col items-center gap-x-4 gap-y-3 rounded-lg border border-gray-200 p-5 shadow-xs peer-data-[state='checked']:border-2 peer-data-[state='checked']:p-[1.1875rem] md:flex-row"
				>
					<div
						class="flex -space-x-2 select-none *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background *:data-[slot=avatar]:grayscale"
					>
						{#each config.featuredRecruiters as recruiter}
							<Avatar.Root class="border">
								<Avatar.Image src="{recruiter.logo}?size=128" alt={recruiter.name} />
								<Avatar.Fallback>{recruiter.name.charAt(0)}</Avatar.Fallback>
							</Avatar.Root>
						{/each}
					</div>
					<div class="flex flex-col gap-y-0.5 text-center select-none md:text-left">
						<p class="font-medium">{m['getStarted.RECRUITER_TITLE']()}</p>
						<p class="text-sm text-gray-600">
							{m['getStarted.RECRUITER_DESCRIPTION']()}
						</p>
					</div>
				</div>
			</label>
		</RadioGroup.Root>
		<Button onclick={handleContinue} class="w-full" size="lg">{m['getStarted.CONTINUE']()}</Button>
	</div>
	<p class="text-center text-gray-600">
		{m['getStarted.ALREADY_HAVE_ACCOUNT']()}
		<a class="text-primary-700 font-medium" href={authRoutes.signIn()}
			>{m['getStarted.SIGN_IN']()}</a
		>
	</p>
</section>
