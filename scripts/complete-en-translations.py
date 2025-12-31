#!/usr/bin/env python3
"""
Quick English Translation Completer
Translates [TODO] markers in EN JSON using improved translations
"""

import json
import re

# Comprehensive Turkish to English dictionary
translations = {
    # Common verbs and actions
    "görüntüleme": "viewing",
    "görüntüle": "view",
    "yönetimi": "management",
    "yönetim": "management",
    "yöneticisi": "manager",
    "oluştur": "create",
    "oluşturma": "creation",
    "oluşturulan": "created",
    "güncelle": "update",
    "güncelleme": "updating",
    "güncellendi": "updated",
    "sil": "delete",
    "silme": "deletion",
    "silindi": "deleted",
    "kaydet": "save",
    "kaydedildi": "saved",
    "yükle": "load",
    "yükleniyor": "loading",
    "yüklenemedi": "failed to load",
    "yüklenirken": "while loading",
    "bulunamadı": "not found",
    "zorunludur": "is required",
    "gereklidir": "is required",
    
    # Status and states
    "aktif": "active",
    "tamamlandı": "completed",
    "beklemede": "pending",
    "iptal edildi": "cancelled",
    "onaylandı": "approved",
    "reddedildi": "rejected",
    "başarılı": "successful",
    "başarısız": "failed",
    "başarıyla": "successfully",
    
    # Entities
    "kullanıcı": "user",
    "kullanıcılar": "users",
    "talep": "request",
    "talebi": "request",
    "talepleri": "requests",
    "rapor": "report",
    "raporu": "report",
    "ödünç": "loan",
    "iade": "return",
    "envanter": "inventory",
    "eşya": "item",
    "ürün": "product",
    "bakım": "maintenance",
    "satın alma": "purchase",
    "yedek": "backup",
    "yedekleme": "backup",
    "rol": "role",
    "yetki": "permission",
    "ayar": "setting",
    "ayarlar": "settings",
    
    # Messages
    "hata oluştu": "an error occurred",
    "lütfen tekrar deneyin": "please try again",
    "lütfen bekleyin": "please wait",
    "emin misiniz": "are you sure",
    "başarıyla tamamlandı": "completed successfully",
    "işlem başarısız": "operation failed",
    
    # Descriptions
    "ve": "and",
    "için": "for",
    "ile": "with",
    "olan": "that is",
    "olarak": "as",
    "dahil": "including",
    "hakkında": "about",
    "arasında": "between",
    "toplam": "total",
    "detayları": "details",
    "bilgileri": "information",
    "durumu": "status",
    "tarihi": "date",
    "notları": "notes",
    "açıklaması": "description",
    
    # Permissions and access
    "yetkilerine sahiptir": "has permissions",
    "erişimi": "access",
    "görüntüleme yetkisi": "viewing permission",
    "yönetim yetkisi": "management permission",
    "tam yetkiye sahip": "has full permissions",
    
    # Time expressions
    "gecikmiş": "overdue",
    "süresi geçmiş": "overdue",
    "bugün": "today",
    "geçmiş": "history",
    "son": "last",
    "yeni": "new",
}

def smart_translate(text):
    """Intelligently translate Turkish text to English"""
    # Remove [TODO] prefix
    text = text.replace('[TODO] ', '')
    text_lower = text.lower()
    
    # Try direct translation for common patterns
    result = text
    
    # Replace known words
    for tr_word, en_word in translations.items():
        pattern = r'\b' + re.escape(tr_word) + r'\b'
        result = re.sub(pattern, en_word, result, flags=re.IGNORECASE)
    
    # Specific pattern fixes
    result = result.replace('olurken bir', 'occurred while')
    result = result.replace('eden', 'creator')
    result = result.replace('edilen', 'processed')
    result = result.replace('edildi', 'processed')
    result = result.replace('işlemi', 'operation')
    result = result.replace('ile ilgili', 'related to')
    result = result.replace('göre', 'according to')
    result = result.replace('kadar', 'until')
    
    # Title case for titles
    if text[0].isupper() and len(text.split()) <= 4:
        result = result.title()
    
    return result

def main():
    en_json_path = "frontend/src/i18n/locales/en.json"
    
    print("🔧 English Translation Completer")
    print("=" * 50)
    print()
    
    # Load EN JSON
    with open(en_json_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Count TODOs
    todo_count = content.count('[TODO]')
    print(f"📊 Found {todo_count} [TODO] markers")
    print()
    
    # Find and replace TODOs
    replacements = 0
    lines = content.split('\n')
    new_lines = []
    
    for line in lines:
        if '[TODO]' in line:
            # Extract the Turkish text
            match = re.search(r'"([^"]+)":\s*"\[TODO\]\s*([^"]+)"', line)
            if match:
                key = match.group(1)
                tr_text = match.group(2)
                en_text = smart_translate(tr_text)
                
                # Replace the line
                new_line = line.replace(f'[TODO] {tr_text}', en_text)
                new_lines.append(new_line)
                replacements += 1
                
                if replacements <= 10:  # Show first 10
                    print(f"  ✏️  {key}")
                    print(f"     TR: {tr_text}")
                    print(f"     EN: {en_text}")
                    print()
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)
    
    # Save updated file
    with open(en_json_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))
    
    print("=" * 50)
    print(f"✅ Completed {replacements} translations")
    print()
    print(f"📄 Updated: {en_json_path}")
    print()
    print("⚠️  Note: Auto-translated. Please review for accuracy!")
    print()

if __name__ == "__main__":
    main()
