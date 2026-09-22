import { StepRun, Worker, WorkflowStage } from '@/types';

export const workflow: WorkflowStage[] = [
{
  id: 'stage_load',
  nodes: [
  {
    id: 'load_catalog',
    label: 'Load catalog',
    agent: 'file',
    status: 'done',
    detail: '3,500 SKUs parsed from products.csv',
    parallelism: 1,
    retries: 0
  }]

},
{
  id: 'stage_search',
  nodes: [
  {
    id: 'search_urls',
    label: 'Resolve retailer URLs',
    agent: 'search',
    status: 'done',
    detail: '13,842 candidate URLs → 9,104 high-confidence',
    parallelism: 4,
    retries: 2
  }]

},
{
  id: 'stage_extract',
  nodes: [
  {
    id: 'extract_price',
    label: 'Extract price',
    agent: 'vision',
    status: 'running',
    detail: '2,418 / 3,500 pages read',
    parallelism: 20,
    retries: 61
  },
  {
    id: 'verify_price',
    label: 'Verify price',
    agent: 'planner',
    status: 'running',
    detail: '148 outliers under review',
    parallelism: 4,
    retries: 3
  },
  {
    id: 'stock_status',
    label: 'Stock status',
    agent: 'browser',
    status: 'running',
    detail: '2,301 / 3,500 confirmed',
    parallelism: 20,
    retries: 12
  }]

},
{
  id: 'stage_report',
  nodes: [
  {
    id: 'generate_excel',
    label: 'Generate Excel audit',
    agent: 'file',
    status: 'queued',
    detail: 'Waits on all extraction branches',
    parallelism: 1,
    retries: 0
  }]

},
{
  id: 'stage_approval',
  nodes: [
  {
    id: 'human_approval',
    label: 'Human approval',
    agent: 'human',
    status: 'blocked',
    detail: 'Destructive action — price overwrite',
    parallelism: 1,
    retries: 0
  }]

},
{
  id: 'stage_update',
  nodes: [
  {
    id: 'update_dashboard',
    label: 'Update SmartStore',
    agent: 'api',
    status: 'queued',
    detail: 'Batched writes, 250 per request',
    parallelism: 2,
    retries: 0
  }]

}];


export const stepRuns: StepRun[] = [
{
  id: 'tsk_92f1',
  node: 'extract_price',
  agent: 'vision',
  target: 'jumia.com.ng/galaxy-s24-ultra-512gb',
  status: 'running',
  model: 'Qwen2.5-VL-7B',
  duration: '6.2s',
  attempt: 1
},
{
  id: 'tsk_92ef',
  node: 'stock_status',
  agent: 'browser',
  target: 'konga.com/product/samsung-a55-128gb',
  status: 'running',
  model: 'Qwen3-14B',
  duration: '3.9s',
  attempt: 1
},
{
  id: 'tsk_92ed',
  node: 'extract_price',
  agent: 'vision',
  target: 'slot.ng/samsung-galaxy-z-flip5',
  status: 'done',
  model: 'Qwen2.5-VL-7B',
  duration: '7.8s',
  attempt: 1
},
{
  id: 'tsk_92ec',
  node: 'verify_price',
  agent: 'planner',
  target: 'outlier batch #37 (12 SKUs)',
  status: 'running',
  model: 'Qwen3-14B',
  duration: '11.4s',
  attempt: 1
},
{
  id: 'tsk_92e8',
  node: 'extract_price',
  agent: 'vision',
  target: 'pointek.ng/galaxy-a35-5g',
  status: 'failed',
  model: 'Qwen2.5-VL-7B',
  duration: '30.0s',
  attempt: 2
},
{
  id: 'tsk_92e5',
  node: 'extract_price',
  agent: 'browser',
  target: 'jumia.com.ng/galaxy-s23-fe-256gb',
  status: 'done',
  model: 'Qwen3-14B',
  duration: '5.1s',
  attempt: 1
},
{
  id: 'tsk_92e1',
  node: 'search_urls',
  agent: 'search',
  target: 'query: "Samsung Galaxy A05 price Nigeria"',
  status: 'done',
  model: 'BGE-M3 + reranker',
  duration: '1.2s',
  attempt: 1
},
{
  id: 'tsk_92de',
  node: 'stock_status',
  agent: 'browser',
  target: 'konga.com/product/galaxy-tab-a9',
  status: 'queued',
  model: 'Qwen3-14B',
  duration: '—',
  attempt: 1
}];


