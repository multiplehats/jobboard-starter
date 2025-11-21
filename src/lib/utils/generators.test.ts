import { describe, it, expect } from 'vitest';
import { generateList, createEnumListFactory } from './generators';

describe('generateList', () => {
	describe('basic functionality', () => {
		it('should generate a list with default key names (title, value)', () => {
			const items = ['published', 'draft', 'expired'] as const;
			const labels = {
				published: 'Published',
				draft: 'Draft',
				expired: 'Expired'
			};

			const result = generateList(items, labels);

			expect(result).toEqual([
				{ title: 'Published', value: 'published' },
				{ title: 'Draft', value: 'draft' },
				{ title: 'Expired', value: 'expired' }
			]);
		});

		it('should generate a list with custom key names', () => {
			const items = ['published', 'draft', 'expired'] as const;
			const labels = {
				published: 'Published',
				draft: 'Draft',
				expired: 'Expired'
			};

			const result = generateList(items, labels, 'label', 'id');

			expect(result).toEqual([
				{ label: 'Published', id: 'published' },
				{ label: 'Draft', id: 'draft' },
				{ label: 'Expired', id: 'expired' }
			]);
		});

		it('should generate a list with "label" and "value" key names', () => {
			const items = ['remote', 'hybrid', 'onsite'] as const;
			const labels = {
				remote: 'Remote',
				hybrid: 'Hybrid',
				onsite: 'On-site'
			};

			const result = generateList(items, labels, 'label', 'value');

			expect(result).toEqual([
				{ label: 'Remote', value: 'remote' },
				{ label: 'Hybrid', value: 'hybrid' },
				{ label: 'On-site', value: 'onsite' }
			]);
		});
	});

	describe('real-world usage patterns', () => {
		it('should work with job types pattern', () => {
			const JOB_TYPES = ['full_time', 'part_time', 'contract', 'freelance'] as const;
			const labels = {
				full_time: 'Full Time',
				part_time: 'Part Time',
				contract: 'Contract',
				freelance: 'Freelance'
			};

			const result = generateList(JOB_TYPES, labels, 'label', 'value');

			expect(result).toHaveLength(4);
			expect(result[0]).toEqual({ label: 'Full Time', value: 'full_time' });
			expect(result[3]).toEqual({ label: 'Freelance', value: 'freelance' });
		});

		it('should work with location types pattern', () => {
			const LOCATION_TYPES = ['remote', 'hybrid', 'onsite'] as const;
			const labels = {
				remote: 'Remote',
				hybrid: 'Hybrid',
				onsite: 'On-site'
			};

			const result = generateList(LOCATION_TYPES, labels, 'label', 'value');

			expect(result).toHaveLength(3);
			expect(result).toEqual([
				{ label: 'Remote', value: 'remote' },
				{ label: 'Hybrid', value: 'hybrid' },
				{ label: 'On-site', value: 'onsite' }
			]);
		});

		it('should work with seniority levels pattern', () => {
			const SENIORITY_LEVELS = [
				'entry-level',
				'mid-level',
				'senior',
				'manager',
				'director',
				'executive'
			] as const;
			const labels = {
				'entry-level': 'Entry Level',
				'mid-level': 'Mid Level',
				senior: 'Senior',
				manager: 'Manager',
				director: 'Director',
				executive: 'Executive'
			};

			const result = generateList(SENIORITY_LEVELS, labels, 'label', 'value');

			expect(result).toHaveLength(6);
			expect(result[0]).toEqual({ label: 'Entry Level', value: 'entry-level' });
			expect(result[5]).toEqual({ label: 'Executive', value: 'executive' });
		});

		it('should work with currencies pattern', () => {
			const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] as const;
			const labels = {
				USD: 'US Dollar',
				EUR: 'Euro',
				GBP: 'British Pound',
				CAD: 'Canadian Dollar',
				AUD: 'Australian Dollar'
			};

			const result = generateList(CURRENCIES, labels, 'label', 'value');

			expect(result).toHaveLength(5);
			expect(result[0]).toEqual({ label: 'US Dollar', value: 'USD' });
			expect(result[2]).toEqual({ label: 'British Pound', value: 'GBP' });
		});
	});

	describe('edge cases', () => {
		it('should handle empty arrays', () => {
			const items = [] as const;
			const labels = {};

			const result = generateList(items, labels);

			expect(result).toEqual([]);
		});

		it('should handle single item', () => {
			const items = ['only'] as const;
			const labels = { only: 'Only One' };

			const result = generateList(items, labels);

			expect(result).toEqual([{ title: 'Only One', value: 'only' }]);
		});

		it('should preserve order of items', () => {
			const items = ['z', 'a', 'm', 'c'] as const;
			const labels = {
				z: 'Zulu',
				a: 'Alpha',
				m: 'Mike',
				c: 'Charlie'
			};

			const result = generateList(items, labels, 'label', 'value');

			expect(result[0].value).toBe('z');
			expect(result[1].value).toBe('a');
			expect(result[2].value).toBe('m');
			expect(result[3].value).toBe('c');
		});

		it('should handle labels with special characters', () => {
			const items = ['key1', 'key2'] as const;
			const labels = {
				key1: 'Label with "quotes"',
				key2: "Label with 'apostrophes'"
			};

			const result = generateList(items, labels);

			expect(result[0].title).toBe('Label with "quotes"');
			expect(result[1].title).toBe("Label with 'apostrophes'");
		});

		it('should handle unicode characters in labels', () => {
			const items = ['emoji', 'unicode'] as const;
			const labels = {
				emoji: '😀 Emoji Label',
				unicode: 'Unicode: café'
			};

			const result = generateList(items, labels);

			expect(result[0].title).toBe('😀 Emoji Label');
			expect(result[1].title).toBe('Unicode: café');
		});
	});

	describe('different key name combinations', () => {
		const items = ['a', 'b'] as const;
		const labels = { a: 'Label A', b: 'Label B' };

		it('should work with "name" and "id"', () => {
			const result = generateList(items, labels, 'name', 'id');
			expect(result[0]).toEqual({ name: 'Label A', id: 'a' });
		});

		it('should work with "text" and "key"', () => {
			const result = generateList(items, labels, 'text', 'key');
			expect(result[0]).toEqual({ text: 'Label A', key: 'a' });
		});

		it('should work with "displayName" and "code"', () => {
			const result = generateList(items, labels, 'displayName', 'code');
			expect(result[0]).toEqual({ displayName: 'Label A', code: 'a' });
		});
	});
});

