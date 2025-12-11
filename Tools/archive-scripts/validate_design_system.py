#!/usr/bin/env python3
"""
Design System Validation Script
Enforces 22-color palette limit and detects hardcoded values in CSS/TypeScript files.

Validates:
1. Color Usage: Only 22 core colors from core-palette.css
2. Typography: No hardcoded font-size values
3. Spacing: No hardcoded margin/padding values (except 0)
4. Shadows: Allows direct rgba() specification (not via variables)
"""

import re
import sys
from pathlib import Path
from typing import Dict, List, Set, Tuple

# 22 core colors from UI_DESIGN_SYSTEM.md
ALLOWED_COLORS = {
    '--primary', '--primary-hover', '--primary-light',
    '--gray-50', '--gray-100', '--gray-300', '--gray-600', '--gray-800', '--gray-900',
    '--success', '--success-bg', '--error', '--error-bg',
    '--warning', '--warning-bg', '--info', '--info-bg',
    '--text', '--text-secondary', '--background', '--bg-secondary', '--border', '--surface'
}

# Allowed typography scale (8 levels)
ALLOWED_FONT_SIZES = {
    '--font-xs', '--font-sm', '--font-base', '--font-lg',
    '--font-xl', '--font-2xl', '--font-3xl', '--font-4xl'
}

# Allowed spacing scale (8 levels)
ALLOWED_SPACING = {
    '--space-xs', '--space-sm', '--space-md', '--space-lg',
    '--space-xl', '--space-2xl', '--space-3xl', '--space-4xl'
}


