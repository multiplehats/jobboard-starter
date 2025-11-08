/**
 * Shared job utilities that can be used on both server and client
 */

/**
 * Generate a job URL from job and organization data
 *
 * @param job - The job with slug
 * @param org - The organization with slug
 * @returns The full job URL path
 */
export function generateJobUrl(job: { slug: string }, org: { slug: string }): string {
	return `/companies/${org.slug}/jobs/${job.slug}`;
}
