'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Email template types
const EMAIL_TEMPLATES = [
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
  {
    id: 'tool-review-outreach',
    name: 'Tool Review Outreach',
    description: 'Sent to tool owners after publishing review',
    params: { 
      toolName: '8rain Station', 
      reviewUrl: 'https://www.sportbotai.com/blog/8rain-station-review' 
    },
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
              <h1 className="text-xl font-bold">📧 Email Templates</h1>
            </div>
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
    </div>
  );
}
