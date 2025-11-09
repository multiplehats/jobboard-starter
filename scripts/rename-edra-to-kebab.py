#!/usr/bin/env python3
"""
Script to rename edra component files from PascalCase/camelCase to kebab-case
"""

import os
import re
import subprocess
from pathlib import Path

# Define the renames
RENAMES = [
    # Root components
    ("src/lib/components/edra/components/MediaPlaceHolder.svelte", "src/lib/components/edra/components/media-placeholder.svelte"),
    ("src/lib/components/edra/components/BubbleMenu.svelte", "src/lib/components/edra/components/bubble-menu.svelte"),
    ("src/lib/components/edra/components/DragHandle.svelte", "src/lib/components/edra/components/drag-handle.svelte"),

    # Extensions
    ("src/lib/components/edra/extensions/FindAndReplace.ts", "src/lib/components/edra/extensions/find-and-replace.ts"),
    ("src/lib/components/edra/extensions/InlineMathReplacer.ts", "src/lib/components/edra/extensions/inline-math-replacer.ts"),
    ("src/lib/components/edra/extensions/ColorHighlighter.ts", "src/lib/components/edra/extensions/color-highlighter.ts"),

    # Video extension
    ("src/lib/components/edra/extensions/video/VideoPlaceholder.ts", "src/lib/components/edra/extensions/video/video-placeholder.ts"),
    ("src/lib/components/edra/extensions/video/VideoExtension.ts", "src/lib/components/edra/extensions/video/video-extension.ts"),
    ("src/lib/components/edra/extensions/video/VideoExtended.ts", "src/lib/components/edra/extensions/video/video-extended.ts"),

    # IFrame extension
    ("src/lib/components/edra/extensions/iframe/IFramePlaceholder.ts", "src/lib/components/edra/extensions/iframe/iframe-placeholder.ts"),
    ("src/lib/components/edra/extensions/iframe/IFrame.ts", "src/lib/components/edra/extensions/iframe/iframe.ts"),
    ("src/lib/components/edra/extensions/iframe/IFrameExtended.ts", "src/lib/components/edra/extensions/iframe/iframe-extended.ts"),

    # Audio extension
    ("src/lib/components/edra/extensions/audio/AudioPlaceholder.ts", "src/lib/components/edra/extensions/audio/audio-placeholder.ts"),
    ("src/lib/components/edra/extensions/audio/AudiExtended.ts", "src/lib/components/edra/extensions/audio/audio-extended.ts"),
    ("src/lib/components/edra/extensions/audio/AudioExtension.ts", "src/lib/components/edra/extensions/audio/audio-extension.ts"),

    # Image extension
    ("src/lib/components/edra/extensions/image/ImageExtended.ts", "src/lib/components/edra/extensions/image/image-extended.ts"),
    ("src/lib/components/edra/extensions/image/ImagePlaceholder.ts", "src/lib/components/edra/extensions/image/image-placeholder.ts"),

    # Drag handle extension
    ("src/lib/components/edra/extensions/drag-handle/ClipboardSerializer.ts", "src/lib/components/edra/extensions/drag-handle/clipboard-serializer.ts"),

    # Shadcn components
    ("src/lib/components/edra/shadcn/components/IFrameExtended.svelte", "src/lib/components/edra/shadcn/components/iframe-extended.svelte"),
    ("src/lib/components/edra/shadcn/components/VideoExtended.svelte", "src/lib/components/edra/shadcn/components/video-extended.svelte"),
    ("src/lib/components/edra/shadcn/components/VideoPlaceholder.svelte", "src/lib/components/edra/shadcn/components/video-placeholder.svelte"),
    ("src/lib/components/edra/shadcn/components/EdraToolTip.svelte", "src/lib/components/edra/shadcn/components/edra-tooltip.svelte"),
    ("src/lib/components/edra/shadcn/components/IFramePlaceHolder.svelte", "src/lib/components/edra/shadcn/components/iframe-placeholder.svelte"),
    ("src/lib/components/edra/shadcn/components/ImagePlaceholder.svelte", "src/lib/components/edra/shadcn/components/image-placeholder.svelte"),
    ("src/lib/components/edra/shadcn/components/MediaExtended.svelte", "src/lib/components/edra/shadcn/components/media-extended.svelte"),
    ("src/lib/components/edra/shadcn/components/CodeBlock.svelte", "src/lib/components/edra/shadcn/components/code-block.svelte"),
    ("src/lib/components/edra/shadcn/components/AudioExtended.svelte", "src/lib/components/edra/shadcn/components/audio-extended.svelte"),
    ("src/lib/components/edra/shadcn/components/SlashCommandList.svelte", "src/lib/components/edra/shadcn/components/slash-command-list.svelte"),
    ("src/lib/components/edra/shadcn/components/AudioPlaceHolder.svelte", "src/lib/components/edra/shadcn/components/audio-placeholder.svelte"),
    ("src/lib/components/edra/shadcn/components/ImageExtended.svelte", "src/lib/components/edra/shadcn/components/image-extended.svelte"),
    ("src/lib/components/edra/shadcn/components/ToolBarIcon.svelte", "src/lib/components/edra/shadcn/components/toolbar-icon.svelte"),

    # Shadcn toolbar components
    ("src/lib/components/edra/shadcn/components/toolbar/Alignment.svelte", "src/lib/components/edra/shadcn/components/toolbar/alignment.svelte"),
    ("src/lib/components/edra/shadcn/components/toolbar/QuickColors.svelte", "src/lib/components/edra/shadcn/components/toolbar/quick-colors.svelte"),
    ("src/lib/components/edra/shadcn/components/toolbar/Headings.svelte", "src/lib/components/edra/shadcn/components/toolbar/headings.svelte"),
    ("src/lib/components/edra/shadcn/components/toolbar/SearchAndReplace.svelte", "src/lib/components/edra/shadcn/components/toolbar/search-and-replace.svelte"),
    ("src/lib/components/edra/shadcn/components/toolbar/FontSize.svelte", "src/lib/components/edra/shadcn/components/toolbar/font-size.svelte"),

    # Shadcn menus
    ("src/lib/components/edra/shadcn/menus/TableRow.svelte", "src/lib/components/edra/shadcn/menus/table-row.svelte"),
    ("src/lib/components/edra/shadcn/menus/TableCol.svelte", "src/lib/components/edra/shadcn/menus/table-col.svelte"),
    ("src/lib/components/edra/shadcn/menus/Menu.svelte", "src/lib/components/edra/shadcn/menus/menu.svelte"),
    ("src/lib/components/edra/shadcn/menus/Link.svelte", "src/lib/components/edra/shadcn/menus/link.svelte"),
]


