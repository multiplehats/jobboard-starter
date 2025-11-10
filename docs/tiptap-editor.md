# Tiptap Rich Text Editor Guide

## Overview

This project uses Tiptap for rich text editing (job descriptions, etc.). We store **JSON in the database** and convert to HTML for display.

## Custom Job Description Editor

We use a **simplified toolbar** for job descriptions with only essential formatting:

**Available Tools:**
- ✅ **Undo/Redo** - Standard editing controls
- ✅ **H2, H3** - Section headings (NO H1 - reserved for page titles)
- ✅ **Bold, Italic, Underline** - Basic text formatting
- ✅ **Link** - Add hyperlinks
- ✅ **Bullet List, Numbered List** - Organize information

**Excluded Tools:**
- ❌ H1 (reserved for page headings)
- ❌ Text alignment
- ❌ Images/Video/Media
- ❌ Tables
- ❌ Math equations
- ❌ Font size/colors
- ❌ Strikethrough, code, superscript, subscript

This keeps job descriptions clean, professional, and consistent.

## Why JSON Storage?

### ✅ Advantages
- **Editor Restoration**: Can perfectly restore the editor state for editing
- **Semantic Structure**: Maintains document structure, not just formatting
- **Single Source of Truth**: No sync issues between JSON and HTML
- **Future-Proof**: Can change rendering without touching stored data

### ❌ HTML-Only Storage Would Mean
- Can't restore editor properly
- Lose semantic information
- Hard to migrate or change rendering

## Architecture

```
User Edit → Tiptap Editor → JSON → Database
                                       ↓
User View ← HTML ← JSON Converter ← Database
```

## Usage

### 1. Storing Content (Form Submission)

```svelte
<script lang="ts">
  import { EdraEditor, EdraToolBar } from '$lib/components/edra/shadcn';
  import type { Content, Editor } from '@tiptap/core';

  let editor = $state<Editor>();
  let content = $state<Content>();
  let contentJSON = $state('');

  function onUpdate() {
    if (editor && !editor.isDestroyed) {
      content = editor.getJSON();
      contentJSON = JSON.stringify(content); // Store this
    }
  }
</script>

<EdraEditor
  bind:editor
  {content}
  {onUpdate}
/>

<!-- Hidden input submits JSON to server -->
<input type="hidden" name="description" value={contentJSON} />
```

### 2. Displaying Content (Job Page)

```svelte
<script lang="ts">
  import JobDescription from '$lib/components/jobs/JobDescription.svelte';

  interface Props {
    data: { job: Job };
  }

  let { data }: Props = $props();
</script>

<!-- Automatically converts JSON to HTML -->
<JobDescription content={data.job.description} />
```

### 3. Utility Functions

```typescript
import { tiptapJsonToHtml, tiptapJsonToText } from '$lib/utils/tiptap';

// Convert to HTML
const html = tiptapJsonToHtml(job.description);

// Convert to plain text (for excerpts, meta descriptions)
const excerpt = tiptapJsonToText(job.description).slice(0, 160);
```

### 4. Loading Content for Editing

```svelte
<script lang="ts">
  import { EdraEditor } from '$lib/components/edra/shadcn';
  import type { Content, Editor } from '@tiptap/core';

  interface Props {
    data: { job: Job };
  }

  let { data }: Props = $props();
  let editor = $state<Editor>();

  // Parse JSON from database
  let content = $state<Content>(
    typeof data.job.description === 'string'
      ? JSON.parse(data.job.description)
      : data.job.description
  );
</script>

<EdraEditor bind:editor {content} />
```

## Database Schema

```typescript
export const jobs = pgTable('jobs', {
  // ...

  // Rich text fields stored as JSON
  description: json('description').notNull(),
  requirements: json('requirements'),
  benefits: json('benefits'),

  // ...
});
```

## Performance Considerations

### Current Approach: On-Demand Conversion
- ✅ Simple, no sync issues
- ✅ Small datasets (<1000 jobs)
- ⚠️ Converts JSON→HTML on every page load

### Future Optimization (if needed)
If performance becomes an issue:

1. **Add cached HTML field:**
   ```typescript
   description: json('description').notNull(),
   descriptionHtml: text('description_html'), // cached
   ```

2. **Update on save:**
   ```typescript
   await db.update(jobs).set({
     description: jsonContent,
     descriptionHtml: generateHTML(jsonContent, extensions)
   });
   ```

3. **Invalidate cache on edit:**
   - Set `descriptionHtml = null` when editing
   - Regenerate on next display

## Examples

### Job Listing Card (Excerpt)
```svelte
<script lang="ts">
  import { tiptapJsonToText } from '$lib/utils/tiptap';

  let excerpt = $derived(
    tiptapJsonToText(job.description).slice(0, 160) + '...'
  );
</script>

<p class="text-sm text-gray-600">{excerpt}</p>
```

### Full Job Description
```svelte
<script lang="ts">
  import JobDescription from '$lib/components/jobs/JobDescription.svelte';
</script>

<JobDescription
  content={job.description}
  class="mt-4"
/>
```

### SEO Meta Description
```typescript
export const load: PageServerLoad = async ({ params }) => {
  const job = await getJob(params.id);

  return {
    job,
    seo: {
      title: job.title,
      description: tiptapJsonToText(job.description).slice(0, 160)
    }
  };
};
```

## Customizing the Toolbar

### Job Descriptions (Current)
Uses `JobDescriptionToolbar.svelte` - minimal, professional formatting only.

### Creating a Custom Toolbar

If you need different formatting for other content types:

```svelte
<!-- src/lib/components/edra/shadcn/CustomToolbar.svelte -->
<script lang="ts">
  import type { Editor } from '@tiptap/core';
  import ToolBarIcon from './components/toolbar-icon.svelte';
  import Bold from '@lucide/svelte/icons/bold';
  // ... other icons

  let { editor, class: className }: Props = $props();

  const commands = [
    {
      icon: Bold,
      name: 'bold',
      tooltip: 'Bold',
      onClick: (editor: Editor) => editor.chain().focus().toggleBold().run(),
      isActive: (editor: Editor) => editor.isActive('bold')
    },
    // Add only the commands you need
  ];
</script>

<div class={cn('edra-toolbar', className)}>
  {#each commands as command (command.name)}
    <ToolBarIcon {editor} {command} />
  {/each}
</div>
```

See `JobDescriptionToolbar.svelte` for a complete example.

## Best Practices

1. **Always store JSON**, never HTML
2. **Convert to HTML** only when displaying
3. **Use utilities** for consistent conversion
4. **Parse JSON once** when loading for editing
5. **Cache wisely** if performance issues arise
6. **Limit toolbar options** - only include tools users actually need

## Troubleshooting

### Editor not restoring content
```typescript
// ❌ Wrong: passing string
<EdraEditor content={job.description} />

// ✅ Correct: parse JSON first
<EdraEditor content={JSON.parse(job.description)} />
```

### Missing extensions in HTML output
Make sure `tiptapJsonToHtml()` includes all extensions used in your editor:

```typescript
// src/lib/utils/tiptap.ts
export function tiptapJsonToHtml(json: Content | string): string {
  return generateHTML(content, [
    StarterKit,
    // Add all other extensions here!
  ]);
}
```
