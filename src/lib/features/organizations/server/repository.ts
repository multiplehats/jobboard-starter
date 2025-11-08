import { db } from '$lib/server/db';
import { organization, member } from '$lib/server/db/schema.js';
import { eq, ilike, or } from 'drizzle-orm';
import type { Organization, CreateOrganizationData } from '../types/organization';

export async function searchOrganizations(query: string): Promise<Organization[]> {
	if (!query.trim()) {
		return [];
	}

	const results = await db
		.select()
		.from(organization)
		.where(or(ilike(organization.name, `%${query}%`), ilike(organization.slug, `%${query}%`)))
		.limit(10);

	return results;
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
	const org = await db.query.organization.findFirst({
		where: eq(organization.id, id)
	});

	return org || null;
}

export async function createOrganization(data: CreateOrganizationData): Promise<Organization> {
	const slug = data.name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

	const metadata = data.website ? JSON.stringify({ website: data.website }) : null;

	const [org] = await db
		.insert(organization)
		.values({
			name: data.name,
			slug,
			metadata,
			createdAt: new Date()
		})
		.returning();

	return org;
}

export async function addUserToOrganization(
	userId: string,
	organizationId: string,
	role: string = 'admin'
): Promise<void> {
	await db.insert(member).values({
		userId,
		organizationId,
		role,
		createdAt: new Date()
	});
}

export async function getUserOrganizations(userId: string) {
	const organizations = await db
		.select({
			id: organization.id,
			name: organization.name,
			slug: organization.slug,
			logo: organization.logo,
			createdAt: organization.createdAt,
			metadata: organization.metadata,
			role: member.role
		})
		.from(member)
		.innerJoin(organization, eq(member.organizationId, organization.id))
		.where(eq(member.userId, userId));

	return organizations;
}
