'use client';

/**
 * User Management Component for Admin Dashboard
 * 
 * Full user management with search, filters, and actions:
 * - Add credits
 * - Change plan
 * - Ban/Unban
 * - Delete user
 * - Reset password
 * - Export data
 */

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Plus, 
  Ban, 
  Trash2, 
  Download, 
  Key, 
  Crown,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  plan: 'FREE' | 'PRO' | 'PREMIUM' | 'ADMIN';
  analysisCount: number;
  bonusCredits: number;
  lastActiveAt: string | null;
  lastAnalysisDate: string | null;
  isBanned: boolean;
  bannedReason: string | null;
  referralSource: string | null;
  referralMedium: string | null;
  referralCampaign: string | null;
  createdAt: string;
  stripeSubscriptionId: string | null;
  stripeCurrentPeriodEnd: string | null;
  authProviders: string[];
  analysesCount: number;
  favoriteTeamsCount: number;
  hasActiveSubscription: boolean;
}

const planColors = {
  FREE: 'bg-gray-500/20 text-gray-400',
  PRO: 'bg-blue-500/20 text-blue-400',
  PREMIUM: 'bg-purple-500/20 text-purple-400',
  ADMIN: 'bg-yellow-500/20 text-yellow-400',
};

const providerIcons: Record<string, string> = {
  google: '🔵',
  github: '⚫',
  credentials: '🔑',
};

