export interface Organization {
	id: string;
	name: string;
	slug: string;
	logo: string | null;
	createdAt: Date;
	metadata: string | null;
}

export interface CreateOrganizationData {
	name: string;
	website?: string;
}

export interface OrganizationSearchResult {
	id: string;
	name: string;
	logo: string | null;
	website?: string;
}
