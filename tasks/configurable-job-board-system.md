# Configurable Job Board System - Implementation Plan

**Status**: Planning
**Created**: 2025-11-21
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

3. **Testable**:
   - Each preset can be tested independently
   - Validators adapt to configuration
   - Form behavior is predictable

4. **Flexible**:
   - Support remote-only, local-only, hybrid boards
   - Allow custom field requirements
   - Extensible for future needs

### Out of Scope

- ✗ Backwards compatibility (making breaking changes is OK)
- ✗ Geographic/map-based location pickers (keep it simple with text input)
- ✗ Complex location validation (can add later)

## Current State Analysis

### Database Schema

`src/lib/server/db/schema/jobs.ts`:
```typescript
location: varchar('location', { length: 255 }), // City, Country
locationType: locationTypeEnum('location_type').notNull(),
```

**Status**: ✅ Schema already supports location field
**Issue**: ❌ No conditional requirement based on locationType

### Validators

`src/lib/features/jobs/validators.ts:78`:
```typescript
locationType: z.enum(LOCATION_TYPES).default('remote')
```

**Issues**:
- ❌ Hardcoded default to 'remote'
- ❌ No location field in public job posting schema
- ❌ No conditional validation based on locationType

### Form Components

`src/lib/features/jobs/components/job-posting/form-sections/location-section.svelte`:

**Issues**:
- ❌ No physical location input field
- ❌ Shows remote-specific fields (timezones, worldwide) always
- ❌ No conditional rendering based on locationType selection

## Solution Architecture

### Approach: Preset-Based Configuration with Conditional Location

**Three-Layer System**:

```
┌─────────────────────────────────────────┐
│  1. Preset Selection (site.server.ts)  │
│     preset: 'local-only' | 'remote-...' │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  2. Dynamic Validation (validators.ts)  │
│     - Conditional location requirement  │
│     - Config-driven field visibility    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  3. Reactive Form (location-section)    │
│     - Show location input for onsite/   │
│       hybrid                            │
│     - Show timezones for remote         │
│     - Validate based on selection       │
└─────────────────────────────────────────┘
```

### Key Design Decisions

1. **Location Field**:
   - Simple text input (e.g., "San Francisco, CA, USA" or "123 Main St, NYC")
   - Required for onsite/hybrid, optional/hidden for remote
   - Can enhance with autocomplete later

2. **Validation Logic**:
   - Dynamic schema builder: `buildJobPostingSchema(config)`
   - Conditional field requirements based on locationType
   - Config-driven defaults

3. **Form Behavior**:
   - Reactive: Show/hide fields based on locationType selection
   - Validate in real-time
   - Clear location when switching from onsite/hybrid to remote

## Implementation Plan

### Phase 1: Configuration System (2-3 hours)

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

export const jobBoardConfigSchema = z.object({
  preset: z.enum(PRESET_TYPES),

  // Which location types to allow
  allowedLocationTypes: z.array(z.enum(['remote', 'hybrid', 'onsite'])),

  // Default location type for new jobs
  defaultLocationType: z.enum(['remote', 'hybrid', 'onsite']).optional(),

  // Field visibility
  fields: z.object({
    location: z.object({
      visible: z.boolean(),
      required: z.enum(['always', 'never', 'conditional']) // conditional = required for onsite/hybrid
    }),
    hiringLocation: z.object({
      visible: z.boolean(),
      required: z.boolean()
    }),
    workingPermits: z.object({
      visible: z.boolean(),
      required: z.boolean()
    }),
    salary: z.object({
      visible: z.boolean(),
      required: z.boolean()
    })
  })
});

export type JobBoardConfig = z.infer<typeof jobBoardConfigSchema>;
export type PresetType = (typeof PRESET_TYPES)[number];
```

#### Step 1.2: Define Presets

**File**: `src/lib/config/jobs/presets.server.ts` (NEW)

```typescript
import type { JobBoardConfig } from './schema.server';

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
      visible: true,
      required: 'conditional' // Required when onsite/hybrid selected
    },
    hiringLocation: {
      visible: true,
      required: false
    },
    workingPermits: {
      visible: true,
      required: false
    },
    salary: {
      visible: true,
      required: false
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
      visible: true,
      required: 'always'
    },
    hiringLocation: {
      visible: false, // Not relevant for local-only
      required: false
    },
    workingPermits: {
      visible: false, // Usually not relevant
      required: false
    },
    salary: {
      visible: true,
      required: false
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
      visible: true,
      required: 'conditional'
    },
    hiringLocation: {
      visible: true,
      required: false
    },
    workingPermits: {
      visible: true,
      required: false
    },
    salary: {
      visible: true,
      required: false
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
      visible: true,
      required: 'conditional'
    },
    hiringLocation: {
      visible: true,
      required: false
    },
    workingPermits: {
      visible: true,
      required: false
    },
    salary: {
      visible: true,
      required: false
    }
  }
};

