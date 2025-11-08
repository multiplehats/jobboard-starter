<script lang="ts">
	import { enhance } from '$app/forms';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { JOB_TYPES, LOCATION_TYPES } from '$lib/features/talent/types/talent';
	import type { PageData, ActionData } from './$types';

	interface Props {
		data: PageData;
		form?: ActionData;
	}

	let { data, form }: Props = $props();

	let submitting = $state(false);
	let formData = $state({
		headline: data.talentProfile.headline || '',
		bio: data.talentProfile.bio || '',
		location: data.talentProfile.location || '',
		desiredJobTypes: data.talentProfile.desiredJobTypes || [],
		desiredLocationTypes: data.talentProfile.desiredLocationTypes || [],
		yearsOfExperience: data.talentProfile.yearsOfExperience?.toString() || '',
		skills: data.talentProfile.skills?.join(', ') || '',
		resumeUrl: data.talentProfile.resumeUrl || '',
		portfolioUrl: data.talentProfile.portfolioUrl || '',
		linkedinUrl: data.talentProfile.linkedinUrl || '',
		githubUrl: data.talentProfile.githubUrl || '',
		websiteUrl: data.talentProfile.websiteUrl || '',
		jobAlertsEnabled: data.talentProfile.jobAlertsEnabled,
		emailNotifications: data.talentProfile.emailNotifications
	});

	function handleJobTypeToggle(value: string) {
		const types = formData.desiredJobTypes || [];
		if (types.includes(value)) {
			formData.desiredJobTypes = types.filter((t) => t !== value);
		} else {
			formData.desiredJobTypes = [...types, value];
		}
	}

	function handleLocationTypeToggle(value: string) {
		const types = formData.desiredLocationTypes || [];
		if (types.includes(value)) {
			formData.desiredLocationTypes = types.filter((t) => t !== value);
		} else {
			formData.desiredLocationTypes = [...types, value];
		}
	}
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Profile Settings</h1>
		<p class="text-muted-foreground">
			Update your talent profile information
		</p>
	</div>

	<form
		method="POST"
		action="?/updateProfile"
		use:enhance={() => {
			submitting = true;
			return async ({ result }) => {
				submitting = false;
				if (result.type === 'success') {
					toast.success('Profile updated successfully');
				} else if (result.type === 'failure') {
					toast.error((result.data?.error || 'Failed to update profile') as string);
				}
			};
		}}
	>
		<!-- Basic Information -->
		<Card class="mb-6">
			<CardHeader>
				<CardTitle>Basic Information</CardTitle>
				<CardDescription>Your professional profile details</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<Label for="headline">Headline</Label>
					<Input
						id="headline"
						name="headline"
						bind:value={formData.headline}
						placeholder="e.g., Senior Frontend Engineer"
						maxlength={255}
					/>
				</div>

				<div class="space-y-2">
					<Label for="bio">Bio</Label>
					<Textarea
						id="bio"
						name="bio"
						bind:value={formData.bio}
						placeholder="Tell us about yourself..."
						rows={4}
					/>
				</div>

				<div class="space-y-2">
					<Label for="location">Location</Label>
					<Input
						id="location"
						name="location"
						bind:value={formData.location}
						placeholder="e.g., San Francisco, CA"
						maxlength={255}
					/>
				</div>
			</CardContent>
		</Card>

		<!-- Job Preferences -->
		<Card class="mb-6">
			<CardHeader>
				<CardTitle>Job Preferences</CardTitle>
				<CardDescription>What kind of jobs are you looking for?</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<Label>Desired Job Types</Label>
					<div class="grid gap-3 sm:grid-cols-2">
						{#each JOB_TYPES as jobType (jobType.value)}
							<div class="flex items-center space-x-2">
								<Checkbox
									id="jobType-{jobType.value}"
									name="desiredJobTypes"
									value={jobType.value}
									checked={formData.desiredJobTypes?.includes(jobType.value)}
									onCheckedChange={() => handleJobTypeToggle(jobType.value)}
								/>
								<Label for="jobType-{jobType.value}" class="font-normal">
									{jobType.label}
								</Label>
							</div>
						{/each}
					</div>
				</div>

				<div class="space-y-2">
					<Label>Desired Location Types</Label>
					<div class="grid gap-3 sm:grid-cols-2">
						{#each LOCATION_TYPES as locationType (locationType.value)}
							<div class="flex items-center space-x-2">
								<Checkbox
									id="locationType-{locationType.value}"
									name="desiredLocationTypes"
									value={locationType.value}
									checked={formData.desiredLocationTypes?.includes(locationType.value)}
									onCheckedChange={() => handleLocationTypeToggle(locationType.value)}
								/>
								<Label for="locationType-{locationType.value}" class="font-normal">
									{locationType.label}
								</Label>
							</div>
						{/each}
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Experience & Skills -->
		<Card class="mb-6">
			<CardHeader>
				<CardTitle>Experience & Skills</CardTitle>
				<CardDescription>Your professional background</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<Label for="yearsOfExperience">Years of Experience</Label>
					<Input
						id="yearsOfExperience"
						name="yearsOfExperience"
						type="number"
						min="0"
						bind:value={formData.yearsOfExperience}
						placeholder="e.g., 5"
					/>
				</div>

				<div class="space-y-2">
					<Label for="skills">Skills</Label>
					<Input
						id="skills"
						name="skills"
						bind:value={formData.skills}
						placeholder="React, TypeScript, Node.js (comma-separated)"
					/>
					<p class="text-xs text-muted-foreground">
						Enter your skills separated by commas
					</p>
				</div>
			</CardContent>
		</Card>

		<!-- Links & Documents -->
		<Card class="mb-6">
			<CardHeader>
				<CardTitle>Links & Documents</CardTitle>
				<CardDescription>Share your work and professional profiles</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<Label for="resumeUrl">Resume URL</Label>
					<Input
						id="resumeUrl"
						name="resumeUrl"
						type="url"
						bind:value={formData.resumeUrl}
						placeholder="https://example.com/resume.pdf"
					/>
				</div>

				<div class="space-y-2">
					<Label for="portfolioUrl">Portfolio URL</Label>
					<Input
						id="portfolioUrl"
						name="portfolioUrl"
						type="url"
						bind:value={formData.portfolioUrl}
						placeholder="https://yourportfolio.com"
					/>
				</div>

				<div class="space-y-2">
					<Label for="linkedinUrl">LinkedIn URL</Label>
					<Input
						id="linkedinUrl"
						name="linkedinUrl"
						type="url"
						bind:value={formData.linkedinUrl}
						placeholder="https://linkedin.com/in/yourprofile"
					/>
				</div>

				<div class="space-y-2">
					<Label for="githubUrl">GitHub URL</Label>
					<Input
						id="githubUrl"
						name="githubUrl"
						type="url"
						bind:value={formData.githubUrl}
						placeholder="https://github.com/yourusername"
					/>
				</div>

				<div class="space-y-2">
					<Label for="websiteUrl">Website URL</Label>
					<Input
						id="websiteUrl"
						name="websiteUrl"
						type="url"
						bind:value={formData.websiteUrl}
						placeholder="https://yourwebsite.com"
					/>
				</div>
			</CardContent>
		</Card>

		<!-- Notification Settings -->
		<Card class="mb-6">
			<CardHeader>
				<CardTitle>Notification Settings</CardTitle>
				<CardDescription>Manage how you receive updates</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="flex items-center space-x-2">
					<Checkbox
						id="jobAlertsEnabled"
						name="jobAlertsEnabled"
						value="true"
						checked={formData.jobAlertsEnabled}
						onCheckedChange={(checked) => {
							formData.jobAlertsEnabled = checked === true;
						}}
					/>
					<Label for="jobAlertsEnabled" class="font-normal">
						Enable job alerts for matching positions
					</Label>
				</div>

				<div class="flex items-center space-x-2">
					<Checkbox
						id="emailNotifications"
						name="emailNotifications"
						value="true"
						checked={formData.emailNotifications}
						onCheckedChange={(checked) => {
							formData.emailNotifications = checked === true;
						}}
					/>
					<Label for="emailNotifications" class="font-normal">
						Receive email notifications
					</Label>
				</div>
			</CardContent>
		</Card>

		<!-- Form Error -->
		{#if form?.error}
			<div class="mb-6 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
				{form.error}
			</div>
		{/if}

		<!-- Submit Button -->
		<div class="flex justify-end">
			<Button type="submit" disabled={submitting} class="min-w-[120px]">
				{#if submitting}
					Saving...
				{:else}
					Save Changes
				{/if}
			</Button>
		</div>
	</form>
</div>
