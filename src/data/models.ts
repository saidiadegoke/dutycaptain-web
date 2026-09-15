import { ModelService } from '@/types';

export const modelServices: ModelService[] = [
{
  id: 'qwen3-14b',
  name: 'Qwen3-14B',
  role: 'Primary agent — planning, browser reasoning, validation',
  gpu: 'A40 48GB · slot 0',
  vram: '13.2 / 48 GB',
  vramPct: 28,
  status: 'loaded',
  latency: '640 ms p50',
  queue: 3,
  phase: 1
},
{
  id: 'qwen25-vl-7b',
  name: 'Qwen2.5-VL-7B',
  role: 'Vision — screenshot reading, OCR, table extraction',
  gpu: 'A40 48GB · slot 0',
  vram: '11.4 / 48 GB',
  vramPct: 24,
  status: 'loaded',
  latency: '1.8 s p50',
  queue: 11,
  phase: 2
},
{
  id: 'bge-m3',
  name: 'BGE-M3',
  role: 'Embeddings — semantic memory and retrieval',
  gpu: 'CPU pool',
  vram: '1.1 / 48 GB',
  vramPct: 3,
  status: 'loaded',
  latency: '90 ms p50',
  queue: 0,
  phase: 3
},
{
  id: 'qwen3-32b',
  name: 'Qwen3-32B',
  role: 'Deep planner — swapped in for large jobs only',
  gpu: 'unassigned',
  vram: '0 / 48 GB',
  vramPct: 0,
  status: 'standby',
  latency: '—',
  queue: 0,
  phase: 4
},
{
  id: 'whisper-v3',
  name: 'Whisper Large V3',
  role: 'Speech — voice commands (not in MVP scope)',
  gpu: 'unassigned',
  vram: '0 / 48 GB',
  vramPct: 0,
  status: 'unloaded',
  latency: '—',
  queue: 0,
  phase: 4
}];


export const gpuTimeline = [
{ t: '08:40', vram: 22 },
{ t: '08:50', vram: 26 },
{ t: '09:00', vram: 31 },
{ t: '09:10', vram: 49 },
{ t: '09:20', vram: 55 },
{ t: '09:30', vram: 55 }];


export const runtimeServices = [
{ name: 'Playwright workers', detail: '20 CPU containers · chromium, firefox, webkit', status: 'healthy' },
{ name: 'vLLM', detail: 'Serving 3 models · dynamic load/unload enabled', status: 'healthy' },
{ name: 'PostgreSQL + pgvector', detail: '8 tables · 1.9M embeddings', status: 'healthy' },
{ name: 'Redis queue', detail: '1,082 tasks pending · 20 consumers', status: 'busy' },
{ name: 'Fastify API', detail: 'v0.4.1 · 142 req/min', status: 'healthy' }];