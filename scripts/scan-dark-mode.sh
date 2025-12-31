#!/bin/bash

# CTIS-SIMS Advanced Dark Mode Scanner & Fixer
# Tüm sayfaları analiz eder ve dark mode eksikliklerini otomatik düzeltir

set -e

echo "🌙 CTIS-SIMS Advanced Dark Mode Scanner"
echo "========================================"
echo ""

FRONTEND_DIR="frontend/src"
REPORT_FILE="dark-mode-report-$(date +%Y%m%d-%H%M%S).txt"

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# İstatistikler
TOTAL_FILES=0
FILES_WITH_ISSUES=0
TOTAL_ISSUES=0
FIXED_ISSUES=0

# Rapor başlığı
{
    echo "CTIS-SIMS Dark Mode Analysis Report"
    echo "Generated: $(date)"
    echo "=========================================="
    echo ""
} > "$REPORT_FILE"

# Analiz fonksiyonu
analyze_file() {
    local file=$1
    local file_issues=0
    local file_name=$(basename "$file")
    local file_path=$(echo "$file" | sed "s|$FRONTEND_DIR/||")
    
    TOTAL_FILES=$((TOTAL_FILES + 1))
    
    # Problem pattern'leri
    local patterns=(
        # Backgrounds without dark mode
        'className="[^"]*\bbg-white\b[^"]*".*[^d][^a][^r][^k]:|className="[^"]*\bbg-white\b[^"]*"[^>]*>'
        'className="[^"]*\bbg-gray-50\b[^"]*".*[^d][^a][^r][^k]:|className="[^"]*\bbg-gray-50\b[^"]*"[^>]*>'
        'className="[^"]*\bbg-gray-100\b[^"]*".*[^d][^a][^r][^k]:|className="[^"]*\bbg-gray-100\b[^"]*"[^>]*>'
        
        # Text without dark mode
        'className="[^"]*\btext-gray-900\b[^"]*".*[^d][^a][^r][^k]:|className="[^"]*\btext-gray-900\b[^"]*"[^>]*>'
        'className="[^"]*\btext-gray-700\b[^"]*".*[^d][^a][^r][^k]:|className="[^"]*\btext-gray-700\b[^"]*"[^>]*>'
        'className="[^"]*\btext-gray-600\b[^"]*".*[^d][^a][^r][^k]:|className="[^"]*\btext-gray-600\b[^"]*"[^>]*>'
        
        # Borders without dark mode
        'className="[^"]*\bborder-gray-200\b[^"]*".*[^d][^a][^r][^k]:|className="[^"]*\bborder-gray-200\b[^"]*"[^>]*>'
        'className="[^"]*\bborder-gray-300\b[^"]*".*[^d][^a][^r][^k]:|className="[^"]*\bborder-gray-300\b[^"]*"[^>]*>'
    )
    
    local issues=""
    
    # Her pattern'i kontrol et
    for pattern in "${patterns[@]}"; do
        if grep -n -E "$pattern" "$file" > /dev/null 2>&1; then
            local matches=$(grep -n -E "$pattern" "$file" 2>/dev/null | head -5)
            issues+="$matches\n"
            file_issues=$((file_issues + 1))
        fi
    done
    
    # Eğer issue varsa raporla
    if [ $file_issues -gt 0 ]; then
        FILES_WITH_ISSUES=$((FILES_WITH_ISSUES + 1))
        TOTAL_ISSUES=$((TOTAL_ISSUES + file_issues))
        
        echo -e "${YELLOW}⚠️  Issues found in: ${file_path}${NC}"
        echo "    Issues: $file_issues"
        
        {
            echo "File: $file_path"
            echo "Issues: $file_issues"
            echo "---"
            echo -e "$issues"
            echo ""
        } >> "$REPORT_FILE"
    else
        echo -e "${GREEN}✅ OK: ${file_path}${NC}"
    fi
}