const ITEMS_PER_PAGE = 20;

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionModal, setActionModal] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form states for actions
  const [creditsAmount, setCreditsAmount] = useState(10);
  const [newPlan, setNewPlan] = useState<'FREE' | 'PRO' | 'PREMIUM' | 'ADMIN'>('PRO');
  const [banReason, setBanReason] = useState('');

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (planFilter) params.set('plan', planFilter);
      params.set('limit', String(ITEMS_PER_PAGE));
      params.set('offset', String((page - 1) * ITEMS_PER_PAGE));

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [search, planFilter, page]);

  useEffect(() => {
    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  const performAction = async (action: string, data?: any) => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    setActionResult(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userId: selectedUser.id,
          data,
        }),
      });

      const result = await response.json();
      
      setActionResult({
        success: result.success,
        message: result.message || result.error || 'Action completed',
      });

      if (result.success) {
        // Refresh user list
        fetchUsers();
        
        // Close modal after short delay
        setTimeout(() => {
          setActionModal(null);
          setSelectedUser(null);
          setActionResult(null);
        }, 1500);
      }
    } catch (error) {
      setActionResult({
        success: false,
        message: 'Action failed',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = (user: User, action: string) => {
    setSelectedUser(user);
    setActionModal(action);
    setActionResult(null);
    
    // Reset form states
    setCreditsAmount(10);
    setNewPlan(user.plan === 'FREE' ? 'PRO' : user.plan);
    setBanReason('');
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-white/10 rounded-lg text-sm focus:outline-none focus:border-accent"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-bg-tertiary border border-white/10 rounded-lg text-sm focus:outline-none focus:border-accent"
          >
            <option value="">All Plans</option>
            <option value="FREE">Free</option>
            <option value="PRO">Pro</option>
            <option value="PREMIUM">Premium</option>
            <option value="ADMIN">Admin</option>
          </select>
          
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="px-3 py-2 bg-bg-tertiary border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-text-muted">
        <span>Showing {users.length} of {total} users (Page {page} of {totalPages || 1})</span>
      </div>

      {/* Users Table */}
      <div className="bg-bg-secondary border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 text-left font-medium text-text-muted">User</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Plan</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Source</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Auth</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Registered</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Activity</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Credits</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Status</th>
                <th className="px-4 py-3 text-right font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                  {/* User Info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-bold">
                          {user.name?.[0] || user.email?.[0] || '?'}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-text-primary">{user.name || 'Anonymous'}</div>
                        <div className="text-xs text-text-muted truncate max-w-[200px]">{user.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Plan */}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${planColors[user.plan]}`}>
                      {user.plan}
                    </span>
                    {user.hasActiveSubscription && (
                      <span className="ml-1 text-emerald-400 text-xs">●</span>
                    )}
                  </td>

                  {/* Source */}
                  <td className="px-4 py-3">
                    <div className="text-xs">
                      {user.referralSource ? (
                        <span className="px-1.5 py-0.5 bg-white/10 rounded text-text-secondary">
                          {user.referralSource}
                        </span>
                      ) : (
                        <span className="text-text-muted">Direct</span>
                      )}
                    </div>
                  </td>

                  {/* Auth Providers */}
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {user.authProviders.length > 0 ? (
                        user.authProviders.map((p) => (
                          <span key={p} title={p}>
                            {providerIcons[p] || '🔐'}
                          </span>
                        ))
                      ) : (
                        <span title="Email/Password">🔑</span>
                      )}
                    </div>
                  </td>

                  {/* Registered */}
                  <td className="px-4 py-3">
                    <div className="text-xs text-text-muted" title={user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'}>
                      {user.createdAt 
                        ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })
                        : 'Unknown'
                      }
                    </div>
                  </td>

                  {/* Activity */}
                  <td className="px-4 py-3">
                    <div className="text-xs">
                      <div className="text-text-secondary">
                        {user.analysesCount} analyses
                      </div>
                      <div className="text-text-muted">
                        {user.lastActiveAt 
                          ? `Active ${formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })}`
                          : 'Never'
                        }
                      </div>
                    </div>
                  </td>

                  {/* Credits */}
                  <td className="px-4 py-3">
                    <div className="text-xs">
                      <span className="text-text-secondary">{user.analysesCount} analyses</span>
                      {user.bonusCredits > 0 && (
                        <span className="ml-1 text-emerald-400">+{user.bonusCredits} bonus</span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {user.isBanned ? (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                        Banned
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">
                        Active
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleAction(user, 'addCredits')}
                        title="Add Credits"
                        className="p-1.5 hover:bg-white/10 rounded transition-colors text-blue-400"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAction(user, 'changePlan')}
                        title="Change Plan"
                        className="p-1.5 hover:bg-white/10 rounded transition-colors text-purple-400"
                      >
                        <Crown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAction(user, user.isBanned ? 'unban' : 'ban')}
                        title={user.isBanned ? 'Unban' : 'Ban'}
                        className={`p-1.5 hover:bg-white/10 rounded transition-colors ${user.isBanned ? 'text-emerald-400' : 'text-yellow-400'}`}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAction(user, 'exportData')}
                        title="Export Data"
                        className="p-1.5 hover:bg-white/10 rounded transition-colors text-text-muted"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAction(user, 'delete')}
                        title="Delete User"
                        className="p-1.5 hover:bg-white/10 rounded transition-colors text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="p-8 text-center text-text-muted">
            Loading users...
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className="p-8 text-center text-text-muted">
            No users found
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1 || loading}
            className="px-3 py-2 bg-bg-tertiary border border-white/10 rounded-lg text-sm hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⟪ First
          </button>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-3 py-2 bg-bg-tertiary border border-white/10 rounded-lg text-sm hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  disabled={loading}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-accent text-white'
                      : 'bg-bg-tertiary border border-white/10 hover:bg-white/5'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="px-3 py-2 bg-bg-tertiary border border-white/10 rounded-lg text-sm hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages || loading}
            className="px-3 py-2 bg-bg-tertiary border border-white/10 rounded-lg text-sm hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Last ⟫
          </button>
        </div>
      )}

      {/* Action Modals */}
      {actionModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-secondary border border-white/10 rounded-xl p-6 max-w-md w-full">
            {/* Add Credits */}
            {actionModal === 'addCredits' && (
              <>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-400" />
                  Add Credits
                </h3>
                <p className="text-sm text-text-muted mb-4">
                  Add bonus analyses to <strong>{selectedUser.email}</strong>
                </p>
                <input
                  type="number"
                  min="1"
                  value={creditsAmount}
                  onChange={(e) => setCreditsAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-bg-tertiary border border-white/10 rounded-lg mb-4"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => performAction('addCredits', { credits: creditsAmount })}
                    disabled={actionLoading || creditsAmount <= 0}
                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium disabled:opacity-50"
                  >
                    {actionLoading ? 'Adding...' : `Add ${creditsAmount} Credits`}
                  </button>
                  <button
                    onClick={() => setActionModal(null)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* Change Plan */}
            {actionModal === 'changePlan' && (
              <>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-purple-400" />
                  Change Plan
                </h3>
                <p className="text-sm text-text-muted mb-4">
                  Change plan for <strong>{selectedUser.email}</strong>
                  <br />
                  <span className="text-yellow-400">Current: {selectedUser.plan}</span>
                </p>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value as any)}
                  className="w-full px-4 py-2 bg-bg-tertiary border border-white/10 rounded-lg mb-4"
                >
                  <option value="FREE">Free</option>
                  <option value="PRO">Pro</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="ADMIN">Admin (Full Access)</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => performAction('changePlan', { plan: newPlan })}
                    disabled={actionLoading || newPlan === selectedUser.plan}
                    className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium disabled:opacity-50"
                  >
                    {actionLoading ? 'Changing...' : `Change to ${newPlan}`}
                  </button>
                  <button
                    onClick={() => setActionModal(null)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* Ban User */}
            {actionModal === 'ban' && (
              <>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-yellow-400">
                  <Ban className="w-5 h-5" />
                  Ban User
                </h3>
                <p className="text-sm text-text-muted mb-4">
                  Ban <strong>{selectedUser.email}</strong> from using the platform
                </p>
                <input
                  type="text"
                  placeholder="Reason for ban (optional)"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full px-4 py-2 bg-bg-tertiary border border-white/10 rounded-lg mb-4"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => performAction('ban', { reason: banReason })}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-medium disabled:opacity-50"
                  >
                    {actionLoading ? 'Banning...' : 'Ban User'}
                  </button>
                  <button
                    onClick={() => setActionModal(null)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* Unban User */}
            {actionModal === 'unban' && (
              <>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-400">
                  <Check className="w-5 h-5" />
                  Unban User
                </h3>
                <p className="text-sm text-text-muted mb-4">
                  Restore access for <strong>{selectedUser.email}</strong>
                </p>
                {selectedUser.bannedReason && (
                  <p className="text-sm text-yellow-400 mb-4">
                    Banned for: {selectedUser.bannedReason}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => performAction('unban')}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium disabled:opacity-50"
                  >
                    {actionLoading ? 'Unbanning...' : 'Unban User'}
                  </button>
                  <button
                    onClick={() => setActionModal(null)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* Delete User */}
            {actionModal === 'delete' && (
              <>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  Delete User
                </h3>
                <p className="text-sm text-text-muted mb-4">
                  Permanently delete <strong>{selectedUser.email}</strong> and all their data.
                  <br />
                  <span className="text-red-400">This action cannot be undone!</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => performAction('delete')}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-medium disabled:opacity-50"
                  >
                    {actionLoading ? 'Deleting...' : 'Delete Forever'}
                  </button>
                  <button
                    onClick={() => setActionModal(null)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* Export Data */}
            {actionModal === 'exportData' && (
              <>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5 text-text-muted" />
                  Export User Data
                </h3>
                <p className="text-sm text-text-muted mb-4">
                  Export all data for <strong>{selectedUser.email}</strong> (GDPR compliant)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      setActionLoading(true);
                      const response = await fetch('/api/admin/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'exportData',
                          userId: selectedUser.id,
                        }),
                      });
                      const data = await response.json();
                      
                      // Download as JSON
                      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `user-export-${selectedUser.id}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      
                      setActionLoading(false);
                      setActionModal(null);
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium disabled:opacity-50"
                  >
                    {actionLoading ? 'Exporting...' : 'Download JSON'}
                  </button>
                  <button
                    onClick={() => setActionModal(null)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* Result Message */}
            {actionResult && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                actionResult.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {actionResult.success ? <Check className="inline w-4 h-4 mr-1" /> : <X className="inline w-4 h-4 mr-1" />}
                {actionResult.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
