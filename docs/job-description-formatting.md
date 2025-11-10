# Job Description Formatting Guide

## Available Formatting Tools

This is what users see when creating job descriptions:

### Toolbar Layout

```
[↶] [↷] | [H2] [H3] | [B] [I] [U] | [🔗] | [•] [1.]
```

### Tool Descriptions

| Icon | Tool | Shortcut | Use Case |
|------|------|----------|----------|
| ↶ | Undo | Ctrl+Z | Undo last change |
| ↷ | Redo | Ctrl+Y | Redo undone change |
| H2 | Heading 2 | Ctrl+Alt+2 | Section titles (e.g., "Responsibilities") |
| H3 | Heading 3 | Ctrl+Alt+3 | Sub-sections |
| **B** | Bold | Ctrl+B | Emphasize important text |
| *I* | Italic | Ctrl+I | Add emphasis |
| U | Underline | Ctrl+U | Highlight text |
| 🔗 | Link | - | Add hyperlinks |
| • | Bullet List | Ctrl+Shift+8 | Unordered lists |
| 1. | Numbered List | Ctrl+Shift+7 | Ordered lists |

## Example Job Description

Here's how a well-formatted job description looks:

```
## About the Role

We're looking for a **Senior Software Engineer** to join our growing team.
This is a *remote-first* position with flexible working hours.

## Responsibilities

• Design and implement scalable backend services
• Mentor junior developers
• Participate in code reviews
• Collaborate with product team

## Requirements

1. 5+ years of experience with Node.js
2. Strong understanding of PostgreSQL
3. Experience with cloud platforms (AWS/GCP)
4. Excellent communication skills

## Benefits

• Competitive salary ($120k - $180k)
• Health insurance
• 401(k) matching
• Unlimited PTO

Learn more about our company at [example.com](https://example.com).
```

## What's NOT Available (By Design)

These tools are intentionally excluded to maintain clean, professional job descriptions:

❌ **H1 Headings** - Reserved for page titles
❌ **Text Alignment** - All text left-aligned
❌ **Images/Video** - Use company logo in separate field
❌ **Tables** - Use lists instead
❌ **Font Size/Colors** - Consistent styling
❌ **Code Blocks** - Not needed for job descriptions
❌ **Strikethrough** - Confusing in job postings

## Best Practices

### ✅ DO

- Use H2 for main sections (Responsibilities, Requirements, Benefits)
- Use H3 for sub-sections if needed
- Use bullet lists for requirements and benefits
- Use numbered lists for sequential steps
- Bold key qualifications or requirements
- Add links to company website or application portal
- Keep formatting minimal and consistent

### ❌ DON'T

- Don't overuse bold/italic (readability suffers)
- Don't mix bullet and numbered lists unnecessarily
- Don't create deep nesting of lists
- Don't add excessive line breaks

## Technical Implementation

The minimal toolbar ensures:
- **Professional appearance** - All job descriptions look consistent
- **Fast loading** - No unnecessary extensions or features
- **Mobile friendly** - Simple toolbar works on all devices
- **Accessible** - Clean HTML structure for screen readers
- **Easy editing** - Limited options = less confusion

## Customization

If you need different formatting for other content (blog posts, company pages, etc.),
see [tiptap-editor.md](./tiptap-editor.md#customizing-the-toolbar) for creating custom toolbars.
