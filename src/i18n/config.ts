import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 语言资源配置
const resources = {
  en: {
    common: () => import('../locales/en/common.json'),
    rebate: () => import('../locales/en/rebate.json'),
    referral: () => import('../locales/en/referral.json'),
    wallet: () => import('../locales/en/wallet.json'),
    rewards: () => import('../locales/en/rewards.json'),
    portfolio: () => import('../locales/en/portfolio.json'),
    market: () => import('../locales/en/market.json'),
  },
  'zh-CN': {
    common: () => import('../locales/zh-CN/common.json'),
    rebate: () => import('../locales/zh-CN/rebate.json'),
    referral: () => import('../locales/zh-CN/referral.json'),
    wallet: () => import('../locales/zh-CN/wallet.json'),
    rewards: () => import('../locales/zh-CN/rewards.json'),
    portfolio: () => import('../locales/zh-CN/portfolio.json'),
    market: () => import('../locales/zh-CN/market.json'),
  },
  ja: {
    common: () => import('../locales/ja/common.json'),
    rebate: () => import('../locales/ja/rebate.json'),
    referral: () => import('../locales/ja/referral.json'),
    wallet: () => import('../locales/ja/wallet.json'),
    rewards: () => import('../locales/ja/rewards.json'),
    portfolio: () => import('../locales/ja/portfolio.json'),
    market: () => import('../locales/ja/market.json'),
  },
  tr: {
    common: () => import('../locales/tr/common.json'),
    rebate: () => import('../locales/tr/rebate.json'),
    referral: () => import('../locales/tr/referral.json'),
    wallet: () => import('../locales/tr/wallet.json'),
    rewards: () => import('../locales/tr/rewards.json'),
    portfolio: () => import('../locales/tr/portfolio.json'),
    market: () => import('../locales/tr/market.json'),
  },
  vi: {
    common: () => import('../locales/vi/common.json'),
    rebate: () => import('../locales/vi/rebate.json'),
    referral: () => import('../locales/vi/referral.json'),
    wallet: () => import('../locales/vi/wallet.json'),
    rewards: () => import('../locales/vi/rewards.json'),
    portfolio: () => import('../locales/vi/portfolio.json'),
    market: () => import('../locales/vi/market.json'),
  },
  es: {
    common: () => import('../locales/es/common.json'),
    rebate: () => import('../locales/es/rebate.json'),
    referral: () => import('../locales/es/referral.json'),
    wallet: () => import('../locales/es/wallet.json'),
    rewards: () => import('../locales/es/rewards.json'),
    portfolio: () => import('../locales/es/portfolio.json'),
    market: () => import('../locales/es/market.json'),
  },
};

// 初始化 i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {},
    fallbackLng: 'en',
    lng: 'en', // 默认语言为英文
    defaultNS: 'common',
    ns: ['common', 'rebate', 'referral', 'wallet', 'rewards', 'portfolio', 'market'],
    
    interpolation: {
      escapeValue: false, // React 已经安全处理
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    react: {
      useSuspense: false,
    },
  });

// 动态加载语言资源
const loadLanguageResources = async (lng: string) => {
  const langResources = resources[lng as keyof typeof resources];
  if (langResources) {
    for (const [namespace, loader] of Object.entries(langResources)) {
      const resource = await loader();
      i18n.addResourceBundle(lng, namespace, resource.default || resource, true, true);
    }
  }
};

// 加载初始语言
const currentLang = i18n.language || 'en';
loadLanguageResources(currentLang);

// 监听语言变化并加载对应资源
i18n.on('languageChanged', (lng) => {
  loadLanguageResources(lng);
});

export default i18n;

