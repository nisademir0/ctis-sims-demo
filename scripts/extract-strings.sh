#!/bin/bash

# CTIS-SIMS String Extractor
# Extracts all unique hardcoded strings from JSX files for i18n conversion

set -e

FRONTEND_DIR="frontend/src"
OUTPUT_FILE="extracted-strings-$(date +%Y%m%d-%H%M%S).txt"
TEMP_FILE="/tmp/ctis-strings-temp.txt"

echo "🔍 CTIS-SIMS String Extractor"
echo "=============================="
echo ""

# Clear temp file
> "$TEMP_FILE"

echo "📁 Scanning frontend/src directory..."
echo ""

# Find all JSX/TSX files
find "$FRONTEND_DIR" -type f \( -name "*.jsx" -o -name "*.tsx" \) ! -path "*/node_modules/*" | while read -r file; do
    # Extract strings from various patterns
    
    # Pattern 1: JSX text content >Text Here<
    grep -oE '>[^<>{}]+<' "$file" 2>/dev/null | \
        sed 's/^>//g' | sed 's/<$//g' | \
        grep -v '^\s*$' | \
        grep -v '^[0-9]\+$' | \
        grep -v '^\s*{' >> "$TEMP_FILE" || true
    
    # Pattern 2: String literals in JSX "Text Here" or 'Text Here'
    grep -oE '"[^"]+"|'"'"'[^'"'"']+'"'"'' "$file" 2>/dev/null | \
        sed 's/^"//g' | sed 's/"$//g' | \
        sed "s/^'//g" | sed "s/'$//g" | \
        grep -v '^\s*$' | \
        grep -v '^[a-z_-]\+$' | \
        grep -v '^\.' | \
        grep -v '^/' | \
        grep -v '^#' | \
        grep -v '^@' >> "$TEMP_FILE" || true
    
    # Pattern 3: Template literals `Text ${var} here`
    grep -oE '\`[^\`]+\`' "$file" 2>/dev/null | \
        sed 's/^`//g' | sed 's/`$//g' | \
        grep -v '^\s*$' >> "$TEMP_FILE" || true
done

echo "🔧 Processing and deduplicating strings..."

# Sort, deduplicate, and filter
cat "$TEMP_FILE" | \
    # Remove leading/trailing whitespace
    sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | \
    # Remove empty lines
    grep -v '^$' | \
    # Remove lines with only symbols/numbers
    grep -v '^[0-9_.,;!?+=*/()[\]{}]\+$' | \
    # Remove lines that are just variable names (camelCase, snake_case)
    grep -v '^[a-z][a-zA-Z0-9_]\{1,\}$' | \
    # Remove file paths
    grep -v '^\.\/\|^\/\|^http' | \
    # Remove CSS classes
    grep -v '^[a-z\-]\+:[a-z\-]\+' | \
    # Keep lines with Turkish characters or meaningful text
    grep -E '[A-ZĞÜŞİÖÇ]|[a-zğüşıöç]{4,}' | \
    # Sort and deduplicate
    sort -u > "$OUTPUT_FILE"

# Count results
TOTAL_STRINGS=$(wc -l < "$OUTPUT_FILE" | tr -d ' ')

echo ""
echo "=============================="
echo "✅ Extraction Complete!"
echo ""
echo "📊 Statistics:"
echo "   Total unique strings: $TOTAL_STRINGS"
echo ""
echo "📄 Output saved to: $OUTPUT_FILE"
echo ""
echo "📝 Next Steps:"
echo "   1. Open $OUTPUT_FILE"
echo "   2. Remove strings that DON'T need translation"
echo "   3. Keep only Turkish text that should be translated"
echo "   4. Save the file"
echo "   5. Run: ./scripts/generate-translations.sh $OUTPUT_FILE"
echo ""

# Show preview
echo "📋 Preview (first 20 strings):"
echo "─────────────────────────────────"
head -20 "$OUTPUT_FILE"
echo "─────────────────────────────────"
echo ""
echo "💡 Tip: grep for Turkish words to verify:"
echo "   grep -E 'Hoş|Talep|İade|Kaydet|Durum' $OUTPUT_FILE"
echo ""

# Cleanup
rm -f "$TEMP_FILE"
