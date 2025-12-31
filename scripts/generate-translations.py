#!/usr/bin/env python3
"""
CTIS-SIMS Translation Key Generator
Generates smart translation keys from Turkish strings
"""

import sys
import json
import re
from collections import defaultdict
from datetime import datetime

def generate_key(text):
    """Generate intelligent translation key based on text content"""
    
    # Common actions - check first for exact matches
    common_actions = {
        "Kaydet": "common.save",
        "Kaydet ve Devam": "common.saveAndContinue",
        "İptal": "common.cancel",
        "İptal Et": "common.cancel",
        "Sil": "common.delete",
        "Düzenle": "common.edit",
        "Ekle": "common.add",
        "Güncelle": "common.update",
        "Ara": "common.search",
        "Arama": "common.search",
        "Filtrele": "common.filter",
        "Temizle": "common.clear",
        "Dışa Aktar": "common.export",
        "İçe Aktar": "common.import",
        "Onayla": "common.confirm",
        "Onay": "common.confirm",
        "Kapat": "common.close",
        "Geri": "common.back",
        "Sonraki": "common.next",
        "Önceki": "common.previous",
        "Gönder": "common.submit",
        "Sıfırla": "common.reset",
        "Yenile": "common.refresh",
        "Görüntüle": "common.view",
        "Detayları Görüntüle": "common.viewDetails",
        "İndir": "common.download",
        "Yükle": "common.upload",
        "İşlemler": "common.actions",
        "Durum": "common.status",
        "Tarih": "common.date",
        "Toplam": "common.total",
        "Tümü": "common.all",
        "Aktif": "common.active",
        "Notlar": "common.notes",
        "Açıklama": "common.description",
        "Kategori": "common.category",
        "Miktar": "common.quantity",
        "Adet": "common.quantity",
        "Öncelik": "common.priority",
        "Yükleniyor...": "common.loading",
        "Evet": "common.yes",
        "Hayır": "common.no",
        "Düşük": "common.priorityLow",
        "Normal": "common.priorityNormal",
        "Yüksek": "common.priorityHigh",
        "Acil": "common.priorityCritical",
        "Kritik": "common.priorityCritical",
        "Başarılı": "common.success",
        "Başarısız": "common.failed",
        "Hata": "common.error",
        "Uyarı": "common.warning",
        "Bilgi": "common.info",
    }
    
    if text in common_actions:
        return common_actions[text]
    
    # Category-based detection
    text_lower = text.lower()
    
    # Inventory keywords
    if any(kw in text_lower for kw in ['envanter', 'stok', 'inventory']):
        key = text_lower.replace('envanter', '').replace('stok', '').strip()
        key = re.sub(r'[^a-z0-9]+', '_', key).strip('_')
        return f"inventory.{key}" if key else "inventory.title"
    
    # Transaction keywords
    if any(kw in text_lower for kw in ['iade', 'ödünç', 'checkout', 'gecik', 'overdue', 'teslim']):
        key = re.sub(r'[^a-z0-9]+', '_', text_lower).strip('_')
        return f"transactions.{key}"
    
    # Purchase Request keywords
    if any(kw in text_lower for kw in ['talep', 'satın alma', 'request', 'purchase', 'onay', 'red']):
        key = re.sub(r'[^a-z0-9]+', '_', text_lower).strip('_')
        return f"purchase.{key}"
    
    # Chatbot keywords
    if any(kw in text_lower for kw in ['soru', 'cevap', 'sorgu', 'query', 'chat', 'bot', 'ai']):
        key = re.sub(r'[^a-z0-9]+', '_', text_lower).strip('_')
        return f"chatbot.{key}"
    
    # Report keywords
    if any(kw in text_lower for kw in ['rapor', 'report', 'istatistik', 'statistics']):
        key = re.sub(r'[^a-z0-9]+', '_', text_lower).strip('_')
        return f"reports.{key}"
    
    # Admin keywords
    if any(kw in text_lower for kw in ['kullanıcı', 'user', 'rol', 'role', 'yetki', 'yedek', 'backup', 'ayar', 'settings', 'log', 'denetim', 'audit']):
        key = re.sub(r'[^a-z0-9]+', '_', text_lower).strip('_')
        return f"admin.{key}"
    
    # Maintenance keywords
    if any(kw in text_lower for kw in ['bakım', 'maintenance', 'onarım', 'repair']):
        key = re.sub(r'[^a-z0-9]+', '_', text_lower).strip('_')
        return f"maintenance.{key}"
    
    # Message keywords
    if any(kw in text_lower for kw in ['başarı', 'success', 'hata', 'error', 'uyarı', 'warning']):
        key = re.sub(r'[^a-z0-9]+', '_', text_lower).strip('_')
        return f"messages.{key}"
    
    # Default: generate generic key
    # Transliterate Turkish characters
    trans = str.maketrans('ğüşıöçĞÜŞİÖÇ', 'gusiocGUSIOC')
    key = text.translate(trans).lower()
    key = re.sub(r'[^a-z0-9]+', '_', key).strip('_')
    
    return f"other.{key}" if key else "other.unknown"

