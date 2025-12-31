#!/bin/bash

# CTIS-SIMS Translation Applicator
# Applies translation mappings to source files and updates JSON files

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <mapping-file.json>"
    echo ""
    echo "Example: $0 string-to-key-mapping-20251208-123456.json"
    exit 1
fi

MAPPING_FILE="$1"
FRONTEND_DIR="frontend/src"
TR_JSON="frontend/src/i18n/locales/tr.json"
EN_JSON="frontend/src/i18n/locales/en.json"
BACKUP_DIR="apply-backup-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="translation-apply-$(date +%Y%m%d-%H%M%S).log"

echo "🚀 CTIS-SIMS Translation Applicator"
echo "====================================="
echo ""

if [ ! -f "$MAPPING_FILE" ]; then
    echo "❌ Error: Mapping file not found: $MAPPING_FILE"
    exit 1
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "⚠️  Warning: jq not found. Installing basic JSON parser..."
    # Use python as fallback
    USE_PYTHON=true
else
    USE_PYTHON=false
fi

# Create full backup
echo "📦 Creating full backup..."
mkdir -p "$BACKUP_DIR/src"
cp -r "$FRONTEND_DIR" "$BACKUP_DIR/"
echo "✅ Backup created: $BACKUP_DIR"
echo ""

# Start logging
exec > >(tee -a "$LOG_FILE")
exec 2>&1

echo "📖 Reading mappings from $MAPPING_FILE..."

# Extract mappings using Python (more reliable than jq for complex JSON)
python3 << 'PYEOF' > /tmp/mappings.txt
import json
import sys

try:
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    mappings = data.get('mappings', {})
    
    for text, key in mappings.items():
        # Escape special characters for use in sed
        text_escaped = text.replace('/', '\\/').replace('"', '\\"')
        print(f"{text_escaped}:::{key}")
        
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
PYEOF "$MAPPING_FILE"

if [ $? -ne 0 ]; then
    echo "❌ Failed to parse mapping file"
    exit 1
fi

TOTAL_MAPPINGS=$(wc -l < /tmp/mappings.txt | tr -d ' ')
echo "✅ Loaded $TOTAL_MAPPINGS mappings"
echo ""

echo "🔧 Applying translations to source files..."
echo ""

FILES_MODIFIED=0
REPLACEMENTS_MADE=0

