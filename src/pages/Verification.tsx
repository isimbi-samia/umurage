import React, { useState } from 'react';
import { CheckCircle, Shield, AlertCircle, Loader2, Upload, ChevronRight, Clock, XCircle, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'Traditional Artist', icon: '🎨', desc: 'Musicians, dancers, visual artists, craftspeople' },
  { value: 'Historian', icon: '📚', desc: 'Academic or community historians of Rwandan history' },
  { value: 'Researcher', icon: '🔬', desc: 'Cultural researchers and anthropologists' },
  { value: 'Cultural Educator', icon: '🎓', desc: 'Teachers and educators promoting Rwandan culture' },
  { value: 'Museum Representative', icon: '🏛️', desc: 'Staff or representatives of cultural institutions' },
  { value: 'Heritage Organization', icon: '🌿', desc: 'Non-profits, NGOs, and cultural organizations' },
  { value: 'Emerging Cultural Creator', icon: '⭐', desc: 'Young creators under 35 promoting culture' },
  { value: 'Other', icon: '🤝', desc: 'Other cultural contributors and heritage workers' },
];

const BADGE_TIERS = [
  {
    icon: '🟢', title: 'Verified Cultural Figure', color: 'text-green-400', bg: 'bg-green-900/20 border-green-800/40',
    desc: 'Recognized artists, performers, historians, researchers, and educators',
    for: ['Traditional Artist', 'Historian', 'Researcher', 'Cultural Educator'],
  },
  {
    icon: '🟢', title: 'Official Cultural Institution', color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-800/40',
    desc: 'Museums, schools, cultural organizations, and heritage projects',
    for: ['Museum Representative', 'Heritage Organization'],
  },
  {
    icon: '🟢', title: 'Heritage Contributor', color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-800/40',
    desc: 'People documenting family history, local traditions, and community heritage',
    for: ['Other'],
  },
  {
    icon: '🟢', title: 'Emerging Cultural Creator', color: 'text-purple-400', bg: 'bg-purple-900/20 border-purple-800/40',
    desc: 'Young creators under 35 promoting and preserving Rwandan culture',
    for: ['Emerging Cultural Creator'],
  },
];

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-800/40', label: 'Application Submitted' },
  under_review: { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-800/40', label: 'Under Review' },
  approved: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/20 border-green-800/40', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-900/20 border-red-800/40', label: 'Rejected' },
  more_info_required: { icon: Info, color: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-800/40', label: 'More Information Required' },
};

