# Configurable Job Board System - Implementation Plan

**Status**: Ready for Implementation
**Created**: 2025-11-21
**Updated**: 2025-11-21
**Priority**: High

## Problem Statement

The current job posting system is hardcoded for remote jobs. Users who fork this repo to create different types of job boards face issues:

1. **Remote-only assumptions**: Form defaults to remote, shows timezone/worldwide hiring fields
2. **Missing physical location**: No way to require office location for onsite/hybrid jobs
3. **Inflexible validation**: Can't adapt form requirements to different job board types
4. **Hard to customize**: Would require modifying multiple files, breaking upstream merges

**Critical Missing Feature**: Job posters cannot specify physical office location for onsite/hybrid positions. If someone is posting a hybrid or onsite job, candidates NEED to know where the office is located.

## Requirements

### Must Have

1. **Physical Location Requirement**:
   - Onsite jobs → Office location REQUIRED
   - Hybrid jobs → Office location REQUIRED
   - Remote jobs → Location optional/hidden

2. **Simple Configuration**:
   - Change job board type in ONE config file
   - Preset-based for common use cases
   - Override specific settings as needed
   - **MUST prevent invalid configurations**

3. **Type Safe**:
   - Full TypeScript type safety
   - No runtime-only type errors
   - Proper static analysis support

4. **Testable**:
   - Each preset can be tested independently
   - Validators adapt to configuration
   - Form behavior is predictable
   - Config validation prevents bugs

5. **Flexible**:
   - Support remote-only, local-only, hybrid boards
   - Allow custom field requirements
   - Extensible for future needs

### Out of Scope

- ✗ Backwards compatibility (making breaking changes is OK - will document migration)
- ✗ Geographic/map-based location pickers (keep it simple with text input)
- ✗ Complex location validation (can add later)
- ✗ Runtime config changes (requires server restart - documented)

## Current State Analysis

### Database Schema

`src/lib/server/db/schema/jobs.ts`:
```typescript
location: varchar('location', { length: 255 }), // City, Country
locationType: locationTypeEnum('location_type').notNull(),
```

**Status**: ✅ Schema already supports location field
**Issue**: ❌ No conditional requirement based on locationType
**Issue**: ❌ No max length validation in Zod matching DB (255 chars)

### Validators

`src/lib/features/jobs/validators.ts:78`:
```typescript
locationType: z.enum(LOCATION_TYPES).default('remote')
```

**Issues**:
- ❌ Hardcoded default to 'remote'
- ❌ No location field in public job posting schema
- ❌ No conditional validation based on locationType
- ❌ No max length validation

### Form Components

`src/lib/features/jobs/components/job-posting/form-sections/location-section.svelte`:

**Issues**:
- ❌ No physical location input field
- ❌ Shows remote-specific fields (timezones, worldwide) always
- ❌ No conditional rendering based on locationType selection

## Solution Architecture

### Approach: Preset-Based Configuration with Static Types

**Key Design Decision**: Separate static types from runtime validation to maintain type safety.

**Three-Layer System**:

```
┌─────────────────────────────────────────┐
│  1. Preset Selection (site.server.ts)  │
│     preset: 'local-only' | 'remote-...' │
│     + Config Validation                 │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  2. Static Base Schema + Runtime Valid  │
│     - Base type (all fields optional)   │
│     - Runtime validation with config    │
│     - Conditional requirements          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  3. Reactive Form (location-section)    │
│     - Config-driven field visibility    │
│     - Show/hide based on config + state │
│     - Real-time validation              │
└─────────────────────────────────────────┘
```

### Key Design Decisions

1. **Field Configuration**:
   - Single `mode` field: `hidden`, `optional`, `required`, `conditional`
   - Prevents invalid combinations (e.g., visible=false + required=true)
   - Clear semantics for developers

2. **Type Safety**:
   - Base schema with all fields optional
   - Runtime validation enforces config rules
   - No `z.infer<ReturnType<...>>` pattern that breaks types
   - Proper TypeScript inference maintained

3. **Validation Logic**:
   - Static base schema: `baseJobPostingSchema`
   - Dynamic validator: `validateJobPosting(data, config)`
   - Conditional field requirements
   - Config-driven defaults
   - **Schema only includes visible fields**

4. **Form Behavior**:
   - Reactive: Show/hide fields based on config + locationType
   - Validate in real-time
   - Clear location when switching to remote
   - Contextual error messages

5. **Config Validation**:
   - Validate merged configs prevent conflicts
   - Check logical consistency
   - Fail fast on invalid configs

## Implementation Plan

### Phase 1: Configuration System (3-4 hours)

#### Step 1.1: Create Job Board Config Schema

**File**: `src/lib/config/jobs/schema.server.ts` (NEW)

```typescript
import { z } from 'zod';

export const PRESET_TYPES = [
  'remote-first',  // Remote jobs with optional onsite/hybrid
  'local-only',    // Onsite-only jobs (no remote option)
  'hybrid-first',  // All types, hybrid default
  'flexible',      // All types, no defaults
  'custom'         // Full control
] as const;

export const FIELD_MODES = ['hidden', 'optional', 'required', 'conditional'] as const;

/**
 * Field mode:
 * - hidden: Field not shown, not validated, not in schema
 * - optional: Field shown but not required
 * - required: Field shown and always required
 * - conditional: Field shown, required based on locationType
 *                (for location: required when onsite/hybrid)
 */
export const fieldConfigSchema = z.object({
  mode: z.enum(FIELD_MODES)
});

export const jobBoardConfigSchema = z.object({
  preset: z.enum(PRESET_TYPES),

  // Which location types to allow
  allowedLocationTypes: z.array(z.enum(['remote', 'hybrid', 'onsite'])).min(1),

  // Default location type for new jobs
  defaultLocationType: z.enum(['remote', 'hybrid', 'onsite']).optional(),

  // Field configuration using mode
  fields: z.object({
    location: fieldConfigSchema,
    hiringLocation: fieldConfigSchema,
    workingPermits: fieldConfigSchema,
    salary: fieldConfigSchema
  })
}).refine(
  (config) => {
    // defaultLocationType must be in allowedLocationTypes
    if (config.defaultLocationType && !config.allowedLocationTypes.includes(config.defaultLocationType)) {
      return false;
    }
    return true;
  },
  {
    message: 'defaultLocationType must be one of the allowedLocationTypes'
  }
);

export type JobBoardConfig = z.infer<typeof jobBoardConfigSchema>;
export type PresetType = (typeof PRESET_TYPES)[number];
export type FieldMode = (typeof FIELD_MODES)[number];
```

#### Step 1.2: Define Presets

**File**: `src/lib/config/jobs/presets.server.ts` (NEW)

