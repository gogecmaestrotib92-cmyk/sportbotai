'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Types for outreach tracking
interface OutreachEmail {
  id: string;
  toolName: string;
  toolUrl: string;
  contactEmail: string | null;
  blogSlug: string | null;
  reviewTitle: string | null;
  outreachStatus: string;
  outreachSentAt: string | null;
  outreachOpened: boolean;
  outreachClicked: boolean;
  outreachReplied: boolean;
  outreachReplyAt: string | null;
  backlinkStatus: string;
  backlinkUrl: string | null;
}

interface OutreachStats {
  total: number;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  notSent: number;
  noEmail: number;
}

// Email template types - Tool Review Outreach is default (most used)
const EMAIL_TEMPLATES = [
  {
    id: 'tool-review-outreach',
    name: 'Tool Review Outreach',
    description: 'Sent to tool owners after publishing review',
    params: { 
      toolName: '8rain Station', 
      reviewUrl: 'https://www.sportbotai.com/blog/8rain-station-review' 
    },
  },
  {
    id: 'welcome',
    name: 'Welcome Email',
    description: 'Sent after successful subscription',
    params: { planName: 'Pro' },
  },
  {
    id: 'renewal',
    name: 'Renewal Confirmation',
    description: 'Sent after subscription renewal',
    params: { planName: 'Pro', nextBillingDate: '2026-02-08' },
  },
  {
    id: 'payment-failed',
    name: 'Payment Failed',
    description: 'Sent when payment fails',
    params: { planName: 'Pro', updateUrl: 'https://www.sportbotai.com/account' },
  },
  {
    id: 'cancellation',
    name: 'Cancellation Confirmation',
    description: 'Sent when user cancels subscription',
    params: { planName: 'Pro', endDate: '2026-02-08' },
  },
  {
    id: 'trial-ending',
    name: 'Trial Ending Soon',
    description: 'Sent 3 days before trial ends',
    params: { daysLeft: 3 },
  },
  {
    id: 'registration-welcome',
    name: 'Registration Welcome',
    description: 'Sent after free registration',
    params: { name: 'John' },
  },
];

