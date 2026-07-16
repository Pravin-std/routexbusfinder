import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function SettingsManager() {
  const { theme, setTheme } = useTheme();
  const [formData, setFormData] = useState<any>({
    app_name: "RouteX Bus Finder",
    support_email: "support@routex.com",
    support_phone: "+91 98765 43210",
    default_theme: "system",
    default_currency: "inr"
  });

  useEffect(() => {
    const saved = localStorage.getItem("routex-settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      setFormData(parsed);
      if (parsed.default_theme) {
        setTheme(parsed.default_theme);
      }
    }
  }, [setTheme]);

  const handleSave = () => {
    localStorage.setItem("routex-settings", JSON.stringify(formData));
    toast.success("Settings saved successfully to local storage");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-sm text-muted-foreground">Manage your application preferences (Stored locally).</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic information about your platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Application Name</Label>
              <Input 
                value={formData.app_name} 
                onChange={e => setFormData({ ...formData, app_name: e.target.value })} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Support Email</Label>
                <Input 
                  value={formData.support_email} 
                  onChange={e => setFormData({ ...formData, support_email: e.target.value })} 
                  type="email" 
                />
              </div>
              <div className="space-y-2">
                <Label>Support Phone</Label>
                <Input 
                  value={formData.support_phone} 
                  onChange={e => setFormData({ ...formData, support_phone: e.target.value })} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance & Localization</CardTitle>
            <CardDescription>Customize the look and regional settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Theme Preference</Label>
                <Select 
                  value={formData.default_theme} 
                  onValueChange={val => {
                    setFormData({ ...formData, default_theme: val });
                    setTheme(val);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light Mode</SelectItem>
                    <SelectItem value="dark">Dark Mode</SelectItem>
                    <SelectItem value="system">System Default</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ta">Tamil (தமிழ்)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select 
                value={formData.default_currency} 
                onValueChange={val => setFormData({ ...formData, default_currency: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inr">INR (₹)</SelectItem>
                  <SelectItem value="usd">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
