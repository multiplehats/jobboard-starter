# Job Constants i18n Integration

## Overview

The job constants now use Paraglide i18n directly, with `en.json` serving as the fallback/default language. There are **no hardcoded label constants** in the code - all labels come from i18n messages.

## Type Safety

The `generateList` function enforces strict type checking at multiple levels:

### 1. Label Keys Must Match Enum Values Exactly
- Labels object MUST have exactly the same keys as the enum values
- Extra keys (like `blabla`) will cause TypeScript errors
- Missing keys will also cause TypeScript errors

### 2. Value Property Has Precise Union Type
- The `value` property is typed as the exact union of enum values
- Example: `"entry-level" | "mid-level" | "senior" | "manager" | "director" | "executive"`
- Not just `string` - this prevents invalid assignments at compile time

```typescript
const levels = seniorityLevelsList();
// Type: Array<{ label: string; value: "entry-level" | "mid-level" | ... }>

let selected: SeniorityLevel;
selected = levels[0].value; // ✅ Valid - TypeScript knows the exact type
selected = 'invalid';        // ❌ Type error caught at compile time
```

This catches bugs early during development, not at runtime. See `TYPE_SAFETY_DEMO.md` for more examples.

## How It Works

### 1. Source of Truth

All enum values are defined in `constants.ts`:

```typescript
export const JOB_TYPES = ['full_time', 'part_time', 'contract', 'freelance'] as const;
export const SENIORITY_LEVELS = ['entry-level', 'mid-level', 'senior', 'manager', 'director', 'executive'] as const;
```

### 2. i18n Messages

Labels come from `messages/en.json`:

```json
{
  "jobs": {
    "jobTypes": {
      "full_time": "Full Time",
      "part_time": "Part Time",
      "contract": "Contract",
      "freelance": "Freelance"
    },
    "seniorityLevels": {
      "entry_level": "Entry-level",
      "mid_level": "Mid-level",
      "senior": "Senior",
      "manager": "Manager"
    }
  }
}
```

**Note:** Enum values with dashes (e.g., `'entry-level'`) use underscores in message keys (e.g., `entry_level`).

### 3. List Generation

Factory functions in `constants.ts` generate lists with i18n labels:

```typescript
import * as m from '$lib/paraglide/messages';

export const jobTypesList = <K extends string = 'label', V extends string = 'value'>(
  keyName: K = 'label' as K,
  valueName: V = 'value' as V
) =>
  generateList(
    JOB_TYPES,
    {
      full_time: m['jobs.jobTypes.full_time'](),
      part_time: m['jobs.jobTypes.part_time'](),
      contract: m['jobs.jobTypes.contract'](),
      freelance: m['jobs.jobTypes.freelance']()
    },
    keyName,
    valueName
  );
```

### 4. Available List Functions

All enum types have corresponding list factory functions:

```typescript
import {
  locationTypesList,
  jobTypesList,
  jobStatusesList,
  seniorityLevelsList,
  hiringLocationTypesList,
  workingPermitsTypesList,
  currenciesList,
  salaryPeriodsList
} from '$lib/features/jobs/constants';
```

### 5. Usage

In components:

```typescript
import { jobTypesList, currenciesList } from '$lib/features/jobs/constants';

// Get list with default 'label' and 'value' keys
const jobTypes = jobTypesList();
// => [{ label: 'Full Time', value: 'full_time' }, ...]

// Custom key names
const jobTypes = jobTypesList('name', 'id');
// => [{ name: 'Full Time', id: 'full_time' }, ...]

// Currency example
const currencies = currenciesList();
// => [{ label: 'USD', value: 'USD' }, { label: 'EUR', value: 'EUR' }, ...]
```

## Architecture Benefits

1. **No Hardcoded Labels**: All labels come from `en.json`, which serves as the fallback
2. **Type-Safe**: Full TypeScript inference from enum values to generated lists
3. **Single Source of Truth**: Enum values defined once, used by:
   - Database schema (PostgreSQL enums)
   - Validators (Zod schemas)
   - UI components (via list factories)
4. **i18n Ready**: When you add more languages (e.g., `fr.json`, `es.json`), Paraglide will automatically switch based on locale
5. **Tree-Shakeable**: Paraglide is compiler-based, so unused translations are removed from the bundle

## Database Migration Required

After adding the new enum types (`currencyEnum` and `salaryPeriodEnum`), you need to generate and apply a migration:

```bash
# Generate migration
pnpm run db:generate

# Apply migration to database
pnpm run db:migrate
```

This will:
1. Create PostgreSQL enum types for `currency` and `salary_period`
2. Update the `jobs` table columns to use these enums
3. Convert existing varchar columns to enum columns

## Adding New Languages

To add a new language:

1. Create `messages/fr.json` (or your language code)
2. Copy the structure from `en.json` and translate
3. Paraglide will automatically compile and make it available
4. No code changes needed - the list factories will use the new translations

Example `messages/fr.json`:

```json
{
  "jobs": {
    "jobTypes": {
      "full_time": "Temps plein",
      "part_time": "Temps partiel",
      "contract": "Contrat",
      "freelance": "Freelance"
    }
  }
}
```
