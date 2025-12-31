#!/bin/bash

# CTIS-SIMS Comprehensive i18n & Dark Mode Analyzer
# Hardcoded text ve dark mode eksikliklerini bulur ve düzeltir

set -e

FRONTEND_DIR="frontend/src"
REPORT_FILE="comprehensive-analysis-$(date +%Y%m%d-%H%M%S).json"
FIX_REPORT="fix-summary-$(date +%Y%m%d-%H%M%S).txt"

echo "🔍 CTIS-SIMS Comprehensive Analysis"
echo "===================================="
echo ""

# JSON rapor başlat
cat > "$REPORT_FILE" << 'EOF'
{
  "analysis_date": "$(date -Iseconds)",
  "files": {}
}
EOF

# Türkçe hardcoded text pattern'leri
TURKISH_PATTERNS=(
    "Hoş Geldiniz"
    "Sistem Yöneticisi"
    "İade"
    "Talep"
    "Onay"
    "Red"
    "Kaydet"
    "İptal"
    "Sil"
    "Düzenle"
    "Yeni"
    "Ara"
    "Filtrele"
    "Temizle"
    "Dışa Aktar"
    "İndir"
    "Yükle"
    "Toplam"
    "Durum"
    "Tarih"
    "Açıklama"
    "Kullanıcı"
    "Rol"
    "Yetki"
    "Ayarlar"
    "Profil"
    "Çıkış"
    "Giriş"
)

# Analiz fonksiyonu
analyze_file() {
    local file=$1
    local file_name=$(basename "$file")
    local issues=0
    
    echo "Analyzing: $file_name"
    
    # Hardcoded Turkish text kontrolü (t() içinde değilse)
    for pattern in "${TURKISH_PATTERNS[@]}"; do
        # className dışındaki Türkçe metinler
        if grep -n ">[^<]*${pattern}" "$file" 2>/dev/null | grep -v "t(" | grep -v "//" > /dev/null; then
            echo "  ⚠️  Hardcoded Turkish text found: $pattern"
            issues=$((issues + 1))
        fi
    done
    
    # Dark mode eksiklikleri
    if grep -q "className=" "$file"; then
        # bg-white without dark mode
        if grep "className=" "$file" | grep -q "bg-white" && ! grep "className=" "$file" | grep "bg-white" | grep -q "dark:bg-"; then
            echo "  ⚠️  bg-white without dark mode"
            issues=$((issues + 1))
        fi
        
        # text-gray-900 without dark mode  
        if grep "className=" "$file" | grep -q "text-gray-900" && ! grep "className=" "$file" | grep "text-gray-900" | grep -q "dark:text-"; then
            echo "  ⚠️  text-gray-900 without dark mode"
            issues=$((issues + 1))
        fi
    fi
    
    # useTranslation hook var mı?
    if ! grep -q "useTranslation" "$file" && grep -q -E "(Hoş Geldiniz|İade|Talep|Kaydet|İptal)" "$file"; then
        echo "  ⚠️  Missing useTranslation import"
        issues=$((issues + 1))
    fi
    
    if [ $issues -gt 0 ]; then
        echo "  Total issues: $issues"
        echo ""
    fi
    
    return $issues
}

# Specific page analyzers
analyze_dashboard() {
    echo "📊 Analyzing Dashboard..."
    local file="$FRONTEND_DIR/pages/Dashboard.jsx"
    
    if [ -f "$file" ]; then
        # Check for "Hoş Geldiniz" pattern
        if grep -q "Hoş Geldiniz" "$file"; then
            echo "  ❌ Found hardcoded 'Hoş Geldiniz'"
        fi
        
        # Check for role names
        if grep -q "Sistem Yöneticisi\|Yönetici\|Personel" "$file"; then
            echo "  ❌ Found hardcoded role names"
        fi
    fi
    echo ""
}