```typescript
import type { JobBoardConfig } from './schema.server';
import { jobBoardConfigSchema } from './schema.server';

/**
 * Remote-First: Tech/startup job boards
 * - All location types allowed
 * - Remote is default
 * - Location required only for onsite/hybrid
 */
export const REMOTE_FIRST_PRESET: JobBoardConfig = {
  preset: 'remote-first',
  allowedLocationTypes: ['remote', 'hybrid', 'onsite'],
  defaultLocationType: 'remote',
  fields: {
    location: {
      mode: 'conditional' // Required when onsite/hybrid selected
    },
    hiringLocation: {
      mode: 'optional'
    },
    workingPermits: {
      mode: 'optional'
    },
    salary: {
      mode: 'optional'
    }
  }
};

/**
 * Local-Only: Restaurant, retail, healthcare jobs
 * - Only onsite jobs allowed
 * - Location always required
 * - No remote-specific fields
 */
export const LOCAL_ONLY_PRESET: JobBoardConfig = {
  preset: 'local-only',
  allowedLocationTypes: ['onsite'],
  defaultLocationType: 'onsite',
  fields: {
    location: {
      mode: 'required' // Always required
    },
    hiringLocation: {
      mode: 'hidden' // Not relevant for local-only
    },
    workingPermits: {
      mode: 'hidden' // Usually not relevant
    },
    salary: {
      mode: 'optional'
    }
  }
};

/**
 * Hybrid-First: Post-COVID job boards
 * - All location types
 * - Hybrid is default
 * - Location required for onsite/hybrid
 */
export const HYBRID_FIRST_PRESET: JobBoardConfig = {
  preset: 'hybrid-first',
  allowedLocationTypes: ['remote', 'hybrid', 'onsite'],
  defaultLocationType: 'hybrid',
  fields: {
    location: {
      mode: 'conditional'
    },
    hiringLocation: {
      mode: 'optional'
    },
    workingPermits: {
      mode: 'optional'
    },
    salary: {
      mode: 'optional'
    }
  }
};

/**
 * Flexible: General purpose
 * - All location types
 * - No defaults
 * - Location conditional
 */
export const FLEXIBLE_PRESET: JobBoardConfig = {
  preset: 'flexible',
  allowedLocationTypes: ['remote', 'hybrid', 'onsite'],
  fields: {
    location: {
      mode: 'conditional'
    },
    hiringLocation: {
      mode: 'optional'
    },
    workingPermits: {
      mode: 'optional'
    },
    salary: {
      mode: 'optional'
    }
  }
};

const PRESETS_MAP = {
  'remote-first': REMOTE_FIRST_PRESET,
  'local-only': LOCAL_ONLY_PRESET,
  'hybrid-first': HYBRID_FIRST_PRESET,
  'flexible': FLEXIBLE_PRESET
} as const;

/**
 * Get a preset by name
 * Returns null for 'custom' preset (requires explicit config)
 */
export function getPreset(name: PresetType): JobBoardConfig | null {
  if (name === 'custom') {
    return null;
  }
  return PRESETS_MAP[name];
}

/**
 * Validate config for logical consistency
 * Throws if config has invalid combinations
 */
function validateConfigLogic(config: JobBoardConfig): void {
  // Validate defaultLocationType is in allowedLocationTypes
  if (config.defaultLocationType && !config.allowedLocationTypes.includes(config.defaultLocationType)) {
    throw new Error(
      `defaultLocationType "${config.defaultLocationType}" must be in allowedLocationTypes: ${config.allowedLocationTypes.join(', ')}`
    );
  }

  // For local-only boards, location should not be hidden
  if (config.allowedLocationTypes.length === 1 && config.allowedLocationTypes[0] === 'onsite') {
    if (config.fields.location.mode === 'hidden') {
      throw new Error('location field cannot be hidden for local-only job boards');
    }
  }

  // If only remote is allowed, location should probably be hidden or optional
  if (config.allowedLocationTypes.length === 1 && config.allowedLocationTypes[0] === 'remote') {
    if (config.fields.location.mode === 'required' || config.fields.location.mode === 'conditional') {
      throw new Error('location field should not be required for remote-only job boards');
    }
  }
}

/**
 * Merge user config with preset and validate
 */
export function resolveConfig(userConfig: Partial<JobBoardConfig>): JobBoardConfig {
  const preset = userConfig.preset || 'remote-first';

  if (preset === 'custom') {
    // Custom preset requires explicit configuration
    if (!userConfig.allowedLocationTypes || !userConfig.fields) {
      throw new Error(
        'Custom preset requires explicit configuration. Please specify allowedLocationTypes and fields.'
      );
    }

    // Validate and return
    const config = jobBoardConfigSchema.parse(userConfig);
    validateConfigLogic(config);
    return config;
  }

  const basePreset = getPreset(preset);
  if (!basePreset) {
    throw new Error(`Unknown preset: ${preset}`);
  }

  // Deep merge user overrides with preset
  const merged: JobBoardConfig = {
    preset: basePreset.preset,
    allowedLocationTypes: userConfig.allowedLocationTypes ?? basePreset.allowedLocationTypes,
    defaultLocationType: userConfig.defaultLocationType ?? basePreset.defaultLocationType,
    fields: {
      location: userConfig.fields?.location ?? basePreset.fields.location,
      hiringLocation: userConfig.fields?.hiringLocation ?? basePreset.fields.hiringLocation,
      workingPermits: userConfig.fields?.workingPermits ?? basePreset.fields.workingPermits,
      salary: userConfig.fields?.salary ?? basePreset.fields.salary
    }
  };

  // Validate merged config
  const validated = jobBoardConfigSchema.parse(merged);
  validateConfigLogic(validated);

  return validated;
}
```

#### Step 1.3: Config Getter with Cache Management

**File**: `src/lib/config/jobs/config.server.ts` (NEW)

```typescript
import { dev } from '$app/environment';
import { siteConfig } from '$lib/config/site.server';
import { resolveConfig } from './presets.server';
import type { JobBoardConfig } from './schema.server';

let cachedConfig: JobBoardConfig | null = null;

/**
 * Get the resolved job board configuration
 *
 * IMPORTANT: Config changes require server restart in production.
 * In development mode, config is refreshed on each call for better DX.
 *
 * @param forceRefresh - Force refresh of cached config (useful for testing)
 * @returns Validated job board configuration
 */
export function getJobBoardConfig(forceRefresh = false): JobBoardConfig {
  // In dev mode, always refresh for better DX
  // In production, cache unless forceRefresh is true
  if (!cachedConfig || forceRefresh || dev) {
    cachedConfig = resolveConfig(siteConfig.jobBoard);
  }
  return cachedConfig;
}

/**
 * Clear the cached config (useful for testing)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}
```

#### Step 1.4: Export Module

**File**: `src/lib/config/jobs/index.ts` (NEW)

```typescript
export * from './schema.server';
export * from './presets.server';
export * from './config.server';
```

#### Step 1.5: Update Site Config

**File**: `src/lib/config/site.server.ts` (UPDATE)