function useMyApplication(userId?: string) {
  return useQuery({
    queryKey: ['my-verification', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('verification_applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

function useSubmitApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (app: {
      user_id: string;
      full_name: string;
      category: string;
      biography: string;
      evidence_description: string;
      evidence_links: string[];
      awards: string;
      published_works: string;
      certificates: string;
    }) => {
      const { data, error } = await supabase.from('verification_applications').insert(app).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, { user_id }) => {
      qc.invalidateQueries({ queryKey: ['my-verification', user_id] });
      toast.success('Verification application submitted!');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---- Badge Info Tooltip / Modal ----
const BadgeInfoModal: React.FC<{ verifiedType: string; onClose: () => void }> = ({ verifiedType, onClose }) => {
  const tier = BADGE_TIERS.find(t => t.for.includes(verifiedType)) || BADGE_TIERS[0];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl p-6 animate-fade-in" style={{ background: 'rgba(22,14,5,0.99)', border: '1px solid rgba(200,150,12,0.3)' }}>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold mb-4 ${tier.bg} ${tier.color}`}>
          {tier.icon} {tier.title}
        </div>
        <h3 className="font-cinzel text-umurage-gold text-lg font-bold mb-2">{tier.title}</h3>
        <p className="text-umurage-muted text-sm mb-3">{tier.desc}</p>
        <div className="bg-umurage-surface border border-umurage-border rounded-xl p-3 text-xs text-umurage-subtle leading-relaxed">
          This account has been verified by Umurage Hub after confirming the person's identity and cultural contribution. Category: <strong className="text-umurage-cream">{verifiedType}</strong>
        </div>
        <button onClick={onClose} className="btn-gold w-full mt-4 py-2.5 text-sm">Close</button>
      </div>
    </div>
  );
};

// ---- Application Form ----
const ApplicationForm: React.FC<{ userId: string; onSubmit: () => void }> = ({ userId, onSubmit }) => {
  const submitApp = useSubmitApplication();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    full_name: '',
    category: '',
    biography: '',
    evidence_description: '',
    evidence_links: '',
    awards: '',
    published_works: '',
    certificates: '',
  });

  const inp = "w-full bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60 transition-colors";

  const handleFinalSubmit = async () => {
    if (!form.full_name || !form.category || !form.biography) {
      toast.error('Please complete all required fields');
      return;
    }
    await submitApp.mutateAsync({
      user_id: userId,
      full_name: form.full_name,
      category: form.category,
      biography: form.biography,
      evidence_description: form.evidence_description,
      evidence_links: form.evidence_links.split('\n').map(l => l.trim()).filter(Boolean),
      awards: form.awards,
      published_works: form.published_works,
      certificates: form.certificates,
    });
    onSubmit();
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <React.Fragment key={s}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step >= s ? 'bg-umurage-gold text-umurage-bg' : 'bg-umurage-card text-umurage-subtle border border-umurage-border'
            }`}>{s}</div>
            {s < 3 && <div className={`flex-1 h-0.5 transition-all ${step > s ? 'bg-umurage-gold' : 'bg-umurage-border'}`} />}
          </React.Fragment>
        ))}
      </div>
      <div className="flex justify-between text-xs text-umurage-muted mb-8 -mt-6">
        <span>Identity</span>
        <span>Category</span>
        <span>Evidence</span>
      </div>

      {/* Step 1: Identity */}
      {step === 1 && (
        <div className="umurage-card rounded-2xl p-6 animate-fade-in">
          <h3 className="font-cinzel text-umurage-gold text-lg font-bold mb-5">Your Identity</h3>
          <div className="space-y-4">
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Full Legal Name *</label>
              <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Your full name as on your ID" className={inp} />
            </div>
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Biography / Profile *</label>
              <textarea value={form.biography} onChange={e => setForm(f => ({ ...f, biography: e.target.value }))}
                placeholder="Describe your background, cultural work, and why you deserve verification..."
                rows={5} className={`${inp} resize-none leading-relaxed`} />
            </div>
          </div>
          <button
            onClick={() => form.full_name && form.biography ? setStep(2) : toast.error('Please fill required fields')}
            className="btn-gold w-full py-3 mt-5 flex items-center justify-center gap-2"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Step 2: Category */}
      {step === 2 && (
        <div className="umurage-card rounded-2xl p-6 animate-fade-in">
          <h3 className="font-cinzel text-umurage-gold text-lg font-bold mb-2">Cultural Category</h3>
          <p className="text-umurage-muted text-sm mb-5">Select the category that best describes your cultural contribution.</p>
          <div className="grid grid-cols-1 gap-2 mb-5">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                  form.category === cat.value
                    ? 'border-umurage-gold bg-umurage-gold/10'
                    : 'border-umurage-border bg-umurage-surface hover:border-umurage-gold/30'
                }`}
              >
                <span className="text-2xl flex-shrink-0">{cat.icon}</span>
                <div>
                  <p className={`text-sm font-semibold ${form.category === cat.value ? 'text-umurage-gold' : 'text-umurage-cream'}`}>{cat.value}</p>
                  <p className="text-umurage-subtle text-xs mt-0.5">{cat.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-outline-gold flex-1 py-3 text-sm">Back</button>
            <button
              onClick={() => form.category ? setStep(3) : toast.error('Select a category')}
              className="btn-gold flex-1 py-3 flex items-center justify-center gap-2"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Evidence */}
      {step === 3 && (
        <div className="umurage-card rounded-2xl p-6 animate-fade-in">
          <h3 className="font-cinzel text-umurage-gold text-lg font-bold mb-5">Supporting Evidence</h3>
          <div className="space-y-4">
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Description of Contribution</label>
              <textarea value={form.evidence_description}
                onChange={e => setForm(f => ({ ...f, evidence_description: e.target.value }))}
                placeholder="Describe your awards, performances, research, or cultural work..."
                rows={3} className={`${inp} resize-none`} />
            </div>
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Links to Work (one per line)</label>
              <textarea value={form.evidence_links}
                onChange={e => setForm(f => ({ ...f, evidence_links: e.target.value }))}
                placeholder={"https://example.com/my-work\nhttps://youtube.com/mychannel"}
                rows={3} className={`${inp} resize-none font-mono text-xs`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-umurage-muted text-xs font-medium block mb-1.5">Awards & Recognition</label>
                <textarea value={form.awards}
                  onChange={e => setForm(f => ({ ...f, awards: e.target.value }))}
                  placeholder="List any awards..." rows={2} className={`${inp} resize-none`} />
              </div>
              <div>
                <label className="text-umurage-muted text-xs font-medium block mb-1.5">Published Works</label>
                <textarea value={form.published_works}
                  onChange={e => setForm(f => ({ ...f, published_works: e.target.value }))}
                  placeholder="Books, articles, recordings..." rows={2} className={`${inp} resize-none`} />
              </div>
            </div>
            <div className="flex items-start gap-2 bg-umurage-gold/5 border border-umurage-gold/20 rounded-xl p-3">
              <AlertCircle size={14} className="text-umurage-gold flex-shrink-0 mt-0.5" />
              <p className="text-umurage-muted text-xs leading-relaxed">
                Our verification committee will review your application within 7-14 business days. Providing false information will result in permanent disqualification.
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setStep(2)} className="btn-outline-gold flex-1 py-3 text-sm">Back</button>
            <button
              onClick={handleFinalSubmit}
              disabled={submitApp.isPending}
              className="btn-gold flex-1 py-3 flex items-center justify-center gap-2"
            >
              {submitApp.isPending ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
              Submit Application
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ---- Status Card ----
const ApplicationStatus: React.FC<{ application: Record<string, unknown> }> = ({ application }) => {
  const status = application.status as keyof typeof STATUS_CONFIG;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;

  const steps = [
    { key: 'pending', label: 'Submitted', done: true },
    { key: 'under_review', label: 'Under Review', done: ['under_review', 'approved', 'rejected', 'more_info_required'].includes(status) },
    { key: 'approved', label: 'Decision', done: ['approved', 'rejected'].includes(status) },
  ];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Status banner */}
      <div className={`umurage-card rounded-2xl p-6 mb-6 border ${config.bg}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
            <StatusIcon size={24} className={config.color} />
          </div>
          <div>
            <p className="text-umurage-subtle text-xs font-semibold uppercase tracking-wider">Application Status</p>
            <h3 className={`font-cinzel text-xl font-bold ${config.color}`}>{config.label}</h3>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-4">
          {steps.map((s, i) => (
            <React.Fragment key={s.key}>
              <div className={`flex items-center gap-1.5 text-xs font-medium ${s.done ? config.color : 'text-umurage-subtle'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${s.done ? `border-current ${config.bg}` : 'border-umurage-border'}`}>
                  {s.done ? '✓' : i + 1}
                </div>
                {s.label}
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${s.done && steps[i+1].done ? 'bg-current' : 'bg-umurage-border'}`} />}
            </React.Fragment>
          ))}
        </div>

        {application.reviewer_notes && (
          <div className="bg-umurage-surface border border-umurage-border rounded-xl p-3">
            <p className="text-umurage-subtle text-xs font-semibold mb-1">Reviewer Note:</p>
            <p className="text-umurage-muted text-sm">{application.reviewer_notes as string}</p>
          </div>
        )}
      </div>

      {/* Application details */}
      <div className="umurage-card rounded-2xl p-6">
        <h3 className="text-umurage-cream font-semibold mb-4">Application Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-umurage-border/50">
            <span className="text-umurage-subtle text-sm">Full Name</span>
            <span className="text-umurage-cream text-sm font-medium">{application.full_name as string}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-umurage-border/50">
            <span className="text-umurage-subtle text-sm">Category</span>
            <span className="text-umurage-cream text-sm font-medium">{application.category as string}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-umurage-border/50">
            <span className="text-umurage-subtle text-sm">Submitted</span>
            <span className="text-umurage-cream text-sm">{new Date(application.created_at as string).toLocaleDateString()}</span>
          </div>
          {application.reviewed_at && (
            <div className="flex justify-between py-2">
              <span className="text-umurage-subtle text-sm">Reviewed</span>
              <span className="text-umurage-cream text-sm">{new Date(application.reviewed_at as string).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---- Main Verification Page ----
const Verification: React.FC = () => {
  const { user, isAuthenticated, openAuth } = useAuth();
  const { data: application, isLoading } = useMyApplication(user?.id);
  const [submitted, setSubmitted] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-24 animate-fade-in">
        <Shield size={48} className="text-umurage-gold/30 mx-auto mb-4" />
        <h2 className="font-cinzel text-umurage-gold text-2xl font-bold mb-3">Cultural Verification</h2>
        <p className="text-umurage-muted text-sm mb-6 max-w-sm mx-auto">Sign in to apply for a verified green badge on Umurage Hub.</p>
        <button onClick={() => openAuth('login')} className="btn-gold px-8 py-3">Sign In to Apply</button>
      </div>
    );
  }

  if (user?.verified) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="text-center py-12">
          <div className="w-24 h-24 rounded-full bg-green-900/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={48} className="text-green-400" />
          </div>
          <h2 className="font-cinzel text-umurage-gold text-2xl font-bold mb-3">You Are Verified! 🟢</h2>
          <p className="text-umurage-muted text-sm mb-2">Your account carries the official Umurage Hub verification badge.</p>
          {user.verifiedType && (
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-green-900/20 border border-green-800/40 text-green-400 font-semibold mt-2">
              <CheckCircle size={12} /> {user.verifiedType}
            </span>
          )}
        </div>
        <div className="umurage-card rounded-2xl p-6">
          <h3 className="text-umurage-cream font-semibold mb-4">Verification Information</h3>
          <p className="text-umurage-muted text-sm leading-relaxed">
            Your green badge is visible to all Umurage Hub users and signals authenticity, trust, and genuine cultural contribution. It helps prevent impersonation and builds community confidence in your content.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={24} className="text-umurage-gold" />
          <h1 className="font-cinzel text-3xl text-umurage-gold font-bold">Cultural Verification</h1>
        </div>
        <p className="text-umurage-muted text-base max-w-xl">
          Apply for the Umurage Hub green badge — a symbol of cultural authenticity, trust, and heritage authority.
        </p>
      </div>

      {/* Badge types */}
      {!application && !submitted && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {BADGE_TIERS.map((tier, i) => (
            <div key={i} className={`rounded-xl border p-4 ${tier.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{tier.icon}</span>
                <span className={`text-sm font-semibold ${tier.color}`}>{tier.title}</span>
              </div>
              <p className="text-umurage-subtle text-xs leading-relaxed">{tier.desc}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="text-umurage-gold animate-spin" /></div>
      ) : application ? (
        <ApplicationStatus application={application as Record<string, unknown>} />
      ) : submitted ? (
        <div className="text-center py-12 animate-fade-in">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
          <h3 className="font-cinzel text-umurage-gold text-xl font-bold mb-2">Application Submitted!</h3>
          <p className="text-umurage-muted text-sm max-w-sm mx-auto">Your verification request is now under review. You will be notified when a decision is made (7-14 days).</p>
        </div>
      ) : (
        <ApplicationForm userId={user.id} onSubmit={() => setSubmitted(true)} />
      )}
    </div>
  );
};

export default Verification;
