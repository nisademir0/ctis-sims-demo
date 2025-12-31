#!/usr/bin/env python3
"""
CTIS-SIMS Translation Applicator
Applies translation mappings to source files and updates JSON files
"""

import sys
import json
import re
import os
import shutil
from datetime import datetime
from pathlib import Path

def nested_set(dic, keys, value):
    """Set value in nested dictionary"""
    for key in keys[:-1]:
        dic = dic.setdefault(key, {})
    dic[keys[-1]] = value

def nested_get(dic, keys):
    """Get value from nested dictionary"""
    for key in keys:
        if not isinstance(dic, dict) or key not in dic:
            return None
        dic = dic[key]
    return dic

def add_use_translation(content):
    """Add useTranslation import and hook if not present"""
    
    # Check if already has useTranslation
    if 'useTranslation' in content:
        return content, False
    
    lines = content.split('\n')
    new_lines = []
    import_added = False
    hook_added = False
    
    for i, line in enumerate(lines):
        new_lines.append(line)
        
        # Add import after first import from 'react'
        if not import_added and re.match(r"^import.*from ['\"]react['\"]", line):
            new_lines.append("import { useTranslation } from 'react-i18next';")
            import_added = True
        
        # Add hook after function declaration
        if import_added and not hook_added:
            if re.search(r'export default function \w+|function \w+\s*\(', line):
                # Look for opening brace
                if '{' in line:
                    indent = len(line) - len(line.lstrip())
                    new_lines.append(' ' * (indent + 2) + "const { t } = useTranslation();")
                    hook_added = True
    
    return '\n'.join(new_lines), import_added or hook_added

def escape_for_regex(text):
    """Escape special characters for regex"""
    return re.escape(text)

def apply_translation_to_file(file_path, mappings):
    """Apply translations to a single file"""
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        replacements = 0
        
        # Add useTranslation if needed
        content, added = add_use_translation(content)
        if added:
            replacements += 1
        
        # Apply each mapping
        for text, key in mappings.items():
            text_escaped = escape_for_regex(text)
            
            # Pattern 1: JSX text content >Text< → >{t('key')}<
            pattern1 = f">{text_escaped}<"
            replacement1 = f">{{t('{key}')}}<"
            new_content, count1 = re.subn(pattern1, replacement1, content)
            if count1 > 0:
                content = new_content
                replacements += count1
            
            # Pattern 2: String in JSX attributes "Text" → {t('key')}
            pattern2 = f'"{text_escaped}"'
            replacement2 = f"{{t('{key}')}}"
            new_content, count2 = re.subn(pattern2, replacement2, content)
            if count2 > 0:
                content = new_content
                replacements += count2
            
            # Pattern 3: String in JSX attributes 'Text' → {t('key')}
            pattern3 = f"'{text_escaped}'"
            replacement3 = f"{{t('{key}')}}"
            new_content, count3 = re.subn(pattern3, replacement3, content)
            if count3 > 0:
                content = new_content
                replacements += count3
        
        # Only write if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return replacements
        
        return 0
    
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def update_json_files(mappings, translations_tr, translations_en):
    """Update tr.json and en.json with new translations"""
    
    tr_json_path = "frontend/src/i18n/locales/tr.json"
    en_json_path = "frontend/src/i18n/locales/en.json"
    
    # Load existing files
    with open(tr_json_path, 'r', encoding='utf-8') as f:
        tr_data = json.load(f)
    
    with open(en_json_path, 'r', encoding='utf-8') as f:
        en_data = json.load(f)
    
    new_keys = 0
    
    # Add new translations
    for text, key in mappings.items():
        key_parts = key.split('.')
        
        # Check if key already exists
        if nested_get(tr_data, key_parts) is None:
            # Add to Turkish
            nested_set(tr_data, key_parts, translations_tr.get(text, text))
            
            # Add to English
            nested_set(en_data, key_parts, translations_en.get(text, f"[TODO] {text}"))
            
            new_keys += 1
            print(f"  ➕ {key}")
    
    # Save updated files
    with open(tr_json_path, 'w', encoding='utf-8') as f:
        json.dump(tr_data, f, ensure_ascii=False, indent=2)
    
    with open(en_json_path, 'w', encoding='utf-8') as f:
        json.dump(en_data, f, ensure_ascii=False, indent=2)
    
    return new_keys

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 apply-translations.py <mapping-file.json>")
        sys.exit(1)
    
    mapping_file = sys.argv[1]
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_dir = f"apply-backup-{timestamp}"
    log_file = f"translation-apply-{timestamp}.log"
    
    print("🚀 CTIS-SIMS Translation Applicator (Python)")
    print("=" * 60)
    print()
    
    # Load mapping file
    try:
        with open(mapping_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        mappings = data['mappings']
        translations_tr = data['translations']['tr']
        translations_en = data['translations']['en']
    
    except FileNotFoundError:
        print(f"❌ Error: Mapping file not found: {mapping_file}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error loading mapping file: {e}")
        sys.exit(1)
    
    print(f"📖 Loaded {len(mappings)} mappings from {mapping_file}")
    print()
    
    # Create backup
    print("📦 Creating backup...")
    os.makedirs(backup_dir, exist_ok=True)
    shutil.copytree('frontend/src', f'{backup_dir}/src', dirs_exist_ok=True)
    print(f"✅ Backup created: {backup_dir}/")
    print()
    
    # Find all JSX/TSX files
    print("🔍 Finding source files...")
    frontend_src = Path('frontend/src')
    jsx_files = list(frontend_src.rglob('*.jsx')) + list(frontend_src.rglob('*.tsx'))
    jsx_files = [f for f in jsx_files if 'node_modules' not in str(f)]
    
    print(f"📄 Found {len(jsx_files)} JSX/TSX files")
    print()
    
    # Apply translations to files
    print("🔧 Applying translations to source files...")
    print()
    
    files_modified = 0
    total_replacements = 0
    
    for file_path in jsx_files:
        replacements = apply_translation_to_file(file_path, mappings)
        if replacements > 0:
            files_modified += 1
            total_replacements += replacements
            print(f"  ✏️  {file_path.relative_to('frontend/src')} → {replacements} changes")
    
    print()
    print("📚 Updating JSON translation files...")
    print()
    
    new_keys = update_json_files(mappings, translations_tr, translations_en)
    
    print()
    print("=" * 60)
    print("✅ Translation Application Complete!")
    print()
    print("📊 Summary:")
    print(f"   Files modified: {files_modified}/{len(jsx_files)}")
    print(f"   Total replacements: {total_replacements}")
    print(f"   New translation keys: {new_keys}")
    print()
    print("📄 Files:")
    print(f"   - Backup: {backup_dir}/")
    print(f"   - TR JSON: frontend/src/i18n/locales/tr.json")
    print(f"   - EN JSON: frontend/src/i18n/locales/en.json")
    print()
    print("⚠️  Next Steps:")
    print("   1. Review modified files")
    print("   2. Search for [TODO] in JSON files and add proper English translations")
    print("   3. Test the application")
    print("   4. Run: docker compose restart frontend")
    print()

if __name__ == "__main__":
    main()
