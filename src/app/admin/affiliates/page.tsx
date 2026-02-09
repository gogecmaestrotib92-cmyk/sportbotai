'use client';

/**
 * Admin - Affiliate Management
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  code: string;
  status: string;
  website: string | null;
  notes: string | null;
  commissionRate: number;
  createdAt: string;
  approvedAt: string | null;
  _count: {
    clicks: number;
    conversions: number;
  };
  totalCommission: number;
}

export default function AdminAffiliates() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  // Admin emails (should match your admin check)
  const adminEmails = ['gogecmaestrotib92@gmail.com', 'aiinstamarketing@gmail.com'];

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
      router.push('/');
      return;
    }
    fetchAffiliates();
  }, [session, status]);

  const fetchAffiliates = async () => {
    try {
      const res = await fetch('/api/admin/affiliates');
      if (res.ok) {
        const data = await res.json();
        setAffiliates(data.affiliates);
      }
    } catch (err) {
      console.error('Error fetching affiliates:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string, password?: string) => {
    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, password }),
      });
      if (res.ok) {
        fetchAffiliates();
      }
    } catch (err) {
      console.error('Error updating affiliate:', err);
    }
  };

  const handleApprove = async (affiliate: Affiliate) => {
    // Generate random password
    const password = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 4).toUpperCase();
    
    if (confirm(`Approve ${affiliate.name}?\n\nGenerated password: ${password}\n\nMake sure to email this to them!`)) {
      await updateStatus(affiliate.id, 'ACTIVE', password);
      alert(`Approved! Send this to ${affiliate.email}:\n\nLogin: ${affiliate.email}\nPassword: ${password}\nDashboard: https://sportbotai.com/affiliate/dashboard`);
    }
  };

  const filteredAffiliates = filter === 'ALL' 
    ? affiliates 
    : affiliates.filter(a => a.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Affiliate Management</h1>
          <div className="flex gap-2">
            {['ALL', 'PENDING', 'ACTIVE', 'SUSPENDED'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === s 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
            <p className="text-gray-400 text-sm">Total Affiliates</p>
            <p className="text-2xl font-bold text-white">{affiliates.length}</p>
          </div>
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
            <p className="text-gray-400 text-sm">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-400">
              {affiliates.filter(a => a.status === 'PENDING').length}
            </p>
          </div>
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
            <p className="text-gray-400 text-sm">Active</p>
            <p className="text-2xl font-bold text-emerald-400">
              {affiliates.filter(a => a.status === 'ACTIVE').length}
            </p>
          </div>
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
            <p className="text-gray-400 text-sm">Total Commission</p>
            <p className="text-2xl font-bold text-emerald-400">
              ${affiliates.reduce((sum, a) => sum + a.totalCommission, 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Affiliate</th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Code</th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Status</th>
                <th className="text-right text-gray-400 text-sm font-medium px-6 py-4">Clicks</th>
                <th className="text-right text-gray-400 text-sm font-medium px-6 py-4">Conversions</th>
                <th className="text-right text-gray-400 text-sm font-medium px-6 py-4">Commission</th>
                <th className="text-right text-gray-400 text-sm font-medium px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredAffiliates.map((affiliate) => (
                <tr key={affiliate.id} className="hover:bg-gray-800/30">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{affiliate.name}</p>
                      <p className="text-gray-400 text-sm">{affiliate.email}</p>
                      {affiliate.website && (
                        <a href={affiliate.website} target="_blank" rel="noopener noreferrer" className="text-emerald-400 text-xs hover:underline">
                          {affiliate.website}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded text-sm">
                      {affiliate.code}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={affiliate.status} />
                  </td>
                  <td className="px-6 py-4 text-right text-white">
                    {affiliate._count.clicks}
                  </td>
                  <td className="px-6 py-4 text-right text-white">
                    {affiliate._count.conversions}
                  </td>
                  <td className="px-6 py-4 text-right text-emerald-400 font-medium">
                    ${affiliate.totalCommission.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      {affiliate.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(affiliate)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(affiliate.id, 'REJECTED')}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-sm rounded"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {affiliate.status === 'ACTIVE' && (
                        <button
                          onClick={() => updateStatus(affiliate.id, 'SUSPENDED')}
                          className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-sm rounded"
                        >
                          Suspend
                        </button>
                      )}
                      {affiliate.status === 'SUSPENDED' && (
                        <button
                          onClick={() => updateStatus(affiliate.id, 'ACTIVE')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredAffiliates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No affiliates found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-yellow-500/20 text-yellow-400',
    ACTIVE: 'bg-emerald-500/20 text-emerald-400',
    SUSPENDED: 'bg-red-500/20 text-red-400',
    REJECTED: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <span className={`text-xs px-2 py-1 rounded font-medium ${styles[status] || styles.PENDING}`}>
      {status}
    </span>
  );
}
