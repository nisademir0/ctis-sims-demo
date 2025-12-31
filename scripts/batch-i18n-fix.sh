#!/bin/bash

# CTIS-SIMS Batch i18n Fixer
# Automatically adds useTranslation and converts common Turkish patterns to t() calls

set -e

FRONTEND_DIR="frontend/src"
BACKUP_DIR="i18n-backup-$(date +%Y%m%d-%H%M%S)"

echo "🔧 CTIS-SIMS Batch i18n Fixer"
echo "=============================="
echo ""

# Common Turkish to i18n key mappings
declare -A TRANSLATIONS=(
    # Common actions
    ["Kaydet"]="common.save"
    ["İptal"]="common.cancel"
    ["Sil"]="common.delete"
    ["Düzenle"]="common.edit"
    ["Ekle"]="common.add"
    ["Güncelle"]="common.update"
    ["Ara"]="common.search"
    ["Filtrele"]="common.filter"
    ["Temizle"]="common.clearFilters"
    ["Dışa Aktar"]="common.export"
    ["İçe Aktar"]="common.import"
    ["Onayla"]="common.confirm"
    ["Kapat"]="common.close"
    ["Geri"]="common.back"
    ["Sonraki"]="common.next"
    ["Önceki"]="common.previous"
    ["Gönder"]="common.submit"
    ["Sıfırla"]="common.reset"
    ["Yenile"]="common.refresh"
    ["Görüntüle"]="common.view"
    ["İndir"]="common.download"
    ["Yükle"]="common.upload"
    ["İşlemler"]="common.actions"
    ["Durum"]="common.status"
    ["Tarih"]="common.date"
    ["Toplam"]="common.total"
    ["Tümü"]="common.all"
    ["Aktif"]="common.active"
    ["Notlar"]="common.notes"
    ["Yükleniyor..."]="common.loading"
    
    # Request specific
    ["Talep Oluştur"]="purchase.createRequest"
    ["Talep Detayları"]="purchase.requestDetails"
    ["Satın Alma Taleplerim"]="purchase.myRequests"
    ["Yeni Talep"]="purchase.newRequest"
    ["Talep Durumu"]="purchase.status"
    ["Beklemede"]="purchase.statusPending"
    ["Onaylandı"]="purchase.statusApproved"
    ["Reddedildi"]="purchase.statusRejected"
    ["Kategori"]="common.category"
    ["Miktar"]="common.quantity"
    ["Açıklama"]="common.description"
    ["Öncelik"]="common.priority"
    ["Düşük"]="common.priorityLow"
    ["Normal"]="common.priorityNormal"
    ["Yüksek"]="common.priorityHigh"
    ["Acil"]="common.priorityCritical"
)

# Process a single file
process_file() {
    local file=$1
    local file_name=$(basename "$file")
    
    echo "Processing: $file_name"
    
    # Check if useTranslation already exists
    if ! grep -q "useTranslation" "$file"; then
        echo "  → Adding useTranslation import and hook"
        
        # Add import after first import line
        perl -i -pe '
            if (!$done && /^import/) {
                $_ .= "import { useTranslation } from '\''react-i18next'\'';\n" unless /useTranslation/;
                $done = 1;
            }
        ' "$file"
        
        # Add const { t } after first function declaration
        perl -i -pe '
            if (!$done && /export default function|function \w+\s*\(/) {
                $_ =~ s/(\{[^}]*)/\1\n  const { t } = useTranslation();/;
                $done = 1;
            }
        ' "$file"
    fi
    
    # Apply translations
    for turkish in "${!TRANSLATIONS[@]}"; do
        key="${TRANSLATIONS[$turkish]}"
        
        # Replace in JSX text content: >Turkish Text< → >{t('key')}<
        perl -i -pe "s/>$turkish</>{\$t('$key')}</g" "$file"
        
        # Replace in string literals: "Turkish Text" → {t('key')}
        # But only inside JSX elements, not in comments or strings
        perl -i -pe "s/\"$turkish\"/{\$t('$key')}/g" "$file"
    done
    
    echo "  ✅ Done"
}

# Find and process all files in specified directories
process_directory() {
    local dir=$1
    local pattern=$2
    
    echo ""
    echo "📁 Processing directory: $dir"
    echo ""
    
    find "$FRONTEND_DIR/$dir" -name "$pattern" -type f 2>/dev/null | while read -r file; do
        process_file "$file"
    done
}

# Create backup
echo "📦 Creating backup..."
mkdir -p "$BACKUP_DIR"
cp -r "$FRONTEND_DIR" "$BACKUP_DIR/"
echo "✅ Backup created at: $BACKUP_DIR"
echo ""

# Process specific directories based on user input
if [ "$1" == "purchase" ]; then
    process_directory "pages/requests" "PurchaseRequest*.jsx"
elif [ "$1" == "chatbot" ]; then
    process_directory "pages/chatbot" "*.jsx"
elif [ "$1" == "reports" ]; then
    process_directory "pages/reports" "*.jsx"
elif [ "$1" == "admin" ]; then
    process_directory "pages/admin" "*.jsx"
elif [ "$1" == "all" ]; then
    process_directory "pages/requests" "*.jsx"
    process_directory "pages/chatbot" "*.jsx"
    process_directory "pages/reports" "*.jsx"
    process_directory "pages/admin" "*.jsx"
else
    echo "Usage: $0 {purchase|chatbot|reports|admin|all}"
    echo ""
    echo "Examples:"
    echo "  $0 purchase  - Fix Purchase Request pages"
    echo "  $0 chatbot   - Fix AI Assistant pages"
    echo "  $0 reports   - Fix Reports pages"
    echo "  $0 admin     - Fix Administration pages"
    echo "  $0 all       - Fix all pages"
    exit 1
fi

echo ""
echo "=============================="
echo "✅ Batch i18n Fix Complete!"
echo ""
echo "⚠️  Important: Manual review required!"
echo "   - Check that translations make sense in context"
echo "   - Some complex JSX may need manual adjustment"
echo "   - Verify all translation keys exist in tr.json/en.json"
echo ""
echo "📦 Backup saved at: $BACKUP_DIR"
echo ""
