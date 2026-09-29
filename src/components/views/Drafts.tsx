'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangleIcon, CheckCircle2Icon, MessageCircleWarningIcon, XIcon } from 'lucide-react';
import { Panel } from '@/components/Panel';
import { ApiError, brandsApi, draftsApi, platformActionsApi } from '@/lib/api';
import type { Brand, Draft, PlatformAction } from '@/lib/types';
import { ago } from '@/utils/format';

/**
 * Drafts and brand memory (phase 7).
 *
 * Tasks write posts and replies as DRAFTS — nothing is posted. Each is checked
 * in code against the brand: its prices and times only, nothing it never says,
 * the platform's length, not a repeat of what you already approved. You
 * approve, edit (checked again) or reject; what you approve becomes the
 * brand's "already said".
 */
export function Drafts() {
  const [brands, setBrands] = useState<Brand[] | null>(null);
  const loadBrands = () => brandsApi.list().then(setBrands).catch(() => setBrands([]));
  useEffect(() => { loadBrands(); }, []);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight text-ink-900">Drafts</h1>
        <p className="mt-1 text-[13px] text-ink-500">What tasks wrote for you to approve — nothing is posted — and the brand memory they write from.</p>
      </div>
      <DraftsPanel brands={brands || []} />
      <BrandsPanel brands={brands} onChanged={loadBrands} />
    </div>);
}

const TABS: { id: Draft['status']; label: string }[] = [
  { id: 'draft', label: 'To review' }, { id: 'approved', label: 'Approved' }, { id: 'rejected', label: 'Rejected' },
];

