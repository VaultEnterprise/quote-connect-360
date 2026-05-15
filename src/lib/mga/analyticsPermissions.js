/**
 * MGA Gate 6K — Analytics Permissions
 * lib/mga/analyticsPermissions.js
 *
 * Read-only analytics permissions
 */

export const analyticsPermissions = {
  'analytics.view_summary': {
    description: 'View MGA command summary metrics',
    category: 'analytics',
    action: 'read',
    target_entity: 'Analytics',
  },
  'analytics.view_operational': {
    description: 'View operational metrics (case, quote, exception)',
    category: 'analytics',
    action: 'read',
    target_entity: 'Analytics',
  },
  'analytics.view_exports': {
    description: 'View export and delivery metrics',
    category: 'analytics',
    action: 'read',
    target_entity: 'Analytics',
  },
  'analytics.view_broker_agency': {
    description: 'View Broker/Agency lifecycle metrics',
    category: 'analytics',
    action: 'read',
    target_entity: 'Analytics',
  },
  'analytics.view_audit': {
    description: 'View audit trail and governance metrics',
    category: 'analytics',
    action: 'read',
    target_entity: 'Analytics',
  },
};

export const roleAnalyticsPermissions = {
  mga_admin: [
    'analytics.view_summary',
    'analytics.view_operational',
    'analytics.view_exports',
    'analytics.view_broker_agency',
    'analytics.view_audit',
  ],
  mga_manager: [
    'analytics.view_operational',
    'analytics.view_exports',
    'analytics.view_broker_agency',
    'analytics.view_audit',
  ],
  mga_user: ['analytics.view_exports'],
  mga_read_only: ['analytics.view_exports'],
  platform_super_admin: [
    'analytics.view_summary',
    'analytics.view_operational',
    'analytics.view_exports',
    'analytics.view_broker_agency',
    'analytics.view_audit',
  ],
};

export default analyticsPermissions;