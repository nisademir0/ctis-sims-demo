#!/bin/bash

# CTIS-SIMS Translation Generator
# Generates translation keys and updates JSON files from filtered strings

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <filtered-strings-file>"
    echo ""
    echo "Example: $0 extracted-strings-20251208-123456.txt"
    exit 1
fi

INPUT_FILE="$1"
TR_JSON="frontend/src/i18n/locales/tr.json"
EN_JSON="frontend/src/i18n/locales/en.json"
MAPPING_FILE="string-to-key-mapping-$(date +%Y%m%d-%H%M%S).json"
BACKUP_DIR="translation-backup-$(date +%Y%m%d-%H%M%S)"

echo "🔧 CTIS-SIMS Translation Generator"
echo "==================================="
echo ""

if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ Error: File not found: $INPUT_FILE"
    exit 1
fi

# Create backup
echo "📦 Creating backup..."
mkdir -p "$BACKUP_DIR"
cp "$TR_JSON" "$BACKUP_DIR/"
cp "$EN_JSON" "$BACKUP_DIR/"
echo "✅ Backup created: $BACKUP_DIR"
echo ""

# Intelligent key generation function
generate_key() {
    local text="$1"
    local key=""
    
    # Common Turkish to category mapping
    case "$text" in
        # Common actions
        "Kaydet"|"Kaydet ve Devam") echo "common.save" ;;
        "İptal"|"İptal Et") echo "common.cancel" ;;
        "Sil"|"Silin") echo "common.delete" ;;
        "Düzenle") echo "common.edit" ;;
        "Ekle") echo "common.add" ;;
        "Güncelle") echo "common.update" ;;
        "Ara"|"Arama") echo "common.search" ;;
        "Filtrele") echo "common.filter" ;;
        "Temizle") echo "common.clear" ;;
        "Dışa Aktar"|"Export") echo "common.export" ;;
        "İçe Aktar"|"Import") echo "common.import" ;;
        "Onayla"|"Onay") echo "common.confirm" ;;
        "Kapat") echo "common.close" ;;
        "Geri") echo "common.back" ;;
        "Sonraki") echo "common.next" ;;
        "Önceki") echo "common.previous" ;;
        "Gönder") echo "common.submit" ;;
        "Sıfırla"|"Resetle") echo "common.reset" ;;
        "Yenile") echo "common.refresh" ;;
        "Görüntüle") echo "common.view" ;;
        "Detayları Görüntüle") echo "common.viewDetails" ;;
        "İndir"|"Download") echo "common.download" ;;
        "Yükle"|"Upload") echo "common.upload" ;;
        "İşlemler"|"Eylemler") echo "common.actions" ;;
        "Durum"|"Status") echo "common.status" ;;
        "Tarih"|"Date") echo "common.date" ;;
        "Toplam"|"Total") echo "common.total" ;;
        "Tümü"|"All") echo "common.all" ;;
        "Aktif"|"Active") echo "common.active" ;;
        "Notlar"|"Notes") echo "common.notes" ;;
        "Açıklama"|"Description") echo "common.description" ;;
        "Kategori"|"Category") echo "common.category" ;;
        "Miktar"|"Quantity"|"Adet") echo "common.quantity" ;;
        "Öncelik"|"Priority") echo "common.priority" ;;
        "Yükleniyor..."|"Loading...") echo "common.loading" ;;
        "Evet"|"Yes") echo "common.yes" ;;
        "Hayır"|"No") echo "common.no" ;;
        
        # Priorities
        "Düşük") echo "common.priorityLow" ;;
        "Normal") echo "common.priorityNormal" ;;
        "Yüksek") echo "common.priorityHigh" ;;
        "Acil"|"Kritik") echo "common.priorityCritical" ;;
        
        # Inventory
        *"Envanter"*|*"Inventory"*) echo "inventory.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        *"Stok"*) echo "inventory.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        
        # Transactions
        *"İade"*|*"Return"*) echo "transactions.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        *"Checkout"*|*"Ödünç"*) echo "transactions.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        *"Gecik"*|*"Overdue"*) echo "transactions.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        
        # Purchase Requests
        *"Talep"*|*"Request"*) echo "purchase.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        *"Satın Alma"*|*"Purchase"*) echo "purchase.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        *"Onay"*|*"Approve"*) echo "purchase.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        *"Red"*|*"Reject"*) echo "purchase.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        
        # Chatbot
        *"Soru"*|*"Question"*|*"Sorgu"*|*"Query"*) echo "chatbot.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        *"Cevap"*|*"Answer"*|*"Yanıt"*) echo "chatbot.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        *"Chat"*|*"Sohbet"*) echo "chatbot.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        
        # Reports
        *"Rapor"*|*"Report"*) echo "reports.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        *"İstatistik"*|*"Statistics"*) echo "reports.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        
        # Admin
        *"Kullanıcı"*|*"User"*) echo "admin.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        *"Rol"*|*"Role"*|*"Yetki"*) echo "admin.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        *"Yedek"*|*"Backup"*) echo "admin.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        *"Ayar"*|*"Settings"*) echo "admin.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        *"Log"*|*"Denetim"*|*"Audit"*) echo "admin.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        
        # Dashboard
        *"Hoş Geldiniz"*|*"Welcome"*) echo "dashboard.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        *"Dashboard"*|*"Panel"*) echo "dashboard.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        
        # Messages
        *"başarılı"*|*"success"*) echo "messages.success.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        *"başarısız"*|*"hata"*|*"error"*) echo "messages.error.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        *"uyarı"*|*"warning"*) echo "messages.warning.${text,,}" | sed 's/ /_/g' | sed 's/[^a-z._]//g' ;;
        
        # Default: generate from text
        *) 
            # Convert to snake_case key
            echo "$text" | \
                tr '[:upper:]' '[:lower:]' | \
                sed 's/ğ/g/g; s/ü/u/g; s/ş/s/g; s/ı/i/g; s/ö/o/g; s/ç/c/g' | \
                sed 's/[^a-z0-9]/_/g' | \
                sed 's/__*/_/g' | \
                sed 's/^_//; s/_$//' | \
                awk '{print "other." $0}'
            ;;
    esac
}

