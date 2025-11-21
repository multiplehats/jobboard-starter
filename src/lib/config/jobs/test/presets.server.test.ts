import { describe, it, expect } from 'vitest';
import {
	REMOTE_FIRST_PRESET,
	LOCAL_ONLY_PRESET,
	HYBRID_FIRST_PRESET,
	FLEXIBLE_PRESET,
	getPreset
} from '../presets.server';
import { jobBoardConfigSchema } from '$lib/config/jobs/schema.server.js';

describe('Job Board Presets', () => {
	it('remote-first preset validates', () => {
		expect(() => jobBoardConfigSchema.parse(REMOTE_FIRST_PRESET)).not.toThrow();
	});

	it('local-only preset validates', () => {
		expect(() => jobBoardConfigSchema.parse(LOCAL_ONLY_PRESET)).not.toThrow();
	});

	it('local-only preset has correct settings', () => {
		expect(LOCAL_ONLY_PRESET.allowedLocationTypes).toEqual(['onsite']);
		expect(LOCAL_ONLY_PRESET.fields.location.mode).toBe('required');
		expect(LOCAL_ONLY_PRESET.fields.hiringLocation.mode).toBe('hidden');
	});

	it('hybrid-first preset validates', () => {
		expect(() => jobBoardConfigSchema.parse(HYBRID_FIRST_PRESET)).not.toThrow();
	});

	it('flexible preset validates', () => {
		expect(() => jobBoardConfigSchema.parse(FLEXIBLE_PRESET)).not.toThrow();
	});

	it('getPreset returns null for custom', () => {
		expect(getPreset('custom')).toBeNull();
	});

	it('getPreset returns correct preset', () => {
		expect(getPreset('local-only')).toBe(LOCAL_ONLY_PRESET);
	});
});