```typescript
import { env } from '$env/dynamic/private';
import type { JobBoardConfig } from './jobs';

export const siteConfig = {
  appName: 'Job Board Starter',
  optionalEnv: {
    firecrawlApiKey: env.FIRECRAWL_API_KEY ?? null,
    openRouterApiKey: env.OPENROUTER_API_KEY ?? null
  },
  flags: {
    darkMode: true,
    prefillJobFromURL: true,
    enrichDescription: true
  },
  auth: {
    authPageImage: '/public/auth-screen.jpg'
  },

  /**
   * Job Board Configuration
   *
   * ⚠️ IMPORTANT: Configuration changes require server restart
   *
   * Choose a preset that matches your job board type:
   *
   * - 'remote-first': Tech/startup boards (default)
   *   → All location types, defaults to remote, location required for onsite/hybrid
   *
   * - 'local-only': Restaurant, retail, healthcare
   *   → Only onsite jobs, location always required, no remote fields
   *
   * - 'hybrid-first': Post-COVID mixed boards
   *   → All location types, defaults to hybrid, location required for onsite/hybrid
   *
   * - 'flexible': General purpose
   *   → All location types, no defaults, location conditional
   *
   * - 'custom': Full customization (advanced)
   *   → Requires explicit allowedLocationTypes and fields configuration
   *
   * Examples:
   *
   * // Use preset as-is
   * jobBoard: { preset: 'local-only' }
   *
   * // Override preset settings
   * jobBoard: {
   *   preset: 'remote-first',
   *   fields: {
   *     salary: { mode: 'required' }
   *   }
   * }
   *
   * // Full custom configuration
   * jobBoard: {
   *   preset: 'custom',
   *   allowedLocationTypes: ['remote', 'onsite'],
   *   defaultLocationType: 'remote',
   *   fields: {
   *     location: { mode: 'conditional' },
   *     hiringLocation: { mode: 'optional' },
   *     workingPermits: { mode: 'hidden' },
   *     salary: { mode: 'required' }
   *   }
   * }
   */
  jobBoard: {
    preset: 'remote-first'
  } as Partial<JobBoardConfig>,

  featuredRecruiters: [
    // ... existing ...
  ],
  featuredTalents: [
    // ... existing ...
  ]
} as const;

export type SiteConfig = typeof siteConfig;
export type ClientSiteConfig = Pick<SiteConfig, 'flags'>;
```

### Phase 2: Type-Safe Validators (3-4 hours)

#### Step 2.1: Create Base Schema and Validator

**File**: `src/lib/features/jobs/validators.ts` (UPDATE)

```typescript
import { z } from 'zod';
import {
  LOCATION_TYPES,
  JOB_TYPES,
  SENIORITY_LEVELS,
  HIRING_LOCATION_TYPES,
  WORKING_PERMITS_TYPES,
  CURRENCIES
} from './constants';
import type { JobBoardConfig } from '$lib/config/jobs';

/**
 * Base job posting schema with all fields optional
 * This maintains type safety while allowing runtime validation
 */
export const baseJobPostingSchema = z.object({
  job: z.object({
    title: z.string().min(1, 'Title is required').max(80, 'Title must be under 80 characters'),
    description: z.string().min(1, 'Description is required'),
    type: z.enum(JOB_TYPES, { required_error: 'Job type is required' }),
    seniority: z
      .array(z.enum(SENIORITY_LEVELS))
      .min(1, 'At least one seniority level is required'),
    appLinkOrEmail: z
      .string()
      .min(1, 'Application method is required')
      .refine(
        (val) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const urlRegex = /^https?:\/\/.+/;
          return emailRegex.test(val) || urlRegex.test(val);
        },
        { message: 'Must be a valid email or URL' }
      ),
    applicationDeadline: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Must be a valid date' })
  }),
  locationType: z.enum(LOCATION_TYPES),
  location: z.string().max(255, 'Location must be under 255 characters').optional(),
  hiringLocation: z.object({
    type: z.enum(HIRING_LOCATION_TYPES).optional(),
    timezones: z.array(z.string()).default([])
  }).optional(),
  workingPermits: z.object({
    type: z.enum(WORKING_PERMITS_TYPES).optional(),
    permits: z.array(z.string()).default([])
  }).optional(),
  salary: z
    .object({
      min: z.number().int().positive().optional(),
      max: z.number().int().positive().optional(),
      currency: z.enum(CURRENCIES).default('USD')
    })
    .refine(
      (data) => {
        if (data.min !== undefined && data.max !== undefined) {
          return data.max >= data.min;
        }
        return true;
      },
      { message: 'Maximum salary must be greater than or equal to minimum salary' }
    )
    .optional(),
  organization: z.object({
    name: z.string().min(1, 'Company name is required'),
    url: z.string().url('Must be a valid URL'),
    logo: z.string().optional()
  }),
  customerEmail: z.string().email('Must be a valid email'),
  selectedUpsells: z.array(z.string()).default([])
});

export type JobPostingInput = z.infer<typeof baseJobPostingSchema>;

/**
 * Build dynamic schema that only includes visible fields
 * This ensures hidden fields don't appear in validation errors
 */
export function buildPublicJobPostingSchema(config: JobBoardConfig) {
  // Build schema fields based on config
  const schemaFields: any = {
    job: baseJobPostingSchema.shape.job,
    organization: baseJobPostingSchema.shape.organization,
    customerEmail: baseJobPostingSchema.shape.customerEmail,
    selectedUpsells: baseJobPostingSchema.shape.selectedUpsells,
  };

  // Location type - only allow configured types with default
  const allowedTypes = config.allowedLocationTypes as [string, ...string[]];
  const defaultType = config.defaultLocationType || config.allowedLocationTypes[0];
  schemaFields.locationType = z.enum(allowedTypes).default(defaultType);

  // Physical location - only include if not hidden
  if (config.fields.location.mode !== 'hidden') {
    const locationMode = config.fields.location.mode;

    if (locationMode === 'required') {
      schemaFields.location = z
        .string()
        .min(1, 'Office location is required')
        .max(255, 'Location must be under 255 characters');
    } else {
      // optional or conditional - will validate conditionally below
      schemaFields.location = z
        .string()
        .max(255, 'Location must be under 255 characters')
        .optional();
    }
  }

  // Hiring location - only include if not hidden
  if (config.fields.hiringLocation.mode !== 'hidden') {
    const mode = config.fields.hiringLocation.mode;

    schemaFields.hiringLocation = z.object({
      type: mode === 'required'
        ? z.enum(HIRING_LOCATION_TYPES, { required_error: 'Hiring location type is required' })
        : z.enum(HIRING_LOCATION_TYPES).optional(),
      timezones: z.array(z.string()).default([])
    });
  }

  // Working permits - only include if not hidden
  if (config.fields.workingPermits.mode !== 'hidden') {
    const mode = config.fields.workingPermits.mode;

    schemaFields.workingPermits = z.object({
      type: mode === 'required'
        ? z.enum(WORKING_PERMITS_TYPES, { required_error: 'Working permits type is required' })
        : z.enum(WORKING_PERMITS_TYPES).optional(),
      permits: z.array(z.string()).default([])
    });
  }

  // Salary - only include if not hidden
  if (config.fields.salary.mode !== 'hidden') {
    const mode = config.fields.salary.mode;

    const salaryBase = z
      .object({
        min: z.number().int().positive().optional(),
        max: z.number().int().positive().optional(),
        currency: z.enum(CURRENCIES).default('USD')
      })
      .refine(
        (data) => {
          if (data.min !== undefined && data.max !== undefined) {
            return data.max >= data.min;
          }
          return true;
        },
        { message: 'Maximum salary must be greater than or equal to minimum salary' }
      );

    if (mode === 'required') {
      schemaFields.salary = salaryBase.refine(
        (data) => data.min !== undefined || data.max !== undefined,
        { message: 'Salary information is required' }
      );
    } else {
      schemaFields.salary = salaryBase;
    }
  }

  // Build base schema
  let schema = z.object(schemaFields);

  // Add conditional validations

  // 1. Location is required for onsite/hybrid when mode is 'conditional'
  if (config.fields.location.mode === 'conditional') {
    schema = schema.refine(
      (data) => {
        if (data.locationType === 'onsite' || data.locationType === 'hybrid') {
          return data.location && data.location.length > 0;
        }
        return true;
      },
      {
        message: (data: any) => {
          if (data.locationType === 'onsite') {
            return 'Office location is required for onsite positions';
          }
          return 'Office location is required for hybrid positions';
        },
        path: ['location']
      }
    );
  }

  // 2. Timezones are required when hiringLocation type is 'timezone'
  if (config.fields.hiringLocation.mode !== 'hidden') {
    schema = schema.refine(
      (data) => {
        if (data.hiringLocation?.type === 'timezone') {
          return data.hiringLocation.timezones && data.hiringLocation.timezones.length > 0;
        }
        return true;
      },
      {
        message: 'At least one timezone is required when hiring by timezone',
        path: ['hiringLocation', 'timezones']
      }
    );
  }

  return schema;
}

/**
 * Validate job posting data against config
 * This is the main validation function used in forms
 */
export function validateJobPosting(data: unknown, config: JobBoardConfig) {
  const schema = buildPublicJobPostingSchema(config);
  return schema.parse(data);
}

/**
 * Type for the validated job posting
 * This is what you get after successful validation
 */
export type ValidatedJobPosting = z.infer<typeof baseJobPostingSchema>;
```

