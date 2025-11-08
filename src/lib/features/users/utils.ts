import type { UserState, TalentProfile, RecruiterProfile } from './types';

/**
 * Determine user state based on existing profiles
 */
export function getUserState(
	talentProfile: TalentProfile | null,
	recruiterProfile: RecruiterProfile | null
): UserState {
	const hasTalent = !!talentProfile;
	const hasRecruiter = !!recruiterProfile;

	if (hasTalent && !hasRecruiter) return 'talent';
	if (!hasTalent && hasRecruiter) return 'recruiter';
	throw new Error('User must have either talent or recruiter profile');
}

/**
 * Check if user needs onboarding
 */
export function needsOnboarding(
	userState: UserState,
	talentProfile: TalentProfile | null,
	recruiterProfile: RecruiterProfile | null
): boolean {
	if (userState === 'talent' && talentProfile && !talentProfile.onboardingCompleted) return true;
	if (userState === 'recruiter' && recruiterProfile && !recruiterProfile.onboardingCompleted)
		return true;
	return false;
}

/**
 * Get onboarding redirect URL based on user state
 */
export function getOnboardingUrl(
	userState: UserState,
	talentProfile: TalentProfile | null,
	recruiterProfile: RecruiterProfile | null
): string | null {
	if (userState === 'talent' && talentProfile && !talentProfile.onboardingCompleted) {
		return '/onboarding/talent';
	}
	if (userState === 'recruiter' && recruiterProfile && !recruiterProfile.onboardingCompleted) {
		return '/onboarding/recruit';
	}
	return null;
}

/**
 * Get dashboard URL based on user state
 */
export function getDashboardUrl(userState: UserState): string {
	if (userState === 'talent') return '/dashboard/talent';
	if (userState === 'recruiter') return '/dashboard/recruiter';
	if (userState === 'both') return '/dashboard/talent'; // Default to talent for both
	return '/';
}
