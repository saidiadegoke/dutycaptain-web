export const marketingNav = [
{ to: '/platform', label: 'Platform' },
{ to: '/use-cases', label: 'Use cases' },
{ to: '/developers', label: 'Developers' },
{ to: '/security', label: 'Security' },
{ to: '/deployment', label: 'Deployment' },
{ to: '/pricing', label: 'Pricing' },
{ to: '/company', label: 'Company' }];


export const heroStats = [
{ value: '3,500', label: 'products priced per run' },
{ value: '25–35 min', label: 'end-to-end, 20 workers' },
{ value: '100%', label: 'of actions in the audit trail' },
{ value: '1 GPU', label: 'to run the whole MVP' }];


export const agents = [
{
  id: 'planner',
  name: 'Planner',
  model: 'Qwen3-14B → 32B',
  summary:
  'Turns one English instruction into a typed execution graph — not prose. Decides what runs in parallel, what needs verifying, and where a human has to sign off.'
},
{
  id: 'browser',
  name: 'Browser',
  model: 'Playwright · Chromium, Firefox, WebKit',
  summary:
  'Persistent sessions with real cookies and logins. Opens, clicks, types, waits, downloads. The model never touches HTML — it issues tool calls.'
},
{
  id: 'vision',
  name: 'Vision',
  model: 'Qwen2.5-VL-7B',
  summary:
  'Reads the screenshot when selectors fail, returning values plus bounding boxes. Survives retailer redesigns that break scrapers every quarter.'
},
{
  id: 'search',
  name: 'Search',
  model: 'BGE-M3 + Reranker-v2',
  summary:
  'Ranks candidate URLs before a browser opens anything, so workers only spend time on high-confidence pages.'
},
{
  id: 'file',
  name: 'File',
  model: 'Qwen2.5-VL-7B',
  summary:
  'PDFs, scanned invoices, receipts, catalogues, Excel and CSV in. Structured JSON out first, then the report your team actually opens.'
},
{
  id: 'api',
  name: 'Connector',
  model: 'Typed adapters',
  summary:
  'Writes results back into SmartStore, ERPs, Paystack, courier APIs, Postgres and sheets — in batches, with a snapshot kept.'
}];


export const runSequence = [
{
  title: 'One instruction',
  body: '“Compare prices of all Samsung phones across Jumia, Konga, Slot and Pointek. Update SmartStore and generate an Excel audit.”'
},
{
  title: 'The planner decomposes it',
  body: 'Seven tasks, three of them parallel, one human gate before any write. You review the graph before dispatch.'
},
{
  title: 'Workers execute',
  body: '20 Playwright containers resolve URLs, read pages with vision, and validate outliers. No model coordination after dispatch.'
},
{
  title: 'You approve the write',
  body: '3,487 proposed price changes arrive as a diff with sources and confidence. Approve once and the graph resumes.'
}];


export const comparison = {
  columns: ['DutyCaptain', 'RPA / scrapers', 'Chat assistants'],
  rows: [
  { feature: 'Handles a site redesign', values: ['Vision re-reads the page', 'Breaks, needs a dev', 'Cannot browse reliably'] },
  { feature: 'Runs thousands of steps unattended', values: ['DAG + distributed queue', 'Linear, fragile', 'Session-bound'] },
  { feature: 'Pauses for human sign-off', values: ['Built-in approval gates', 'All or nothing', 'No guarantees'] },
  { feature: 'Record of every decision', values: ['Full audit trail', 'Logs only', 'Chat history'] },
  { feature: 'Where your data lives', values: ['Your GPUs, your network', 'Vendor cloud', 'Third-party API'] },
  { feature: 'Cost per long job', values: ['Fixed GPU hours', 'Per-bot licence', 'Per-token, unbounded'] }]

};

