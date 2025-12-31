#!/bin/bash

# CTIS-SIMS Dark Mode Auto-Fix Script
# Bu script tüm frontend sayfalarındaki dark mode sınıflarını kontrol eder ve düzeltir

set -e

echo "🌙 CTIS-SIMS Dark Mode Auto-Fix Script"
echo "======================================"
echo ""

FRONTEND_DIR="frontend/src"
BACKUP_DIR="frontend/dark-mode-backup-$(date +%Y%m%d-%H%M%S)"

# Backup oluştur
echo "📦 Creating backup..."
mkdir -p "$BACKUP_DIR"
cp -r "$FRONTEND_DIR" "$BACKUP_DIR/"
echo "✅ Backup created at: $BACKUP_DIR"
echo ""

# Değişiklik sayacı
TOTAL_CHANGES=0

# Renk eşlemeleri (Light -> Dark)
declare -A COLOR_MAP=(
    # Backgrounds
    ["bg-white"]="bg-white dark:bg-gray-800"
    ["bg-gray-50"]="bg-gray-50 dark:bg-gray-900"
    ["bg-gray-100"]="bg-gray-100 dark:bg-gray-700"
    
    # Text colors
    ["text-gray-900"]="text-gray-900 dark:text-gray-100"
    ["text-gray-800"]="text-gray-800 dark:text-gray-200"
    ["text-gray-700"]="text-gray-700 dark:text-gray-300"
    ["text-gray-600"]="text-gray-600 dark:text-gray-400"
    ["text-gray-500"]="text-gray-500 dark:text-gray-400"
    
    # Borders
    ["border-gray-200"]="border-gray-200 dark:border-gray-700"
    ["border-gray-300"]="border-gray-300 dark:border-gray-600"
    
    # Placeholders
    ["placeholder-gray-400"]="placeholder-gray-400 dark:placeholder-gray-500"
)

# Dosyaları işle
process_file() {
    local file=$1
    local changes=0
    local temp_file="${file}.tmp"
    
    cp "$file" "$temp_file"
    
    # Her renk eşlemesini uygula
    for light in "${!COLOR_MAP[@]}"; do
        dark="${COLOR_MAP[$light]}"
        
        # Eğer zaten dark: varsa atla
        if grep -q "className.*${light}.*dark:" "$temp_file" 2>/dev/null; then
            continue
        fi
        
        # className="..." içindeki renkleri değiştir (dark: yoksa)
        if grep -q "className=\"[^\"]*${light}[^\"]*\"" "$temp_file" 2>/dev/null; then
            # dark: içermeyen className'leri bul ve değiştir
            sed -i '' "s/className=\"\([^\"]*\)${light}\([^\"]*\)\"/className=\"\1${dark}\2\"/g" "$temp_file"
            changes=$((changes + 1))
        fi
        
        # className={clsx(...)} içindeki renkleri değiştir
        if grep -q "className={clsx([^}]*${light}" "$temp_file" 2>/dev/null; then
            sed -i '' "s/'${light}'/'${dark}'/g" "$temp_file"
            changes=$((changes + 1))
        fi
    done
    
    # Özel durumlar için ek düzeltmeler
    
    # hover:bg-gray-50 -> hover:bg-gray-50 dark:hover:bg-gray-700
    if grep -q "hover:bg-gray-50\"" "$temp_file" && ! grep -q "dark:hover:bg-gray-" "$temp_file"; then
        sed -i '' 's/hover:bg-gray-50"/hover:bg-gray-50 dark:hover:bg-gray-700"/g' "$temp_file"
        changes=$((changes + 1))
    fi
    
    # hover:bg-gray-100 -> hover:bg-gray-100 dark:hover:bg-gray-800
    if grep -q "hover:bg-gray-100\"" "$temp_file" && ! grep -q "dark:hover:bg-gray-" "$temp_file"; then
        sed -i '' 's/hover:bg-gray-100"/hover:bg-gray-100 dark:hover:bg-gray-800"/g' "$temp_file"
        changes=$((changes + 1))
    fi
    
    # focus:ring-blue-500 -> dark:focus:ring-blue-400 ekle
    if grep -q "focus:ring-blue-500" "$temp_file" && ! grep -q "dark:focus:ring-blue" "$temp_file"; then
        sed -i '' 's/focus:ring-blue-500/focus:ring-blue-500 dark:focus:ring-blue-400/g' "$temp_file"
        changes=$((changes + 1))
    fi
    
    # Değişiklik olduysa dosyayı güncelle
    if [ $changes -gt 0 ]; then
        mv "$temp_file" "$file"
        echo "  ✏️  Fixed: $(basename $file) ($changes changes)"
        TOTAL_CHANGES=$((TOTAL_CHANGES + changes))
    else
        rm "$temp_file"
    fi
}

# JSX/TSX dosyalarını bul ve işle
echo "🔍 Scanning and fixing files..."
echo ""

# Pages dizini
if [ -d "$FRONTEND_DIR/pages" ]; then
    echo "📄 Processing pages..."
    find "$FRONTEND_DIR/pages" -type f \( -name "*.jsx" -o -name "*.tsx" \) | while read file; do
        process_file "$file"
    done
fi

# Components dizini
if [ -d "$FRONTEND_DIR/components" ]; then
    echo ""
    echo "🧩 Processing components..."
    find "$FRONTEND_DIR/components" -type f \( -name "*.jsx" -o -name "*.tsx" \) | while read file; do
        process_file "$file"
    done
fi

echo ""
echo "======================================"
echo "✅ Dark Mode Auto-Fix Complete!"
echo ""
echo "📊 Statistics:"
echo "   Total changes: $TOTAL_CHANGES"
echo "   Backup location: $BACKUP_DIR"
echo ""
echo "💡 Next steps:"
echo "   1. Review changes with: git diff"
echo "   2. Test in browser"
echo "   3. If something breaks, restore from: $BACKUP_DIR"
echo ""