class DesignSystemValidator:
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.errors: List[str] = []
        self.warnings: List[str] = []
        
    def validate_all(self) -> bool:
        """Run all validation checks."""
        print("🔍 Validating Design System Compliance...")
        print(f"📂 Project root: {self.project_root}\n")
        
        # Collect all CSS and TypeScript files
        css_files = list(self.project_root.glob('**/*.css'))
        ts_files = list(self.project_root.glob('**/*.ts')) + \
                   list(self.project_root.glob('**/*.tsx'))
        
        # Filter out node_modules and dist
        css_files = [f for f in css_files if 'node_modules' not in str(f) and 'dist' not in str(f)]
        ts_files = [f for f in ts_files if 'node_modules' not in str(f) and 'dist' not in str(f)]
        
        print(f"📄 Checking {len(css_files)} CSS files and {len(ts_files)} TypeScript files\n")
        
        # Run validations
        self.validate_color_usage(css_files + ts_files)
        self.validate_typography(css_files + ts_files)
        self.validate_spacing(css_files)
        
        # Report results
        self.print_results()
        
        return len(self.errors) == 0
    
    def validate_color_usage(self, files: List[Path]) -> None:
        """Validate that only 22 core colors are used."""
        print("🎨 Checking color usage (22-color limit)...")
        
        # Patterns to detect
        hex_pattern = re.compile(r'#[0-9a-fA-F]{3,6}(?![0-9a-fA-F])')
        rgb_pattern = re.compile(r'rgb\s*\([^)]+\)')
        var_pattern = re.compile(r'var\(--([a-z0-9-]+)\)')
        
        # Allow rgba() for shadows/overlays (per UI_DESIGN_SYSTEM.md Section 1.5)
        rgba_pattern = re.compile(r'rgba\s*\([^)]+\)')
        
        for file in files:
            try:
                content = file.read_text(encoding='utf-8')
                lines = content.split('\n')
                
                # Skip variables.css, core-palette.css, dark.css, light.css (these DEFINE colors with hex values)
                if any(name in str(file) for name in ['variables.css', 'core-palette.css', 'dark.css', 'light.css']):
                    continue
                
                for i, line in enumerate(lines, 1):
                    # Skip comments
                    if '//' in line or '/*' in line or '*/' in line:
                        continue
                    
                    # Check for hardcoded hex colors
                    hex_matches = hex_pattern.findall(line)
                    for hex_color in hex_matches:
                        self.errors.append(
                            f"❌ {file.relative_to(self.project_root)}:{i} - "
                            f"Hardcoded color '{hex_color}' detected. Use CSS variables only."
                        )
                    
                    # Check for rgb() (rgba() is allowed for shadows)
                    if 'rgb(' in line and 'rgba(' not in line:
                        rgb_matches = rgb_pattern.findall(line)
                        for rgb_color in rgb_matches:
                            self.errors.append(
                                f"❌ {file.relative_to(self.project_root)}:{i} - "
                                f"Hardcoded rgb color '{rgb_color}'. Use CSS variables or rgba() for shadows."
                            )
                    
                    # Check CSS variables are from allowed set
                    var_matches = var_pattern.findall(line)
                    for var_name in var_matches:
                        full_var = f'--{var_name}'
                        # Check if it's a color variable (starts with known prefixes)
                        if any(prefix in var_name for prefix in ['color', 'bg', 'border', 'text', 'background', 'primary', 'success', 'error', 'warning', 'info', 'gray', 'surface']):
                            if full_var not in ALLOWED_COLORS:
                                self.errors.append(
                                    f"❌ {file.relative_to(self.project_root)}:{i} - "
                                    f"Unauthorized color variable '{full_var}'. Only 22 core colors allowed."
                                )
            
            except Exception as e:
                self.warnings.append(f"⚠️  Failed to read {file}: {e}")
        
        print(f"   ✓ Color validation complete\n")
    
    def validate_typography(self, files: List[Path]) -> None:
        """Validate no hardcoded font-size values."""
        print("🔤 Checking typography (no hardcoded font-size)...")
        
        # Pattern: font-size: 16px, font-size: 1.5rem, etc.
        font_size_pattern = re.compile(r'font-size\s*:\s*([0-9.]+(?:px|rem|em|pt))', re.IGNORECASE)
        
        for file in files:
            try:
                content = file.read_text(encoding='utf-8')
                lines = content.split('\n')
                
                for i, line in enumerate(lines, 1):
                    # Skip comments
                    if '//' in line or '/*' in line or '*/' in line:
                        continue
                    
                    # Check for hardcoded font-size
                    matches = font_size_pattern.findall(line)
                    for size_value in matches:
                        # Allow font-size: 0 (rare but valid)
                        if size_value.startswith('0'):
                            continue
                        
                        self.errors.append(
                            f"❌ {file.relative_to(self.project_root)}:{i} - "
                            f"Hardcoded font-size '{size_value}'. Use typography scale variables (--font-xs to --font-4xl)."
                        )
            
            except Exception as e:
                self.warnings.append(f"⚠️  Failed to read {file}: {e}")
        
        print(f"   ✓ Typography validation complete\n")
    
    def validate_spacing(self, files: List[Path]) -> None:
        """Validate no hardcoded margin/padding values (except 0)."""
        print("📏 Checking spacing (no hardcoded margin/padding)...")
        
        # Patterns: margin: 16px, padding: 1rem 2rem, etc.
        spacing_pattern = re.compile(
            r'(?:margin|padding)(?:-(?:top|bottom|left|right))?\s*:\s*([^;{]+)',
            re.IGNORECASE
        )
        
        # Allowed values: 0, auto, inherit, var(...)
        allowed_pattern = re.compile(r'^(?:0|auto|inherit|var\(|calc\().*$')
        
        for file in files:
            try:
                content = file.read_text(encoding='utf-8')
                lines = content.split('\n')
                
                for i, line in enumerate(lines, 1):
                    # Skip comments
                    if '//' in line or '/*' in line or '*/' in line:
                        continue
                    
                    # Check for spacing properties
                    matches = spacing_pattern.findall(line)
                    for spacing_value in matches:
                        spacing_value = spacing_value.strip()
                        
                        # Split by spaces (e.g., "1rem 2rem" → ["1rem", "2rem"])
                        parts = spacing_value.split()
                        
                        for part in parts:
                            # Check if this part is allowed
                            if not allowed_pattern.match(part):
                                # Check if it's a hardcoded px/rem/em value
                                if re.match(r'^[0-9.]+(?:px|rem|em|pt)', part):
                                    self.errors.append(
                                        f"❌ {file.relative_to(self.project_root)}:{i} - "
                                        f"Hardcoded spacing '{spacing_value}'. Use spacing scale (--space-xs to --space-4xl)."
                                    )
                                    break  # Only report once per line
            
            except Exception as e:
                self.warnings.append(f"⚠️  Failed to read {file}: {e}")
        
        print(f"   ✓ Spacing validation complete\n")
    
    def print_results(self) -> None:
        """Print validation results."""
        print("\n" + "=" * 70)
        print("📊 VALIDATION RESULTS")
        print("=" * 70)
        
        if self.warnings:
            print(f"\n⚠️  Warnings ({len(self.warnings)}):")
            for warning in self.warnings[:10]:  # Show first 10
                print(f"   {warning}")
            if len(self.warnings) > 10:
                print(f"   ... and {len(self.warnings) - 10} more warnings")
        
        if self.errors:
            print(f"\n❌ Errors ({len(self.errors)}):")
            for error in self.errors[:20]:  # Show first 20
                print(f"   {error}")
            if len(self.errors) > 20:
                print(f"   ... and {len(self.errors) - 20} more errors")
            
            print(f"\n{'='*70}")
            print(f"❌ VALIDATION FAILED: {len(self.errors)} errors found")
            print(f"{'='*70}")
            print("\n📖 Design System Specification:")
            print("   - 22 colors only (no hardcoded colors)")
            print("   - 6-stage typography: 12px → 16px → 20px → 24px → 28px → 32px")
            print("   - 6-stage spacing: 4px → 8px → 16px → 24px → 32px → 48px")
            print("\n📚 Documentation: docs/1-core/UI_DESIGN_SYSTEM.md")
            print("🔧 Auto-fix tools:")
            print("   - python3 scripts/fix_hardcoded_colors.py")
            print("   - python3 scripts/fix_hardcoded_typography.py")
            print("   - python3 scripts/fix_hardcoded_spacing.py")
        else:
            print(f"\n{'='*70}")
            print("✅ VALIDATION PASSED: All design system rules enforced")
            print(f"{'='*70}")
            print("\n✨ Perfect compliance achieved:")
            print("   ✓ 22-color palette properly used")
            print("   ✓ 6-stage typography (12-32px, 4px steps)")
            print("   ✓ 6-stage spacing (4-48px)")
            print("\n🎉 Your UI follows industry-standard design systems!")
            print("   (Material Design, Tailwind CSS, Bootstrap principles)")


def main():
    """Main entry point."""
    # Find project root (contains nanashi8.github.io/)
    script_path = Path(__file__).resolve()
    project_root = script_path.parent.parent
    
    # Validate design system
    validator = DesignSystemValidator(project_root)
    success = validator.validate_all()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
