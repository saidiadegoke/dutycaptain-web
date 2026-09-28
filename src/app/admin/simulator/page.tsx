'use client';

import dynamic from 'next/dynamic';

// Client-only: the simulator drives the API from the browser, as the screens do.
const SimulatorPage = dynamic(() => import('@/sim/ui/SimulatorPage').then((m) => m.SimulatorPage), { ssr: false });

export default function Simulator() {
  return <SimulatorPage />;
}
