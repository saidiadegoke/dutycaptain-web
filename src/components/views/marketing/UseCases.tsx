import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { PageHeader, Section, SectionHeading } from '@/components/marketing/Section';
import { CTABand } from '@/components/marketing/CTABand';
import { useCases } from '@/data/marketing';

const timeline = [
['Load 3,500 SKUs', 'Planner'],
['Find retailer URLs', 'Search agent'],
['Visit product pages', '20 Playwright workers'],
['Read prices', 'Vision agent'],
['Validate outliers', 'Qwen3-14B'],
['Produce Excel audit', 'File agent'],
['Await approval', 'Human'],
['Update SmartStore', 'Connector agent']];


export function UseCases() {
  const featured = useCases.find((u) => u.featured)!;
  const others = useCases.filter((u) => !u.featured);

  return (
    <>
      <PageHeader
        eyebrow="Use cases"
        title="Work that is measurable, repetitive, and currently done by hand"
        lede="We build for jobs with a number attached — SKUs priced, invoices read, hours returned to the team. Here is what operations teams run first." />
      

      <Section tone="light">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_minmax(0,0.9fr)] lg:gap-16">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-brand-700">
              Most common first job · {featured.industry}
            </p>
            <h2 className="mt-3 text-[28px] font-semibold leading-tight tracking-tight text-ink-900 lg:text-[32px]">
              {featured.name}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-700">{featured.problem}</p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-500">{featured.approach}</p>

            <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-6 border-t border-line pt-7">
              {featured.metrics.map((m) =>
              <div key={m.label}>
                  <dd className="tabular text-[28px] font-semibold leading-none tracking-tight text-ink-900">
                    {m.value}
                  </dd>
                  <dt className="mt-1.5 text-[12px] text-ink-500">{m.label}</dt>
                </div>
              )}
            </dl>
          </div>

          <figure className="rounded-xl border border-line bg-panel p-6 shadow-panel">
            <figcaption className="text-[12px] font-semibold text-ink-700">
              Execution timeline · one run
            </figcaption>
            <ol className="mt-4">
              {timeline.map(([stage, worker], i) =>
              <li key={stage} className="flex gap-3.5">
                  <div className="flex flex-col items-center">
                    <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    i === 6 ? 'bg-warn-600' : 'bg-brand-600'}`
                    }
                    aria-hidden="true" />
                  
                    {i < timeline.length - 1 &&
                  <span className="my-1 w-px flex-1 bg-line" aria-hidden="true" />
                  }
                  </div>
                  <div className="pb-4">
                    <p className="text-[13px] font-medium text-ink-900">{stage}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-ink-500">{worker}</p>
                  </div>
                </li>
              )}
            </ol>
            <p className="border-t border-line pt-4 text-[12px] leading-relaxed text-ink-500">
              3,500 products · 20 workers · ~8 seconds per product · 25–35 minutes total.
            </p>
          </figure>
        </div>
      </Section>

      <Section tone="canvas">
        <SectionHeading
          title="Also running in production"
          lede="Each of these started as one manual process someone was doing every week." />
        

        <div className="mt-10 space-y-px overflow-hidden rounded-xl border border-line bg-line">
          {others.map((useCase) =>
          <article
            key={useCase.id}
            className="grid grid-cols-1 gap-6 bg-panel p-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-10 lg:p-8">
            
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-ink-500">
                  {useCase.industry}
                </p>
                <h3 className="mt-2 text-[18px] font-semibold tracking-tight text-ink-900">
                  {useCase.name}
                </h3>
                <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-700">
                  {useCase.problem}
                </p>
                <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-500">
                  {useCase.approach}
                </p>
              </div>
              <dl className="flex gap-8 lg:flex-col lg:gap-4 lg:border-l lg:border-line lg:pl-8">
                {useCase.metrics.map((m) =>
              <div key={m.label}>
                    <dd className="tabular text-[20px] font-semibold leading-none tracking-tight text-ink-900">
                      {m.value}
                    </dd>
                    <dt className="mt-1 text-[12px] leading-snug text-ink-500">{m.label}</dt>
                  </div>
              )}
              </dl>
            </article>
          )}
        </div>

        <div className="mt-8">
          <Link href="/developers"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-700 transition-colors duration-150 ease-out hover:text-brand-500">
            
            Define your own workflow in YAML or TypeScript
            <ArrowRightIcon className="h-4 w-4" strokeWidth={2.2} />
          </Link>
        </div>
      </Section>

      <Section tone="light">
        <SectionHeading
          title="Is your process a good fit?"
          align="center"
          lede="The jobs that work best share a shape. If three of these are true, it is worth a pilot." />
        
        <ul className="mx-auto mt-9 grid max-w-3xl grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
          {[
          'Someone repeats it weekly or daily',
          'It involves a website with no usable API',
          'The inputs are PDFs, scans or spreadsheets',
          'Volume is in the hundreds or thousands',
          'Mistakes are expensive enough to need review',
          'The output is a file, a price, or a record update'].
          map((item) =>
          <li key={item} className="bg-panel px-5 py-4 text-[14px] text-ink-700">
              {item}
            </li>
          )}
        </ul>
      </Section>

      <CTABand
        title="Tell us the job you would hand over first"
        body="We scope it against the runtime, tell you honestly whether it is a fit, and run a pilot on your hardware." />
      
    </>);

}