#### Step 2.2: Update Post Job Action

**File**: `src/lib/features/jobs/actions/post-job.remote.ts` (UPDATE)

```typescript
import { command, form } from '$app/server';
import { buildPublicJobPostingSchema } from '$lib/features/jobs/validators';
import { getJobBoardConfig } from '$lib/config/jobs/config.server';
import { z } from 'zod';

/**
 * Get the dynamic schema based on job board config
 * This runs at request time, using the cached config
 */
const getSchema = () => buildPublicJobPostingSchema(getJobBoardConfig());

export const prefillFromATS = command(z.string(), async (atsUrl: string) => {
  console.log('Prefilling from ATS URL:', atsUrl);
});

export const submitJobPosting = form(getSchema(), async (data) => {
  console.log('Job posting data:', data);

  // Simulate processing
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    success: true,
    jobId: 'job_' + Date.now(),
    message: 'Job posted successfully!'
  };
});

export type SubmitJobOutput = {
  success: boolean;
  jobId: string;
  message: string;
};
```

### Phase 3: Update Form Components (4-5 hours)

#### Step 3.1: Pass Config to Page

**File**: `src/routes/(public)/post-a-job/+page.server.ts` (UPDATE)

```typescript
import type { PageServerLoad } from './$types';
import { getPricingConfig, enrichUpsellsWithTranslations } from '$lib/config/products';
import { getJobBoardConfig } from '$lib/config/jobs/config.server';
import * as m from '$lib/paraglide/messages';

export const load: PageServerLoad = async () => {
  const pricingConfig = getPricingConfig();
  const jobBoardConfig = getJobBoardConfig();

  const enrichedUpsells = enrichUpsellsWithTranslations(pricingConfig.upsells, m);

  return {
    pricing: {
      ...pricingConfig.jobPosting,
      upsells: enrichedUpsells
    },
    jobBoardConfig
  };
};
```

#### Step 3.2: Update Location Section

**File**: `src/lib/features/jobs/components/job-posting/form-sections/location-section.svelte` (COMPLETE REWRITE)

