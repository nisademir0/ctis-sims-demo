# ESLint i18n Rules Documentation

## Overview

Custom ESLint rules have been added to prevent hardcoded Turkish strings and enforce i18n best practices.

## Rules

### `local-rules/no-hardcoded-turkish` (warn)

**Purpose:** Detects hardcoded Turkish text in JSX and JavaScript, encouraging use of i18n translation keys.

**Triggered by:**
- JSX text with Turkish characters: `<div>Kullanıcı</div>`
- String literals with Turkish characters: `const label = "Kaydet"`
- Common Turkish words without i18n

**Exceptions (won't trigger):**
- Text inside `t()` calls: `{t('user.name')}`
- Validation messages (react-hook-form): `required: 'Gerekli alan'`
- Comments and imports
- Translation JSON files

**Examples:**

```jsx
// ❌ Bad - Will trigger warning
<button>Kaydet</button>
<div>Kullanıcı Adı</div>
const text = "Açıklama ekleyin";

// ✅ Good - No warning
<button>{t('common.save')}</button>
<div>{t('user.name')}</div>
const text = t('forms.addDescription');

// ✅ Also OK - Validation messages
<input {...register('email', { 
  required: 'E-posta gereklidir' 
})} />
```

## Common Turkish Words Detected

The rule recognizes these common words and suggests i18n keys:

- **kullanıcı** → `admin.user` or `chatbot.user`
- **kaydet** → `common.save`
- **sil** → `common.delete`
- **ekle** → `common.add`
- **düzenle** → `common.edit`
- **güncelle** → `common.update`
- **ara** → `common.search`
- **filtre** → `common.filter`
- **tarih** → `forms.date`
- **açıklama** → `forms.description`
- **seçin** → Use `t('inventory.selectUser')` or `t('inventory.selectItem')`
- **yükleniyor** → `common.loading`
- **başarılı** → `messages.success`
- **başarısız** → `messages.error`

## Setup

### Installation

The rule is already configured in `eslint.config.js`. No additional packages needed.

### File Structure

```
frontend/
├── eslint.config.js              # Main ESLint config
├── eslint-rules/
│   └── no-hardcoded-turkish.js   # Custom rule implementation
└── src/
    └── i18n/locales/
        ├── tr.json               # Turkish translations
        └── en.json               # English translations
```

### Running ESLint

```bash
# Check all files
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Check specific file
npx eslint src/pages/SomePage.jsx
```

## Workflow

1. **Write code with i18n from the start:**
   ```jsx
   const { t } = useTranslation();
   return <div>{t('category.key')}</div>;
   ```

2. **If you see ESLint warning:**
   - Add translation key to `tr.json` and `en.json`
   - Replace hardcoded text with `t('category.key')`
   - Verify with `npm run lint`

3. **Before committing:**
   ```bash
   npm run lint
   bash scripts/verify-i18n.sh
   ```

## Best Practices

### 1. Use Semantic Key Names

```jsx
// ❌ Bad
t('text1')
t('label2')

// ✅ Good
t('auth.loginButton')
t('forms.emailLabel')
```

### 2. Group by Feature/Category

```json
{
  "auth": { "login": "Giriş Yap", "logout": "Çıkış Yap" },
  "admin": { "users": "Kullanıcılar", "roles": "Roller" },
  "common": { "save": "Kaydet", "cancel": "İptal" }
}
```

### 3. Reuse Common Keys

Before creating new keys, check if these exist:
- `common.save`, `common.cancel`, `common.delete`
- `common.loading`, `common.refresh`
- `messages.success`, `messages.error`
- `forms.required`, `forms.optional`

### 4. Handle Validation Messages

Form validation can stay in Turkish with react-hook-form:

```jsx
// This is OK - won't trigger warning due to exception
<input {...register('email', {
  required: 'E-posta gereklidir',
  pattern: {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: 'Geçersiz e-posta formatı'
  }
})} />
```

## Disabling Rules (Use Sparingly)

If you absolutely need to disable the rule for a specific line:

```jsx
// eslint-disable-next-line local-rules/no-hardcoded-turkish
const temporaryText = "Geçici metin";
```

Or for an entire file (not recommended):

```jsx
/* eslint-disable local-rules/no-hardcoded-turkish */
```

## Verification

After fixing warnings, verify with:

```bash
# ESLint check
npm run lint

# i18n verification
bash scripts/verify-i18n.sh

# Check specific patterns
grep -r "Kullanıcı\|Kaydet\|Sil" src/ --include="*.jsx" --exclude-dir=backup
```

## Integration with CI/CD

Add to your CI pipeline:

```yaml
# .github/workflows/ci.yml
- name: Run ESLint
  run: |
    cd frontend
    npm run lint
    
- name: Verify i18n
  run: bash scripts/verify-i18n.sh
```

## Troubleshooting

### Rule not working?

1. Check ESLint is running: `npx eslint --version`
2. Verify config: `cat frontend/eslint.config.js`
3. Clear cache: `rm -rf frontend/.eslintcache`
4. Restart VS Code

### False positives?

Update the rule in `eslint-rules/no-hardcoded-turkish.js` to add more exceptions.

### Need to add more Turkish words?

Edit `commonTurkishWords` array in `eslint-rules/no-hardcoded-turkish.js`.

## Summary

✅ **Automatic detection** of hardcoded Turkish strings  
✅ **Helpful suggestions** for i18n key names  
✅ **Exceptions** for validation messages and special cases  
✅ **Consistent enforcement** across the codebase  
✅ **Easy to extend** with more patterns

This ensures the codebase stays internationalized and maintainable! 🌍
