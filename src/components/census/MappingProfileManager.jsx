import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { saveMappingProfile, listMappingProfiles, deleteMappingProfile } from "@/utils/censusHelpers";
import { Save, Trash2, Download, Copy } from "lucide-react";

export default function MappingProfileManager({ mapping, headers, onLoadProfile }) {
  const [profiles, setProfiles] = useState(() => listMappingProfiles());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [profileName, setProfileName] = useState("");

  const handleSave = () => {
    if (!profileName.trim()) return;
    saveMappingProfile(profileName, mapping, headers);
    setProfiles(listMappingProfiles());
    setProfileName("");
    setShowSaveDialog(false);
  };

  const handleLoad = (profile) => {
    onLoadProfile?.(profile.mapping);
  };

  const handleDelete = (name) => {
    deleteMappingProfile(name);
    setProfiles(listMappingProfiles());
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowSaveDialog(true)}
          className="text-xs"
        >
          <Save className="w-3 h-3 mr-1" /> Save Mapping Profile
        </Button>
      </div>

      {profiles.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">Saved Profiles ({profiles.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {profiles.map(profile => (
              <div key={profile.name} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs group hover:bg-muted transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{profile.name}</div>
                  <div className="text-muted-foreground text-[11px]">
                    {Object.keys(profile.mapping).length} field(s) • {new Date(profile.savedAt).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleLoad(profile)}
                  className="h-6 text-xs whitespace-nowrap"
                  title="Load this mapping template"
                >
                  <Copy className="w-3 h-3 mr-1" /> Load
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(profile.name)}
                  title="Delete this mapping template"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm">Save Mapping Profile</DialogTitle>
            <DialogDescription className="text-xs">
              Save your current field mapping to reuse for future imports.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Profile name (e.g., 'Acme Corp Standard')"
            value={profileName}
            onChange={e => setProfileName(e.target.value)}
            className="text-sm"
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!profileName.trim()}>
              Save Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}