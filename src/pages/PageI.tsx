import { FormEvent, useState } from 'react';

type ContactStatus = 'idle' | 'submitting' | 'success' | 'error';

const CONTACT_REASONS = [
  'Request a demo',
  'Partnership',
  'Investor / Press',
  'General inquiry',
  'Support',
] as const;

const INITIAL_FORM = {
  full_name: '',
  work_email: '',
  company: '',
  role: '',
  reason_for_contact: '',
  message: '',
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function PageI() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState<ContactStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const endpoint = import.meta.env.VITE_CONTACT_SHEET_ENDPOINT;
  const isSubmitting = status === 'submitting';

  const updateField = (field: keyof typeof INITIAL_FORM, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (status !== 'submitting') {
      setStatus('idle');
      setErrorMessage('');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextForm = {
      ...form,
      full_name: form.full_name.trim(),
      work_email: form.work_email.trim(),
      company: form.company.trim(),
      role: form.role.trim(),
      reason_for_contact: form.reason_for_contact.trim(),
      message: form.message.trim(),
    };

    if (!nextForm.full_name || !isValidEmail(nextForm.work_email) || !nextForm.message) {
      setStatus('error');
      setErrorMessage('Please complete your name, a valid work email, and your message.');
      return;
    }

    if (!endpoint) {
      setStatus('error');
      setErrorMessage('Contact endpoint is not configured.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(nextForm),
      });

      if (!response.ok) {
        throw new Error(`Contact request failed with status ${response.status}`);
      }

      setForm(INITIAL_FORM);
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again later.');
    }
  };

  return (
    <div className="app-page-shell h-full min-h-0 min-w-0 overflow-hidden px-2 py-2 sm:px-3 sm:py-3">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-col">
        <div className="ui-surface flex min-h-0 flex-1 overflow-hidden rounded-[26px]">
          <div className="grid min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_28%),linear-gradient(135deg,#f8fafc_0%,#eef2f7_100%)] px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(420px,0.72fr)] lg:gap-10 lg:px-12 lg:py-10">
            <section className="flex min-h-0 flex-col justify-between gap-8">
              <div>
                <div className="inline-flex rounded-full border border-neutral-200 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500 shadow-sm">
                  Contact channel
                </div>
                <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-[-0.05em] text-neutral-950 sm:text-5xl">
                  Contact Us
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-6 text-neutral-600 sm:text-base">
                  Send us your message and we will review it.
                </p>
              </div>

              <div className="grid max-w-xl gap-3 text-sm leading-6 text-neutral-700">
                <div className="rounded-[20px] border border-neutral-200 bg-white/72 px-4 py-4 shadow-sm">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    What happens next
                  </div>
                  <p className="mt-2">
                    AISync stores the contact request as a structured row for review. No public inbox,
                    no email automation, and no extra product module are created from this form.
                  </p>
                </div>
                <div className="rounded-[20px] border border-neutral-200 bg-white/72 px-4 py-4 shadow-sm">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Data captured
                  </div>
                  <p className="mt-2">
                    Submissions are sent to one configured Google Sheets endpoint with status initialized
                    by the endpoint as <span className="font-semibold text-neutral-900">new</span>.
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-8 min-h-0 lg:mt-0">
              <form
                className="ui-surface grid gap-4 rounded-[24px] px-4 py-5 shadow-xl shadow-slate-900/8 sm:px-5"
                onSubmit={handleSubmit}
              >
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Message details
                  </div>
                  <div className="mt-1 text-lg font-semibold tracking-[-0.03em] text-neutral-950">
                    Tell us how we can help.
                  </div>
                </div>

                <label className="grid gap-1.5">
                  <span className="ui-label">Full name</span>
                  <input
                    className="ui-input text-sm"
                    type="text"
                    value={form.full_name}
                    onChange={(event) => updateField('full_name', event.target.value)}
                    required
                    autoComplete="name"
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="ui-label">Work email</span>
                  <input
                    className="ui-input text-sm"
                    type="email"
                    value={form.work_email}
                    onChange={(event) => updateField('work_email', event.target.value)}
                    required
                    autoComplete="email"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="ui-label">Company / Organization</span>
                    <input
                      className="ui-input text-sm"
                      type="text"
                      value={form.company}
                      onChange={(event) => updateField('company', event.target.value)}
                      autoComplete="organization"
                    />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="ui-label">Role / Job title</span>
                    <input
                      className="ui-input text-sm"
                      type="text"
                      value={form.role}
                      onChange={(event) => updateField('role', event.target.value)}
                      autoComplete="organization-title"
                    />
                  </label>
                </div>

                <label className="grid gap-1.5">
                  <span className="ui-label">Reason for contact</span>
                  <select
                    className="ui-input text-sm"
                    value={form.reason_for_contact}
                    onChange={(event) => updateField('reason_for_contact', event.target.value)}
                  >
                    <option value="">Select a reason</option>
                    {CONTACT_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5">
                  <span className="ui-label">Message</span>
                  <textarea
                    className="ui-input min-h-32 resize-y text-sm leading-6"
                    value={form.message}
                    onChange={(event) => updateField('message', event.target.value)}
                    required
                  />
                </label>

                {status === 'success' ? (
                  <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    Message sent successfully.
                  </div>
                ) : null}

                {status === 'error' ? (
                  <div className="rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                    {errorMessage || 'Something went wrong. Please try again later.'}
                  </div>
                ) : null}

                <div className="flex justify-end">
                  <button
                    className="ui-button ui-button-primary min-h-10 px-5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send message'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
