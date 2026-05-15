import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function TxQuoteContactsPanel() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ destination_code: "TRIAD", contact_name: "", email: "", contact_type: "to" });

  const { data: contacts = [] } = useQuery({
    queryKey: ["txquote-destination-contacts"],
    queryFn: () => base44.entities.TxQuoteDestinationContact.list("destination_code", 100),
  });

  const saveMutation = useMutation({
    mutationFn: async (contact) => {
      if (contact.id) return base44.entities.TxQuoteDestinationContact.update(contact.id, contact);
      return base44.entities.TxQuoteDestinationContact.create({ ...contact, is_default: true, is_active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["txquote-destination-contacts"] });
      setForm({ destination_code: "TRIAD", contact_name: "", email: "", contact_type: "to" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">TxQuote Destination Contacts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border p-4 space-y-3">
          <p className="font-medium">Add Contact</p>
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <Label>Destination</Label>
              <Select value={form.destination_code} onValueChange={(value) => setForm((prev) => ({ ...prev, destination_code: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRIAD">Triad</SelectItem>
                  <SelectItem value="SUS">SUS</SelectItem>
                  <SelectItem value="AST">AST</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Name</Label>
              <Input value={form.contact_name} onChange={(e) => setForm((prev) => ({ ...prev, contact_name: e.target.value }))} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.contact_type} onValueChange={(value) => setForm((prev) => ({ ...prev, contact_type: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="to">To</SelectItem>
                  <SelectItem value="cc">CC</SelectItem>
                  <SelectItem value="bcc">BCC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => saveMutation.mutate(form)} disabled={!form.email}>Add Contact</Button>
        </div>

        <div className="space-y-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="rounded-xl border p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{contact.contact_name || contact.email}</p>
                  <p className="text-xs text-muted-foreground">{contact.destination_code} • {contact.contact_type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Active</span>
                  <Switch checked={!!contact.is_active} onCheckedChange={(checked) => saveMutation.mutate({ ...contact, is_active: checked })} />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label>Name</Label>
                  <Input defaultValue={contact.contact_name || ""} onBlur={(e) => saveMutation.mutate({ ...contact, contact_name: e.target.value })} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input defaultValue={contact.email || ""} onBlur={(e) => saveMutation.mutate({ ...contact, email: e.target.value })} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={!!contact.is_default} onCheckedChange={(checked) => saveMutation.mutate({ ...contact, is_default: checked })} />
                  <Label>Default</Label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}