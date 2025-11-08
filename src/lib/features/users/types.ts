import type { UserObj } from '$lib/server/auth';

export type UserState = 'talent' | 'recruiter';

export interface TalentProfile {
	id: string;
	userId: string;
	bio: string | null;
	headline: string | null;
	location: string | null;
	desiredJobTypes: string[] | null;
	desiredLocationTypes: string[] | null;
	desiredSalaryMin: number | null;
	desiredSalaryCurrency: string | null;
	yearsOfExperience: number | null;
	skills: string[] | null;
	resumeUrl: string | null;
	portfolioUrl: string | null;
	linkedinUrl: string | null;
	githubUrl: string | null;
	websiteUrl: string | null;
	jobAlertsEnabled: boolean;
	profileVisibility: string;
	emailNotifications: boolean;
	onboardingCompleted: boolean;
	onboardingStep: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface RecruiterProfile {
	id: string;
	userId: string;
	jobTitle: string | null;
	company: string | null;
	linkedinUrl: string | null;
	defaultOrganizationId: string | null;
	onboardingCompleted: boolean;
	onboardingStep: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface Organization {
	id: string;
	name: string;
	slug: string;
	logo: string | null;
	createdAt: Date;
	metadata: string | null;
}

export interface UserProfile {
	state: UserState;
	talentProfile: TalentProfile | null;
	recruiterProfile: RecruiterProfile | null;
	organizations: Organization[];
}

export interface AppUser extends UserObj {
	profile: UserProfile;
}
