'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Camera } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [site, setSite] = useState({
    siteName: '',
    siteDescription: '',
    siteLogo: '',
  });
  const [smtp, setSmtp] = useState({
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    fromName: '',
    fromEmail: '',
    enabled: false,
  });
  const [captcha, setCaptcha] = useState({
    provider: 'slider',
    siteKey: '',
    secretKey: '',
    enabled: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      if (res.data.success) {
        setSmtp(res.data.data.smtp);
        setCaptcha(res.data.data.captcha);
        setSite(res.data.data.site);
      }
    } catch (error) {
      toast.error('Failed to load settings');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await api.post('/admin/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
            setSite(prev => ({ ...prev, siteLogo: res.data.data.url }));
            toast.success('Logo uploaded');
        }
      } catch (error) {
        toast.error('Failed to upload logo');
      }
    }
  };
  
  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/admin/settings', { smtp, captcha, site });
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">系统设置</h1>

      <Card>
        <CardHeader>
          <CardTitle>网站信息配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label>网站名称</Label>
              <Input
                value={site.siteName}
                onChange={(e) => setSite({ ...site, siteName: e.target.value })}
                placeholder="Arcane Club"
              />
            </div>
             <div className="space-y-2">
              <Label>网站简介</Label>
              <Input
                value={site.siteDescription}
                onChange={(e) => setSite({ ...site, siteDescription: e.target.value })}
                placeholder="A modern community..."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>网站 Logo</Label>
            <div className="flex flex-col gap-4">
               {site.siteLogo && (
                 <div className="relative w-32 h-32 border rounded-md overflow-hidden bg-gray-50">
                   <img src={`http://localhost:3000${site.siteLogo}`} alt="Site Logo" className="w-full h-full object-contain p-2" />
                 </div>
               )}
               <div className="w-full max-w-sm">
                 <FileUpload 
                   accept="image/*" 
                   onFileSelect={onLogoSelect}
                   helperText="支持 JPG, PNG, GIF 格式"
                 />
               </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SMTP 邮件配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={smtp.enabled}
              onCheckedChange={(checked) => setSmtp({ ...smtp, enabled: checked })}
            />
            <Label>启用 SMTP 服务</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SMTP Host</Label>
              <Input
                value={smtp.host}
                onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                placeholder="smtp.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Port</Label>
              <Input
                type="number"
                value={smtp.port}
                onChange={(e) => setSmtp({ ...smtp, port: parseInt(e.target.value) })}
                placeholder="587"
              />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={smtp.user}
                onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={smtp.pass}
                onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
                placeholder="********"
              />
            </div>
            <div className="space-y-2">
              <Label>From Name</Label>
              <Input
                value={smtp.fromName}
                onChange={(e) => setSmtp({ ...smtp, fromName: e.target.value })}
                placeholder="Arcane Club"
              />
            </div>
            <div className="space-y-2">
              <Label>From Email</Label>
              <Input
                value={smtp.fromEmail}
                onChange={(e) => setSmtp({ ...smtp, fromEmail: e.target.value })}
                placeholder="noreply@example.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>人机验证配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={captcha.enabled}
              onCheckedChange={(checked) => setCaptcha({ ...captcha, enabled: checked })}
            />
            <Label>启用人机验证</Label>
          </div>

          <div className="space-y-2">
            <Label>验证服务提供商</Label>
            <Select 
              value={captcha.provider} 
              onValueChange={(val) => setCaptcha({...captcha, provider: val})}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择验证方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slider">本地滑块验证 (Slider)</SelectItem>
                <SelectItem value="turnstile">Cloudflare Turnstile</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {captcha.provider === 'turnstile' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Site Key</Label>
                <Input
                  value={captcha.siteKey}
                  onChange={(e) => setCaptcha({ ...captcha, siteKey: e.target.value })}
                  placeholder="Turnstile Site Key"
                />
              </div>
              <div className="space-y-2">
                <Label>Secret Key</Label>
                <Input
                  value={captcha.secretKey}
                  onChange={(e) => setCaptcha({ ...captcha, secretKey: e.target.value })}
                  placeholder="Turnstile Secret Key"
                  type="password"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={loading}>
        {loading ? '保存中...' : '保存设置'}
      </Button>
    </div>
  );
}
