import type { PageServerLoad, Actions } from './$types';
import { savedJobRepository } from '$lib/features/talent/server/saved-jobs-repository';
import { fail, error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	if (!user) {
		throw error(401, 'Unauthorized');
	}

	// Load all saved jobs with details
	const savedJobs = await savedJobRepository.findByUser(user.id);

	return {
		savedJobs
	};
};

export const actions: Actions = {
	unsave: async ({ request, locals }) => {
		const session = await locals.getSession({
			headers: new Headers()
		});

		if (!session?.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const jobId = formData.get('jobId') as string;

		if (!jobId) {
			return fail(400, { error: 'Job ID is required' });
		}

		try {
			const unsaved = await savedJobRepository.unsave(session.user.id, jobId);

			if (!unsaved) {
				return fail(404, { error: 'Saved job not found' });
			}

			return { success: true };
		} catch (error) {
			console.error('Error unsaving job:', error);
			return fail(500, { error: 'Failed to unsave job' });
		}
	},

	updateNotes: async ({ request, locals }) => {
		const session = await locals.getSession({
			headers: new Headers()
		});

		if (!session?.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const jobId = formData.get('jobId') as string;
		const notes = formData.get('notes') as string;

		if (!jobId) {
			return fail(400, { error: 'Job ID is required' });
		}

		try {
			const updated = await savedJobRepository.updateNotes(session.user.id, jobId, notes || '');

			if (!updated) {
				return fail(404, { error: 'Saved job not found' });
			}

			return { success: true };
		} catch (error) {
			console.error('Error updating notes:', error);
			return fail(500, { error: 'Failed to update notes' });
		}
	}
};