function DraftsPanel({ brands }: { brands: Brand[] }) {
  const [tab, setTab] = useState<Draft['status']>('draft');
  const [list, setList] = useState<Draft[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = () => draftsApi.list({ status: tab }).then(setList).catch(() => setError('Could not load drafts.'));
  useEffect(() => { setList(null); load(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Panel title="Drafts" description="Checked against the brand in code. Approve, edit or reject; an approved draft is posted only when you choose Publish — once.">
      <Compose brands={brands} onSaved={() => { setTab('draft'); load(); }} />
      <div className="mb-3 flex gap-1">
        {TABS.map((t) =>
        <button key={t.id} type="button" onClick={() => setTab(t.id)}
          className={`cursor-pointer rounded-md px-2.5 py-1 text-[12px] font-medium ${tab === t.id ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-canvas'}`}>{t.label}</button>
        )}
      </div>
      {error && <p role="alert" className="mb-2 text-[12px] text-danger-700">{error}</p>}
      <ul className="space-y-3">
        {(list || []).map((d) => <DraftCard key={d.id} draft={d} brand={brands.find((b) => b.id === d.brand_id) || null} onChanged={load} />)}
        {list && list.length === 0 && <li className="text-[12px] text-ink-500">{tab === 'draft' ? 'Nothing to review.' : 'None.'}</li>}
      </ul>
    </Panel>);
}

function DraftCard({ draft, brand, onChanged }: { draft: Draft; brand: Brand | null; onChanged: () => void }) {
  const [text, setText] = useState(draft.text || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checks, setChecks] = useState(draft.checks);
  const edited = text.trim() !== (draft.text || '').trim();

  async function decide(action: 'approve' | 'reject' | 'edit') {
    setBusy(true);
    setError(null);
    try {
      const d = await draftsApi.decide(draft.id, action, edited ? text : undefined);
      setChecks(d.checks);
      if (action !== 'edit') onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  const problems = checks.problems || [];
  const limit = checks.length?.limit;
  return (
    <li className="rounded-lg border border-line px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-500">
        <span className="font-medium text-ink-700">{draft.kind === 'reply' ? 'Reply' : 'Post'}</span>
        {draft.platform && <span>· {draft.platform}</span>}
        {brand && <span>· {brand.name}</span>}
        {draft.planned_for && <span>· for {new Date(draft.planned_for).toLocaleString()}</span>}
        {draft.in_reply_to && <span>· to comment {draft.in_reply_to}</span>}
        <span>· {ago(draft.created_at)}</span>
        {draft.task_id && <Link href={`/app/tasks/${draft.task_id}`} className="text-brand-700 hover:text-brand-500">from its task</Link>}
      </div>
      {checks.escalate &&
      <p className="mt-2 flex items-start gap-1.5 rounded-md bg-warn-50 px-2 py-1.5 text-[12px] text-warn-700">
          <MessageCircleWarningIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" /> For you to answer: {checks.escalate}
        </p>}
      {draft.status === 'draft' ?
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={Math.min(8, Math.max(2, Math.ceil(text.length / 70)))} aria-label="Draft text"
        placeholder={checks.escalate ? 'Write your own reply, or reject.' : ''}
        className="mt-2 w-full rounded-md border border-line bg-panel px-3 py-2 text-[13px] leading-relaxed text-ink-900" /> :
      <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-900">{draft.text}</p>}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
        {checks.ok && !edited && <span className="inline-flex items-center gap-1 text-ok-700"><CheckCircle2Icon className="h-3.5 w-3.5" /> Checks passed</span>}
        {problems.map((p) => <span key={p} className="inline-flex items-center gap-1 text-danger-700"><AlertTriangleIcon className="h-3.5 w-3.5" /> {p}</span>)}
        {limit && <span className={`${[...text].length > limit ? 'text-danger-700' : 'text-ink-500'}`}>{[...text].length}/{limit}</span>}
      </div>
      {error && <p role="alert" className="mt-1 text-[12px] text-danger-700">{error}</p>}
      {draft.status === 'approved' && <PublishControls draft={draft} onChanged={onChanged} />}
      {draft.status === 'draft' &&
      <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" disabled={busy || !text.trim()} onClick={() => decide('approve')} className="cursor-pointer rounded-md bg-brand-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-brand-500 disabled:opacity-60">{edited ? 'Approve my edit' : 'Approve'}</button>
          {edited && <button type="button" disabled={busy} onClick={() => decide('edit')} className="cursor-pointer rounded-md border border-line bg-panel px-3 py-1.5 text-[12px] font-medium text-ink-700 hover:bg-canvas disabled:opacity-60">Check my edit</button>}
          <button type="button" disabled={busy} onClick={() => decide('reject')} className="cursor-pointer rounded-md border border-line bg-panel px-3 py-1.5 text-[12px] font-medium text-ink-700 hover:bg-canvas disabled:opacity-60">Reject</button>
        </div>}
    </li>);
}

const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

function BrandsPanel({ brands, onChanged }: { brands: Brand[] | null; onChanged: () => void }) {
  const [editing, setEditing] = useState<Brand | 'new' | null>(null);
  return (
    <Panel title="Brand memory" description="What drafts are written from — and checked against. Prices and times in a draft must be one of these facts.">
      <ul className="divide-y divide-line rounded-md border border-line">
        {(brands || []).map((b) =>
        <li key={b.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
            <button type="button" onClick={() => setEditing(b)} className="cursor-pointer text-left">
              <span className="font-medium text-ink-900">{b.name}</span>
              <span className="text-ink-500"> · {b.facts.length} fact{b.facts.length === 1 ? '' : 's'}{b.never_say.length ? ` · ${b.never_say.length} never-say` : ''}</span>
            </button>
            <button type="button" onClick={() => brandsApi.remove(b.id).then(onChanged).catch(() => {})} aria-label={`Remove ${b.name}`} className="cursor-pointer rounded p-1 text-ink-400 hover:text-ink-900"><XIcon className="h-3.5 w-3.5" /></button>
          </li>
        )}
        {brands && brands.length === 0 && <li className="px-3 py-2 text-[12px] text-ink-500">None yet. Without one, drafts may state no prices or times at all.</li>}
      </ul>
      {!editing && <button type="button" onClick={() => setEditing('new')} className="mt-3 cursor-pointer rounded-md bg-brand-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-brand-500">Add a brand</button>}
      {editing && <BrandForm brand={editing === 'new' ? null : editing} onDone={() => { setEditing(null); onChanged(); }} />}
    </Panel>);
}

function BrandForm({ brand, onDone }: { brand: Brand | null; onDone: () => void }) {
  const [name, setName] = useState(brand?.name || '');
  const [voice, setVoice] = useState(brand?.voice || '');
  const [facts, setFacts] = useState((brand?.facts || []).map((f) => `${f.name}: ${f.value}`).join('\n'));
  const [neverSay, setNeverSay] = useState((brand?.never_say || []).join('\n'));
  const [hashtags, setHashtags] = useState((brand?.hashtags || []).join(' '));
  const [autoReply, setAutoReply] = useState(Boolean(brand?.reply_rules?.auto));
  const [maxPerHour, setMaxPerHour] = useState(String(brand?.reply_rules?.max_per_hour || 5));
  const [from, setFrom] = useState(brand?.reply_rules?.hours?.from || '08:00');
  const [to, setTo] = useState(brand?.reply_rules?.hours?.to || '20:00');
  const [mentions, setMentions] = useState((brand?.allowed_mentions || []).map((m) => `@${m}`).join(' '));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    const input = {
      name,
      voice,
      facts: lines(facts).map((l) => { const i = l.indexOf(':'); return i > 0 ? { name: l.slice(0, i).trim(), value: l.slice(i + 1).trim() } : { name: l, value: '' }; }),
      never_say: lines(neverSay),
      hashtags: hashtags.split(/\s+/).filter(Boolean),
      reply_rules: { auto: autoReply, facts_only: true, max_per_hour: Number(maxPerHour) || 5, hours: { from, to, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos' } },
      allowed_mentions: mentions.split(/[\s,]+/).filter(Boolean),
    };
    try {
      if (brand) await brandsApi.update(brand.id, input); else await brandsApi.create(input);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  const field = 'w-full rounded-md border border-line bg-panel px-3 py-2 text-[12px] text-ink-900';
  return (
    <div className="mt-3 space-y-2 rounded-md border border-line bg-canvas p-3">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Brand name" aria-label="Brand name" className={field} />
      <textarea value={voice} onChange={(e) => setVoice(e.target.value)} rows={2} placeholder="Voice, e.g. warm, short, a little playful; Nigerian English" aria-label="Voice" className={field} />
      <textarea value={facts} onChange={(e) => setFacts(e.target.value)} rows={4} placeholder={'Facts, one per line as name: value\nmeat pie: ₦1,500\nopening hours: 7am to 8pm, Monday to Saturday'} aria-label="Facts" className={`${field} font-mono`} />
      <textarea value={neverSay} onChange={(e) => setNeverSay(e.target.value)} rows={2} placeholder={'Never say, one per line\ncheapest in Lagos'} aria-label="Never say" className={field} />
      <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#hashtags it uses" aria-label="Hashtags" className={field} />
      <input value={mentions} onChange={(e) => setMentions(e.target.value)} placeholder="@accounts a post may name without asking you" aria-label="Allowed mentions" className={field} />
      <fieldset className="rounded-md border border-line bg-panel px-3 py-2 text-[12px] text-ink-800">
        <label className="flex items-center gap-2 font-medium">
          <input type="checkbox" checked={autoReply} onChange={(e) => setAutoReply(e.target.checked)} /> Reply to comments automatically
        </label>
        <p className="mt-1 text-ink-500">Only replies that pass every check — the brand&apos;s own prices and times, nobody else named, not marked for you — within these hours and this many an hour. Anything else waits for you.</p>
        {autoReply &&
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span>From</span><input type="time" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" className="rounded border border-line px-1.5 py-1" />
          <span>to</span><input type="time" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" className="rounded border border-line px-1.5 py-1" />
          <span>at most</span><input type="number" min={1} max={60} value={maxPerHour} onChange={(e) => setMaxPerHour(e.target.value)} aria-label="Most per hour" className="w-16 rounded border border-line px-1.5 py-1" /><span>an hour</span>
        </div>}
      </fieldset>
      {error && <p role="alert" className="text-[12px] text-danger-700">{error}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={busy || !name.trim()} onClick={save} className="cursor-pointer rounded-md bg-brand-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-brand-500 disabled:opacity-60">Save</button>
        <button type="button" onClick={onDone} className="cursor-pointer rounded-md border border-line bg-panel px-3 py-1.5 text-[12px] font-medium text-ink-700 hover:bg-canvas">Cancel</button>
      </div>
    </div>);
}

/** A post you write yourself: checked against the brand like any draft. */
function Compose({ brands, onSaved }: { brands: Brand[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [brandId, setBrandId] = useState('');
  const [when, setWhen] = useState('');
  const [error, setError] = useState<string | null>(null);
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="mb-3 cursor-pointer text-[12px] font-medium text-brand-700 hover:text-brand-500">+ Write a post yourself</button>;
  return (
    <div className="mb-4 space-y-2 rounded-md border border-line bg-canvas p-3">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} aria-label="Your post" placeholder="What to post" className="w-full rounded-md border border-line bg-panel px-3 py-2 text-[13px] text-ink-900" />
      <div className="flex flex-wrap items-center gap-2">
        <select value={brandId} onChange={(e) => setBrandId(e.target.value)} aria-label="Brand" className="rounded-md border border-line bg-panel px-2 py-1.5 text-[12px]">
          <option value="">{brands.length === 1 ? brands[0].name : 'No brand'}</option>
          {brands.length > 1 && brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="When to post it (optional)" className="rounded-md border border-line bg-panel px-2 py-1.5 text-[12px]" />
        <span className="text-[12px] text-ink-500">{[...text].length}/280</span>
      </div>
      {error && <p role="alert" className="text-[12px] text-danger-700">{error}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={!text.trim()} onClick={async () => {
          setError(null);
          try {
            await draftsApi.create({ text, ...(brandId ? { brand_id: brandId } : {}), ...(when ? { planned_for: new Date(when).toISOString() } : {}) });
            setText(''); setWhen(''); setOpen(false); onSaved();
          } catch (err) { setError(err instanceof ApiError ? err.message : 'Could not save.'); }
        }} className="cursor-pointer rounded-md bg-brand-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-brand-500 disabled:opacity-60">Save as a draft</button>
        <button type="button" onClick={() => setOpen(false)} className="cursor-pointer rounded-md border border-line bg-panel px-3 py-1.5 text-[12px] font-medium text-ink-700 hover:bg-canvas">Cancel</button>
      </div>
    </div>);
}

const PUBLISH_LABEL: Record<string, string> = {
  queued: 'Queued', publishing: 'Posting…', published: 'Published', failed: 'Not posted', unknown: 'Did it go out? Check', cancelled: 'Taken off the queue',
};

/**
 * Publishing an approved draft: now, or at its planned time — exactly once.
 * After: the post's link and Undo. A post whose answer was lost: you say
 * whether it went out; it is never posted again blind.
 */
function PublishControls({ draft, onChanged }: { draft: Draft; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<PlatformAction | null>(null);
  useEffect(() => {
    if (!draft.action_id) return;
    platformActionsApi.list().then((all) => setAction(all.find((a) => a.id === draft.action_id) || null)).catch(() => {});
  }, [draft.action_id, draft.publish_status]);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try { await fn(); onChanged(); } catch (err) { setError(err instanceof ApiError ? err.message : 'That did not work.'); } finally { setBusy(false); }
  }
  const btn = 'cursor-pointer rounded-md border border-line bg-panel px-3 py-1.5 text-[12px] font-medium text-ink-700 hover:bg-canvas disabled:opacity-60';
  const future = draft.planned_for && new Date(draft.planned_for) > new Date();
  const s = draft.publish_status;
  return (
    <div className="mt-2 text-[12px]">
      {s && <p className={`font-medium ${s === 'published' ? 'text-ok-700' : s === 'failed' || s === 'unknown' ? 'text-danger-700' : 'text-ink-600'}`}>
        {PUBLISH_LABEL[s]}{s === 'queued' && draft.planned_for ? ` for ${new Date(draft.planned_for).toLocaleString()}` : ''}
        {action?.url && <> · <a href={action.url} target="_blank" rel="noreferrer" className="text-brand-700 hover:text-brand-500">see it</a></>}
        {action?.verified?.matches && <span className="text-ink-500"> · read back, it matches</span>}
        {action?.undone_by && <span className="text-ink-500"> · undone</span>}
      </p>}
      {action?.error && s !== 'published' && <p className="text-ink-500">{action.error}</p>}
      {error && <p role="alert" className="text-danger-700">{error}</p>}
      <div className="mt-1.5 flex flex-wrap gap-2">
        {(!s || s === 'cancelled' || s === 'failed') && <>
          <button type="button" disabled={busy} onClick={() => run(() => draftsApi.publish(draft.id))} className="cursor-pointer rounded-md bg-brand-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-brand-500 disabled:opacity-60">Publish now</button>
          {future && <button type="button" disabled={busy} onClick={() => run(() => draftsApi.publish(draft.id, { at: draft.planned_for as string }))} className={btn}>Publish at {new Date(draft.planned_for as string).toLocaleString()}</button>}
        </>}
        {s === 'queued' && <button type="button" disabled={busy} onClick={() => run(() => draftsApi.unpublish(draft.id))} className={btn}>Take off the queue</button>}
        {s === 'published' && action && !action.undone_by && <button type="button" disabled={busy} onClick={() => run(() => platformActionsApi.undo(action.id))} className={btn}>Undo — delete the post</button>}
        {s === 'unknown' && action && <>
          <button type="button" disabled={busy} onClick={() => run(() => platformActionsApi.confirm(action.id, true))} className={btn}>It went out</button>
          <button type="button" disabled={busy} onClick={() => run(() => platformActionsApi.confirm(action.id, false))} className={btn}>It didn&apos;t — post it once</button>
        </>}
      </div>
    </div>);
}