# Düzeltme fonksiyonu
fix_file() {
    local file=$1
    local backup="${file}.bak"
    
    # Backup oluştur
    cp "$file" "$backup"
    
    # Perl ile akıllı değiştirme (sadece dark: içermeyenleri değiştir)
    perl -i -pe '
        # bg-white -> bg-white dark:bg-gray-800
        s/\bclassName="([^"]*\bbg-white\b[^"]*)"(?![^<>]*dark:)/className="$1 dark:bg-gray-800"/g unless /dark:/;
        
        # bg-gray-50 -> bg-gray-50 dark:bg-gray-900
        s/\bclassName="([^"]*\bbg-gray-50\b[^"]*)"(?![^<>]*dark:)/className="$1 dark:bg-gray-900"/g unless /dark:/;
        
        # bg-gray-100 -> bg-gray-100 dark:bg-gray-700
        s/\bclassName="([^"]*\bbg-gray-100\b[^"]*)"(?![^<>]*dark:)/className="$1 dark:bg-gray-700"/g unless /dark:/;
        
        # text-gray-900 -> text-gray-900 dark:text-gray-100
        s/\bclassName="([^"]*\btext-gray-900\b[^"]*)"(?![^<>]*dark:)/className="$1 dark:text-gray-100"/g unless /dark:/;
        
        # text-gray-800 -> text-gray-800 dark:text-gray-200
        s/\bclassName="([^"]*\btext-gray-800\b[^"]*)"(?![^<>]*dark:)/className="$1 dark:text-gray-200"/g unless /dark:/;
        
        # text-gray-700 -> text-gray-700 dark:text-gray-300
        s/\bclassName="([^"]*\btext-gray-700\b[^"]*)"(?![^<>]*dark:)/className="$1 dark:text-gray-300"/g unless /dark:/;
        
        # text-gray-600 -> text-gray-600 dark:text-gray-400
        s/\bclassName="([^"]*\btext-gray-600\b[^"]*)"(?![^<>]*dark:)/className="$1 dark:text-gray-400"/g unless /dark:/;
        
        # text-gray-500 -> text-gray-500 dark:text-gray-400
        s/\bclassName="([^"]*\btext-gray-500\b[^"]*)"(?![^<>]*dark:)/className="$1 dark:text-gray-400"/g unless /dark:/;
        
        # border-gray-200 -> border-gray-200 dark:border-gray-700
        s/\bclassName="([^"]*\bborder-gray-200\b[^"]*)"(?![^<>]*dark:)/className="$1 dark:border-gray-700"/g unless /dark:/;
        
        # border-gray-300 -> border-gray-300 dark:border-gray-600
        s/\bclassName="([^"]*\bborder-gray-300\b[^"]*)"(?![^<>]*dark:)/className="$1 dark:border-gray-600"/g unless /dark:/;
        
        # hover:bg-gray-50 -> hover:bg-gray-50 dark:hover:bg-gray-700
        s/\bhover:bg-gray-50\b(?![^"]*dark:hover:)/hover:bg-gray-50 dark:hover:bg-gray-700/g unless /dark:hover:/;
        
        # hover:bg-gray-100 -> hover:bg-gray-100 dark:hover:bg-gray-800
        s/\bhover:bg-gray-100\b(?![^"]*dark:hover:)/hover:bg-gray-100 dark:hover:bg-gray-800/g unless /dark:hover:/;
    ' "$file"
    
    # Değişiklik var mı kontrol et
    if ! diff -q "$file" "$backup" > /dev/null 2>&1; then
        FIXED_ISSUES=$((FIXED_ISSUES + 1))
        echo -e "  ${GREEN}✏️  Fixed${NC}"
        rm "$backup"
    else
        # Değişiklik yoksa backup'ı geri yükle
        mv "$backup" "$file"
    fi
}

# Ana işlem
echo "🔍 Phase 1: Scanning files..."
echo ""

# JSX/TSX dosyalarını bul
FILES=$(find "$FRONTEND_DIR" -type f \( -name "*.jsx" -o -name "*.tsx" \) 2>/dev/null)

for file in $FILES; do
    analyze_file "$file"
done

echo ""
echo "========================================"
echo ""
echo "📊 Analysis Summary:"
echo "   Total files scanned: $TOTAL_FILES"
echo "   Files with issues: $FILES_WITH_ISSUES"
echo "   Total issues found: $TOTAL_ISSUES"
echo ""

# Kullanıcıya sor
if [ $FILES_WITH_ISSUES -gt 0 ]; then
    echo "🔧 Would you like to auto-fix these issues? (y/n)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo ""
        echo "🔧 Phase 2: Fixing issues..."
        echo ""
        
        # Backup dizini oluştur
        BACKUP_DIR="dark-mode-backup-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        cp -r "$FRONTEND_DIR" "$BACKUP_DIR/"
        
        echo "📦 Full backup created: $BACKUP_DIR"
        echo ""
        
        # Issue olan dosyaları düzelt
        for file in $FILES; do
            # Önce analiz et
            if grep -q -E 'className="[^"]*\b(bg-white|bg-gray-50|text-gray-900|border-gray-200)\b[^"]*"' "$file" 2>/dev/null; then
                if ! grep -q 'dark:' "$file" 2>/dev/null || [ $(grep -o 'dark:' "$file" | wc -l) -lt 3 ]; then
                    echo "  Processing: $(basename $file)"
                    fix_file "$file"
                fi
            fi
        done
        
        echo ""
        echo "========================================"
        echo "✅ Auto-fix complete!"
        echo ""
        echo "📊 Fix Summary:"
        echo "   Files fixed: $FIXED_ISSUES"
        echo "   Backup: $BACKUP_DIR"
        echo ""
    else
        echo ""
        echo "ℹ️  No changes made. Report saved to: $REPORT_FILE"
        echo ""
    fi
else
    echo -e "${GREEN}✨ All files already have proper dark mode support!${NC}"
    echo ""
fi

echo "📄 Detailed report: $REPORT_FILE"
echo ""
echo "💡 Next steps:"
echo "   1. Review changes: git diff"
echo "   2. Test in browser (toggle dark mode)"
echo "   3. Check report for details"
echo ""
