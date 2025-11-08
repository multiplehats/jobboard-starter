import type { PageServerLoad, Actions } from './$types';
import { talentProfileRepository } from '$lib/features/talent/server/repository';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';

const updateProfileSchema = z.object({
	headline: z.string().max(255).optional().nullable(),
	bio: z.string().optional().nullable(),
	location: z.string().max(255).optional().nullable(),
	desiredJobTypes: z.array(z.string()).optional().nullable(),
	desiredLocationTypes: z.array(z.string()).optional().nullable(),
	yearsOfExperience: z.coerce.number().int().min(0).optional().nullable(),
	skills: z.array(z.string()).optional().nullable(),
	resumeUrl: z.string().url().optional().or(z.literal('')).nullable(),
	portfolioUrl: z.string().url().optional().or(z.literal('')).nullable(),
	linkedinUrl: z.string().url().optional().or(z.literal('')).nullable(),
	githubUrl: z.string().url().optional().or(z.literal('')).nullable(),
	websiteUrl: z.string().url().optional().or(z.literal('')).nullable(),
	jobAlertsEnabled: z.boolean().optional(),
	emailNotifications: z.boolean().optional()
});

export const load: PageServerLoad = async ({ parent }) => {
	const { talentProfile } = await parent();
	return { talentProfile };
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		const session = await locals.getSession({
			headers: new Headers()
		});

		if (!session?.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();

		// Parse form data
		const data: Record<string, any> = {};

		// Simple fields
		const simpleFields = [
			'headline',
			'bio',
			'location',
			'resumeUrl',
			'portfolioUrl',
			'linkedinUrl',
			'githubUrl',
			'websiteUrl'
		];

		for (const field of simpleFields) {
			const value = formData.get(field) as string;
			data[field] = value || null;
		}

		// Number field
		const yearsOfExperience = formData.get('yearsOfExperience') as string;
		data.yearsOfExperience = yearsOfExperience ? parseInt(yearsOfExperience) : null;

		// Boolean fields
		data.jobAlertsEnabled = formData.get('jobAlertsEnabled') === 'true';
		data.emailNotifications = formData.get('emailNotifications') === 'true';

		// Array fields
		const desiredJobTypes = formData.getAll('desiredJobTypes') as string[];
		data.desiredJobTypes = desiredJobTypes.length > 0 ? desiredJobTypes : null;

		const desiredLocationTypes = formData.getAll('desiredLocationTypes') as string[];
		data.desiredLocationTypes = desiredLocationTypes.length > 0 ? desiredLocationTypes : null;

		// Parse skills from comma-separated string or JSON array
		const skillsInput = formData.get('skills') as string;
		if (skillsInput) {
			try {
				// Try parsing as JSON first
				data.skills = JSON.parse(skillsInput);
			} catch {
				// Otherwise, split by commas
				data.skills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);
			}
		} else {
			data.skills = null;
		}

		// Validate
		try {
			const validated = updateProfileSchema.parse(data);

			// Update profile
			const updated = await talentProfileRepository.update(session.user.id, validated);

			if (!updated) {
				return fail(404, { error: 'Profile not found' });
			}

			return { success: true };
		} catch (error) {
			if (error instanceof z.ZodError) {
				return fail(400, {
					error: 'Invalid form data',
					fieldErrors: error.flatten().fieldErrors
				});
			}
			console.error('Error updating profile:', error);
			return fail(500, { error: 'Failed to update profile' });
		}
	}
};