def auto_translate(text):
    """Basic Turkish to English translation"""
    translations = {
        "Kaydet": "Save",
        "Kaydet ve Devam": "Save and Continue",
        "İptal": "Cancel",
        "İptal Et": "Cancel",
        "Sil": "Delete",
        "Düzenle": "Edit",
        "Ekle": "Add",
        "Güncelle": "Update",
        "Ara": "Search",
        "Arama": "Search",
        "Filtrele": "Filter",
        "Temizle": "Clear",
        "Dışa Aktar": "Export",
        "İçe Aktar": "Import",
        "Onayla": "Confirm",
        "Onay": "Approve",
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
        "Başarılı": "Successful",
        "Başarısız": "Failed",
        "Hata": "Error",
        "Uyarı": "Warning",
        "Bilgi": "Information",
        "Kullanıcı": "User",
        "Talep": "Request",
        "İade": "Return",
        "Red": "Reject",
        "Reddedildi": "Rejected",
        "Onaylandı": "Approved",
        "Beklemede": "Pending",
    }
    
    return translations.get(text, f"[TODO] {text}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 generate-translations.py <filtered-strings-file>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    mapping_file = f"string-to-key-mapping-{timestamp}.json"
    
    print("🔧 CTIS-SIMS Translation Generator (Python)")
    print("=" * 50)
    print()
    
    # Read strings
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            strings = [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print(f"❌ Error: File not found: {input_file}")
        sys.exit(1)
    
    print(f"📖 Loaded {len(strings)} strings from {input_file}")
    print()
    
    # Generate mappings
    print("🔍 Generating translation keys...")
    mappings = {}
    key_groups = defaultdict(list)
    
    for text in strings:
        key = generate_key(text)
        mappings[text] = key
        category = key.split('.')[0]
        key_groups[category].append(text)
    
    # Save mapping file
    output_data = {
        "generated": timestamp,
        "total_strings": len(strings),
        "mappings": mappings,
        "translations": {
            "tr": {text: text for text in strings},
            "en": {text: auto_translate(text) for text in strings}
        }
    }
    
    with open(mapping_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print("=" * 50)
    print("✅ Mapping Generation Complete!")
    print()
    print("📊 Key Distribution:")
    for category in sorted(key_groups.keys()):
        count = len(key_groups[category])
        print(f"   {category}.*: {count} strings")
    
    print()
    print("📄 Output file:", mapping_file)
    print()
    print("📝 Sample mappings:")
    print("-" * 50)
    for i, (text, key) in enumerate(list(mappings.items())[:15]):
        en_text = auto_translate(text)
        print(f"  {key}")
        print(f"    TR: {text}")
        print(f"    EN: {en_text}")
        if i < 14:
            print()
    print("-" * 50)
    print()
    print("🎯 Next Step:")
    print(f"   python3 scripts/apply-translations.py {mapping_file}")
    print()

if __name__ == "__main__":
    main()
