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
	import Progress from '$lib/components/ui/progress/progress.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import { JOB_TYPES, LOCATION_TYPES, EXPERIENCE_LEVELS } from '$lib/features/talent/types/talent';

	let currentStep = $state(1);
	const totalSteps = 5;

	// Form data state
	let desiredJobTypes = $state<string[]>([]);
	let desiredLocationTypes = $state<string[]>([]);
	let yearsOfExperience = $state<number | null>(null);
	let skillsInput = $state('');
	let skills = $state<string[]>([]);
	let resumeFile = $state<File | null>(null);

	// Derived states
	let progress = $derived((currentStep / totalSteps) * 100);
	let canProceed = $derived(() => {
		switch (currentStep) {
			case 1:
				return desiredJobTypes.length > 0;
			case 2:
				return desiredLocationTypes.length > 0;
			case 3:
				return yearsOfExperience !== null;
			case 4:
				return skills.length > 0;
			case 5:
				return true; // Summary step, always can proceed
			default:
				return false;
		}
	});

	let isSubmitting = $state(false);

	function toggleJobType(type: string) {
		if (desiredJobTypes.includes(type)) {
			desiredJobTypes = desiredJobTypes.filter((t) => t !== type);
		} else {
			desiredJobTypes = [...desiredJobTypes, type];
		}
	}

	function toggleLocationType(type: string) {
		if (desiredLocationTypes.includes(type)) {
			desiredLocationTypes = desiredLocationTypes.filter((t) => t !== type);
		} else {
			desiredLocationTypes = [...desiredLocationTypes, type];
		}
	}

	function addSkill() {
		const trimmedSkill = skillsInput.trim();
		if (trimmedSkill && !skills.includes(trimmedSkill)) {
			skills = [...skills, trimmedSkill];
			skillsInput = '';
		}
	}

	function removeSkill(skill: string) {
		skills = skills.filter((s) => s !== skill);
	}

	function handleSkillsKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addSkill();
		} else if (e.key === ',' && skillsInput.trim()) {
			e.preventDefault();
			addSkill();
		}
	}

	function nextStep() {
		if (canProceed() && currentStep < totalSteps) {
			currentStep++;
		}
	}

	function prevStep() {
		if (currentStep > 1) {
			currentStep--;
		}
	}

	function skipOnboarding() {
		goto('/dashboard/talent');
	}

	function handleResumeChange(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			resumeFile = input.files[0];
		}
	}
</script>

