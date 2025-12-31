#!/bin/bash

##############################################################################
# CTIS-SIMS i18n Verification Script
# 
# This script scans the frontend codebase for internationalization issues:
# 1. Hardcoded Turkish strings in JSX
# 2. Components using t() without useTranslation import
# 3. Missing translation keys in JSON files
# 4. Inconsistent key naming patterns
#
# Usage: ./scripts/verify-i18n.sh
# Output: i18n-verification-report.txt
##############################################################################

echo "🔍 CTIS-SIMS i18n Verification"
echo "======================================"
echo ""

FRONTEND_DIR="frontend/src"
REPORT_FILE="i18n-verification-report-$(date +%Y%m%d-%H%M%S).txt"

# Initialize report
echo "CTIS-SIMS i18n Verification Report" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "=====================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

##############################################################################
# CHECK 1: Hardcoded Turkish strings in JSX
##############################################################################
echo "📝 Checking for hardcoded Turkish strings..." 
echo "" >> "$REPORT_FILE"
echo "=== HARDCODED TURKISH STRINGS ===" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Common Turkish patterns (case-insensitive)
TURKISH_PATTERNS=(
    "kullanıcı"
    "şifre"
    "giriş"
    "çıkış"
    "güncelle"
    "kaydet"
    "sil"
    "ekle"
    "oluştur"
    "düzenle"
    "başarılı"
    "başarısız"
    "hata"
    "yükleniyor"
    "seçin"
    "zorunlu"
    "gerekli"
    "tarih"
    "açıklama"
)

for pattern in "${TURKISH_PATTERNS[@]}"; do
    results=$(grep -rni "$pattern" "$FRONTEND_DIR" \
        --include="*.jsx" \
        --include="*.tsx" \
        --exclude-dir=node_modules \
        --exclude-dir=dist \
        --exclude-dir=build \
        | grep -v "// " \
        | grep -v "t('" \
        | grep -v "useTranslation" \
        | head -20)
    
    if [ ! -z "$results" ]; then
        echo "⚠️  Pattern: $pattern" >> "$REPORT_FILE"
        echo "$results" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
done

##############################################################################
# CHECK 2: Components using t() without useTranslation
##############################################################################
echo "🔧 Checking for t() usage without useTranslation..."
echo "" >> "$REPORT_FILE"
echo "=== MISSING useTranslation IMPORTS ===" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

for file in $(find "$FRONTEND_DIR" -name "*.jsx" -o -name "*.tsx"); do
    # Check if file uses t() function
    if grep -q "t('" "$file" || grep -q 't("' "$file"; then
        # Check if it has useTranslation import
        if ! grep -q "useTranslation" "$file"; then
            echo "❌ $file" >> "$REPORT_FILE"
        fi
    fi
done

##############################################################################
# CHECK 3: Missing const { t } declaration
##############################################################################
echo "🎯 Checking for missing const { t } declarations..."
echo "" >> "$REPORT_FILE"
echo "=== MISSING const { t } DECLARATIONS ===" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

for file in $(find "$FRONTEND_DIR" -name "*.jsx" -o -name "*.tsx"); do
    # Check if file uses t() function
    if grep -q "t('" "$file" || grep -q 't("' "$file"; then
        # Check if it has const { t } declaration
        if ! grep -q "const { t }" "$file"; then
            echo "❌ $file" >> "$REPORT_FILE"
        fi
    fi
done

##############################################################################
# CHECK 4: Translation key usage vs definitions
##############################################################################
echo "📚 Checking translation key coverage..."
echo "" >> "$REPORT_FILE"
echo "=== TRANSLATION KEY COVERAGE ===" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Count unique keys used in code
USED_KEYS=$(grep -rho "t('[^']*')" "$FRONTEND_DIR" --include="*.jsx" --include="*.tsx" | sort -u | wc -l)
# Count keys in TR JSON
TR_KEYS=$(grep -c '"[^"]*":' frontend/src/i18n/locales/tr.json)
# Count keys in EN JSON
EN_KEYS=$(grep -c '"[^"]*":' frontend/src/i18n/locales/en.json)

echo "Used keys in code: $USED_KEYS" >> "$REPORT_FILE"
echo "Defined in tr.json: $TR_KEYS" >> "$REPORT_FILE"
echo "Defined in en.json: $EN_KEYS" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

##############################################################################
# CHECK 5: Inconsistent key naming
##############################################################################
echo "🏷️  Checking for inconsistent key naming..."
echo "" >> "$REPORT_FILE"
echo "=== KEY NAMING ISSUES ===" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Keys in 'other.*' category (should be moved to proper categories)
OTHER_KEYS=$(grep -o '"other\.[^"]*"' frontend/src/i18n/locales/tr.json | wc -l)
echo "Keys in 'other' category: $OTHER_KEYS (Should categorize these properly)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Keys with underscores vs dots inconsistency
echo "Sample keys needing review:" >> "$REPORT_FILE"
grep -o '"[^"]*_[^"]*"' frontend/src/i18n/locales/tr.json | head -10 >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

##############################################################################
# CHECK 6: Keys with [TODO] markers
##############################################################################
echo "✅ Checking for incomplete translations..."
echo "" >> "$REPORT_FILE"
echo "=== INCOMPLETE TRANSLATIONS ===" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

TODO_COUNT=$(grep -c '\[TODO\]' frontend/src/i18n/locales/en.json || echo "0")
echo "English translations with [TODO]: $TODO_COUNT" >> "$REPORT_FILE"

if [ "$TODO_COUNT" -gt 0 ]; then
    echo "" >> "$REPORT_FILE"
    echo "Sample TODO entries:" >> "$REPORT_FILE"
    grep '\[TODO\]' frontend/src/i18n/locales/en.json | head -5 >> "$REPORT_FILE"
fi

##############################################################################
# SUMMARY
##############################################################################
echo "" >> "$REPORT_FILE"
echo "=== SUMMARY ===" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "✅ Verification complete!" >> "$REPORT_FILE"
echo "📄 Report saved to: $REPORT_FILE" >> "$REPORT_FILE"

echo ""
echo "✅ Verification complete!"
echo "📄 Report: $REPORT_FILE"
echo ""
echo "Next steps:"
echo "1. Review the report for issues"
echo "2. Fix high-priority items (missing useTranslation)"
echo "3. Refactor 'other.*' keys to proper categories"
echo "4. Complete [TODO] translations"
echo ""
