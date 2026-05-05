/**
 * MGA Phase 5 — Scope Error Boundary
 * Fail-closed: any React error within an MGA section shows "Access restricted" rather than leaking data.
 * Safety rule: fail closed on missing or ambiguous scope.
 */
import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default class MGAScopeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive text-sm">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>Access restricted — this section could not be loaded securely.</span>
        </div>
      );
    }
    return this.props.children;
  }
}