<div class="container mx-auto max-w-2xl py-8 px-4">
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Welcome! Let's set up your profile</h1>
		<p class="text-muted-foreground">
			Help us understand your job preferences to find the best opportunities for you.
		</p>
	</div>

	<!-- Progress bar -->
	<div class="mb-8">
		<div class="flex justify-between items-center mb-2">
			<span class="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
			<span class="text-sm text-muted-foreground">{Math.round(progress)}% complete</span>
		</div>
		<Progress value={progress} class="h-2" />
	</div>

	<Card>
		<CardHeader>
			<CardTitle>
				{#if currentStep === 1}
					What type of work are you looking for?
				{:else if currentStep === 2}
					Where do you want to work?
				{:else if currentStep === 3}
					How much experience do you have?
				{:else if currentStep === 4}
					What are your key skills?
				{:else if currentStep === 5}
					Review your profile
				{/if}
			</CardTitle>
			<CardDescription>
				{#if currentStep === 1}
					Select all that apply
				{:else if currentStep === 2}
					Choose your preferred work location
				{:else if currentStep === 3}
					Select your experience level
				{:else if currentStep === 4}
					Add skills separated by commas or press Enter
				{:else if currentStep === 5}
					Review and optionally upload your resume
				{/if}
			</CardDescription>
		</CardHeader>

		<CardContent>
			<!-- Step 1: Job Types -->
			{#if currentStep === 1}
				<div class="space-y-4">
					{#each JOB_TYPES as jobType}
						<div class="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer" onclick={() => toggleJobType(jobType.value)}>
							<Checkbox checked={desiredJobTypes.includes(jobType.value)} onCheckedChange={() => toggleJobType(jobType.value)} />
							<Label class="cursor-pointer flex-1">{jobType.label}</Label>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Step 2: Location Types -->
			{#if currentStep === 2}
				<div class="space-y-4">
					{#each LOCATION_TYPES as locationType}
						<div class="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer" onclick={() => toggleLocationType(locationType.value)}>
							<Checkbox checked={desiredLocationTypes.includes(locationType.value)} onCheckedChange={() => toggleLocationType(locationType.value)} />
							<Label class="cursor-pointer flex-1">{locationType.label}</Label>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Step 3: Years of Experience -->
			{#if currentStep === 3}
				<div class="space-y-4">
					{#each EXPERIENCE_LEVELS as level}
						<div class="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer" onclick={() => (yearsOfExperience = level.value)}>
							<input type="radio" name="experience" checked={yearsOfExperience === level.value} onchange={() => (yearsOfExperience = level.value)} class="h-4 w-4" />
							<Label class="cursor-pointer flex-1">{level.label}</Label>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Step 4: Skills -->
			{#if currentStep === 4}
				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="skills">Add your skills</Label>
						<div class="flex gap-2">
							<Input id="skills" type="text" placeholder="e.g., React, TypeScript, Node.js" bind:value={skillsInput} onkeydown={handleSkillsKeydown} />
							<Button type="button" variant="secondary" onclick={addSkill}>Add</Button>
						</div>
						<p class="text-sm text-muted-foreground">
							Press Enter or comma to add each skill
						</p>
					</div>

					{#if skills.length > 0}
						<div class="flex flex-wrap gap-2 p-4 border rounded-lg min-h-[100px]">
							{#each skills as skill}
								<span class="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
									{skill}
									<button type="button" onclick={() => removeSkill(skill)} class="ml-1 hover:text-destructive">
										×
									</button>
								</span>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Step 5: Summary & Resume -->
			{#if currentStep === 5}
				<div class="space-y-6">
					<div class="space-y-4">
						<div>
							<h3 class="font-semibold mb-2">Job Types</h3>
							<div class="flex flex-wrap gap-2">
								{#each desiredJobTypes as type}
									<span class="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
										{JOB_TYPES.find((t) => t.value === type)?.label}
									</span>
								{/each}
							</div>
						</div>

						<div>
							<h3 class="font-semibold mb-2">Work Location</h3>
							<div class="flex flex-wrap gap-2">
								{#each desiredLocationTypes as type}
									<span class="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
										{LOCATION_TYPES.find((t) => t.value === type)?.label}
									</span>
								{/each}
							</div>
						</div>

						<div>
							<h3 class="font-semibold mb-2">Experience</h3>
							<p class="text-muted-foreground">
								{EXPERIENCE_LEVELS.find((l) => l.value === yearsOfExperience)?.label}
							</p>
						</div>

						<div>
							<h3 class="font-semibold mb-2">Skills</h3>
							<div class="flex flex-wrap gap-2">
								{#each skills as skill}
									<span class="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
										{skill}
									</span>
								{/each}
							</div>
						</div>
					</div>

					<div class="pt-4 border-t space-y-2">
						<Label for="resume">Upload Resume (Optional)</Label>
						<Input id="resume" type="file" accept=".pdf,.doc,.docx" onchange={handleResumeChange} />
						{#if resumeFile}
							<p class="text-sm text-muted-foreground">Selected: {resumeFile.name}</p>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Navigation buttons -->
			<div class="flex justify-between items-center mt-8 pt-6 border-t">
				<div>
					{#if currentStep > 1}
						<Button variant="outline" onclick={prevStep}>Back</Button>
					{/if}
				</div>

				<div class="flex gap-2">
					{#if currentStep < totalSteps}
						<Button onclick={nextStep} disabled={!canProceed()}>Next</Button>
					{:else}
						<form method="POST" action="?/updateProfile" use:enhance={() => {
							isSubmitting = true;
							return async ({ result }) => {
								isSubmitting = false;
								if (result.type === 'redirect') {
									goto(result.location);
								}
							};
						}}>
							<input type="hidden" name="desiredJobTypes" value={JSON.stringify(desiredJobTypes)} />
							<input type="hidden" name="desiredLocationTypes" value={JSON.stringify(desiredLocationTypes)} />
							<input type="hidden" name="yearsOfExperience" value={yearsOfExperience} />
							<input type="hidden" name="skills" value={JSON.stringify(skills)} />
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? 'Saving...' : 'Complete Setup'}
							</Button>
						</form>
					{/if}
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Skip option -->
	<div class="text-center mt-6">
		<button onclick={skipOnboarding} class="text-sm text-muted-foreground hover:text-foreground underline">
			Skip for now
		</button>
	</div>
</div>