export const PRESETS = {
  'remote-first': REMOTE_FIRST_PRESET,
  'local-only': LOCAL_ONLY_PRESET,
  'hybrid-first': HYBRID_FIRST_PRESET,
  'flexible': FLEXIBLE_PRESET,
  'custom': {} as JobBoardConfig
} as const;

export function getPreset(name: keyof typeof PRESETS): JobBoardConfig {
  return PRESETS[name];
}

export function resolveConfig(userConfig: Partial<JobBoardConfig>): JobBoardConfig {
  const preset = userConfig.preset || 'remote-first';

  if (preset === 'custom') {
    return userConfig as JobBoardConfig;
  }

  const basePreset = getPreset(preset);

  // Merge user overrides
  return {
    ...basePreset,
    ...userConfig,
    fields: {
      ...basePreset.fields,
      ...userConfig.fields
    }
  };
}
```

#### Step 1.3: Config Getter

**File**: `src/lib/config/jobs/config.server.ts` (NEW)

```typescript
import { siteConfig } from '$lib/config/site.server';
import { resolveConfig } from './presets.server';
import type { JobBoardConfig } from './schema.server';

let cachedConfig: JobBoardConfig | null = null;

export function getJobBoardConfig(): JobBoardConfig {
  if (!cachedConfig) {
    cachedConfig = resolveConfig(siteConfig.jobBoard);
  }
  return cachedConfig;
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
   * Presets:
   * - 'remote-first': Tech/startup boards (default)
   * - 'local-only': Restaurant, retail, healthcare
   * - 'hybrid-first': Post-COVID mixed boards
   * - 'flexible': All options, no defaults
   * - 'custom': Full customization
   *
   * Examples:
   *
   * // Use preset
   * jobBoard: { preset: 'local-only' }
   *
   * // Override preset
   * jobBoard: {
   *   preset: 'remote-first',
   *   fields: { salary: { visible: true, required: true } }
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

### Phase 2: Dynamic Validators (2-3 hours)

#### Step 2.1: Update Job Validators

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
 * Build dynamic job posting schema based on config
 */
export function buildPublicJobPostingSchema(config: JobBoardConfig) {
  // Location type - only allow configured types
  const locationTypeSchema = z
    .enum(config.allowedLocationTypes as [string, ...string[]])
    .default(config.defaultLocationType || config.allowedLocationTypes[0]);

  // Physical location - conditional requirement
  let locationSchema: z.ZodString | z.ZodOptional<z.ZodString>;

  if (config.fields.location.required === 'always') {
    locationSchema = z.string().min(1, 'Location is required');
  } else if (config.fields.location.required === 'never') {
    locationSchema = z.string().optional();
  } else {
    // Conditional: required for onsite/hybrid
    locationSchema = z.string().optional();
  }

  // Hiring location schema
  const hiringLocationSchema = config.fields.hiringLocation.visible
    ? z.object({
        type: config.fields.hiringLocation.required
          ? z.enum(HIRING_LOCATION_TYPES, { required_error: 'Hiring location type is required' })
          : z.enum(HIRING_LOCATION_TYPES).optional(),
        timezones: z.array(z.string()).default([])
      })
    : z.object({
        type: z.enum(HIRING_LOCATION_TYPES).optional(),
        timezones: z.array(z.string()).default([])
      });

  // Working permits schema
  const workingPermitsSchema = config.fields.workingPermits.visible
    ? z.object({
        type: config.fields.workingPermits.required
          ? z.enum(WORKING_PERMITS_TYPES, { required_error: 'Working permits type is required' })
          : z.enum(WORKING_PERMITS_TYPES).optional(),
        permits: z.array(z.string()).default([])
      })
    : z.object({
        type: z.enum(WORKING_PERMITS_TYPES).optional(),
        permits: z.array(z.string()).default([])
      });

  // Salary schema
  const salarySchema = z
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

  const baseSchema = z.object({
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
    locationType: locationTypeSchema,
    location: locationSchema,
    hiringLocation: hiringLocationSchema,
    workingPermits: workingPermitsSchema,
    salary: salarySchema,
    organization: z.object({
      name: z.string().min(1, 'Company name is required'),
      url: z.string().url('Must be a valid URL'),
      logo: z.string().optional()
    }),
    customerEmail: z.string().email('Must be a valid email'),
    selectedUpsells: z.array(z.string()).default([])
  });

  // Add conditional validation for location field
  if (config.fields.location.required === 'conditional') {
    return baseSchema.refine(
      (data) => {
        // If onsite or hybrid, location is required
        if (data.locationType === 'onsite' || data.locationType === 'hybrid') {
          return data.location && data.location.length > 0;
        }
        return true;
      },
      {
        message: 'Location is required for onsite and hybrid positions',
        path: ['location']
      }
    );
  }

  return baseSchema;
}

export type PublicJobPostingInput = z.infer<ReturnType<typeof buildPublicJobPostingSchema>>;
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
 */
const getSchema = () => buildPublicJobPostingSchema(getJobBoardConfig());

export const prefillFromATS = command(z.string(), async (atsUrl: string) => {
  console.log('Prefilling from ATS URL:', atsUrl);
});

export const submitJobPosting = form(getSchema(), async (data) => {
  console.log('Job posting data:', data);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    success: true,
    jobId: 'job_' + Date.now(),
    message: 'Job posted successfully!'
  };
});

type SubmitJobOutput = {
  success: boolean;
  jobId: string;
  message: string;
};
```

### Phase 3: Update Form Components (3-4 hours)

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

  // Show physical location input when:
  // - Field is configured as visible
  // - AND (always required OR conditional and onsite/hybrid selected)
  const showLocationInput = $derived(
    config.fields.location.visible &&
      (config.fields.location.required === 'always' ||
        (config.fields.location.required === 'conditional' &&
          (selectedLocationType === 'onsite' || selectedLocationType === 'hybrid')))
  );

  // Show hiring location (timezone) when:
  // - Field is configured as visible
  // - AND remote or hybrid selected
  const showHiringLocation = $derived(
    config.fields.hiringLocation.visible &&
      (selectedLocationType === 'remote' || selectedLocationType === 'hybrid')
  );

  // Location is required for onsite/hybrid when conditional
  const isLocationRequired = $derived(
    config.fields.location.required === 'always' ||
      (config.fields.location.required === 'conditional' &&
        (selectedLocationType === 'onsite' || selectedLocationType === 'hybrid'))
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
        </Field.Content>
        <div class="flex flex-col gap-2">
          <RadioGroup.Root
            value={selectedLocationType}
            onValueChange={(v) => {
              if (v) fields.locationType.set(v as any);
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
              Where will the employee work? (e.g., "San Francisco, CA, USA" or "123 Main St, New York")
            {:else if selectedLocationType === 'hybrid'}
              Where is the office for in-person work? (e.g., "San Francisco, CA, USA")
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
          <Field.Label>Hiring Location {config.fields.hiringLocation.required ? '*' : ''}</Field.Label>
          <Field.Description>Who can apply based on location?</Field.Description>
        </Field.Content>
        <div class="flex flex-col gap-2">
          <RadioGroup.Root
            value={selectedHiringLocationType}
            onValueChange={(v) => {
              if (v) fields.hiringLocation?.type.set(v as any);
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

  // Only show section if configured as visible
  const showSection = config.fields.workingPermits.visible;
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
            Working Permits Type {config.fields.workingPermits.required ? '*' : ''}
          </Field.Label>
        </Field.Content>
        <div class="flex flex-col gap-2">
          <RadioGroup.Root
            value={selectedWorkingPermitsType}
            onValueChange={(v) => {
              if (v) fields.workingPermits?.type.set(v as any);
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
              placeholder="e.g., US Work Authorization, EU Work Permit (comma separated)"
              {...fields.workingPermits?.permits.as('select multiple')}
            />
          </div>
        </Field.Field>
      {/if}
    </Field.Group>
  </Field.Set>
{/if}
```

#### Step 3.4: Update Main Form

**File**: `src/routes/(public)/post-a-job/+page.svelte` (UPDATE)

Pass config to all form sections:

```svelte
<script lang="ts">
  // ... existing imports and code ...

  let { data }: { data: PageData } = $props();

  const pricing = data.pricing;
  const jobBoardConfig = data.jobBoardConfig; // Add this

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

#### Step 3.5: Update Types

**File**: `src/lib/features/jobs/components/job-posting/types.ts` (UPDATE)

Add `location` field to the types:

```typescript
import type { submitJobPosting } from '$lib/features/jobs/actions/post-job.remote';

export type PublicJobPostingFields = typeof submitJobPosting.fields;
```

### Phase 4: Testing (2-3 hours)

#### Step 4.1: Preset Tests

**File**: `src/lib/config/jobs/presets.server.test.ts` (NEW)

```typescript
import { describe, it, expect } from 'vitest';
import {
  REMOTE_FIRST_PRESET,
  LOCAL_ONLY_PRESET,
  HYBRID_FIRST_PRESET,
  FLEXIBLE_PRESET,
  resolveConfig
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
    expect(LOCAL_ONLY_PRESET.fields.location.required).toBe('always');
    expect(LOCAL_ONLY_PRESET.fields.hiringLocation.visible).toBe(false);
  });

  it('hybrid-first preset validates', () => {
    expect(() => jobBoardConfigSchema.parse(HYBRID_FIRST_PRESET)).not.toThrow();
  });

  it('flexible preset validates', () => {
    expect(() => jobBoardConfigSchema.parse(FLEXIBLE_PRESET)).not.toThrow();
  });

  it('resolveConfig merges user config with preset', () => {
    const userConfig = {
      preset: 'remote-first' as const,
      fields: {
        salary: { visible: true, required: true }
      }
    };

    const resolved = resolveConfig(userConfig);

    expect(resolved.preset).toBe('remote-first');
    expect(resolved.fields.salary.required).toBe(true);
    expect(resolved.fields.location.required).toBe('conditional');
  });
});
```

#### Step 4.2: Validator Tests

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

      expect(() => schema.parse(job)).toThrow();
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

      expect(() => schema.parse(job)).toThrow();
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

      expect(() => schema.parse(job)).toThrow();
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

    it('only allows onsite location type', () => {
      expect(LOCAL_ONLY_PRESET.allowedLocationTypes).toEqual(['onsite']);
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

      expect(() => schema.parse(job)).toThrow();
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
  });
});
```

