/**
 * Platform Broker Agencies Management
 * Route: /command-center/broker-agencies
 * Admin-only page for managing all broker agencies
 */

import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Search, ChevronRight } from 'lucide-react';
import BrokerDetailDrawer from '@/components/broker/BrokerDetailDrawer';
import BrokerApprovalModal from '@/components/broker/BrokerApprovalModal';

export default function PlatformBrokerAgencies() {
  const { user } = useAuth();
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [approvalBroker, setApprovalBroker] = useState(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  useEffect(() => {
    if (user && ['admin', 'platform_super_admin'].includes(user.role)) {
      loadBrokers();
    }
  }, [user]);

  async function loadBrokers() {
    setLoading(true);
    try {
      const response = await base44.entities.BrokerAgencyProfile.list();
      setBrokers(response || []);
    } catch (err) {
      console.error('Error loading brokers:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!user || !['admin', 'platform_super_admin'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access Restricted: Admin only</p>
      </div>
    );
  }

  const filteredBrokers = brokers.filter(broker => {
    const matchesSearch = !searchQuery || 
      broker.legal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      broker.primary_contact_email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || broker.onboarding_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    pending: brokers.filter(b => b.onboarding_status === 'draft' || b.onboarding_status === 'pending_approval').length,
    active: brokers.filter(b => b.onboarding_status === 'active').length,
    suspended: brokers.filter(b => b.relationship_status === 'suspended').length,
    total: brokers.length
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'draft':
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Broker Agencies</h1>
        <p className="text-muted-foreground">Manage all broker agencies on the platform</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Brokers</p>
              <p className="text-2xl font-bold text-foreground">{statusCounts.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-green-600">{statusCounts.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Suspended</p>
              <p className="text-2xl font-bold text-red-600">{statusCounts.suspended}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Brokers</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="suspended">Suspended</TabsTrigger>
        </TabsList>

        <TabsContent value={filterStatus === 'all' ? 'all' : filterStatus} className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Broker List */}
          <div className="space-y-2">
            {filteredBrokers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No brokers found
              </div>
            ) : (
              filteredBrokers.map(broker => (
                <div
                  key={broker.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedBroker(broker);
                    setShowDetailDrawer(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{broker.legal_name}</h3>
                        <Badge className={getStatusBadgeColor(broker.onboarding_status)}>
                          {broker.onboarding_status.replace(/_/g, ' ')}
                        </Badge>
                        {broker.compliance_status === 'suspended' && (
                          <Badge variant="destructive">Compliance Hold</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{broker.primary_contact_email}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>📍 {broker.state} {broker.zip_code}</span>
                        <span>📋 {broker.insurance_lines?.length || 0} lines</span>
                        <span>🏢 {broker.current_open_case_count || 0} cases</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {broker.onboarding_status === 'pending_approval' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setApprovalBroker(broker);
                            setShowApprovalModal(true);
                          }}
                        >
                          Review
                        </Button>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Drawer */}
      {selectedBroker && (
        <BrokerDetailDrawer
          broker={selectedBroker}
          open={showDetailDrawer}
          onOpenChange={setShowDetailDrawer}
          onApprove={(broker) => {
            setApprovalBroker(broker);
            setShowApprovalModal(true);
            setShowDetailDrawer(false);
          }}
          onRefresh={loadBrokers}
        />
      )}

      {/* Approval Modal */}
      {approvalBroker && (
        <BrokerApprovalModal
          broker={approvalBroker}
          open={showApprovalModal}
          onOpenChange={setShowApprovalModal}
          onComplete={loadBrokers}
        />
      )}
    </div>
  );
}