# Auto-translate to English (basic translations)
auto_translate() {
    local text="$1"
    
    case "$text" in
        "Kaydet") echo "Save" ;;
        "İptal") echo "Cancel" ;;
        "Sil") echo "Delete" ;;
        "Düzenle") echo "Edit" ;;
        "Ekle") echo "Add" ;;
        "Güncelle") echo "Update" ;;
        "Ara") echo "Search" ;;
        "Filtrele") echo "Filter" ;;
        "Temizle") echo "Clear" ;;
        "Dışa Aktar") echo "Export" ;;
        "İçe Aktar") echo "Import" ;;
        "Onayla") echo "Confirm" ;;
        "Kapat") echo "Close" ;;
        "Geri") echo "Back" ;;
        "Sonraki") echo "Next" ;;
        "Önceki") echo "Previous" ;;
        "Gönder") echo "Submit" ;;
        "Sıfırla") echo "Reset" ;;
        "Yenile") echo "Refresh" ;;
        "Görüntüle") echo "View" ;;
        "Detayları Görüntüle") echo "View Details" ;;
        "İndir") echo "Download" ;;
        "Yükle") echo "Upload" ;;
        "İşlemler") echo "Actions" ;;
        "Durum") echo "Status" ;;
        "Tarih") echo "Date" ;;
        "Toplam") echo "Total" ;;
        "Tümü") echo "All" ;;
        "Aktif") echo "Active" ;;
        "Notlar") echo "Notes" ;;
        "Açıklama") echo "Description" ;;
        "Kategori") echo "Category" ;;
        "Miktar") echo "Quantity" ;;
        "Öncelik") echo "Priority" ;;
        "Yükleniyor...") echo "Loading..." ;;
        "Evet") echo "Yes" ;;
        "Hayır") echo "No" ;;
        "Düşük") echo "Low" ;;
        "Normal") echo "Normal" ;;
        "Yüksek") echo "High" ;;
        "Acil") echo "Critical" ;;
        *) echo "[NEEDS_TRANSLATION] $text" ;;
    esac
}

