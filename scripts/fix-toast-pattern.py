#!/usr/bin/env python3
"""
Fix incorrect {t('...')} pattern in function calls
Converts: toast.error({t('key')}) → toast.error(t('key'))
Converts: throw new Error({t('key')}) → throw new Error(t('key'))
Converts: console.error({t('key')}) → console.error(t('key'))
"""

import re
from pathlib import Path

def fix_file(file_path):
    """Fix incorrect t() wrapping in a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Pattern: function_call({t('...')}) → function_call(t('...'))
        # Matches: toast.error({t(...)}), throw new Error({t(...)}), console.error({t(...)})
        pattern = r'(\w+\.\w+|\w+\s+new\s+\w+)\((\{t\([\'"][^\'"]+[\'"]\)\})\)'
        
        def replacer(match):
            func_call = match.group(1)
            t_call = match.group(2)[1:-1]  # Remove { and }
            return f"{func_call}({t_call})"
        
        content = re.sub(pattern, replacer, content)
        
        # Also fix standalone cases
        content = re.sub(r'\{t\(([\'"][^\'"]+[\'"])\)\}(?=[,\);])', r't(\1)', content)
        
        if content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
    
    except Exception as e:
        print(f"  ❌ Error in {file_path}: {e}")
        return False

def main():
    print("🔧 Fixing incorrect {t(...)} patterns")
    print("=" * 50)
    print()
    
    frontend_src = Path('frontend/src')
    jsx_files = list(frontend_src.rglob('*.jsx')) + list(frontend_src.rglob('*.tsx'))
    
    fixed_count = 0
    
    for file_path in jsx_files:
        if fix_file(file_path):
            print(f"  ✏️  Fixed: {file_path.relative_to('frontend/src')}")
            fixed_count += 1
    
    print()
    print("=" * 50)
    print(f"✅ Fixed {fixed_count} files")
    print()

if __name__ == "__main__":
    main()
