#!/bin/bash

##############################################################################
# CTIS-SIMS Dark Mode Verification Script
# 
# This script scans the frontend codebase for dark mode issues:
# 1. Missing dark: classes on color properties
# 2. Hardcoded colors (hex, rgb) that should be theme-aware
# 3. Inconsistent dark mode patterns
# 4. Components without theme support
#
# Usage: ./scripts/verify-dark-mode.sh
# Output: dark-mode-verification-report.txt
##############################################################################

echo "🌙 CTIS-SIMS Dark Mode Verification"
echo "======================================"
echo ""

FRONTEND_DIR="frontend/src"
REPORT_FILE="dark-mode-verification-report-$(date +%Y%m%d-%H%M%S).txt"

# Initialize report
echo "CTIS-SIMS Dark Mode Verification Report" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "=====================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

##############################################################################
# CHECK 1: Missing dark: classes on common color properties
##############################################################################
echo "🎨 Checking for missing dark: classes..."
echo "" >> "$REPORT_FILE"
echo "=== MISSING dark: CLASSES ===" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Patterns that likely need dark: variants
COLOR_PATTERNS=(
    "bg-white[^-]"
    "bg-gray-50[^0-9]"
    "bg-gray-100[^0-9]"
    "text-gray-900[^0-9]"
    "text-gray-800[^0-9]"
    "text-gray-700[^0-9]"
    "text-gray-600[^0-9]"
    "border-gray-200[^0-9]"
    "border-gray-300[^0-9]"
)

for pattern in "${COLOR_PATTERNS[@]}"; do
    echo "Checking: $pattern" >&2
    results=$(grep -rn "$pattern" "$FRONTEND_DIR" \
        --include="*.jsx" \
        --include="*.tsx" \
        | grep -v "dark:" \
        | head -10)
    
    if [ ! -z "$results" ]; then
        echo "⚠️  Pattern: $pattern (without dark: variant)" >> "$REPORT_FILE"
        echo "$results" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
done

##############################################################################
# CHECK 2: Hardcoded color values
##############################################################################
echo "🎨 Checking for hardcoded colors..."
echo "" >> "$REPORT_FILE"
echo "=== HARDCODED COLOR VALUES ===" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Find hex colors
echo "Hex colors (#fff, #000, etc):" >> "$REPORT_FILE"
grep -rn "#[0-9a-fA-F]\{3,6\}" "$FRONTEND_DIR" \
    --include="*.jsx" \
    --include="*.tsx" \
    | grep -v "heroicons" \
    | grep -v "node_modules" \
    | head -20 >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Find rgb/rgba colors
echo "RGB colors:" >> "$REPORT_FILE"
grep -rn "rgb" "$FRONTEND_DIR" \
    --include="*.jsx" \
    --include="*.tsx" \
    | grep -v "node_modules" \
    | head -10 >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

##############################################################################
# CHECK 3: Inline styles (should use Tailwind classes)
##############################################################################
echo "💅 Checking for inline styles..."
echo "" >> "$REPORT_FILE"
echo "=== INLINE STYLES ===" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

grep -rn 'style={{' "$FRONTEND_DIR" \
    --include="*.jsx" \
    --include="*.tsx" \
    | head -15 >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

##############################################################################
# CHECK 4: Components missing ThemeContext usage
##############################################################################
echo "🔧 Checking theme context usage..."
echo "" >> "$REPORT_FILE"
echo "=== THEME CONTEXT USAGE ===" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Count components with dark: classes
DARK_AWARE=$(grep -rl "dark:" "$FRONTEND_DIR" --include="*.jsx" --include="*.tsx" | wc -l)
# Count total components
TOTAL_COMPONENTS=$(find "$FRONTEND_DIR" -name "*.jsx" -o -name "*.tsx" | wc -l)

echo "Components with dark: classes: $DARK_AWARE" >> "$REPORT_FILE"
echo "Total components: $TOTAL_COMPONENTS" >> "$REPORT_FILE"
echo "Coverage: $(echo "scale=2; $DARK_AWARE * 100 / $TOTAL_COMPONENTS" | bc)%" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

##############################################################################
# CHECK 5: Inconsistent patterns
##############################################################################
echo "🔍 Checking for inconsistent patterns..."
echo "" >> "$REPORT_FILE"
echo "=== INCONSISTENT PATTERNS ===" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check for mix of bg-white and bg-gray-50 without dark variants
echo "Components mixing light backgrounds without dark variants:" >> "$REPORT_FILE"
for file in $(grep -l "bg-white\|bg-gray-50" "$FRONTEND_DIR" --include="*.jsx" --include="*.tsx"); do
    if ! grep -q "dark:bg" "$file"; then
        echo "  $file" >> "$REPORT_FILE"
    fi
done | head -10
echo "" >> "$REPORT_FILE"

##############################################################################
# CHECK 6: Best practices
##############################################################################
echo "✨ Checking best practices..."
echo "" >> "$REPORT_FILE"
echo "=== BEST PRACTICES ===" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Recommended patterns
echo "✅ Good patterns found:" >> "$REPORT_FILE"
echo "  - bg-white dark:bg-gray-800: $(grep -rc 'bg-white.*dark:bg-gray-800' $FRONTEND_DIR --include='*.jsx' | awk -F: '{sum+=$2} END {print sum}')" >> "$REPORT_FILE"
echo "  - text-gray-900 dark:text-white: $(grep -rc 'text-gray-900.*dark:text' $FRONTEND_DIR --include='*.jsx' | awk -F: '{sum+=$2} END {print sum}')" >> "$REPORT_FILE"
echo "  - border-gray-200 dark:border-gray-700: $(grep -rc 'border-gray-200.*dark:border-gray-700' $FRONTEND_DIR --include='*.jsx' | awk -F: '{sum+=$2} END {print sum}')" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

##############################################################################
# RECOMMENDATIONS
##############################################################################
echo "" >> "$REPORT_FILE"
echo "=== RECOMMENDATIONS ===" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. Replace hardcoded colors with Tailwind classes" >> "$REPORT_FILE"
echo "2. Add dark: variants to all color-related classes" >> "$REPORT_FILE"
echo "3. Use consistent patterns:" >> "$REPORT_FILE"
echo "   - Backgrounds: bg-white dark:bg-gray-800" >> "$REPORT_FILE"
echo "   - Text: text-gray-900 dark:text-gray-100" >> "$REPORT_FILE"
echo "   - Borders: border-gray-200 dark:border-gray-700" >> "$REPORT_FILE"
echo "4. Avoid inline styles, use Tailwind utilities" >> "$REPORT_FILE"
echo "5. Test in both light and dark modes" >> "$REPORT_FILE"

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
echo "1. Review high-priority missing dark: classes"
echo "2. Replace hardcoded colors with Tailwind"
echo "3. Create dark mode utility helpers"
echo "4. Test all components in dark mode"
echo ""
