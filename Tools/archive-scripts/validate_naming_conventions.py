#!/usr/bin/env python3
"""
Documentation Naming Convention Validator

Validates that all documentation files follow the naming conventions:
- All files should use UPPERCASE with underscores (e.g., UI_DESIGN_SYSTEM.md)
- Archive files (5-archive/) are exempt from validation
"""

import re
import sys
from pathlib import Path
from typing import List, Tuple

# Root directory
REPO_ROOT = Path(__file__).parent.parent
DOCS_DIR = REPO_ROOT / "nanashi8.github.io" / "docs"

# Archive directory (naming rules don't apply)
ARCHIVE_DIR = "5-archive"


class NamingValidator:
    """Validates documentation file naming conventions."""
    
    def __init__(self):
        self.errors: List[Tuple[Path, str]] = []
        self.warnings: List[Tuple[Path, str]] = []
    
    def validate_file(self, file_path: Path) -> None:
        """Validate a single file's naming convention."""
        relative_path = file_path.relative_to(DOCS_DIR)
        filename = file_path.name
        
        # Skip archive files
        if ARCHIVE_DIR in str(relative_path.parts):
            return
        
        # Check for proper uppercase naming (excluding .md extension)
        name_without_ext = filename[:-3] if filename.endswith('.md') else filename
        
        # Check for lowercase characters (should be uppercase)
        if re.search(r'[a-z]', name_without_ext):
            self.errors.append((
                relative_path,
                f"Contains lowercase letters. Use UPPERCASE_WITH_UNDERSCORES format"
            ))
        
        # Check for hyphens (should use underscores instead)
        if '-' in name_without_ext and not name_without_ext.startswith('00-'):
            self.errors.append((
                relative_path,
                f"Contains hyphens. Use underscores instead (e.g., UI_DESIGN_SYSTEM.md)"
            ))
        
        # Check for spaces
        if ' ' in filename:
            self.errors.append((
                relative_path,
                f"Contains spaces. Use underscores instead"
            ))
        
        # Check for invalid characters (only uppercase, numbers, underscores allowed)
        if re.search(r'[^A-Z0-9_\-.]', name_without_ext):
            invalid_chars = set(re.findall(r'[^A-Z0-9_\-.]', name_without_ext))
            self.errors.append((
                relative_path,
                f"Contains invalid characters: {', '.join(sorted(invalid_chars))}. " +
                "Use only UPPERCASE letters, numbers, and underscores"
            ))
    
    def validate_all(self) -> bool:
        """Validate all markdown files in docs directory."""
        if not DOCS_DIR.exists():
            print(f"❌ Documentation directory not found: {DOCS_DIR}")
            return False
        
        # Find all .md files
        md_files = list(DOCS_DIR.rglob("*.md"))
        
        if not md_files:
            print(f"⚠️  No markdown files found in {DOCS_DIR}")
            return True
        
        print(f"🔍 Validating {len(md_files)} markdown files...\n")
        
        # Validate each file
        for file_path in md_files:
            self.validate_file(file_path)
        
        # Report results
        return self._report_results(len(md_files))
    
    def _report_results(self, total_files: int) -> bool:
        """Print validation results and return success status."""
        has_errors = len(self.errors) > 0
        has_warnings = len(self.warnings) > 0
        
        # Print errors
        if has_errors:
            print("❌ ERRORS:")
            print("=" * 80)
            for path, message in sorted(self.errors):
                print(f"\n  {path}")
                print(f"  → {message}")
            print("\n" + "=" * 80)
            print(f"\nFound {len(self.errors)} naming convention errors\n")
        
        # Print warnings
        if has_warnings:
            print("⚠️  WARNINGS:")
            print("=" * 80)
            for path, message in sorted(self.warnings):
                print(f"\n  {path}")
                print(f"  → {message}")
            print("\n" + "=" * 80)
            print(f"\nFound {len(self.warnings)} naming convention warnings\n")
        
        # Print success or summary
        if not has_errors and not has_warnings:
            print("✅ All files follow naming conventions!")
            print(f"   Validated: {total_files} files")
            return True
        elif not has_errors:
            print(f"✅ No errors found (validated {total_files} files)")
            print(f"⚠️  But {len(self.warnings)} warnings to consider")
            return True
        else:
            print(f"❌ Validation failed: {len(self.errors)} errors, {len(self.warnings)} warnings")
            return False


def main() -> int:
    """Main entry point."""
    validator = NamingValidator()
    success = validator.validate_all()
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
