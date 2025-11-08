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

export interface TalentOnboardingData {
	desiredJobTypes?: string[];
	desiredLocationTypes?: string[];
	yearsOfExperience?: number;
	skills?: string[];
	resumeUrl?: string;
}

export const JOB_TYPES = [
	{ value: 'full_time', label: 'Full-time' },
	{ value: 'part_time', label: 'Part-time' },
	{ value: 'contract', label: 'Contract' },
	{ value: 'freelance', label: 'Freelance' }
] as const;

export const LOCATION_TYPES = [
	{ value: 'remote', label: 'Remote' },
	{ value: 'hybrid', label: 'Hybrid' },
	{ value: 'onsite', label: 'On-site' }
] as const;

export const EXPERIENCE_LEVELS = [
	{ value: 0, label: 'Entry Level (0-2 years)' },
	{ value: 2, label: 'Mid Level (2-5 years)' },
	{ value: 5, label: 'Senior (5-10 years)' },
	{ value: 10, label: 'Lead/Principal (10+ years)' }
] as const;
