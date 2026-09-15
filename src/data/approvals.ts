import { Approval } from '@/types';

export const approvals: Approval[] = [
{
  id: 'apr_1187',
  jobId: 'job_8412',
  jobName: 'SmartStore price sync — Samsung phones',
  action: 'Overwrite product prices',
  target: 'SmartStore · 3,487 products',
  changes: 3487,
  risk: 'high',
  requestedAt: '2 min ago',
  requestedBy: 'planner',
  summary:
  'Extraction finished for 3,487 of 3,500 SKUs across four retailers. 148 prices moved more than 15% and were re-verified by the planner. 13 SKUs had no confident source and are excluded.',
  sample: [
  { sku: 'SM-S928B', product: 'Galaxy S24 Ultra 512GB', current: 1399000, proposed: 1249900, source: 'Jumia', confidence: 0.96 },
  { sku: 'SM-A556E', product: 'Galaxy A55 5G 128GB', current: 425000, proposed: 411500, source: 'Konga', confidence: 0.94 },
  { sku: 'SM-F731B', product: 'Galaxy Z Flip5 256GB', current: 1180000, proposed: 879000, source: 'Slot', confidence: 0.71, flag: 'outlier' },
  { sku: 'SM-S921B', product: 'Galaxy S24 256GB', current: 1049000, proposed: 1019000, source: 'Jumia', confidence: 0.97 },
  { sku: 'SM-A356E', product: 'Galaxy A35 5G 256GB', current: 358000, proposed: 358000, source: 'Pointek', confidence: 0.62, flag: 'stale' },
  { sku: 'SM-X216B', product: 'Galaxy Tab A9+ 64GB', current: 289000, proposed: 274500, source: 'Konga', confidence: 0.93 },
  { sku: 'SM-A155F', product: 'Galaxy A15 128GB', current: 198500, proposed: 189900, source: 'Slot', confidence: 0.95 },
  { sku: 'SM-M155F', product: 'Galaxy M15 5G 128GB', current: 214000, proposed: 207900, source: 'Jumia', confidence: 0.92 }]

},
{
  id: 'apr_1186',
  jobId: 'job_8409',
  jobName: 'Daily fuel price — NNPC Lagos',
  action: 'Publish to shared sheet',
  target: 'Ops Sheet · Fuel/Lagos!B12',
  changes: 1,
  risk: 'low',
  requestedAt: '1 hr ago',
  requestedBy: 'file',
  summary:
  'Pump price read from the official NNPC board at 08:02 and cross-checked against two news sources. Value changed from ₦1,020 to ₦1,045 per litre.',
  sample: [
  { sku: 'PMS-LAG', product: 'Petrol (PMS) — Lagos', current: 1020, proposed: 1045, source: 'nnpcgroup.com', confidence: 0.99 }]

},
{
  id: 'apr_1184',
  jobId: 'job_8398',
  jobName: 'Courier rate audit — 4 partners',
  action: 'Email rate-increase notice',
  target: 'ops@company.com · 3 recipients',
  changes: 1,
  risk: 'medium',
  requestedAt: 'Yesterday 11:48',
  requestedBy: 'api',
  summary:
  'Two partners raised inter-state zone rates above the 5% threshold. The agent drafted a notice to operations with the affected zones attached as CSV.',
  sample: [
  { sku: 'ZONE-C', product: 'Inter-state zone C — Partner GIG', current: 4500, proposed: 5100, source: 'partner portal', confidence: 0.98 },
  { sku: 'ZONE-D', product: 'Inter-state zone D — Partner Kwik', current: 5200, proposed: 5980, source: 'partner portal', confidence: 0.96, flag: 'outlier' }]

}];