analyze_transactions() {
    echo "💰 Analyzing Transactions & ReturnModal..."
    local trans_file="$FRONTEND_DIR/pages/Transactions.jsx"
    local modal_file="$FRONTEND_DIR/components/ReturnModal.jsx"
    
    if [ -f "$modal_file" ]; then
        if ! grep -q "useTranslation" "$modal_file"; then
            echo "  ❌ ReturnModal missing useTranslation"
        fi
        
        if grep -q "İade\|İade Et\|İade Tarihi" "$modal_file" | grep -v "t("; then
            echo "  ❌ ReturnModal has hardcoded Turkish text"
        fi
    fi
    echo ""
}

analyze_purchase_requests() {
    echo "🛒 Analyzing Purchase Requests..."
    local files=(
        "$FRONTEND_DIR/pages/requests/PurchaseRequestList.jsx"
        "$FRONTEND_DIR/pages/requests/PurchaseRequestForm.jsx"
        "$FRONTEND_DIR/pages/requests/PurchaseRequestDetails.jsx"
    )
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            local name=$(basename "$file")
            
            # Check for hardcoded text
            if grep -E "Talep|Onay|Red|Kategori|Miktar|Açıklama" "$file" | grep -v "t(" | grep -v "//" > /dev/null; then
                echo "  ❌ $name has hardcoded Turkish text"
            fi
            
            # Check for useTranslation
            if ! grep -q "useTranslation" "$file"; then
                echo "  ⚠️  $name missing useTranslation"
            fi
        fi
    done
    echo ""
}

analyze_chatbot() {
    echo "🤖 Analyzing AI Assistant pages..."
    local files=(
        "$FRONTEND_DIR/pages/chatbot/ChatbotPage.jsx"
        "$FRONTEND_DIR/pages/chatbot/ChatHistory.jsx"
        "$FRONTEND_DIR/pages/chatbot/ChatbotAnalytics.jsx"
    )
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            local name=$(basename "$file")
            
            if grep -E "Soru|Cevap|Geçmiş|Sorgu|İstatistik" "$file" | grep -v "t(" > /dev/null 2>&1; then
                echo "  ❌ $name has hardcoded Turkish text"
            fi
        fi
    done
    echo ""
}

analyze_reports() {
    echo "📈 Analyzing Reports pages..."
    local files=(
        "$FRONTEND_DIR/pages/reports/ReportsOverview.jsx"
        "$FRONTEND_DIR/pages/reports/InventoryReport.jsx"
        "$FRONTEND_DIR/pages/reports/TransactionReport.jsx"
        "$FRONTEND_DIR/pages/reports/MaintenanceReport.jsx"
    )
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            local name=$(basename "$file")
            
            if grep -E "Rapor|Özet|Toplam|İstatistik" "$file" | grep -v "t(" > /dev/null 2>&1; then
                echo "  ❌ $name has hardcoded Turkish text"
            fi
        fi
    done
    echo ""
}

analyze_admin() {
    echo "👑 Analyzing Administration pages..."
    local files=(
        "$FRONTEND_DIR/pages/admin/UserManagement.jsx"
        "$FRONTEND_DIR/pages/admin/RoleManagement.jsx"
        "$FRONTEND_DIR/pages/admin/AuditLogs.jsx"
        "$FRONTEND_DIR/pages/admin/BackupRestore.jsx"
        "$FRONTEND_DIR/pages/admin/SystemSettings.jsx"
    )
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            local name=$(basename "$file")
            
            if grep -E "Kullanıcı|Rol|Yetki|Yedek|Ayar|Denetim|Kayıt" "$file" | grep -v "t(" > /dev/null 2>&1; then
                echo "  ❌ $name has hardcoded Turkish text"
            fi
        fi
    done
    echo ""
}

# Run specific analyses
analyze_dashboard
analyze_transactions
analyze_purchase_requests
analyze_chatbot
analyze_reports
analyze_admin

echo "===================================="
echo "✅ Analysis Complete!"
echo ""
echo "📄 Next: Run the fix script to auto-correct issues"
echo ""