```svelte
<script lang="ts">
  import * as Field from '$lib/components/ui/field/index.js';
  import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { locationTypesList } from '$lib/features/jobs/constants';
  import TimezonePicker from '$lib/components/timezone-picker.svelte';
  import { getFormFieldIssues } from '$lib/utils/generators';
  import type { PublicJobPostingFields } from '../types';
  import type { JobBoardConfig } from '$lib/config/jobs';

  let {
    fields,
    config
  }: {
    fields: PublicJobPostingFields;
    config: JobBoardConfig;
  } = $props();

  // Filter location types based on config
  const allLocationTypes = locationTypesList();
  const allowedLocationTypes = allLocationTypes.filter((lt) =>
    config.allowedLocationTypes.includes(lt.value as any)
  );

  // Reactive values
  const selectedLocationType = $derived(fields.locationType.value());
  const selectedHiringLocationType = $derived(fields.hiringLocation?.type.value());
  const selectedTimezones = $derived(fields.hiringLocation?.timezones.value() || []);
  const location = $derived(fields.location?.value() || '');

  // Determine field visibility and requirements based on config

  // Show physical location input when not hidden AND
  // (required always OR conditional with onsite/hybrid selected)
  const showLocationInput = $derived(
    config.fields.location.mode !== 'hidden' &&
      (config.fields.location.mode === 'required' ||
       config.fields.location.mode === 'optional' ||
        (config.fields.location.mode === 'conditional' &&
          (selectedLocationType === 'onsite' || selectedLocationType === 'hybrid')))
  );

  // Show hiring location (timezone) when not hidden AND remote or hybrid selected
  const showHiringLocation = $derived(
    config.fields.hiringLocation.mode !== 'hidden' &&
      (selectedLocationType === 'remote' || selectedLocationType === 'hybrid')
  );

  // Location is required when mode is 'required' OR
  // mode is 'conditional' AND onsite/hybrid selected
  const isLocationRequired = $derived(
    config.fields.location.mode === 'required' ||
      (config.fields.location.mode === 'conditional' &&
        (selectedLocationType === 'onsite' || selectedLocationType === 'hybrid'))
  );

  // Hiring location is required when mode is 'required'
  const isHiringLocationRequired = $derived(
    config.fields.hiringLocation.mode === 'required'
  );
</script>

<Field.Set>
  <Field.Legend>Location & Work Arrangement</Field.Legend>
  <Field.Description>Specify where and how the work will be performed</Field.Description>
  <Field.Separator />
  <Field.Group class="@container/field-group">

    <!-- Location Type Selection (if more than one option) -->
    {#if allowedLocationTypes.length > 1}
      <Field.Field
        orientation="responsive"
        class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
      >
        <Field.Content>
          <Field.Label for="location-type">Location Type *</Field.Label>
          <Field.Description>How will this role be performed?</Field.Description>
        </Field.Content>
        <div class="flex flex-col gap-2">
          <RadioGroup.Root
            value={selectedLocationType}
            onValueChange={(v) => {
              if (v) {
                fields.locationType.set(v as any);

                // Clear location when switching to remote
                if (v === 'remote' && fields.location) {
                  fields.location.set('');
                }
              }
            }}
          >
            {#each allowedLocationTypes as locType (locType.value)}
              <Field.Field orientation="horizontal">
                <RadioGroup.Item value={locType.value} id="location-{locType.value}" />
                <Field.Label for="location-{locType.value}" class="font-normal">
                  {locType.label}
                </Field.Label>
              </Field.Field>
            {/each}
          </RadioGroup.Root>
        </div>
      </Field.Field>
      <Field.Separator />
    {/if}

    <!-- Physical Location (Office Address) -->
    {#if showLocationInput}
      <Field.Field
        orientation="responsive"
        data-invalid={getFormFieldIssues(fields.location).length > 0}
        class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
      >
        <Field.Content>
          <Field.Label for="job-location">
            Office Location {isLocationRequired ? '*' : ''}
          </Field.Label>
          <Field.Description>
            {#if selectedLocationType === 'onsite'}
              Where will the employee work? (e.g., "San Francisco, CA, USA")
            {:else if selectedLocationType === 'hybrid'}
              Where is the office for in-person work? (e.g., "San Francisco, CA, USA")
            {:else}
              Optional physical office location (e.g., "San Francisco, CA, USA")
            {/if}
          </Field.Description>
        </Field.Content>
        <div class="flex flex-col gap-2">
          <Input
            id="job-location"
            type="text"
            placeholder="e.g., San Francisco, CA, USA"
            value={location}
            oninput={(e) => fields.location?.set(e.currentTarget.value)}
          />
          {#each getFormFieldIssues(fields.location) as issue, i (i)}
            <Field.Error>{issue.message}</Field.Error>
          {/each}
        </div>
      </Field.Field>
      <Field.Separator />
    {/if}

    <!-- Hiring Location (Timezone-based, for remote/hybrid) -->
    {#if showHiringLocation}
      <Field.Field
        orientation="responsive"
        class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
      >
        <Field.Content>
          <Field.Label>
            Hiring Location {isHiringLocationRequired ? '*' : ''}
          </Field.Label>
          <Field.Description>Who can apply based on location?</Field.Description>
        </Field.Content>
        <div class="flex flex-col gap-2">
          <RadioGroup.Root
            value={selectedHiringLocationType}
            onValueChange={(v) => {
              if (v) {
                fields.hiringLocation?.type.set(v as any);

                // Clear timezones when switching to worldwide
                if (v === 'worldwide' && fields.hiringLocation) {
                  fields.hiringLocation.timezones.set([]);
                }
              }
            }}
          >
            <Field.Field orientation="horizontal">
              <RadioGroup.Item value="worldwide" id="hiring-worldwide" />
              <Field.Label for="hiring-worldwide" class="font-normal">
                Worldwide - Hire from anywhere
              </Field.Label>
            </Field.Field>
            <Field.Field orientation="horizontal">
              <RadioGroup.Item value="timezone" id="hiring-timezone" />
              <Field.Label for="hiring-timezone" class="font-normal">
                Specific Timezones
              </Field.Label>
            </Field.Field>
          </RadioGroup.Root>
        </div>
      </Field.Field>

      {#if selectedHiringLocationType === 'timezone'}
        <Field.Separator />
        <Field.Field
          orientation="responsive"
          data-invalid={getFormFieldIssues(fields.hiringLocation.timezones).length > 0}
          class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
        >
          <Field.Content>
            <Field.Label for="timezones">Allowed Timezones *</Field.Label>
            <Field.Description>Select one or more timezones where you're hiring</Field.Description>
          </Field.Content>
          <div class="flex flex-col gap-2">
            <TimezonePicker
              value={selectedTimezones}
              onchange={(v: string[]) => fields.hiringLocation?.timezones.set(v)}
              placeholder="Select timezones..."
              class="w-full"
            />
            {#each getFormFieldIssues(fields.hiringLocation.timezones) as issue, i (i)}
              <Field.Error>{issue.message}</Field.Error>
            {/each}
          </div>
        </Field.Field>
      {/if}
    {/if}

  </Field.Group>
</Field.Set>
```

#### Step 3.3: Update Working Permits Section

**File**: `src/lib/features/jobs/components/job-posting/form-sections/working-permits-section.svelte` (UPDATE)

```svelte
<script lang="ts">
  import * as Field from '$lib/components/ui/field/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
  import type { PublicJobPostingFields } from '../types';
  import type { JobBoardConfig } from '$lib/config/jobs';

  let {
    fields,
    config
  }: {
    fields: PublicJobPostingFields;
    config: JobBoardConfig;
  } = $props();

  const selectedWorkingPermitsType = $derived(fields.workingPermits?.type.value());

  // Only show section if not hidden
  const showSection = config.fields.workingPermits.mode !== 'hidden';
  const isRequired = config.fields.workingPermits.mode === 'required';
</script>

{#if showSection}
  <Field.Set>
    <Field.Legend>Working Permits</Field.Legend>
    <Field.Description>Specify any visa or work permit requirements</Field.Description>
    <Field.Separator />
    <Field.Group class="@container/field-group">
      <Field.Field
        orientation="responsive"
        class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
      >
        <Field.Content>
          <Field.Label>
            Working Permits Type {isRequired ? '*' : ''}
          </Field.Label>
          <Field.Description>Are there any work authorization requirements?</Field.Description>
        </Field.Content>
        <div class="flex flex-col gap-2">
          <RadioGroup.Root
            value={selectedWorkingPermitsType}
            onValueChange={(v) => {
              if (v) {
                fields.workingPermits?.type.set(v as any);

                // Clear permits when switching to no-specific
                if (v === 'no-specific' && fields.workingPermits) {
                  fields.workingPermits.permits.set([]);
                }
              }
            }}
          >
            <Field.Field orientation="horizontal">
              <RadioGroup.Item value="no-specific" id="permits-none" />
              <Field.Label for="permits-none" class="font-normal">
                No specific requirements
              </Field.Label>
            </Field.Field>
            <Field.Field orientation="horizontal">
              <RadioGroup.Item value="required" id="permits-required" />
              <Field.Label for="permits-required" class="font-normal">
                Specific permits required
              </Field.Label>
            </Field.Field>
          </RadioGroup.Root>
        </div>
      </Field.Field>

      {#if selectedWorkingPermitsType === 'required'}
        <Field.Separator />
        <Field.Field
          orientation="responsive"
          class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
        >
          <Field.Content>
            <Field.Label for="required-permits">Required Permits</Field.Label>
            <Field.Description>Enter required permits separated by commas</Field.Description>
          </Field.Content>
          <div class="flex flex-col gap-2">
            <Input
              id="required-permits"
              placeholder="e.g., US Work Authorization, EU Work Permit"
              {...fields.workingPermits?.permits.as('select multiple')}
            />
          </div>
        </Field.Field>
      {/if}
    </Field.Group>
  </Field.Set>
{/if}
```