echo "🔍 Analyzing strings and generating keys..."
echo ""

# Build mapping JSON
echo "{" > "$MAPPING_FILE"
echo '  "mappings": {' >> "$MAPPING_FILE"

FIRST=true
declare -A KEY_MAP

while IFS= read -r line; do
    # Skip empty lines
    [ -z "$line" ] && continue
    
    # Generate key
    key=$(generate_key "$line")
    
    # Check for duplicates and group them
    if [ -n "${KEY_MAP[$key]}" ]; then
        # Key already exists, skip
        continue
    fi
    
    KEY_MAP[$key]="$line"
    
    # Add to mapping file
    if [ "$FIRST" = true ]; then
        FIRST=false
    else
        echo "," >> "$MAPPING_FILE"
    fi
    
    # Escape quotes in text
    escaped_line=$(echo "$line" | sed 's/"/\\"/g')
    
    echo -n "    \"$escaped_line\": \"$key\"" >> "$MAPPING_FILE"
    
done < "$INPUT_FILE"

echo "" >> "$MAPPING_FILE"
echo "  }," >> "$MAPPING_FILE"
echo '  "translations": {' >> "$MAPPING_FILE"
echo '    "tr": {},' >> "$MAPPING_FILE"
echo '    "en": {}' >> "$MAPPING_FILE"
echo "  }" >> "$MAPPING_FILE"
echo "}" >> "$MAPPING_FILE"

# Count unique keys
UNIQUE_KEYS=$(echo "${!KEY_MAP[@]}" | tr ' ' '\n' | sort -u | wc -l | tr -d ' ')

echo "=============================="
echo "✅ Mapping Generation Complete!"
echo ""
echo "📊 Statistics:"
echo "   Input strings: $(wc -l < "$INPUT_FILE" | tr -d ' ')"
echo "   Unique keys generated: $UNIQUE_KEYS"
echo ""
echo "📄 Files created:"
echo "   - Mapping: $MAPPING_FILE"
echo "   - Backup: $BACKUP_DIR/"
echo ""
echo "📝 Key Distribution:"
echo "   common.*: $(echo "${!KEY_MAP[@]}" | tr ' ' '\n' | grep -c '^common\.' || echo 0)"
echo "   purchase.*: $(echo "${!KEY_MAP[@]}" | tr ' ' '\n' | grep -c '^purchase\.' || echo 0)"
echo "   transactions.*: $(echo "${!KEY_MAP[@]}" | tr ' ' '\n' | grep -c '^transactions\.' || echo 0)"
echo "   chatbot.*: $(echo "${!KEY_MAP[@]}" | tr ' ' '\n' | grep -c '^chatbot\.' || echo 0)"
echo "   reports.*: $(echo "${!KEY_MAP[@]}" | tr ' ' '\n' | grep -c '^reports\.' || echo 0)"
echo "   admin.*: $(echo "${!KEY_MAP[@]}" | tr ' ' '\n' | grep -c '^admin\.' || echo 0)"
echo "   other.*: $(echo "${!KEY_MAP[@]}" | tr ' ' '\n' | grep -c '^other\.' || echo 0)"
echo ""
echo "📝 Generated Keys Preview:"
echo "─────────────────────────────────"
for key in $(echo "${!KEY_MAP[@]}" | tr ' ' '\n' | sort | head -15); do
    echo "  $key → \"${KEY_MAP[$key]}\""
done
echo "─────────────────────────────────"
echo ""
echo "🎯 Next Step:"
echo "   Run: ./scripts/apply-translations.sh $MAPPING_FILE"
echo ""
