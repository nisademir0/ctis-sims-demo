#!/usr/bin/env python3
"""
Fix JSX ternary expressions with {t('key')} pattern.
Changes: {t('key')} → t('key') in ternary expressions and object properties
"""

import os
import re
from pathlib import Path

def fix_jsx_ternary_patterns(content):
    """Fix all patterns where {t(...)} is used incorrectly in JSX"""
    
    # Pattern 1: Ternary expressions - ? {t('key')} or : {t('key')}
    # Matches: condition ? {t('key')} or condition : {t('key')}
    content = re.sub(
        r'([?:])\s*\{(t\([\'"][^\'"]+[\'"]\))\}',
        r'\1 \2',
        content
    )
    
    # Pattern 2: Logical AND - condition && {t('key')}
    # Matches: {condition && {t('key')}}
    content = re.sub(
        r'&&\s*\{(t\([\'"][^\'"]+[\'"]\))\}',
        r'&& \1',
        content
    )
    
    # Pattern 3: Logical OR - condition || {t('key')}
    # Matches: {value || {t('key')}}
    content = re.sub(
        r'\|\|\s*\{(t\([\'"][^\'"]+[\'"]\))\}',
        r'|| \1',
        content
    )
    
    # Pattern 4: Object property values - key: {t('string')}
    # Matches: label: {t('key')}, name: {t('key')}, etc.
    content = re.sub(
        r'(\w+):\s*\{(t\([\'"][^\'"]+[\'"]\))\}',
        r'\1: \2',
        content
    )
    
    # Pattern 5: Template literals with ternary - ${condition ? {t('key')} : ...}
    content = re.sub(
        r'\$\{([^}]*?)\?\s*\{(t\([\'"][^\'"]+[\'"]\))\}',
        r'${\1? \2',
        content
    )
    
    content = re.sub(
        r'\$\{([^}]*?):\s*\{(t\([\'"][^\'"]+[\'"]\))\}',
        r'${\1: \2',
        content
    )
    
    # Pattern 6: JSX attributes with ternary - title={condition ? {t('key')} : ...}
    # This should already be caught by Pattern 1, but adding explicit pattern
    content = re.sub(
        r'(=\{[^}]*?)\?\s*\{(t\([\'"][^\'"]+[\'"]\))\}',
        r'\1? \2',
        content
    )
    
    content = re.sub(
        r'(=\{[^}]*?):\s*\{(t\([\'"][^\'"]+[\'"]\))\}',
        r'\1: \2',
        content
    )
    
    return content

def process_file(file_path):
    """Process a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        fixed_content = fix_jsx_ternary_patterns(original_content)
        
        if fixed_content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """Main function"""
    frontend_src = Path(__file__).parent.parent / 'frontend' / 'src'
    
    if not frontend_src.exists():
        print(f"Error: {frontend_src} does not exist")
        return
    
    # Find all JSX and TSX files
    jsx_files = list(frontend_src.rglob('*.jsx'))
    tsx_files = list(frontend_src.rglob('*.tsx'))
    all_files = jsx_files + tsx_files
    
    print(f"Found {len(all_files)} files to check")
    
    fixed_count = 0
    fixed_files = []
    
    for file_path in all_files:
        if process_file(file_path):
            fixed_count += 1
            fixed_files.append(file_path.relative_to(frontend_src.parent))
    
    print(f"\n✅ Fixed {fixed_count} files:")
    for file_path in sorted(fixed_files):
        print(f"   - {file_path}")

if __name__ == '__main__':
    main()
