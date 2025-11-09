#!/usr/bin/env python3
"""
Script to fix imports in edra files to use kebab-case with .js extensions
"""

import os
import re
from pathlib import Path

# Define the import replacements (old .js import -> new .js import)
IMPORT_REPLACEMENTS = {
    # Extensions
    "ColorHighlighter.js": "color-highlighter.js",
    "FindAndReplace.js": "find-and-replace.js",
    "InlineMathReplacer.js": "inline-math-replacer.js",

    # Video
    "VideoPlaceholder.js": "video-placeholder.js",
    "VideoExtension.js": "video-extension.js",
    "VideoExtended.js": "video-extended.js",

    # IFrame
    "IFramePlaceholder.js": "iframe-placeholder.js",
    "IFrame.js": "iframe.js",
    "IFrameExtended.js": "iframe-extended.js",

    # Audio
    "AudioPlaceholder.js": "audio-placeholder.js",
    "AudiExtended.js": "audio-extended.js",
    "AudioExtension.js": "audio-extension.js",

    # Image
    "ImageExtended.js": "image-extended.js",
    "ImagePlaceholder.js": "image-placeholder.js",

    # Drag handle
    "ClipboardSerializer.js": "clipboard-serializer.js",
}


def main():
    root = Path(__file__).parent.parent
    os.chdir(root)

    print("Fixing import statements...\n")

    # Find all TypeScript and Svelte files in the edra directory
    edra_dir = Path("src/lib/components/edra")
    files_to_update = list(edra_dir.rglob("*.ts")) + list(edra_dir.rglob("*.svelte"))

    files_updated = 0

    for file_path in files_to_update:
        content = file_path.read_text()
        original_content = content

        for old_import, new_import in IMPORT_REPLACEMENTS.items():
            if old_import in content:
                content = content.replace(old_import, new_import)

        if content != original_content:
            file_path.write_text(content)
            files_updated += 1
            print(f"✓ Updated: {file_path}")

    print(f"\n✓ Fixed imports in {files_updated} files!")


if __name__ == "__main__":
    main()