# Find all JSX/TSX files
find "$FRONTEND_DIR" -type f \( -name "*.jsx" -o -name "*.tsx" \) ! -path "*/node_modules/*" | while read -r file; do
    FILE_MODIFIED=false
    FILE_REPLACEMENTS=0
    
    # Read mappings and apply
    while IFS=':::' read -r text key; do
        [ -z "$text" ] && continue
        
        # Check if file contains this text
        if grep -qF "$text" "$file" 2>/dev/null; then
            
            # Check if file already has useTranslation
            if ! grep -q "useTranslation" "$file"; then
                echo "  📝 Adding useTranslation to $(basename "$file")"
                
                # Add import
                if grep -q "^import.*from 'react'" "$file"; then
                    perl -i -pe '
                        if (!$done && /^import.*from [\047"]react[\047"]/) {
                            $_ .= "import { useTranslation } from '\''react-i18next'\'';\n";
                            $done = 1;
                        }
                    ' "$file"
                fi
                
                # Add const { t } = useTranslation();
                perl -i -pe '
                    if (!$done && /export default function \w+|function \w+\s*\(/) {
                        if (/\{[^\}]*$/) {
                            $_ =~ s/(\{[^\}]*)$/\1\n  const { t } = useTranslation();/;
                        } else {
                            $_ .= "  const { t } = useTranslation();\n";
                        }
                        $done = 1;
                    }
                ' "$file"
            fi
            
            # Pattern 1: Replace JSX text content >Text< with >{t('key')}<
            perl -i -pe "s/>\\s*\Q$text\E\\s*</>{\$t('$key')}</g" "$file"
            
            # Pattern 2: Replace string in attributes "Text" with {t('key')}
            perl -i -pe "s/\"\\s*\Q$text\E\\s*\"/{\$t('$key')}/g" "$file"
            
            # Pattern 3: Replace in template literals
            perl -i -pe "s/\Q$text\E/\${t('$key')}/g" "$file"
            
            if [ "$FILE_MODIFIED" = false ]; then
                echo "  ✏️  $(basename "$file")"
                FILE_MODIFIED=true
                FILES_MODIFIED=$((FILES_MODIFIED + 1))
            fi
            
            FILE_REPLACEMENTS=$((FILE_REPLACEMENTS + 1))
            REPLACEMENTS_MADE=$((REPLACEMENTS_MADE + 1))
        fi
    done < /tmp/mappings.txt
    
    if [ "$FILE_MODIFIED" = true ]; then
        echo "      → $FILE_REPLACEMENTS replacements"
    fi
done

echo ""
echo "📚 Updating JSON translation files..."
echo ""

# Build JSON entries
python3 << 'PYEOF'
import json
import sys

def nested_set(dic, keys, value):
    """Set value in nested dictionary"""
    for key in keys[:-1]:
        dic = dic.setdefault(key, {})
    dic[keys[-1]] = value

def auto_translate(text):
    """Basic Turkish to English translation"""
    translations = {
        "Kaydet": "Save",
        "İptal": "Cancel",
        "Sil": "Delete",
        "Düzenle": "Edit",
        "Ekle": "Add",
        "Güncelle": "Update",
        "Ara": "Search",
        "Filtrele": "Filter",
        "Temizle": "Clear",
        "Dışa Aktar": "Export",
        "İçe Aktar": "Import",
        "Onayla": "Confirm",
        "Kapat": "Close",
        "Geri": "Back",
        "Sonraki": "Next",
        "Önceki": "Previous",
        "Gönder": "Submit",
        "Sıfırla": "Reset",
        "Yenile": "Refresh",
        "Görüntüle": "View",
        "Detayları Görüntüle": "View Details",
        "İndir": "Download",
        "Yükle": "Upload",
        "İşlemler": "Actions",
        "Durum": "Status",
        "Tarih": "Date",
        "Toplam": "Total",
        "Tümü": "All",
        "Aktif": "Active",
        "Notlar": "Notes",
        "Açıklama": "Description",
        "Kategori": "Category",
        "Miktar": "Quantity",
        "Adet": "Quantity",
        "Öncelik": "Priority",
        "Yükleniyor...": "Loading...",
        "Evet": "Yes",
        "Hayır": "No",
        "Düşük": "Low",
        "Normal": "Normal",
        "Yüksek": "High",
        "Acil": "Critical",
        "Kritik": "Critical",
    }
    return translations.get(text, f"[TODO: Translate] {text}")

try:
    # Load existing translations
    with open('frontend/src/i18n/locales/tr.json', 'r', encoding='utf-8') as f:
        tr_data = json.load(f)
    
    with open('frontend/src/i18n/locales/en.json', 'r', encoding='utf-8') as f:
        en_data = json.load(f)
    
    # Load mappings
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        mappings = json.load(f)['mappings']
    
    new_keys = 0
    
    # Add new translations
    for text, key in mappings.items():
        key_parts = key.split('.')
        
        # Check if key already exists
        current = tr_data
        exists = True
        for part in key_parts:
            if part not in current:
                exists = False
                break
            current = current[part] if isinstance(current, dict) else None
            if current is None:
                exists = False
                break
        
        if not exists:
            # Add to Turkish
            nested_set(tr_data, key_parts, text)
            
            # Add to English
            en_text = auto_translate(text)
            nested_set(en_data, key_parts, en_text)
            
            new_keys += 1
            print(f"  ➕ {key}: {text} / {en_text}")
    
    # Save updated translations
    with open('frontend/src/i18n/locales/tr.json', 'w', encoding='utf-8') as f:
        json.dump(tr_data, f, ensure_ascii=False, indent=2)
    
    with open('frontend/src/i18n/locales/en.json', 'w', encoding='utf-8') as f:
        json.dump(en_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Added {new_keys} new translation keys")
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
PYEOF "$MAPPING_FILE"

echo ""
echo "=============================="
echo "✅ Translation Application Complete!"
echo ""
echo "📊 Summary:"
echo "   Files modified: $FILES_MODIFIED"
echo "   Total replacements: $REPLACEMENTS_MADE"
echo "   Mapping file: $MAPPING_FILE"
echo ""
echo "📄 Files:"
echo "   - Backup: $BACKUP_DIR/"
echo "   - Log: $LOG_FILE"
echo "   - TR JSON: $TR_JSON"
echo "   - EN JSON: $EN_JSON"
echo ""
echo "⚠️  Important:"
echo "   1. Review the changes in modified files"
echo "   2. Check JSON files for [TODO: Translate] markers"
echo "   3. Test the application"
echo "   4. Run: docker compose restart frontend"
echo ""

# Cleanup
rm -f /tmp/mappings.txt
