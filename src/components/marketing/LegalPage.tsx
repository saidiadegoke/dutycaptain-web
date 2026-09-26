import { PageHeader, Section } from '@/components/marketing/Section';

export interface LegalSection {
  id: string;
  heading: string;
  /** Paragraphs, in order. */
  body?: string[];
  /** A list shown after the paragraphs. */
  points?: string[];
  /** Paragraphs shown after the list. */
  after?: string[];
}

/** A policy page: title, effective date, contents, then numbered sections. */
export function LegalPage({
  eyebrow,
  title,
  lede,
  effective,
  sections





}: {eyebrow: string;title: string;lede: string;effective: string;sections: LegalSection[];}) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} lede={lede}>
        <p className="text-[13px] text-ink-500">Effective {effective}</p>
      </PageHeader>

      <Section tone="light">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
          <nav aria-label="Contents" className="lg:sticky lg:top-24 lg:self-start">
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-500">Contents</p>
            <ol className="mt-3 space-y-1.5">
              {sections.map((s, i) =>
              <li key={s.id}>
                  <a
                  href={`#${s.id}`}
                  className="flex gap-2 text-[13px] leading-snug text-ink-700 transition-colors duration-150 ease-out hover:text-brand-700">

                    <span className="tabular font-mono text-[11px] text-ink-400">{i + 1}</span>
                    {s.heading}
                  </a>
                </li>
              )}
            </ol>
          </nav>

          <div className="max-w-2xl space-y-10">
            {sections.map((s, i) =>
            <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-[18px] font-semibold tracking-tight text-ink-900">
                  <span className="tabular mr-2 font-mono text-[13px] text-brand-700">{i + 1}.</span>
                  {s.heading}
                </h2>
                {s.body?.map((p) =>
              <p key={p} className="mt-3 text-[14px] leading-relaxed text-ink-700">
                    {p}
                  </p>
              )}
                {s.points &&
              <ul className="mt-3 space-y-2">
                    {s.points.map((p) =>
                <li key={p} className="flex gap-3 text-[14px] leading-relaxed text-ink-700">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden="true" />
                        {p}
                      </li>
                )}
                  </ul>
              }
                {s.after?.map((p) =>
              <p key={p} className="mt-3 text-[14px] leading-relaxed text-ink-700">
                    {p}
                  </p>
              )}
              </section>
            )}
          </div>
        </div>
      </Section>
    </>);

}
