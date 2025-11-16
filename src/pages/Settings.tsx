import { useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "next-themes";
import { Camera, Save, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useSound } from "@/contexts";
import { useMarket } from "@/contexts";
import { loadLanguageResources } from "@/i18n/config";

// 语言列表配置（与 LanguageSwitcher 保持一致）
const languages = [
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '简体中文' },
  { code: 'ja', name: '日本語' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'es', name: 'Español' },
];

const Settings = () => {
  const { i18n } = useTranslation("settings");
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { isEnabled: isSoundEnabled, toggleSound } = useSound();
  const { playerId } = useMarket();

  const [username, setUsername] = useState("User");
  const [email, setEmail] = useState("");
  const [avatarUrl] = useState("");
  const [copiedPid, setCopiedPid] = useState(false);

  const handleSave = () => {
    // Save settings logic here
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully",
    });
  };

  const handleLanguageChange = async (languageCode: string) => {
    // 先加载资源，然后再切换语言，确保资源已加载完成
    await loadLanguageResources(languageCode);
    await i18n.changeLanguage(languageCode);
    toast({
      title: "Language Changed",
      description: `Language changed to ${languages.find(l => l.code === languageCode)?.name}`,
    });
  };

  const handleAvatarUpload = () => {
    // Avatar upload logic here
    toast({
      title: "Coming Soon",
      description: "Avatar upload feature will be available soon",
    });
  };

  const handleCopyPid = () => {
    if (!playerId) return;
    const pidString = `${playerId[0]}:${playerId[1]}`;
    navigator.clipboard.writeText(pidString);
    setCopiedPid(true);
    toast({
      title: "Copied!",
      description: "User ID copied to clipboard",
    });
    setTimeout(() => setCopiedPid(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Settings</h1>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-2xl">
                    {username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" onClick={handleAvatarUpload}>
                  <Camera className="w-4 h-4 mr-2" />
                  Change Avatar
                </Button>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              {/* User ID */}
              {playerId && (
                <div className="space-y-2">
                  <Label htmlFor="pid">User ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="pid"
                      value={`${playerId[0]}:${playerId[1]}`}
                      readOnly
                      className="font-mono"
                    />
                    <Button variant="outline" size="sm" onClick={handleCopyPid} className="px-3">
                      {copiedPid ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dark Mode */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle between light and dark theme
                  </p>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={i18n.language} onValueChange={handleLanguageChange}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Trade Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your orders are filled
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Market Updates (Sound)</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sound when new markets are created
                  </p>
                </div>
                <Switch checked={isSoundEnabled} onCheckedChange={toggleSound} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Price Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get alerts when target prices are reached
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} size="lg">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;