export const workers: Worker[] = [
{ id: 'W01', browser: 'chromium', status: 'busy', sku: 'SM-S928B', retailer: 'Jumia', step: 'screenshot' },
{ id: 'W02', browser: 'chromium', status: 'busy', sku: 'SM-A556E', retailer: 'Konga', step: 'extract' },
{ id: 'W03', browser: 'chromium', status: 'busy', sku: 'SM-F731B', retailer: 'Slot', step: 'navigate' },
{ id: 'W04', browser: 'firefox', status: 'retrying', sku: 'SM-A356E', retailer: 'Pointek', step: 'timeout 2/3' },
{ id: 'W05', browser: 'chromium', status: 'busy', sku: 'SM-S921B', retailer: 'Jumia', step: 'extract' },
{ id: 'W06', browser: 'chromium', status: 'busy', sku: 'SM-X216B', retailer: 'Konga', step: 'navigate' },
{ id: 'W07', browser: 'webkit', status: 'busy', sku: 'SM-A155F', retailer: 'Slot', step: 'screenshot' },
{ id: 'W08', browser: 'chromium', status: 'idle', sku: '—', retailer: '—', step: 'awaiting step' },
{ id: 'W09', browser: 'chromium', status: 'busy', sku: 'SM-S918B', retailer: 'Pointek', step: 'extract' },
{ id: 'W10', browser: 'chromium', status: 'busy', sku: 'SM-A245F', retailer: 'Jumia', step: 'navigate' },
{ id: 'W11', browser: 'firefox', status: 'busy', sku: 'SM-M155F', retailer: 'Konga', step: 'screenshot' },
{ id: 'W12', browser: 'chromium', status: 'error', sku: 'SM-Z556', retailer: 'Pointek', step: 'blocked by WAF' },
{ id: 'W13', browser: 'chromium', status: 'busy', sku: 'SM-S911B', retailer: 'Slot', step: 'extract' },
{ id: 'W14', browser: 'chromium', status: 'busy', sku: 'SM-A057F', retailer: 'Jumia', step: 'navigate' },
{ id: 'W15', browser: 'webkit', status: 'busy', sku: 'SM-X115', retailer: 'Konga', step: 'screenshot' },
{ id: 'W16', browser: 'chromium', status: 'busy', sku: 'SM-A165F', retailer: 'Slot', step: 'extract' },
{ id: 'W17', browser: 'chromium', status: 'idle', sku: '—', retailer: '—', step: 'awaiting step' },
{ id: 'W18', browser: 'chromium', status: 'busy', sku: 'SM-S926B', retailer: 'Jumia', step: 'navigate' },
{ id: 'W19', browser: 'chromium', status: 'busy', sku: 'SM-A366B', retailer: 'Konga', step: 'extract' },
{ id: 'W20', browser: 'chromium', status: 'busy', sku: 'SM-F946B', retailer: 'Pointek', step: 'screenshot' }];


export const throughput = [
{ t: '09:04', products: 0, errors: 0 },
{ t: '09:07', products: 186, errors: 2 },
{ t: '09:10', products: 402, errors: 5 },
{ t: '09:13', products: 691, errors: 4 },
{ t: '09:16', products: 1044, errors: 9 },
{ t: '09:19', products: 1437, errors: 7 },
{ t: '09:22', products: 1863, errors: 11 },
{ t: '09:25', products: 2418, errors: 8 }];


export const extractionSample = `{
  "sku": "SM-S928B",
  "retailer": "Jumia",
  "price": "₦1,249,900",
  "currency": "NGN",
  "availability": "In Stock",
  "confidence": 0.96,
  "source": "vision.bbox[220,310,290,340]"
}`;