import React from "react";
import { Settings as SettingsIcon, Building2, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/shared/PageHeader";
import { useAuth } from "@/lib/AuthContext";

export default function Settings() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Platform configuration and administration"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> Agency Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Configure your agency details, offices, and team members from the admin panel.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Roles & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Manage user roles and access levels for your organization.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-primary" /> Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Name:</span> {user?.full_name}</div>
              <div><span className="text-muted-foreground">Email:</span> {user?.email}</div>
              <div><span className="text-muted-foreground">Role:</span> {user?.role || "user"}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}