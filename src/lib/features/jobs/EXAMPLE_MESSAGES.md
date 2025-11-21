# Job Enums i18n Integration Example

## 1. Add to `messages/en.json`

```json
{
  // ... existing messages
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
      "manager": "Manager",
      "director": "Director",
      "executive": "Executive"
    },
    "locationTypes": {
      "remote": "Remote",
      "hybrid": "Hybrid",
      "onsite": "On-site"
    },
    "jobStatuses": {
      "draft": "Draft",
      "awaiting_payment": "Awaiting Payment",
      "awaiting_approval": "Awaiting Approval",
      "published": "Published",
      "rejected": "Rejected",
      "expired": "Expired"
    },
    "hiringLocationTypes": {
      "worldwide": "Worldwide",
      "timezone": "Specific Timezones"
    },
    "workingPermitsTypes": {
      "no_specific": "No Specific Requirements",
      "required": "Specific Permits Required"
    }
  }
}
```

## 2. Usage in Components (Svelte 5)

### Simple Usage (Recommended)

```svelte
<script lang="ts">
  import * as m from '$paraglide/messages';
  import { jobTypesList, seniorityLevelsList } from '$lib/features/jobs/constants';

  // Create lists with translated labels
  const jobTypes = jobTypesList((value) => m.jobs_jobTypes[value]());
  const seniorityLevels = seniorityLevelsList((value) => m.jobs_seniorityLevels[value.replace(/-/g, '_')]());
</script>

{#each jobTypes as type}
  <option value={type.value}>{type.label}</option>
{/each}
```

### Advanced Usage with Helper

```svelte
<script lang="ts">
  import * as m from '$paraglide/messages';
  import { jobTypesList } from '$lib/features/jobs/constants';

  // Create a reusable label getter
  const getJobTypeLabel = (value: string) => {
    const key = value as keyof typeof m.jobs_jobTypes;
    return m.jobs_jobTypes[key]?.() ?? value;
  };

  const jobTypes = jobTypesList(getJobTypeLabel);
</script>
```

## 3. Key Benefits

1. **Type-Safe**: Paraglide generates typed message functions
2. **Tree-Shakeable**: Only messages used in your app are bundled
3. **Zero Runtime Cost**: Translations are compiled at build time
4. **Hot Reload**: Changes to messages reflect immediately in dev mode
5. **Single Source of Truth**: Enum values defined once in constants.ts
6. **Easy Localization**: Just add new language files (e.g., messages/es.json)

## 4. Adding a New Language

1. Create `messages/es.json`:
```json
{
  "jobs": {
    "jobTypes": {
      "full_time": "Tiempo Completo",
      "part_time": "Tiempo Parcial",
      // ...
    }
  }
}
```

2. Update `project.inlang/settings.json`:
```json
{
  "locales": ["en", "es"]
}
```

3. No code changes needed! Paraglide automatically generates functions for all locales.

## 5. Runtime Locale Switching

```svelte
<script lang="ts">
  import { setLocale } from '$paraglide/runtime';
  import { jobTypesList } from '$lib/features/jobs/constants';
  import * as m from '$paraglide/messages';

  // Lists automatically use current locale
  $: jobTypes = jobTypesList((value) => m.jobs_jobTypes[value]());

  function switchLanguage(locale: 'en' | 'es') {
    setLocale(locale);
    // jobTypes will automatically re-render with new locale
  }
</script>
```

## 6. Server-Side Usage

```typescript
import * as m from '$paraglide/messages';
import { setLanguageTag } from '$paraglide/runtime';
import { jobTypesList } from '$lib/features/jobs/constants';

// In +page.server.ts or API route
export const load: PageServerLoad = async ({ request }) => {
  // Set locale based on request
  setLanguageTag('en');

  const jobTypes = jobTypesList((value) => m.jobs_jobTypes[value]());

  return { jobTypes };
};
```