#### Step 3.4: Create Salary Section

**File**: `src/lib/features/jobs/components/job-posting/form-sections/salary-section.svelte` (NEW)

```svelte
<script lang="ts">
  import * as Field from '$lib/components/ui/field/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { getFormFieldIssues } from '$lib/utils/generators';
  import type { PublicJobPostingFields } from '../types';
  import type { JobBoardConfig } from '$lib/config/jobs';

  let {
    fields,
    config
  }: {
    fields: PublicJobPostingFields;
    config: JobBoardConfig;
  } = $props();

  const salaryMin = $derived(fields.salary?.min.value());
  const salaryMax = $derived(fields.salary?.max.value());
  const currency = $derived(fields.salary?.currency.value() || 'USD');

  // Only show section if not hidden
  const showSection = config.fields.salary.mode !== 'hidden';
  const isRequired = config.fields.salary.mode === 'required';
</script>

{#if showSection}
  <Field.Set>
    <Field.Legend>Salary Information</Field.Legend>
    <Field.Description>
      {#if isRequired}
        Salary range is required for this job board
      {:else}
        Optional salary information helps attract qualified candidates
      {/if}
    </Field.Description>
    <Field.Separator />
    <Field.Group class="@container/field-group">

      <Field.Field
        orientation="responsive"
        class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
      >
        <Field.Content>
          <Field.Label>Salary Range {isRequired ? '*' : ''}</Field.Label>
          <Field.Description>Annual salary range for this position</Field.Description>
        </Field.Content>
        <div class="flex flex-col gap-4">
          <div class="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Min"
              value={salaryMin?.toString() || ''}
              oninput={(e) => {
                const val = e.currentTarget.value;
                fields.salary?.min.set(val ? parseInt(val, 10) : undefined);
              }}
              class="flex-1"
            />
            <span class="text-muted-foreground">to</span>
            <Input
              type="number"
              placeholder="Max"
              value={salaryMax?.toString() || ''}
              oninput={(e) => {
                const val = e.currentTarget.value;
                fields.salary?.max.set(val ? parseInt(val, 10) : undefined);
              }}
              class="flex-1"
            />
            <Select.Root
              selected={{ value: currency, label: currency }}
              onSelectedChange={(v) => {
                if (v) fields.salary?.currency.set(v.value as any);
              }}
            >
              <Select.Trigger class="w-24">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="USD">USD</Select.Item>
                <Select.Item value="EUR">EUR</Select.Item>
                <Select.Item value="GBP">GBP</Select.Item>
                <Select.Item value="CAD">CAD</Select.Item>
                <Select.Item value="AUD">AUD</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>
          {#each getFormFieldIssues(fields.salary) as issue, i (i)}
            <Field.Error>{issue.message}</Field.Error>
          {/each}
        </div>
      </Field.Field>

    </Field.Group>
  </Field.Set>
{/if}
```

#### Step 3.5: Update Main Form

**File**: `src/routes/(public)/post-a-job/+page.svelte` (UPDATE)

```svelte
<script lang="ts">
  // ... existing imports ...
  import SalarySection from '$lib/features/jobs/components/job-posting/form-sections/salary-section.svelte';

  let { data }: { data: PageData } = $props();

  const pricing = data.pricing;
  const jobBoardConfig = data.jobBoardConfig;

  // ... rest of code ...
</script>

<!-- ... -->

<form {...submitJobPosting} class="w-full">
  <Field.Group>
    <JobInformationSection
      fields={submitJobPosting.fields as PublicJobPostingFields}
    />
    <Field.Separator />

    <LocationSection
      fields={submitJobPosting.fields as PublicJobPostingFields}
      config={jobBoardConfig}
    />
    <Field.Separator />

    <WorkingPermitsSection
      fields={submitJobPosting.fields as PublicJobPostingFields}
      config={jobBoardConfig}
    />
    <Field.Separator />

    <SalarySection
      fields={submitJobPosting.fields as PublicJobPostingFields}
      config={jobBoardConfig}
    />
    <Field.Separator />

    <CompanyInformationSection
      fields={submitJobPosting.fields as PublicJobPostingFields}
    />
    <!-- ... rest ... -->
  </Field.Group>
</form>
```

#### Step 3.6: Update Types

**File**: `src/lib/features/jobs/components/job-posting/types.ts` (UPDATE)

```typescript
import type { submitJobPosting } from '$lib/features/jobs/actions/post-job.remote';

export type PublicJobPostingFields = typeof submitJobPosting.fields;
```

### Phase 4: Comprehensive Testing (3-4 hours)

#### Step 4.1: Config Validation Tests

**File**: `src/lib/config/jobs/config.server.test.ts` (NEW)

```typescript
import { describe, it, expect } from 'vitest';
import { resolveConfig } from './presets.server';
import type { JobBoardConfig } from './schema.server';

describe('Config Resolution and Validation', () => {
  it('rejects config with invalid defaultLocationType', () => {
    expect(() => {
      resolveConfig({
        preset: 'custom',
        allowedLocationTypes: ['remote'],
        defaultLocationType: 'onsite', // Not in allowedLocationTypes!
        fields: {
          location: { mode: 'hidden' },
          hiringLocation: { mode: 'optional' },
          workingPermits: { mode: 'hidden' },
          salary: { mode: 'optional' }
        }
      });
    }).toThrow(/must be in allowedLocationTypes/);
  });

  it('rejects local-only config with hidden location', () => {
    expect(() => {
      resolveConfig({
        preset: 'custom',
        allowedLocationTypes: ['onsite'],
        fields: {
          location: { mode: 'hidden' }, // Invalid for local-only!
          hiringLocation: { mode: 'hidden' },
          workingPermits: { mode: 'hidden' },
          salary: { mode: 'optional' }
        }
      });
    }).toThrow(/cannot be hidden for local-only/);
  });

  it('rejects remote-only config with required location', () => {
    expect(() => {
      resolveConfig({
        preset: 'custom',
        allowedLocationTypes: ['remote'],
        fields: {
          location: { mode: 'required' }, // Invalid for remote-only!
          hiringLocation: { mode: 'optional' },
          workingPermits: { mode: 'hidden' },
          salary: { mode: 'optional' }
        }
      });
    }).toThrow(/should not be required for remote-only/);
  });

  it('accepts valid custom config', () => {
    const config = resolveConfig({
      preset: 'custom',
      allowedLocationTypes: ['remote', 'onsite'],
      defaultLocationType: 'remote',
      fields: {
        location: { mode: 'conditional' },
        hiringLocation: { mode: 'optional' },
        workingPermits: { mode: 'hidden' },
        salary: { mode: 'required' }
      }
    });

    expect(config.preset).toBe('custom');
    expect(config.fields.salary.mode).toBe('required');
  });

  it('custom preset requires explicit config', () => {
    expect(() => {
      resolveConfig({ preset: 'custom' });
    }).toThrow(/requires explicit configuration/);
  });

  it('merges user overrides with preset', () => {
    const config = resolveConfig({
      preset: 'remote-first',
      fields: {
        salary: { mode: 'required' }
      }
    });

    expect(config.preset).toBe('remote-first');
    expect(config.fields.salary.mode).toBe('required');
    expect(config.fields.location.mode).toBe('conditional'); // From preset
  });
});
```