## Implementation Timeline

**Total: 9-13 hours**

- Phase 1: Configuration System (2-3 hours)
- Phase 2: Dynamic Validators (2-3 hours)
- Phase 3: Form Components (3-4 hours)
- Phase 4: Testing (2-3 hours)

## Success Criteria

✅ Users can switch job board type with one config change
✅ Physical location is REQUIRED for onsite/hybrid jobs
✅ Physical location is optional/hidden for remote jobs
✅ Form adapts reactively to location type selection
✅ Validators enforce conditional requirements
✅ All presets work correctly and pass tests
✅ Code is simple, testable, and flexible
✅ No backwards compatibility concerns

## Configuration Examples

### Remote-First Tech Board

```typescript
jobBoard: {
  preset: 'remote-first'
}
```

**Result**: Remote default, location required for onsite/hybrid, timezone filtering

### Restaurant Job Board

```typescript
jobBoard: {
  preset: 'local-only'
}
```

**Result**: Onsite only, location always required, no remote fields

### Post-COVID Mixed Board

```typescript
jobBoard: {
  preset: 'hybrid-first'
}
```

**Result**: Hybrid default, location required for onsite/hybrid, all options available

### Custom Configuration

```typescript
jobBoard: {
  preset: 'custom',
  allowedLocationTypes: ['remote', 'onsite'],
  defaultLocationType: 'remote',
  fields: {
    location: { visible: true, required: 'conditional' },
    hiringLocation: { visible: true, required: true },
    workingPermits: { visible: false, required: false },
    salary: { visible: true, required: true }
  }
}
```

## Next Steps

1. ✅ Review and approve plan
2. Implement Phase 1 (Configuration)
3. Implement Phase 2 (Validators)
4. Implement Phase 3 (Components)
5. Implement Phase 4 (Tests)
6. Manual testing of all presets
7. Documentation updates

---

**Ready to implement?**