export const useCases = [
{
  id: 'pricing',
  name: 'Competitive price monitoring',
  industry: 'Retail & e-commerce',
  problem:
  'A merchandiser checks 3,500 SKUs across four retailers by hand, so prices are stale by the time they are updated.',
  approach:
  'Search ranks retailer URLs, 20 browser workers read each product page with vision, the planner re-verifies anything moving more than 15%, and the write waits for one approval.',
  metrics: [
  { value: '3,500', label: 'SKUs per run' },
  { value: '28 min', label: 'typical runtime' },
  { value: '148', label: 'outliers caught before write' }],

  featured: true
},
{
  id: 'invoices',
  name: 'Supplier invoice extraction',
  industry: 'Finance operations',
  problem: '148 scanned invoices a month, re-keyed into the payables sheet by two people.',
  approach:
  'The file agent reads scans and PDFs with OCR, extracts line items to JSON, and reconciles against purchase orders before producing a payables file.',
  metrics: [
  { value: '14 min', label: 'for a monthly batch' },
  { value: '0', label: 'manual re-keying' }]

},
{
  id: 'catalogue',
  name: 'Competitor catalogue crawl',
  industry: 'Category management',
  problem: 'No structured view of what competitors list, at what price, in stock or not.',
  approach:
  'A scheduled crawl builds a structured catalogue nightly, with stock status and price history stored in Postgres for the category team.',
  metrics: [
  { value: 'Nightly', label: 'refresh' },
  { value: '1,200+', label: 'listings per category' }]

},
{
  id: 'commodity',
  name: 'Regulated price boards',
  industry: 'Energy & logistics',
  problem: 'Pump prices and courier zone rates change without notice and are published as web tables or PDFs.',
  approach:
  'A cron-triggered workflow reads the official board, cross-checks two secondary sources, and publishes to the ops sheet after a one-click approval.',
  metrics: [
  { value: '08:00', label: 'daily, unattended' },
  { value: '3 sources', label: 'cross-checked' }]

},
{
  id: 'onboarding',
  name: 'Bulk product publishing',
  industry: 'Marketplace operations',
  problem: 'Launching 42 new SKUs means 42 rounds of the same admin form.',
  approach:
  'The browser agent operates your admin dashboard directly — no API required — and publishes only after the batch is approved.',
  metrics: [
  { value: '42 SKUs', label: 'per dispatch' },
  { value: 'No API', label: 'integration needed' }]

}];


export const modelStack = [
{ responsibility: 'Planning & orchestration', model: 'Qwen3-32B-Instruct', vram: '20–28 GB', why: 'Strongest reasoning and tool use' },
{ responsibility: 'Browser reasoning', model: 'Qwen3-14B', vram: '10–14 GB', why: 'Fast, follows instructions closely' },
{ responsibility: 'Vision & OCR', model: 'Qwen2.5-VL-7B', vram: '8–12 GB', why: 'Reads screenshots, tables, scans' },
{ responsibility: 'Classification & routing', model: 'Qwen3-4B', vram: '3–5 GB', why: 'Cheap tagging and triage' },
{ responsibility: 'Embeddings', model: 'BGE-M3', vram: '< 2 GB', why: 'High-quality multilingual retrieval' },
{ responsibility: 'Reranking', model: 'BGE-Reranker-v2', vram: '< 2 GB', why: 'Sharpens URL and document retrieval' },
{ responsibility: 'Speech (optional)', model: 'Whisper Large V3', vram: '3–5 GB', why: 'Voice-issued instructions' }];


export const clusterSizing = [
{ service: 'Qwen3-32B planner', gpu: '2× L40S or 2× A100', note: 'Only needed for heavy planning jobs' },
{ service: 'Qwen3-14B agent', gpu: '1× L40S', note: 'Handles browsing and validation' },
{ service: 'Qwen2.5-VL vision', gpu: '1× RTX 4090', note: 'Screenshot and document reading' },
{ service: 'Embeddings', gpu: 'CPU or small GPU', note: 'BGE-M3 runs comfortably on CPU' },
{ service: 'Playwright workers', gpu: 'CPU containers', note: 'Browser fleet needs no GPU' }];


