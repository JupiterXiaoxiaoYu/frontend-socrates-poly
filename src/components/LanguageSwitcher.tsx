import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";

// 语言列表配置
const languages = [
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '简体中文' },
  { code: 'ja', name: '日本語' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'es', name: 'Español' },
];

interface LanguageSwitcherProps {
  variant?: 'mobile' | 'desktop';
}

const LanguageSwitcher = ({ variant = 'mobile' }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  if (variant === 'mobile') {
    return (
      <>
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground cursor-pointer hover:bg-muted/50 transition-colors w-full text-left"
        >
          <Globe className="w-5 h-5" />
          <span className="flex-1">Language</span>
          <span className="text-xs text-muted-foreground">{currentLanguage.name}</span>
        </button>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogPortal>
            <DialogOverlay className="z-[65]" />
            <DialogContent className="sm:max-w-md z-[70]">
              <DialogHeader>
                <DialogTitle>Select Language</DialogTitle>
              </DialogHeader>
              <div className="grid gap-1 py-4">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className={`flex items-center justify-between px-4 py-3 rounded-md text-left transition-colors ${
                      i18n.language === language.code
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <span>{language.name}</span>
                    {i18n.language === language.code && (
                      <Check className="w-5 h-5" />
                    )}
                  </button>
                ))}
              </div>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      </>
    );
  }

  // Desktop variant - 固定白色文字，因为 Header 背景是黑色
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10 rounded-md transition-colors">
          <Globe className="w-4 h-4" />
          <span>{currentLanguage.name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{language.name}</span>
            {i18n.language === language.code && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;

