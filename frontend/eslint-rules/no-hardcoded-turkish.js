/* eslint-disable local-rules/no-hardcoded-turkish */
/**
 * ESLint Custom Rule: no-hardcoded-turkish
 * 
 * Detects hardcoded Turkish strings in JSX and warns developers to use i18n.
 * 
 * Examples that will trigger warnings:
 * - <div>Kullanıcı Adı</div>
 * - <button>Kaydet</button>
 * - const label = "Açıklama";
 * 
 * Valid alternatives:
 * - <div>{t('user.name')}</div>
 * - <button>{t('common.save')}</button>
 * - const label = t('forms.description');
 */

const turkishCharPattern = /[çÇğĞıİöÖşŞüÜ]/;

// Common Turkish words that should always use i18n
const commonTurkishWords = [
  'kullanıcı', 'kaydet', 'sil', 'ekle', 'düzenle', 'güncelle', 
  'ara', 'filtre', 'tarih', 'açıklama', 'seçin', 'yükleniyor',
  'başarılı', 'başarısız', 'onay', 'iptal', 'evet', 'hayır',
  'zorunlu', 'gerekli', 'hata', 'uyarı', 'bilgi', 'başlangıç',
  'bitiş', 'toplam', 'detay', 'liste', 'rapor', 'ayarlar'
];

const noHardcodedTurkish = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow hardcoded Turkish strings - use i18n instead',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      hardcodedTurkish: 'Hardcoded Turkish text detected: "{{text}}". Use t("category.key") for i18n.',
      commonWord: 'Common Turkish word "{{word}}" found. Use t("{{suggestion}}") instead.',
    },
  },

  create(context) {
    return {
      // Check JSX text nodes
      JSXText(node) {
        const text = node.value.trim();
        if (!text) return;

        if (turkishCharPattern.test(text)) {
          context.report({
            node,
            messageId: 'hardcodedTurkish',
            data: { text: text.substring(0, 50) },
          });
        }
      },

      // Check string literals
      Literal(node) {
        if (typeof node.value !== 'string') return;
        
        const text = node.value.toLowerCase();
        
        // Skip if it's in a t() call
        const parent = node.parent;
        if (parent && parent.type === 'CallExpression' && 
            parent.callee.name === 't') {
          return;
        }

        // Skip validation messages (react-hook-form)
        if (parent && parent.type === 'Property' && 
            parent.key.name === 'required') {
          return;
        }

        // Check for Turkish characters
        if (turkishCharPattern.test(text)) {
          // Check for common words and suggest i18n keys
          const foundWord = commonTurkishWords.find(word => 
            text.includes(word)
          );

          if (foundWord) {
            let suggestion = 'common.' + foundWord;
            if (foundWord === 'kullanıcı') suggestion = 'admin.user or chatbot.user';
            if (foundWord === 'tarih') suggestion = 'forms.date';
            if (foundWord === 'açıklama') suggestion = 'forms.description';

            context.report({
              node,
              messageId: 'commonWord',
              data: { word: foundWord, suggestion },
            });
          } else {
            context.report({
              node,
              messageId: 'hardcodedTurkish',
              data: { text: text.substring(0, 50) },
            });
          }
        }
      },
    };
  },
};

export default noHardcodedTurkish;