describe('createEnumListFactory', () => {
	describe('basic functionality', () => {
		it('should create a factory that generates lists with default labels', () => {
			const enumValues = ['remote', 'hybrid', 'onsite'] as const;
			const defaultLabels = {
				remote: 'Remote',
				hybrid: 'Hybrid',
				onsite: 'On-site'
			};

			const factory = createEnumListFactory(enumValues, defaultLabels);
			const result = factory();

			expect(result).toEqual([
				{ label: 'Remote', value: 'remote' },
				{ label: 'Hybrid', value: 'hybrid' },
				{ label: 'On-site', value: 'onsite' }
			]);
		});

		it('should create a factory that accepts custom label getter (i18n simulation)', () => {
			const enumValues = ['remote', 'hybrid', 'onsite'] as const;
			const defaultLabels = {
				remote: 'Remote',
				hybrid: 'Hybrid',
				onsite: 'On-site'
			};

			// Simulate i18n function
			const i18nGetter = (value: string) => {
				const translations: Record<string, string> = {
					remote: 'Remoto',
					hybrid: 'Híbrido',
					onsite: 'Presencial'
				};
				return translations[value] || value;
			};

			const factory = createEnumListFactory(enumValues, defaultLabels);
			const result = factory(i18nGetter);

			expect(result).toEqual([
				{ label: 'Remoto', value: 'remote' },
				{ label: 'Híbrido', value: 'hybrid' },
				{ label: 'Presencial', value: 'onsite' }
			]);
		});

		it('should create a factory that accepts custom key names', () => {
			const enumValues = ['a', 'b'] as const;
			const defaultLabels = { a: 'Label A', b: 'Label B' };

			const factory = createEnumListFactory(enumValues, defaultLabels);
			const result = factory(undefined, 'name', 'id');

			expect(result).toEqual([
				{ name: 'Label A', id: 'a' },
				{ name: 'Label B', id: 'b' }
			]);
		});

		it('should create a factory that accepts both label getter and custom key names', () => {
			const enumValues = ['a', 'b'] as const;
			const defaultLabels = { a: 'Label A', b: 'Label B' };

			const i18nGetter = (value: string) => `Translated ${value.toUpperCase()}`;

			const factory = createEnumListFactory(enumValues, defaultLabels);
			const result = factory(i18nGetter, 'text', 'code');

			expect(result).toEqual([
				{ text: 'Translated A', code: 'a' },
				{ text: 'Translated B', code: 'b' }
			]);
		});
	});

	describe('real-world usage patterns (simulating constants.ts)', () => {
		it('should work like jobTypesList pattern', () => {
			const JOB_TYPES = ['full_time', 'part_time', 'contract', 'freelance'] as const;
			const defaultLabels = {
				full_time: 'Full Time',
				part_time: 'Part Time',
				contract: 'Contract',
				freelance: 'Freelance'
			};

			const jobTypesList = createEnumListFactory(JOB_TYPES, defaultLabels);

			// Without i18n
			const result1 = jobTypesList();
			expect(result1).toHaveLength(4);
			expect(result1[0]).toEqual({ label: 'Full Time', value: 'full_time' });

			// With i18n getter
			const mockI18n = (value: string) => {
				const map: Record<string, string> = {
					full_time: 'Tiempo Completo',
					part_time: 'Medio Tiempo',
					contract: 'Contrato',
					freelance: 'Freelance'
				};
				return map[value] || value;
			};
			const result2 = jobTypesList(mockI18n);
			expect(result2[0]).toEqual({ label: 'Tiempo Completo', value: 'full_time' });

			// With custom key names
			const result3 = jobTypesList(undefined, 'name', 'id');
			expect(result3[0]).toEqual({ name: 'Full Time', id: 'full_time' });
		});

		it('should work like locationTypesList pattern', () => {
			const LOCATION_TYPES = ['remote', 'hybrid', 'onsite'] as const;
			const defaultLabels = {
				remote: 'Remote',
				hybrid: 'Hybrid',
				onsite: 'On-site'
			};

			const locationTypesList = createEnumListFactory(LOCATION_TYPES, defaultLabels);

			const result = locationTypesList();
			expect(result).toEqual([
				{ label: 'Remote', value: 'remote' },
				{ label: 'Hybrid', value: 'hybrid' },
				{ label: 'On-site', value: 'onsite' }
			]);
		});

		it('should work like currenciesList pattern', () => {
			const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] as const;
			const defaultLabels = {
				USD: 'US Dollar',
				EUR: 'Euro',
				GBP: 'British Pound',
				CAD: 'Canadian Dollar',
				AUD: 'Australian Dollar'
			};

			const currenciesList = createEnumListFactory(CURRENCIES, defaultLabels);

			const result = currenciesList();
			expect(result).toHaveLength(5);
			expect(result[0]).toEqual({ label: 'US Dollar', value: 'USD' });
		});
	});

	describe('edge cases', () => {
		it('should handle empty enum values', () => {
			const enumValues = [] as const;
			const defaultLabels = {};

			const factory = createEnumListFactory(enumValues, defaultLabels);
			const result = factory();

			expect(result).toEqual([]);
		});

		it('should handle single enum value', () => {
			const enumValues = ['only'] as const;
			const defaultLabels = { only: 'Only One' };

			const factory = createEnumListFactory(enumValues, defaultLabels);
			const result = factory();

			expect(result).toEqual([{ label: 'Only One', value: 'only' }]);
		});

		it('should fallback to default labels when labelGetter is undefined', () => {
			const enumValues = ['a', 'b'] as const;
			const defaultLabels = { a: 'Default A', b: 'Default B' };

			const factory = createEnumListFactory(enumValues, defaultLabels);
			const result = factory(undefined);

			expect(result).toEqual([
				{ label: 'Default A', value: 'a' },
				{ label: 'Default B', value: 'b' }
			]);
		});

		it('should use labelGetter when provided even if it returns the same as default', () => {
			const enumValues = ['a', 'b'] as const;
			const defaultLabels = { a: 'Default A', b: 'Default B' };

			const labelGetter = (value: string) => {
				const map: Record<string, string> = {
					a: 'Default A',
					b: 'Default B'
				};
				return map[value] || value;
			};

			const factory = createEnumListFactory(enumValues, defaultLabels);
			const result = factory(labelGetter);

			expect(result).toEqual([
				{ label: 'Default A', value: 'a' },
				{ label: 'Default B', value: 'b' }
			]);
		});
	});

	describe('factory reusability', () => {
		it('should allow the same factory to be called multiple times with different configurations', () => {
			const enumValues = ['a', 'b'] as const;
			const defaultLabels = { a: 'Label A', b: 'Label B' };

			const factory = createEnumListFactory(enumValues, defaultLabels);

			const result1 = factory();
			const result2 = factory((v) => `i18n-${v}`);
			const result3 = factory(undefined, 'name', 'id');

			expect(result1[0]).toEqual({ label: 'Label A', value: 'a' });
			expect(result2[0]).toEqual({ label: 'i18n-a', value: 'a' });
			expect(result3[0]).toEqual({ name: 'Label A', id: 'a' });
		});
	});

	describe('i18n integration patterns', () => {
		it('should work with Paraglide-style message functions', () => {
			const JOB_TYPES = ['full_time', 'part_time'] as const;
			const defaultLabels = {
				full_time: 'Full Time',
				part_time: 'Part Time'
			};

			// Simulate Paraglide messages structure
			const mockMessages = {
				enums: {
					job_types: {
						full_time: () => 'Full Time',
						part_time: () => 'Part Time'
					}
				}
			};

			const jobTypesList = createEnumListFactory(JOB_TYPES, defaultLabels);

			// Simulate how it's used in constants.ts
			const result = jobTypesList((value) => {
				const msgKey = value as 'full_time' | 'part_time';
				return mockMessages.enums.job_types[msgKey]();
			});

			expect(result).toEqual([
				{ label: 'Full Time', value: 'full_time' },
				{ label: 'Part Time', value: 'part_time' }
			]);
		});

		it('should handle dynamic i18n functions that change based on locale', () => {
			const CURRENCIES = ['USD', 'EUR'] as const;
			const defaultLabels = {
				USD: 'US Dollar',
				EUR: 'Euro'
			};

			const factory = createEnumListFactory(CURRENCIES, defaultLabels);

			// English
			const enGetter = (value: string) => {
				const map: Record<string, string> = {
					USD: 'US Dollar',
					EUR: 'Euro'
				};
				return map[value] || value;
			};

			// Spanish
			const esGetter = (value: string) => {
				const map: Record<string, string> = {
					USD: 'Dólar Estadounidense',
					EUR: 'Euro'
				};
				return map[value] || value;
			};

			const enResult = factory(enGetter);
			const esResult = factory(esGetter);

			expect(enResult[0]).toEqual({ label: 'US Dollar', value: 'USD' });
			expect(esResult[0]).toEqual({ label: 'Dólar Estadounidense', value: 'USD' });
		});
	});
});