export const rolloutPhases = [
{
  phase: 'Phase 1',
  title: 'One model, one browser fleet',
  body: 'Qwen3-14B plus Playwright. Browser automation, navigation, extraction, CSV generation and connector writes — enough to run real jobs in week one.'
},
{
  phase: 'Phase 2',
  title: 'Add vision',
  body: 'Qwen2.5-VL-7B for screenshot understanding, scanned documents and pages where selectors are hopeless.'
},
{
  phase: 'Phase 3',
  title: 'Add memory',
  body: 'BGE-M3 embeddings in pgvector, so preferences like “prefer Konga over Jumia” carry into future plans.'
},
{
  phase: 'Phase 4',
  title: 'Add the deep planner',
  body: 'Qwen3-32B swapped in for large multi-branch jobs, unloaded again when execution resumes.'
}];


export const plans = [
{
  id: 'pilot',
  name: 'Pilot',
  price: 'Free for 30 days',
  detail: 'One workflow, on your hardware',
  forWho: 'Prove one job end to end before committing.',
  includes: [
  '1 concurrent job, up to 5 browser workers',
  'Qwen3-14B + Qwen2.5-VL-7B',
  'Approval gates and audit trail',
  'Community support'],

  cta: 'Start a pilot',
  featured: false
},
{
  id: 'operations',
  name: 'Operations',
  price: '$1,900',
  period: '/month',
  detail: 'Plus your own GPU cost',
  forWho: 'Teams running scheduled jobs against live business systems.',
  includes: [
  'Unlimited jobs, up to 40 browser workers',
  'Full model stack with dynamic load/unload',
  'Scheduled and API-triggered workflows',
  'Connectors: SmartStore, ERP, Paystack, couriers',
  'Role-based approvals and 30-day snapshots',
  'Business-hours support with 4h response'],

  cta: 'Talk to us',
  featured: true
},
{
  id: 'enterprise',
  name: 'Enterprise',
  price: 'Custom',
  detail: 'Air-gapped or multi-region',
  forWho: 'Regulated operations with their own cluster and compliance review.',
  includes: [
  'Dedicated worker pools and model isolation',
  'SSO, custom retention, export of the full audit log',
  'Private connector development',
  'Named engineer and 1h critical response'],

  cta: 'Contact sales',
  featured: false
}];


export const pricingFaq = [
{
  q: 'What does the GPU actually cost to run?',
  a: 'An A40 48GB pod is around $0.49/hr. Left on continuously that is roughly $353 a month; during development, starting and stopping the pod usually keeps it under $100. Browser workers are CPU-bound, so the GPU only serves the agent and vision models.'
},
{
  q: 'Can it run fully offline?',
  a: 'Yes. Every model in the stack is open weight and self-hosted. The only outbound traffic is to the sites and business systems your workflows explicitly target.'
},
{
  q: 'Do we pay per token or per action?',
  a: 'No. You pay a platform licence and your own compute. A 3,500-product job may make thousands of model calls without changing the bill.'
},
{
  q: 'What happens when a job fails halfway?',
  a: 'Each node carries retries, timeouts and parallelism. Failed tasks are re-dispatched independently, and the job resumes from the graph rather than restarting from the top.'
}];


export const principles = [
{
  title: 'The smallest capable model per task',
  body: 'A 3,500-product job can make thousands of model calls. Routing each step to the smallest model that can do it is the difference between viable and wasteful, even on your own GPUs.'
},
{
  title: 'The runtime is the product',
  body: 'Anyone can download Qwen. Persistent browser sessions, vision-guided automation, a distributed scheduler, retry and recovery, approval checkpoints and an audit trail are what is hard to build.'
},
{
  title: 'Autonomy with a hand on the brake',
  body: 'Agents run unattended until an action touches the business. Publishing, deleting, emailing and paying always stop for a human.'
},
{
  title: 'Measurable work, not conversation',
  body: 'We build for jobs with a number attached — SKUs priced, invoices read, minutes saved — before general-purpose assistance.'
}];