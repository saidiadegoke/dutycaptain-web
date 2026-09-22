import { Task } from '@/types';

export const tasks: Task[] = [
{
  id: 'task_8412',
  name: 'SmartStore price sync — Samsung phones',
  goal: 'Compare prices of all Samsung phones across Jumia, Konga, Slot and Pointek. Update SmartStore and generate an Excel audit.',
  status: 'running',
  done: 2418,
  total: 3500,
  workers: 20,
  startedAt: '09:04',
  elapsed: '22m 11s',
  eta: '11m',
  owner: 'A. Bello',
  trigger: 'manual',
  connector: 'SmartStore'
},
{
  id: 'task_8409',
  name: 'Daily fuel price — NNPC Lagos',
  goal: 'Read the official NNPC price board and publish today’s pump price to the ops sheet.',
  status: 'awaiting_approval',
  done: 6,
  total: 6,
  workers: 1,
  startedAt: '08:00',
  elapsed: '3m 42s',
  eta: '—',
  owner: 'Scheduler',
  trigger: 'schedule',
  connector: 'Google Sheets'
},
{
  id: 'task_8402',
  name: 'Supplier invoice extraction — March batch',
  goal: 'Read 148 scanned supplier invoices and produce a reconciled payables JSON.',
  status: 'completed',
  done: 148,
  total: 148,
  workers: 8,
  startedAt: 'Yesterday 17:20',
  elapsed: '14m 06s',
  eta: '—',
  owner: 'F. Okon',
  trigger: 'manual',
  connector: 'Files'
},
{
  id: 'task_8398',
  name: 'Courier rate audit — 4 partners',
  goal: 'Collect zone-by-zone courier rates and flag any increase above 5%.',
  status: 'paused',
  done: 312,
  total: 640,
  workers: 6,
  startedAt: 'Yesterday 11:02',
  elapsed: '31m 55s',
  eta: 'paused',
  owner: 'A. Bello',
  trigger: 'api',
  connector: 'Courier APIs'
},
{
  id: 'task_8391',
  name: 'Competitor catalogue crawl — Konga TVs',
  goal: 'Build a structured catalogue of all Konga television listings with stock status.',
  status: 'failed',
  done: 704,
  total: 1200,
  workers: 12,
  startedAt: 'Mon 14:40',
  elapsed: '18m 02s',
  eta: '—',
  owner: 'Scheduler',
  trigger: 'schedule',
  connector: 'Postgres'
},
{
  id: 'task_8388',
  name: 'Publish 42 new SKUs to SmartStore',
  goal: 'Create product pages for the 42 approved SKUs in the onboarding sheet.',
  status: 'queued',
  done: 0,
  total: 42,
  workers: 0,
  startedAt: '—',
  elapsed: '—',
  eta: 'queued',
  owner: 'F. Okon',
  trigger: 'manual',
  connector: 'SmartStore'
}];


export const activeTaskId = 'task_8412';