export default function EmailPreviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState(EMAIL_TEMPLATES[0]);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Outreach tracking state
  const [activeTab, setActiveTab] = useState<'templates' | 'outreach'>('outreach');
  const [outreachEmails, setOutreachEmails] = useState<OutreachEmail[]>([]);
  const [outreachStats, setOutreachStats] = useState<OutreachStats | null>(null);
  const [loadingOutreach, setLoadingOutreach] = useState(false);

  // Load outreach emails on mount
  useEffect(() => {
    if (session && activeTab === 'outreach') {
      loadOutreachEmails();
    }
  }, [session, activeTab]);

  const loadOutreachEmails = async () => {
    setLoadingOutreach(true);
    try {
      const res = await fetch('/api/admin/outreach-emails');
      const data = await res.json();
      if (data.outreachEmails) {
        setOutreachEmails(data.outreachEmails);
        setOutreachStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load outreach emails:', err);
    }
    setLoadingOutreach(false);
  };

  // Auth check
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  // Load preview
  const loadPreview = async (template: typeof EMAIL_TEMPLATES[0]) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/email-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id, params: template.params }),
      });
      const data = await res.json();
      if (data.html) {
        setPreviewHtml(data.html);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load preview' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load preview' });
    }
    setLoading(false);
  };

  // Send test email
  const sendTestEmail = async () => {
    if (!testEmail) {
      setMessage({ type: 'error', text: 'Enter an email address' });
      return;
    }
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/email-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          templateId: selectedTemplate.id, 
          params: selectedTemplate.params,
          sendTo: testEmail,
        }),
      });
      const data = await res.json();
      if (data.sent) {
        setMessage({ type: 'success', text: `Test email sent to ${testEmail}` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to send test email' });
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/admin" className="text-slate-400 hover:text-white text-sm">
                ← Back to Admin
              </a>
              <h1 className="text-xl font-bold">📧 Email Center</h1>
            </div>
            {activeTab === 'templates' && (
              <div className="flex items-center gap-3">
                <input
                  type="email"
                  placeholder="Test email address"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm w-64 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={sendTestEmail}
                  disabled={sending || !previewHtml}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                >
                  {sending ? 'Sending...' : 'Send Test'}
                </button>
              </div>
            )}
            {activeTab === 'outreach' && (
              <button
                onClick={loadOutreachEmails}
                disabled={loadingOutreach}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                {loadingOutreach ? 'Loading...' : '🔄 Refresh'}
              </button>
            )}
          </div>
          
          {/* Tabs */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab('outreach')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'outreach'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              📤 Outreach Tracking
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'templates'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              📝 Email Templates
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`max-w-7xl mx-auto px-4 mt-4`}>
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {message.text}
          </div>
        </div>
      )}

      {/* Outreach Tracking Tab */}
      {activeTab === 'outreach' && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Stats Cards */}
          {outreachStats && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <p className="text-2xl font-bold text-emerald-400">{outreachStats.sent + outreachStats.opened + outreachStats.clicked + outreachStats.replied}</p>
                <p className="text-xs text-slate-500 mt-1">Total Sent</p>
              </div>
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <p className="text-2xl font-bold text-blue-400">{outreachStats.opened}</p>
                <p className="text-xs text-slate-500 mt-1">Opened</p>
              </div>
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <p className="text-2xl font-bold text-purple-400">{outreachStats.clicked}</p>
                <p className="text-xs text-slate-500 mt-1">Clicked</p>
              </div>
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <p className="text-2xl font-bold text-amber-400">{outreachStats.replied}</p>
                <p className="text-xs text-slate-500 mt-1">Replied</p>
              </div>
            </div>
          )}

          {/* Outreach Table */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h2 className="font-semibold">Sent Outreach Emails</h2>
              <p className="text-xs text-slate-500 mt-1">Track outreach emails sent to tool owners for badge exchange</p>
            </div>
            
            {loadingOutreach ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
              </div>
            ) : outreachEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <p className="text-4xl mb-4">📭</p>
                <p>No outreach emails sent yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-slate-400">Tool</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-400">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-400">Sent</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-400">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-400">Backlink</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {outreachEmails.map((email) => (
                      <tr key={email.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <a 
                              href={email.toolUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-medium text-white hover:text-emerald-400 transition-colors"
                            >
                              {email.toolName}
                            </a>
                            {email.blogSlug && (
                              <a 
                                href={`https://www.sportbotai.com/blog/${email.blogSlug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs text-slate-500 hover:text-emerald-400 mt-0.5"
                              >
                                📝 View Review
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-400 font-mono text-xs">{email.contactEmail || '-'}</span>
                        </td>
                        <td className="px-4 py-3">
                          {email.outreachSentAt ? (
                            <span className="text-slate-400 text-xs">
                              {new Date(email.outreachSentAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            email.outreachStatus === 'REPLIED' ? 'bg-amber-500/20 text-amber-400' :
                            email.outreachStatus === 'CLICKED' ? 'bg-purple-500/20 text-purple-400' :
                            email.outreachStatus === 'OPENED' ? 'bg-blue-500/20 text-blue-400' :
                            email.outreachStatus === 'BOUNCED' ? 'bg-red-500/20 text-red-400' :
                            'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {email.outreachStatus === 'REPLIED' && '💬'}
                            {email.outreachStatus === 'CLICKED' && '👆'}
                            {email.outreachStatus === 'OPENED' && '👁️'}
                            {email.outreachStatus === 'BOUNCED' && '❌'}
                            {email.outreachStatus === 'SENT' && '✉️'}
                            {email.outreachStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            email.backlinkStatus === 'DOFOLLOW' ? 'bg-emerald-500/20 text-emerald-400' :
                            email.backlinkStatus === 'NOFOLLOW' ? 'bg-amber-500/20 text-amber-400' :
                            email.backlinkStatus === 'PENDING' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {email.backlinkStatus === 'DOFOLLOW' && '✅'}
                            {email.backlinkStatus === 'NOFOLLOW' && '⚠️'}
                            {email.backlinkStatus === 'PENDING' && '⏳'}
                            {email.backlinkStatus === 'NONE' && '—'}
                            {email.backlinkStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {email.blogSlug && (
                              <a
                                href={`https://www.sportbotai.com/blog/${email.blogSlug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-slate-400 hover:text-emerald-400"
                                title="View Review"
                              >
                                🔗
                              </a>
                            )}
                            <a
                              href={email.toolUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-slate-400 hover:text-emerald-400"
                              title="Visit Tool"
                            >
                              🌐
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Template List */}
          <div className="col-span-3">
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h2 className="font-semibold text-sm text-slate-400 uppercase tracking-wide">Templates</h2>
              </div>
              <div className="divide-y divide-slate-800">
                {EMAIL_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template);
                      loadPreview(template);
                    }}
                    className={`w-full text-left p-4 transition-colors ${
                      selectedTemplate.id === template.id
                        ? 'bg-emerald-500/10 border-l-2 border-emerald-500'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Warning */}
            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-xs text-amber-400">
                <strong>⚠️ Note:</strong> Many email clients block images by default. 
                The logo may not show until recipient clicks "Show images".
              </p>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="col-span-9">
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{selectedTemplate.name}</h2>
                  <p className="text-xs text-slate-500 mt-1">{selectedTemplate.description}</p>
                </div>
                <button
                  onClick={() => loadPreview(selectedTemplate)}
                  disabled={loading}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors"
                >
                  {loading ? 'Loading...' : '🔄 Refresh Preview'}
                </button>
              </div>

              {/* Email Preview */}
              <div className="bg-slate-950 min-h-[600px]">
                {loading ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
                  </div>
                ) : previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-[700px] border-0"
                    title="Email Preview"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 text-slate-500">
                    <p className="text-4xl mb-4">📧</p>
                    <p>Click a template to preview</p>
                    <button
                      onClick={() => loadPreview(selectedTemplate)}
                      className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm text-white font-medium"
                    >
                      Load Preview
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Parameters */}
            <div className="mt-4 p-4 bg-slate-900 rounded-xl border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Template Parameters</h3>
              <pre className="text-xs text-emerald-400 bg-slate-950 p-3 rounded-lg overflow-x-auto">
                {JSON.stringify(selectedTemplate.params, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
