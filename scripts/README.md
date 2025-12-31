# Dark Mode Scripts

Bu dizinde CTIS-SIMS projesinin dark mode kontrolü ve otomatik düzeltme scriptleri bulunmaktadır.

## 📜 Scriptler

### 1. `scan-dark-mode.sh` - Akıllı Tarayıcı ve Düzeltici

**Özellikleri:**
- ✅ Tüm JSX/TSX dosyalarını tarar
- ✅ Dark mode eksikliklerini tespit eder
- ✅ Detaylı rapor oluşturur
- ✅ Otomatik düzeltme seçeneği sunar
- ✅ Full backup yapar
- ✅ Sadece gerekli değişiklikleri yapar

**Kullanım:**
```bash
cd /path/to/CTIS-SIMS
./scripts/scan-dark-mode.sh
```

**Çıktı:**
```
🌙 CTIS-SIMS Advanced Dark Mode Scanner
========================================

🔍 Phase 1: Scanning files...

✅ OK: pages/Dashboard.jsx
⚠️  Issues found in: pages/inventory/ItemForm.jsx
    Issues: 3
✅ OK: components/common/Card.jsx

========================================

📊 Analysis Summary:
   Total files scanned: 45
   Files with issues: 5
   Total issues found: 12

🔧 Would you like to auto-fix these issues? (y/n)
```

### 2. `fix-dark-mode-all.sh` - Basit Düzeltici

**Özellikleri:**
- ✅ Doğrudan düzeltme yapar
- ✅ Backup oluşturur
- ✅ Hızlı işlem

**Kullanım:**
```bash
cd /path/to/CTIS-SIMS
./scripts/fix-dark-mode-all.sh
```

## 🎯 Ne Zaman Hangi Script?

### `scan-dark-mode.sh` kullanın:
- ✅ İlk kez dark mode kontrolü yapacaksanız
- ✅ Hangi dosyalarda sorun olduğunu görmek istiyorsanız
- ✅ Detaylı rapor istiyorsanız
- ✅ Dikkatli ve güvenli düzeltme istiyorsanız

### `fix-dark-mode-all.sh` kullanın:
- ✅ Hızlı düzeltme istiyorsanız
- ✅ Tüm dosyaları toplu güncellemek istiyorsanız
- ✅ Detaylı analiz gerekmiyorsa

## 🔍 Kontrol Edilen Pattern'ler

### Arka Planlar
```jsx
// ❌ Eksik
<div className="bg-white">

// ✅ Düzeltilmiş
<div className="bg-white dark:bg-gray-800">
```

### Yazı Renkleri
```jsx
// ❌ Eksik
<p className="text-gray-900">

// ✅ Düzeltilmiş
<p className="text-gray-900 dark:text-gray-100">
```

### Kenarlıklar
```jsx
// ❌ Eksik
<div className="border border-gray-200">

// ✅ Düzeltilmiş
<div className="border border-gray-200 dark:border-gray-700">
```

### Hover States
```jsx
// ❌ Eksik
<button className="hover:bg-gray-50">

// ✅ Düzeltilmiş
<button className="hover:bg-gray-50 dark:hover:bg-gray-700">
```

## 📋 Renk Eşleştirmeleri

| Light Mode | Dark Mode | Kullanım |
|-----------|-----------|----------|
| `bg-white` | `dark:bg-gray-800` | Card, Modal, Container |
| `bg-gray-50` | `dark:bg-gray-900` | Page Background |
| `bg-gray-100` | `dark:bg-gray-700` | Secondary Background |
| `text-gray-900` | `dark:text-gray-100` | Primary Text |
| `text-gray-700` | `dark:text-gray-300` | Secondary Text |
| `text-gray-600` | `dark:text-gray-400` | Tertiary Text |
| `text-gray-500` | `dark:text-gray-400` | Muted Text |
| `border-gray-200` | `dark:border-gray-700` | Primary Border |
| `border-gray-300` | `dark:border-gray-600` | Secondary Border |

## 🛡️ Güvenlik

Her iki script de:
- ✅ Değişiklik yapmadan önce full backup oluşturur
- ✅ Sadece eksik dark mode sınıflarını ekler
- ✅ Mevcut dark mode sınıflarına dokunmaz
- ✅ Dosya bütünlüğünü korur

**Backup Konumu:**
```
dark-mode-backup-YYYYMMDD-HHMMSS/
```

## 📊 Örnek Rapor Çıktısı

```
CTIS-SIMS Dark Mode Analysis Report
Generated: Sun Dec  8 15:30:45 2025
==========================================

File: pages/inventory/ItemForm.jsx
Issues: 3
---
45:          <div className="bg-white p-6 rounded-lg">
67:          <label className="text-gray-700">Name</label>
89:          <input className="border-gray-300" />

File: pages/admin/UserManagement.jsx
Issues: 2
---
...
```

## 🔄 Geri Alma

Eğer bir şeyler ters giderse:

```bash
# Backup'tan geri yükle
cp -r dark-mode-backup-YYYYMMDD-HHMMSS/src/* frontend/src/

# Veya git ile geri al
git restore frontend/src/
```

## 💡 İpuçları

1. **Her zaman önce tara:**
   ```bash
   ./scripts/scan-dark-mode.sh
   ```

2. **Değişiklikleri gözden geçir:**
   ```bash
   git diff frontend/src/
   ```

3. **Browser'da test et:**
   - Navbar'daki tema toggle butonunu kullan
   - Tüm sayfaları gez
   - Hem light hem dark modda kontrol et

4. **CI/CD'ye ekle:**
   ```yaml
   - name: Check Dark Mode
     run: ./scripts/scan-dark-mode.sh
   ```

## 🐛 Sorun Giderme

### Script çalışmıyor?
```bash
# Executable olduğundan emin ol
chmod +x scripts/*.sh

# Doğru dizinde olduğundan emin ol
cd /path/to/CTIS-SIMS
pwd  # /Users/.../CTIS-SIMS olmalı
```

### Beklenmedik değişiklikler?
```bash
# Backup'ı kontrol et
ls -la dark-mode-backup-*/

# Git diff ile değişiklikleri gör
git diff
```

### Bazı dosyalar düzeltilmedi?
- Script sadece basit pattern'leri yakalar
- Karmaşık className yapıları manuel kontrol gerektirebilir
- clsx() veya classnames() kullanımı farklı ele alınır

## 📚 Kaynaklar

- [THEME_AND_I18N_GUIDE.md](../THEME_AND_I18N_GUIDE.md) - Merkezi tema kılavuzu
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- Frontend: `frontend/src/contexts/ThemeContext.jsx`

## 🤝 Katkıda Bulunma

Yeni pattern veya iyileştirme önerileri için:
1. Script'i test edin
2. Pattern'i `scan-dark-mode.sh`'a ekleyin
3. README'yi güncelleyin

---

**Son Güncelleme:** 2025-12-08  
**Proje:** CTIS-SIMS  
**Maintainer:** Development Team