def main():
    root = Path(__file__).parent.parent
    os.chdir(root)

    print("Starting file renames...\n")

    # First pass: rename all files
    for src, dest in RENAMES:
        src_path = Path(src)
        dest_path = Path(dest)

        if src_path.exists():
            print(f"Renaming: {src} -> {dest}")
            # Try git mv first, fall back to regular mv
            try:
                subprocess.run(["git", "mv", src, dest], check=True, capture_output=True)
            except subprocess.CalledProcessError:
                src_path.rename(dest_path)
        else:
            print(f"Warning: File not found: {src}")

    print("\n✓ File renames complete!\n")
    print("Now updating imports in all files...\n")

    # Second pass: update all imports
    replacements = {
        "MediaPlaceHolder.svelte": "media-placeholder.svelte",
        "BubbleMenu.svelte": "bubble-menu.svelte",
        "DragHandle.svelte": "drag-handle.svelte",
        "FindAndReplace.ts": "find-and-replace.ts",
        "InlineMathReplacer.ts": "inline-math-replacer.ts",
        "ColorHighlighter.ts": "color-highlighter.ts",
        "VideoPlaceholder.ts": "video-placeholder.ts",
        "VideoExtension.ts": "video-extension.ts",
        "VideoExtended.ts": "video-extended.ts",
        "IFramePlaceholder.ts": "iframe-placeholder.ts",
        "IFrame.ts": "iframe.ts",
        "IFrameExtended.ts": "iframe-extended.ts",
        "AudioPlaceholder.ts": "audio-placeholder.ts",
        "AudiExtended.ts": "audio-extended.ts",
        "AudioExtension.ts": "audio-extension.ts",
        "ImageExtended.ts": "image-extended.ts",
        "ImagePlaceholder.ts": "image-placeholder.ts",
        "ClipboardSerializer.ts": "clipboard-serializer.ts",
        "IFrameExtended.svelte": "iframe-extended.svelte",
        "VideoExtended.svelte": "video-extended.svelte",
        "VideoPlaceholder.svelte": "video-placeholder.svelte",
        "EdraToolTip.svelte": "edra-tooltip.svelte",
        "IFramePlaceHolder.svelte": "iframe-placeholder.svelte",
        "ImagePlaceholder.svelte": "image-placeholder.svelte",
        "MediaExtended.svelte": "media-extended.svelte",
        "CodeBlock.svelte": "code-block.svelte",
        "AudioExtended.svelte": "audio-extended.svelte",
        "SlashCommandList.svelte": "slash-command-list.svelte",
        "AudioPlaceHolder.svelte": "audio-placeholder.svelte",
        "ImageExtended.svelte": "image-extended.svelte",
        "ToolBarIcon.svelte": "toolbar-icon.svelte",
        "Alignment.svelte": "alignment.svelte",
        "QuickColors.svelte": "quick-colors.svelte",
        "Headings.svelte": "headings.svelte",
        "SearchAndReplace.svelte": "search-and-replace.svelte",
        "FontSize.svelte": "font-size.svelte",
        "TableRow.svelte": "table-row.svelte",
        "TableCol.svelte": "table-col.svelte",
        "Menu.svelte": "menu.svelte",
        "Link.svelte": "link.svelte",
    }

    # Find all TypeScript and Svelte files in the edra directory
    edra_dir = Path("src/lib/components/edra")
    files_to_update = list(edra_dir.rglob("*.ts")) + list(edra_dir.rglob("*.svelte"))

    for file_path in files_to_update:
        content = file_path.read_text()
        original_content = content

        for old_name, new_name in replacements.items():
            content = content.replace(old_name, new_name)

        if content != original_content:
            file_path.write_text(content)
            print(f"Updated imports in: {file_path}")

    print("\n✓ Import updates complete!")
    print("\nAll done! ✓")


if __name__ == "__main__":
    main()
