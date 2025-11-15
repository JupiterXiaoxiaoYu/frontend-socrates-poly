import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCopy: (text: string, label: string) => void;
}

// 分享弹窗组件（移动端底部弹出）
const ShareDialog = ({ open, onOpenChange, onCopy }: ShareDialogProps) => {
  const { t } = useTranslation('referral');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-full p-0 gap-0 bottom-0 top-auto left-0 translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none border-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom">
        {/* 顶部拖动条 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-border rounded-full"></div>
        </div>

        {/* 标题 */}
        <div className="text-center py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">{t('share')}</h2>
        </div>

        <div className="p-4 pb-8">
          {/* Referral Link */}
          <div className="bg-card border border-border rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('referralLink')}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Soc……92VA</span>
                <button
                  onClick={() => onCopy("https://socrates.com/ref/92VA", t('referralLink'))}
                  className="text-foreground hover:text-muted-foreground transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Referral Code */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('referralCode')}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">AKV392VA</span>
                <button
                  onClick={() => onCopy("AKV392VA", t('referralCode'))}
                  className="text-foreground hover:text-muted-foreground transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 社交媒体分享选项 */}
          <div className="flex items-center justify-between mb-6 px-2">
            {/* Copy link */}
            <button
              onClick={() => {
                onCopy("https://socrates.com/ref/92VA", "Referral link");
                onOpenChange(false);
              }}
              className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <Copy className="w-6 h-6 text-foreground" />
              </div>
              <span className="text-xs text-foreground">{t('copyLink')}</span>
            </button>

            {/* X (Twitter) */}
            <button
              onClick={() => {
                window.open(
                  `https://twitter.com/intent/tweet?url=${encodeURIComponent("https://socrates.com/ref/92VA")}&text=${encodeURIComponent("Join me on Socrates!")}`,
                  "_blank"
                );
                onOpenChange(false);
              }}
              className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <span className="text-xs text-foreground">X</span>
            </button>

            {/* Telegram */}
            <button
              onClick={() => {
                window.open(
                  `https://t.me/share/url?url=${encodeURIComponent("https://socrates.com/ref/92VA")}&text=${encodeURIComponent("Join me on Socrates!")}`,
                  "_blank"
                );
                onOpenChange(false);
              }}
              className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-14 h-14 rounded-full bg-[#0088cc] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
              </div>
              <span className="text-xs text-foreground">Telegram</span>
            </button>

            {/* Messages */}
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: "Join Socrates",
                    text: "Join me on Socrates prediction market!",
                    url: "https://socrates.com/ref/92VA",
                  });
                }
                onOpenChange(false);
              }}
              className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-14 h-14 rounded-full bg-[#00B900] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                </svg>
              </div>
              <span className="text-xs text-foreground">Messages</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={() => {
                window.open(
                  `https://wa.me/?text=${encodeURIComponent("Join me on Socrates! https://socrates.com/ref/92VA")}`,
                  "_blank"
                );
                onOpenChange(false);
              }}
              className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <span className="text-xs text-foreground">Whatsapp</span>
            </button>

            {/* More */}
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: "Join Socrates",
                    text: "Join me on Socrates prediction market!",
                    url: "https://socrates.com/ref/92VA",
                  });
                }
                onOpenChange(false);
              }}
              className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <svg className="w-6 h-6 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </div>
              <span className="text-xs text-foreground">More</span>
            </button>
          </div>

          {/* Cancel Button */}
          <Button
            variant="outline"
            className="w-full border-border text-foreground hover:bg-muted font-medium text-base py-6 rounded-full"
            onClick={() => onOpenChange(false)}
          >
            {t('cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;

