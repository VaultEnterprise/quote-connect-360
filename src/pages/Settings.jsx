import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Shield, User, Save, UserPlus, Mail, AlertCircle, Zap, Lock, Bell, Palette, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";

// Import new setting panels
import APIIntegrationsPanel from "@/components/settings/APIIntegrationsPanel";
import QuoteProviderRoutingPanel from "@/components/settings/QuoteProviderRoutingPanel";
import FeatureTogglesPanel from "@/components/settings/FeatureTogglesPanel";
import BrandingPanel from "@/components/settings/BrandingPanel";
import AuditLogPanel from "@/components/settings/AuditLogPanel";
import WebhookConfigPanel from "@/components/settings/WebhookConfigPanel";
import BillingUsagePanel from "@/components/settings/BillingUsagePanel";
import UserManualLibrary from "@/components/help/UserManualLibrary";
import UserManualViewer from "@/components/help/UserManualViewer";
import UserManualGenerator from "@/components/help/UserManualGenerator";
import UserManualManager from "@/components/help/UserManualManager";
import TxQuoteRulesPanel from "@/components/settings/TxQuoteRulesPanel";
import TxQuoteContactsPanel from "@/components/settings/TxQuoteContactsPanel";

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [selectedManual, setSelectedManual] = useState(null);

  const { data: agencies = [] } = useQuery({
    queryKey: ["agencies"],
    queryFn: () => base44.entities.Agency.list(),
  });

  const agency = agencies[0];
  const [agencyForm, setAgencyForm] = useState(null);

  useEffect(() => {
    if (agency && !agencyForm) {
      setAgencyForm({
        name: agency.name || "",
        code: agency.code || "",
        address: agency.address || "",
        city: agency.city || "",
        state: agency.state || "",
        zip: agency.zip || "",
        phone: agency.phone || "",
        email: agency.email || "",
      });
    }
  }, [agency]);

  const saveAgency = useMutation({
    mutationFn: () => agency
      ? base44.entities.Agency.update(agency.id, agencyForm)
      : base44.entities.Agency.create(agencyForm),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agencies"] }),
  });

  const setA = (k, v) => setAgencyForm(p => ({ ...p, [k]: v }));

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      toast({ title: "Invitation sent", description: `${inviteEmail} has been invited as ${inviteRole}.` });
      setInviteEmail("");
    } catch (err) {
      toast({ title: "Invite failed", description: err.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const { data: userList = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    enabled: user?.role === "admin" || user?.role === "platform_super_admin",
  });

  const isAdmin = user?.role === "admin" || user?.role === "platform_super_admin";

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Organization setup, team access, integrations, and platform administration" />

      {!isAdmin && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <strong>Admin Only:</strong> Most settings are restricted to administrators. Contact your admin to manage integrations, features, and billing.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="organization" className="w-full">
        <TabsList className="bg-muted/50 flex-wrap h-auto gap-1">
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Organization
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="w-4 h-4" /> My Account
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="integrations" className="flex items-center gap-2">
                <Zap className="w-4 h-4" /> Integrations
              </TabsTrigger>
              <TabsTrigger value="quote-routing" className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> Quote Routing
              </TabsTrigger>
              <TabsTrigger value="txquote-admin" className="flex items-center gap-2">
                <Shield className="w-4 h-4" /> TxQuote Admin
              </TabsTrigger>
              <TabsTrigger value="features" className="flex items-center gap-2">
                <Shield className="w-4 h-4" /> Features
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="flex items-center gap-2">
                <Bell className="w-4 h-4" /> Webhooks
              </TabsTrigger>
              <TabsTrigger value="branding" className="flex items-center gap-2">
                <Palette className="w-4 h-4" /> Branding
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Team
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <Lock className="w-4 h-4" /> Billing
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Audit Log
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="help" className="flex items-center gap-2">
               <BookOpen className="w-4 h-4" /> Help Center
              </TabsTrigger>
        </TabsList>

        {/* ─────────────────────────────────────────────────────────────────────────────── */}
        {/* ORGANIZATION TAB */}
        {/* ─────────────────────────────────────────────────────────────────────────────── */}
        <TabsContent value="organization" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Organization Information</CardTitle></CardHeader>
            <CardContent>
              {agencyForm ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label>Organization Name</Label><Input value={agencyForm.name} onChange={e => setA("name", e.target.value)} className="mt-1.5" /></div>
                    <div><Label>Organization Code</Label><Input value={agencyForm.code} onChange={e => setA("code", e.target.value)} className="mt-1.5" /></div>
                  </div>
                  <div><Label>Address</Label><Input value={agencyForm.address} onChange={e => setA("address", e.target.value)} className="mt-1.5" /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div><Label>City</Label><Input value={agencyForm.city} onChange={e => setA("city", e.target.value)} className="mt-1.5" /></div>
                    <div><Label>State</Label><Input value={agencyForm.state} onChange={e => setA("state", e.target.value)} className="mt-1.5" maxLength={2} /></div>
                    <div><Label>ZIP</Label><Input value={agencyForm.zip} onChange={e => setA("zip", e.target.value)} className="mt-1.5" /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label>Phone</Label><Input value={agencyForm.phone} onChange={e => setA("phone", e.target.value)} className="mt-1.5" /></div>
                    <div><Label>Email</Label><Input value={agencyForm.email} onChange={e => setA("email", e.target.value)} className="mt-1.5" /></div>
                  </div>
                  <Button onClick={() => saveAgency.mutate()} disabled={saveAgency.isPending}>
                    <Save className="w-4 h-4 mr-2" />{saveAgency.isPending ? "Saving..." : "Save Organization Info"}
                  </Button>
                  {saveAgency.isSuccess && <p className="text-sm text-green-600">Saved successfully.</p>}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Loading organization data...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─────────────────────────────────────────────────────────────────────────────── */}
        {/* MY ACCOUNT TAB */}
        {/* ─────────────────────────────────────────────────────────────────────────────── */}
        <TabsContent value="account" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4 text-primary" /> My Account</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Full Name</span>
                  <span className="font-medium">{user?.full_name}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium capitalize">{user?.role || "user"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─────────────────────────────────────────────────────────────────────────────── */}
        {/* ADMIN-ONLY TABS */}
        {/* ─────────────────────────────────────────────────────────────────────────────── */}

        {isAdmin && (
          <>
            {/* Integrations */}
            <TabsContent value="integrations" className="mt-6">
              <APIIntegrationsPanel />
            </TabsContent>

            <TabsContent value="quote-routing" className="mt-6">
              <QuoteProviderRoutingPanel />
            </TabsContent>

            <TabsContent value="txquote-admin" className="mt-6 space-y-6">
              <TxQuoteRulesPanel />
              <TxQuoteContactsPanel />
            </TabsContent>

            {/* Features */}
            <TabsContent value="features" className="mt-6">
              <FeatureTogglesPanel />
            </TabsContent>

            {/* Webhooks */}
            <TabsContent value="webhooks" className="mt-6">
              <WebhookConfigPanel />
            </TabsContent>

            {/* Branding */}
            <TabsContent value="branding" className="mt-6">
              <BrandingPanel />
            </TabsContent>

            {/* Team */}
            <TabsContent value="team" className="mt-6 space-y-4">
              {/* Invite */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserPlus className="w-4 h-4 text-primary" /> Invite Team Member</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <Label className="text-xs mb-1 block">Email Address</Label>
                      <Input
                        type="email"
                        placeholder="colleague@agency.com"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Role</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" disabled={inviting || !inviteEmail} className="gap-1.5">
                        <Mail className="w-4 h-4" />
                        {inviting ? "Inviting..." : "Send Invite"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Members list */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Team Members</CardTitle></CardHeader>
                <CardContent>
                  {userList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No team members found.</p>
                  ) : (
                    <div className="space-y-2">
                      {userList.map(u => (
                        <div key={u.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="text-sm font-medium">{u.full_name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                          <span className="text-xs capitalize text-muted-foreground bg-muted px-2 py-0.5 rounded">{u.role}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing */}
            <TabsContent value="billing" className="mt-6">
              <BillingUsagePanel />
            </TabsContent>

            {/* Audit Log */}
            <TabsContent value="audit" className="mt-6">
              <AuditLogPanel />
            </TabsContent>
          </>
        )}

        {/* Help Center - Available to all users */}
        <TabsContent value="help" className="mt-6 space-y-6">
          {isAdmin && (
            <>
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={() => setSelectedManual("generator")}>
                  ➕ Create Manual
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedManual("manager")}>
                  ⚙️ Manage Manuals
                </Button>
              </div>

              {selectedManual === "generator" && <UserManualGenerator />}
              {selectedManual === "manager" && <UserManualManager />}
              {!selectedManual && <UserManualLibrary onSelectManual={setSelectedManual} />}
            </>
          )}

          {!isAdmin && <UserManualLibrary onSelectManual={setSelectedManual} />}
        </TabsContent>
      </Tabs>

      {/* Manual Viewer Modal */}
      {selectedManual && typeof selectedManual === "object" && (
        <UserManualViewer manual={selectedManual} onClose={() => setSelectedManual(null)} />
      )}
    </div>
  );
}