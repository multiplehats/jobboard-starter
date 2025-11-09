#!/bin/bash

# Script to rename edra component files to kebab-case

cd "$(dirname "$0")/.."

# Declare all the renames as source -> destination pairs
declare -A renames=(
    # Root components
    ["src/lib/components/edra/components/MediaPlaceHolder.svelte"]="src/lib/components/edra/components/media-placeholder.svelte"
    ["src/lib/components/edra/components/BubbleMenu.svelte"]="src/lib/components/edra/components/bubble-menu.svelte"
    ["src/lib/components/edra/components/DragHandle.svelte"]="src/lib/components/edra/components/drag-handle.svelte"

    # Extensions
    ["src/lib/components/edra/extensions/FindAndReplace.ts"]="src/lib/components/edra/extensions/find-and-replace.ts"
    ["src/lib/components/edra/extensions/InlineMathReplacer.ts"]="src/lib/components/edra/extensions/inline-math-replacer.ts"
    ["src/lib/components/edra/extensions/ColorHighlighter.ts"]="src/lib/components/edra/extensions/color-highlighter.ts"

    # Video extension
    ["src/lib/components/edra/extensions/video/VideoPlaceholder.ts"]="src/lib/components/edra/extensions/video/video-placeholder.ts"
    ["src/lib/components/edra/extensions/video/VideoExtension.ts"]="src/lib/components/edra/extensions/video/video-extension.ts"
    ["src/lib/components/edra/extensions/video/VideoExtended.ts"]="src/lib/components/edra/extensions/video/video-extended.ts"

    # IFrame extension
    ["src/lib/components/edra/extensions/iframe/IFramePlaceholder.ts"]="src/lib/components/edra/extensions/iframe/iframe-placeholder.ts"
    ["src/lib/components/edra/extensions/iframe/IFrame.ts"]="src/lib/components/edra/extensions/iframe/iframe.ts"
    ["src/lib/components/edra/extensions/iframe/IFrameExtended.ts"]="src/lib/components/edra/extensions/iframe/iframe-extended.ts"

    # Audio extension
    ["src/lib/components/edra/extensions/audio/AudioPlaceholder.ts"]="src/lib/components/edra/extensions/audio/audio-placeholder.ts"
    ["src/lib/components/edra/extensions/audio/AudiExtended.ts"]="src/lib/components/edra/extensions/audio/audio-extended.ts"
    ["src/lib/components/edra/extensions/audio/AudioExtension.ts"]="src/lib/components/edra/extensions/audio/audio-extension.ts"

    # Image extension
    ["src/lib/components/edra/extensions/image/ImageExtended.ts"]="src/lib/components/edra/extensions/image/image-extended.ts"
    ["src/lib/components/edra/extensions/image/ImagePlaceholder.ts"]="src/lib/components/edra/extensions/image/image-placeholder.ts"

    # Drag handle extension
    ["src/lib/components/edra/extensions/drag-handle/ClipboardSerializer.ts"]="src/lib/components/edra/extensions/drag-handle/clipboard-serializer.ts"

    # Shadcn components
    ["src/lib/components/edra/shadcn/components/IFrameExtended.svelte"]="src/lib/components/edra/shadcn/components/iframe-extended.svelte"
    ["src/lib/components/edra/shadcn/components/VideoExtended.svelte"]="src/lib/components/edra/shadcn/components/video-extended.svelte"
    ["src/lib/components/edra/shadcn/components/VideoPlaceholder.svelte"]="src/lib/components/edra/shadcn/components/video-placeholder.svelte"
    ["src/lib/components/edra/shadcn/components/EdraToolTip.svelte"]="src/lib/components/edra/shadcn/components/edra-tooltip.svelte"
    ["src/lib/components/edra/shadcn/components/IFramePlaceHolder.svelte"]="src/lib/components/edra/shadcn/components/iframe-placeholder.svelte"
    ["src/lib/components/edra/shadcn/components/ImagePlaceholder.svelte"]="src/lib/components/edra/shadcn/components/image-placeholder.svelte"
    ["src/lib/components/edra/shadcn/components/MediaExtended.svelte"]="src/lib/components/edra/shadcn/components/media-extended.svelte"
    ["src/lib/components/edra/shadcn/components/CodeBlock.svelte"]="src/lib/components/edra/shadcn/components/code-block.svelte"
    ["src/lib/components/edra/shadcn/components/AudioExtended.svelte"]="src/lib/components/edra/shadcn/components/audio-extended.svelte"
    ["src/lib/components/edra/shadcn/components/SlashCommandList.svelte"]="src/lib/components/edra/shadcn/components/slash-command-list.svelte"
    ["src/lib/components/edra/shadcn/components/AudioPlaceHolder.svelte"]="src/lib/components/edra/shadcn/components/audio-placeholder.svelte"
    ["src/lib/components/edra/shadcn/components/ImageExtended.svelte"]="src/lib/components/edra/shadcn/components/image-extended.svelte"
    ["src/lib/components/edra/shadcn/components/ToolBarIcon.svelte"]="src/lib/components/edra/shadcn/components/toolbar-icon.svelte"

    # Shadcn toolbar components
    ["src/lib/components/edra/shadcn/components/toolbar/Alignment.svelte"]="src/lib/components/edra/shadcn/components/toolbar/alignment.svelte"
    ["src/lib/components/edra/shadcn/components/toolbar/QuickColors.svelte"]="src/lib/components/edra/shadcn/components/toolbar/quick-colors.svelte"
    ["src/lib/components/edra/shadcn/components/toolbar/Headings.svelte"]="src/lib/components/edra/shadcn/components/toolbar/headings.svelte"
    ["src/lib/components/edra/shadcn/components/toolbar/SearchAndReplace.svelte"]="src/lib/components/edra/shadcn/components/toolbar/search-and-replace.svelte"
    ["src/lib/components/edra/shadcn/components/toolbar/FontSize.svelte"]="src/lib/components/edra/shadcn/components/toolbar/font-size.svelte"

    # Shadcn menus
    ["src/lib/components/edra/shadcn/menus/TableRow.svelte"]="src/lib/components/edra/shadcn/menus/table-row.svelte"
    ["src/lib/components/edra/shadcn/menus/TableCol.svelte"]="src/lib/components/edra/shadcn/menus/table-col.svelte"
    ["src/lib/components/edra/shadcn/menus/Menu.svelte"]="src/lib/components/edra/shadcn/menus/menu.svelte"
    ["src/lib/components/edra/shadcn/menus/Link.svelte"]="src/lib/components/edra/shadcn/menus/link.svelte"
)

