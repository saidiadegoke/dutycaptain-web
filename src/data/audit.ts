import { AuditEntry } from '@/types';

export const auditEntries: AuditEntry[] = [
{ id: 'ev_77412', at: '09:25:41', agent: 'vision', model: 'Qwen2.5-VL-7B', action: 'extract.price', target: 'jumia.com.ng/galaxy-s24-ultra-512gb', outcome: 'ok', tokens: 1842, taskId: 'task_8412' },
{ id: 'ev_77411', at: '09:25:38', agent: 'browser', model: 'Qwen3-14B', action: 'browser.click', target: 'konga.com · selector "Next page"', outcome: 'ok', tokens: 410, taskId: 'task_8412' },
{ id: 'ev_77410', at: '09:25:36', agent: 'planner', model: 'Qwen3-14B', action: 'validate.outlier', target: 'SM-F731B · −25.5% vs catalog', outcome: 'blocked', tokens: 2210, taskId: 'task_8412' },
{ id: 'ev_77409', at: '09:25:31', agent: 'vision', model: 'Qwen2.5-VL-7B', action: 'extract.price', target: 'pointek.ng/galaxy-a35-5g', outcome: 'retry', tokens: 1610, taskId: 'task_8412' },
{ id: 'ev_77408', at: '09:25:27', agent: 'browser', model: 'Qwen3-14B', action: 'browser.open', target: 'slot.ng/samsung-galaxy-z-flip5', outcome: 'ok', tokens: 288, taskId: 'task_8412' },
{ id: 'ev_77407', at: '09:25:22', agent: 'search', model: 'BGE-Reranker-v2', action: 'search.rank', target: 'query "Galaxy A05 price Nigeria" · 40 → 6 URLs', outcome: 'ok', tokens: 96, taskId: 'task_8412' },
{ id: 'ev_77406', at: '09:25:19', agent: 'browser', model: 'Qwen3-14B', action: 'browser.open', target: 'pointek.ng/galaxy-z-fold5', outcome: 'failed', tokens: 240, taskId: 'task_8412' },
{ id: 'ev_77405', at: '09:25:12', agent: 'vision', model: 'Qwen2.5-VL-7B', action: 'extract.stock', target: 'konga.com/product/galaxy-tab-a9', outcome: 'ok', tokens: 1490, taskId: 'task_8412' },
{ id: 'ev_77404', at: '09:24:58', agent: 'file', model: '—', action: 'artifact.write', target: 'samsung-price-audit-2026-09-11.xlsx', outcome: 'ok', tokens: 0, taskId: 'task_8412' },
{ id: 'ev_77403', at: '09:24:51', agent: 'planner', model: 'Qwen3-14B', action: 'plan.revise', target: 'added retry branch for Pointek WAF', outcome: 'ok', tokens: 3340, taskId: 'task_8412' },
{ id: 'ev_77402', at: '08:03:11', agent: 'human', model: '—', action: 'approval.request', target: 'Publish fuel price to Ops Sheet', outcome: 'blocked', tokens: 0, taskId: 'task_8409' },
{ id: 'ev_77401', at: '08:02:47', agent: 'vision', model: 'Qwen2.5-VL-7B', action: 'extract.table', target: 'nnpcgroup.com · price board', outcome: 'ok', tokens: 2040, taskId: 'task_8409' },
{ id: 'ev_77400', at: '08:00:04', agent: 'planner', model: 'Qwen3-14B', action: 'plan.create', target: '6-step workflow from schedule "0 8 * * *"', outcome: 'ok', tokens: 2880, taskId: 'task_8409' }];