#### Step 4.2: Preset Tests

**File**: `src/lib/config/jobs/presets.server.test.ts` (NEW)

```typescript
import { describe, it, expect } from 'vitest';
import {
  REMOTE_FIRST_PRESET,
  LOCAL_ONLY_PRESET,
  HYBRID_FIRST_PRESET,
  FLEXIBLE_PRESET,
  getPreset
} from './presets.server';
import { jobBoardConfigSchema } from './schema.server';

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
```

#### Step 4.3: Validator Tests

**File**: `src/lib/features/jobs/validators.test.ts` (NEW)

```typescript
import { describe, it, expect } from 'vitest';
import { buildPublicJobPostingSchema } from './validators';
import {
  REMOTE_FIRST_PRESET,
  LOCAL_ONLY_PRESET,
  HYBRID_FIRST_PRESET
} from '$lib/config/jobs/presets.server';

describe('Dynamic Job Validators', () => {
  const baseJob = {
    job: {
      title: 'Senior Engineer',
      description: 'Great role',
      type: 'full_time' as const,
      seniority: ['senior' as const],
      appLinkOrEmail: 'apply@company.com',
      applicationDeadline: '2025-12-31'
    },
    organization: { name: 'ACME Inc', url: 'https://acme.com' },
    customerEmail: 'recruiter@acme.com',
    selectedUpsells: []
  };

  describe('Remote-First Preset', () => {
    const schema = buildPublicJobPostingSchema(REMOTE_FIRST_PRESET);

    it('allows remote job without location', () => {
      const job = {
        ...baseJob,
        locationType: 'remote',
        hiringLocation: { type: 'worldwide', timezones: [] },
        workingPermits: { type: 'no-specific', permits: [] },
        salary: { currency: 'USD' }
      };

      expect(() => schema.parse(job)).not.toThrow();
    });

    it('requires location for onsite job', () => {
      const job = {
        ...baseJob,
        locationType: 'onsite',
        hiringLocation: { type: 'worldwide', timezones: [] },
        workingPermits: { type: 'no-specific', permits: [] },
        salary: { currency: 'USD' }
      };

      expect(() => schema.parse(job)).toThrow(/Office location is required for onsite/);
    });

    it('accepts onsite job with location', () => {
      const job = {
        ...baseJob,
        locationType: 'onsite',
        location: 'San Francisco, CA, USA',
        hiringLocation: { type: 'worldwide', timezones: [] },
        workingPermits: { type: 'no-specific', permits: [] },
        salary: { currency: 'USD' }
      };

      expect(() => schema.parse(job)).not.toThrow();
    });

    it('requires location for hybrid job', () => {
      const job = {
        ...baseJob,
        locationType: 'hybrid',
        hiringLocation: { type: 'worldwide', timezones: [] },
        workingPermits: { type: 'no-specific', permits: [] },
        salary: { currency: 'USD' }
      };

      expect(() => schema.parse(job)).toThrow(/Office location is required for hybrid/);
    });

    it('requires timezones when hiring by timezone', () => {
      const job = {
        ...baseJob,
        locationType: 'remote',
        hiringLocation: { type: 'timezone', timezones: [] },
        workingPermits: { type: 'no-specific', permits: [] },
        salary: { currency: 'USD' }
      };

      expect(() => schema.parse(job)).toThrow(/timezone is required/);
    });

    it('accepts timezone hiring with timezones', () => {
      const job = {
        ...baseJob,
        locationType: 'remote',
        hiringLocation: { type: 'timezone', timezones: ['America/New_York'] },
        workingPermits: { type: 'no-specific', permits: [] },
        salary: { currency: 'USD' }
      };

      expect(() => schema.parse(job)).not.toThrow();
    });

    it('rejects location over 255 characters', () => {
      const job = {
        ...baseJob,
        locationType: 'onsite',
        location: 'a'.repeat(256),
        hiringLocation: { type: 'worldwide', timezones: [] },
        workingPermits: { type: 'no-specific', permits: [] },
        salary: { currency: 'USD' }
      };

      expect(() => schema.parse(job)).toThrow(/under 255 characters/);
    });
  });

  describe('Local-Only Preset', () => {
    const schema = buildPublicJobPostingSchema(LOCAL_ONLY_PRESET);

    it('requires location for onsite job', () => {
      const job = {
        ...baseJob,
        locationType: 'onsite',
        salary: { currency: 'USD' }
      };

      expect(() => schema.parse(job)).toThrow(/Office location is required/);
    });

    it('accepts onsite job with location', () => {
      const job = {
        ...baseJob,
        locationType: 'onsite',
        location: '123 Main St, New York, NY',
        salary: { currency: 'USD' }
      };

      expect(() => schema.parse(job)).not.toThrow();
    });

    it('schema only allows onsite location type', () => {
      const job = {
        ...baseJob,
        locationType: 'remote' as any, // Should fail - not allowed
        location: 'New York',
        salary: { currency: 'USD' }
      };

      expect(() => schema.parse(job)).toThrow();
    });

    it('does not include hiringLocation in schema', () => {
      const job = {
        ...baseJob,
        locationType: 'onsite',
        location: 'New York',
        hiringLocation: { type: 'worldwide', timezones: [] }, // Should be ignored
        salary: { currency: 'USD' }
      };

      const result = schema.parse(job);
      expect(result).not.toHaveProperty('hiringLocation');
    });
  });

  describe('Hybrid-First Preset', () => {
    const schema = buildPublicJobPostingSchema(HYBRID_FIRST_PRESET);

    it('requires location for hybrid job', () => {
      const job = {
        ...baseJob,
        locationType: 'hybrid',
        hiringLocation: { type: 'worldwide', timezones: [] },
        workingPermits: { type: 'no-specific', permits: [] },
        salary: { currency: 'USD' }
      };

      expect(() => schema.parse(job)).toThrow(/Office location is required for hybrid/);
    });

    it('accepts hybrid job with location', () => {
      const job = {
        ...baseJob,
        locationType: 'hybrid',
        location: 'Austin, TX, USA',
        hiringLocation: { type: 'worldwide', timezones: [] },
        workingPermits: { type: 'no-specific', permits: [] },
        salary: { currency: 'USD' }
      };

      expect(() => schema.parse(job)).not.toThrow();
    });

    it('defaults to hybrid location type', () => {
      const job = {
        ...baseJob,
        location: 'Austin, TX',
        hiringLocation: { type: 'worldwide', timezones: [] },
        workingPermits: { type: 'no-specific', permits: [] },
        salary: { currency: 'USD' }
      };

      const result = schema.parse(job);
      expect(result.locationType).toBe('hybrid');
    });
  });
});
```

