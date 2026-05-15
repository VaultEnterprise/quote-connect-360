import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Upload, Save } from "lucide-react";

export default function BrandingPanel() {
  const [branding, setBranding] = useState({
    agencyLogo: "https://via.placeholder.com/200x80?text=Agency+Logo",
    primaryColor: "#0066cc",
    logoUrl: "https://via.placeholder.com/200x80?text=Logo",
    faviconUrl: "",
    portalName: "Benefits Portal",
    portalDescription: "Manage your employee benefits",
    emailHeaderColor: "#0066cc",
  });

  const set = (k, v) => setBranding(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold">Portal Branding</p>
        <p className="text-xs text-muted-foreground">Customize the appearance of your employee benefits portal</p>
      </div>

      {/* Logo preview */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Palette className="w-4 h-4 text-primary" /> Logo & Identity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <img src={branding.logoUrl} alt="Portal Logo" className="h-12 object-contain" />
            <div className="text-xs">
              <p className="font-medium">Current Portal Logo</p>
              <p className="text-muted-foreground">{branding.logoUrl}</p>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium mb-1.5 block">Portal Logo URL</Label>
            <div className="flex gap-2">
              <Input value={branding.logoUrl} onChange={e => set("logoUrl", e.target.value)} className="h-8 text-xs" placeholder="https://..." />
              <Button variant="outline" size="sm" className="h-8 px-2 gap-1">
                <Upload className="w-3 h-3" /> Upload
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium mb-1.5 block">Portal Name</Label>
            <Input value={branding.portalName} onChange={e => set("portalName", e.target.value)} className="h-8 text-xs" />
          </div>

          <div>
            <Label className="text-xs font-medium mb-1.5 block">Portal Description</Label>
            <Input value={branding.portalDescription} onChange={e => set("portalDescription", e.target.value)} className="h-8 text-xs" />
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Colors</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Primary Color", key: "primaryColor" },
            { label: "Email Header Color", key: "emailHeaderColor" },
          ].map(c => (
            <div key={c.key}>
              <Label className="text-xs font-medium mb-1.5 block">{c.label}</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={branding[c.key]}
                  onChange={e => set(c.key, e.target.value)}
                  className="w-10 h-8 rounded border border-input cursor-pointer"
                />
                <Input value={branding[c.key]} onChange={e => set(c.key, e.target.value)} className="h-8 text-xs font-mono flex-1" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button className="gap-1.5" onClick={() => {}}>
        <Save className="w-4 h-4" /> Save Branding
      </Button>
    </div>
  );
}