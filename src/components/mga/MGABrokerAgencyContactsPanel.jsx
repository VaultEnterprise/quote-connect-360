/**
 * MGABrokerAgencyContactsPanel — Gate 6L-A
 * Contacts list and management for Broker / Agency
 */
import React, { useState, useEffect } from 'react';
import { listBrokerAgencyContacts } from '@/lib/mga/services/masterGroupService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus } from 'lucide-react';
import MGABrokerAgencyContactModal from './MGABrokerAgencyContactModal';

export default function MGABrokerAgencyContactsPanel({
  masterGroupId,
  mgaId,
  scopeRequest,
  userRole,
  onContactChange,
}) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const CONTACTS_MANAGE_ROLES = ['platform_super_admin', 'mga_admin'];
  const CONTACTS_VIEW_ROLES = ['platform_super_admin', 'mga_admin', 'mga_manager'];

  useEffect(() => {
    loadContacts();
  }, [masterGroupId]);

  async function loadContacts() {
    setLoading(true);
    const result = await listBrokerAgencyContacts({
      ...scopeRequest,
      target_entity_id: masterGroupId,
      filters: { status: 'active' },
    });
    setContacts(result?.data || []);
    setLoading(false);
  }

  const canManage = CONTACTS_MANAGE_ROLES.includes(userRole);
  const canView = CONTACTS_VIEW_ROLES.includes(userRole);

  if (!canView) return <div className="text-sm text-muted-foreground">Access denied</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">Contacts</h3>
        {canManage && (
          <Button size="sm" onClick={() => { setEditingContact(null); setModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Contact
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : contacts.length === 0 ? (
        <div className="text-sm text-muted-foreground">No contacts</div>
      ) : (
        <div className="space-y-2">
          {contacts.map(contact => (
            <div key={contact.id} className="flex items-center justify-between p-3 border rounded bg-card">
              <div className="flex-1">
                <p className="font-medium text-sm">{contact.full_name}</p>
                <p className="text-xs text-muted-foreground">{contact.email}</p>
                {contact.title && <p className="text-xs text-muted-foreground">{contact.title}</p>}
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">{contact.contact_type}</Badge>
                  {contact.is_primary && <Badge className="text-xs bg-green-100 text-green-800">Primary</Badge>}
                </div>
              </div>
              {canManage && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setEditingContact(contact); setModalOpen(true); }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onContactChange(contact.id, 'deactivate')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <MGABrokerAgencyContactModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditingContact(null); }}
          masterGroupId={masterGroupId}
          mgaId={mgaId}
          scopeRequest={scopeRequest}
          contact={editingContact}
          onSave={() => { loadContacts(); setModalOpen(false); setEditingContact(null); }}
        />
      )}
    </div>
  );
}