## Implementation Timeline

**Total: 13-17 hours** (increased due to additional validation and testing)

- Phase 1: Configuration System (3-4 hours)
- Phase 2: Type-Safe Validators (3-4 hours)
- Phase 3: Form Components (4-5 hours)
- Phase 4: Comprehensive Testing (3-4 hours)

## Success Criteria

✅ Users can switch job board type with one config change
✅ Physical location is REQUIRED for onsite/hybrid jobs
✅ Physical location is optional/hidden for remote jobs
✅ Form adapts reactively to location type selection
✅ Validators enforce conditional requirements
✅ All presets work correctly and pass tests
✅ **Type safety maintained throughout**
✅ **Invalid configs are rejected with clear errors**
✅ **Hidden fields don't appear in schema or validation**
✅ **Max length validation matches DB schema**
✅ **Timezone validation when required**
✅ **Clear, contextual error messages**
✅ Code is simple, testable, and flexible

## Documentation & User Guide

### Choosing Your Preset

**Decision Tree:**

```
Are you building a job board for physical locations only?
(restaurants, retail, healthcare, hospitality)
  → Use 'local-only' preset

Are you building a tech/startup remote-first job board?
  → Use 'remote-first' preset

Are you building a post-COVID hybrid job board?
  → Use 'hybrid-first' preset

Do you want all options with no defaults?
  → Use 'flexible' preset

Do you need complete custom control?
  → Use 'custom' preset (advanced)
```

### Configuration Examples

#### Remote-First Tech Board (Default)

```typescript
jobBoard: {
  preset: 'remote-first'
}
```

**Result:**
- ✅ Remote, hybrid, onsite options
- ✅ Defaults to remote
- ✅ Location required for onsite/hybrid
- ✅ Timezone filtering available
- ✅ All optional fields visible

#### Restaurant/Retail Job Board

```typescript
jobBoard: {
  preset: 'local-only'
}
```

**Result:**
- ✅ Onsite only
- ✅ Location always required
- ❌ No remote-specific fields
- ❌ No timezone/hiring location fields

#### Post-COVID Mixed Board

```typescript
jobBoard: {
  preset: 'hybrid-first'
}
```

**Result:**
- ✅ All location types
- ✅ Defaults to hybrid
- ✅ Location required for onsite/hybrid
- ✅ All options available

#### Custom: Override Preset

```typescript
jobBoard: {
  preset: 'remote-first',
  fields: {
    salary: { mode: 'required' } // Make salary required
  }
}
```

#### Custom: Full Control

```typescript
jobBoard: {
  preset: 'custom',
  allowedLocationTypes: ['remote', 'onsite'],
  defaultLocationType: 'remote',
  fields: {
    location: { mode: 'conditional' },
    hiringLocation: { mode: 'optional' },
    workingPermits: { mode: 'hidden' },
    salary: { mode: 'required' }
  }
}
```

### Field Modes Explained

- **`hidden`**: Field not shown, not in schema, not validated
- **`optional`**: Field shown, user can leave it empty
- **`required`**: Field shown, user must fill it out
- **`conditional`**: Field requirement depends on locationType
  - For `location`: required when onsite/hybrid selected

### Important Notes

#### Config Changes Require Restart

⚠️ **Configuration changes require a server restart** to take effect.

In production, the config is cached on first use. To apply changes:
```bash
# After editing site.server.ts
pm2 restart your-app
# or
systemctl restart your-app
```

In development, the config refreshes automatically on each request.

#### Data Migration

If you change presets on an existing job board with posted jobs, you may need to:

1. **Add missing required fields**: If switching to a preset that requires new fields (e.g., `remote-first` → `local-only` requires location), run a migration to add default values:

```typescript
// Migration example
await db.update(jobs)
  .set({ location: 'Location TBD - Please contact employer' })
  .where(and(
    eq(jobs.locationType, 'onsite'),
    isNull(jobs.location)
  ));
```

2. **Clean up unused fields**: If switching to a preset that hides fields (e.g., `remote-first` → `local-only` hides hiring location), data will persist but won't be shown.

3. **Validate existing jobs**: Run a script to validate all existing jobs against the new schema and flag issues.

### Troubleshooting

#### "Config validation failed"

Check that your config is logically consistent:
- `defaultLocationType` must be in `allowedLocationTypes`
- Local-only boards shouldn't hide location field
- Remote-only boards shouldn't require location field

#### "Field is undefined in form"

Make sure the field is not `hidden` in your config. Hidden fields are not included in the schema.

#### Type errors in validators

Don't use `z.infer<ReturnType<typeof buildPublicJobPostingSchema>>`. Use the exported `ValidatedJobPosting` type instead.

#### Changes not appearing

Remember: **config changes require server restart** in production.

## Testing Checklist

Before deploying, test each preset:

### Remote-First Preset
- [ ] Can post remote job without location
- [ ] Cannot post onsite job without location
- [ ] Cannot post hybrid job without location
- [ ] Can select timezones for remote job
- [ ] Form shows all location types
- [ ] Timezone field appears for remote/hybrid

### Local-Only Preset
- [ ] Cannot post job without location
- [ ] Only onsite option appears
- [ ] No timezone fields shown
- [ ] No hiring location fields shown
- [ ] Location always required

### Hybrid-First Preset
- [ ] Defaults to hybrid
- [ ] Cannot post hybrid without location
- [ ] Can post remote without location
- [ ] All options available
- [ ] Form adapts to selection

### Custom Preset
- [ ] Config validation works
- [ ] Overrides apply correctly
- [ ] Invalid configs rejected
- [ ] Fields show/hide correctly

## Next Steps

1. ✅ Review and approve updated plan
2. Implement Phase 1 (Configuration System)
3. Implement Phase 2 (Type-Safe Validators)
4. Implement Phase 3 (Form Components)
5. Implement Phase 4 (Comprehensive Testing)
6. Manual testing of all presets
7. Documentation updates in README
8. Add visual documentation (screenshots)
9. Create config testing page (dev-only)
10. Add migration guide for existing users

---

## Improvements Over Original Plan

### Critical Fixes ✅
1. Fixed type safety - no more broken `z.infer<ReturnType<...>>`
2. Simplified field config - single `mode` field instead of `visible` + `required`
3. Added config validation - prevents invalid combinations
4. Added timezone validation - required when type='timezone'
5. Added length validation - matches DB schema (255 chars)
6. Fixed custom preset - proper null handling, no type assertions
7. Implemented salary section - was missing
8. Conditionally build schema - hidden fields excluded
9. Better cache management - documented, dev mode bypass
10. Contextual error messages - helps users understand why

### Enhancements ✅
1. Comprehensive config validation tests
2. Logical consistency checks
3. Clear documentation with decision tree
4. Troubleshooting guide
5. Data migration guidance
6. Testing checklist
7. Better developer experience
8. Production-ready for commercial product

**Ready to implement!**