echo "Starting file renames..."

# First pass: rename all files
for src in "${!renames[@]}"; do
    dest="${renames[$src]}"
    if [ -f "$src" ]; then
        echo "Renaming: $src -> $dest"
        git mv "$src" "$dest" 2>/dev/null || mv "$src" "$dest"
    else
        echo "Warning: File not found: $src"
    fi
done

echo ""
echo "File renames complete!"
echo ""
echo "Now updating imports in all files..."

# Second pass: update all imports/references in the entire edra directory
find src/lib/components/edra -type f \( -name "*.ts" -o -name "*.svelte" \) -exec sed -i '' \
    -e 's|MediaPlaceHolder\.svelte|media-placeholder.svelte|g' \
    -e 's|BubbleMenu\.svelte|bubble-menu.svelte|g' \
    -e 's|DragHandle\.svelte|drag-handle.svelte|g' \
    -e 's|FindAndReplace\.ts|find-and-replace.ts|g' \
    -e 's|InlineMathReplacer\.ts|inline-math-replacer.ts|g' \
    -e 's|ColorHighlighter\.ts|color-highlighter.ts|g' \
    -e 's|VideoPlaceholder\.ts|video-placeholder.ts|g' \
    -e 's|VideoExtension\.ts|video-extension.ts|g' \
    -e 's|VideoExtended\.ts|video-extended.ts|g' \
    -e 's|IFramePlaceholder\.ts|iframe-placeholder.ts|g' \
    -e 's|IFrame\.ts|iframe.ts|g' \
    -e 's|IFrameExtended\.ts|iframe-extended.ts|g' \
    -e 's|AudioPlaceholder\.ts|audio-placeholder.ts|g' \
    -e 's|AudiExtended\.ts|audio-extended.ts|g' \
    -e 's|AudioExtension\.ts|audio-extension.ts|g' \
    -e 's|ImageExtended\.ts|image-extended.ts|g' \
    -e 's|ImagePlaceholder\.ts|image-placeholder.ts|g' \
    -e 's|ClipboardSerializer\.ts|clipboard-serializer.ts|g' \
    -e 's|IFrameExtended\.svelte|iframe-extended.svelte|g' \
    -e 's|VideoExtended\.svelte|video-extended.svelte|g' \
    -e 's|VideoPlaceholder\.svelte|video-placeholder.svelte|g' \
    -e 's|EdraToolTip\.svelte|edra-tooltip.svelte|g' \
    -e 's|IFramePlaceHolder\.svelte|iframe-placeholder.svelte|g' \
    -e 's|ImagePlaceholder\.svelte|image-placeholder.svelte|g' \
    -e 's|MediaExtended\.svelte|media-extended.svelte|g' \
    -e 's|CodeBlock\.svelte|code-block.svelte|g' \
    -e 's|AudioExtended\.svelte|audio-extended.svelte|g' \
    -e 's|SlashCommandList\.svelte|slash-command-list.svelte|g' \
    -e 's|AudioPlaceHolder\.svelte|audio-placeholder.svelte|g' \
    -e 's|ImageExtended\.svelte|image-extended.svelte|g' \
    -e 's|ToolBarIcon\.svelte|toolbar-icon.svelte|g' \
    -e 's|Alignment\.svelte|alignment.svelte|g' \
    -e 's|QuickColors\.svelte|quick-colors.svelte|g' \
    -e 's|Headings\.svelte|headings.svelte|g' \
    -e 's|SearchAndReplace\.svelte|search-and-replace.svelte|g' \
    -e 's|FontSize\.svelte|font-size.svelte|g' \
    -e 's|TableRow\.svelte|table-row.svelte|g' \
    -e 's|TableCol\.svelte|table-col.svelte|g' \
    -e 's|Menu\.svelte|menu.svelte|g' \
    -e 's|Link\.svelte|link.svelte|g' \
    {} +

echo "Import updates complete!"
echo ""
echo "All done! ✓"
