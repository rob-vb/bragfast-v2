import { Fragment } from "react";
import { legalInline, type LegalBlock, type LegalDoc } from "@/domain/legal";
import { PageHero, PageHeroLead, PageHeroTitle } from "@/components/page-hero";

const LINK =
  "font-bold underline decoration-berry/30 underline-offset-[3px] transition-colors pointer-fine:hover:decoration-berry";

function Inline({ source }: { source: string }) {
  return legalInline(source).map((part, index) =>
    part.href ? (
      <a key={index} href={part.href} className={LINK}>
        {part.text}
      </a>
    ) : (
      <Fragment key={index}>{part.text}</Fragment>
    ),
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") {
    return (
      <p className="max-w-prose text-pretty">
        <Inline source={block} />
      </p>
    );
  }
  if ("h3" in block) {
    return (
      <h3 className="pt-3 text-lg font-extrabold leading-snug text-berry first:pt-0">
        {block.h3}
      </h3>
    );
  }
  if ("list" in block) {
    return (
      <ul className="max-w-prose list-disc space-y-2 pl-5 marker:text-blush">
        {block.list.map((item) => (
          <li key={item} className="pl-1 text-pretty">
            <Inline source={item} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <dl className="max-w-prose divide-y divide-berry/12 border-y border-berry/12">
      {block.defs.map(([term, body]) => (
        <div key={term} className="grid gap-1 py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
          <dt className="font-extrabold text-berry">{term}</dt>
          <dd className="text-pretty">
            <Inline source={body} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** A privacy statement or terms page: summary first, then every section in full. */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <main>
      <PageHero size="compact">
        <PageHeroTitle size="sm">{doc.title}</PageHeroTitle>
        <PageHeroLead className="max-w-xl text-balance text-milk">{doc.lead}</PageHeroLead>
        <p className="mt-4 text-sm font-bold text-milk/70">{doc.updated}</p>
      </PageHero>

      {/* Phones read the summary before the contents; desktop hangs the contents beside both */}
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-4">
        <section
          aria-labelledby="legal-summary"
          className="rounded-slab bg-milk p-6 sm:p-8 lg:col-span-8 lg:col-start-5 lg:row-start-1"
        >
          <h2 id="legal-summary" className="font-display text-3xl leading-none tracking-wide">
            {doc.summaryTitle}
          </h2>
          <ul className="mt-5 list-disc space-y-2.5 pl-5 text-base font-semibold leading-7 text-berry marker:text-blush">
            {doc.summary.map((item) => (
              <li key={item} className="pl-1 text-pretty">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <nav
          aria-labelledby="legal-toc"
          className="lg:col-span-4 lg:col-start-1 lg:row-span-2 lg:row-start-1"
        >
          <div className="lg:sticky lg:top-28">
            <h2 id="legal-toc" className="text-sm font-extrabold uppercase tracking-wider text-berry/55">
              {doc.tocTitle}
            </h2>
            <ol className="mt-3 space-y-1.5 text-base font-bold">
              {doc.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-berry/75 transition-colors pointer-fine:hover:text-berry"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <div className="-mt-10 divide-y divide-berry/12 lg:col-span-8 lg:col-start-5 lg:mt-0">
          {doc.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-title`}
              className="py-10 sm:py-12"
            >
              <h2
                id={`${section.id}-title`}
                className="font-display text-3xl leading-tight tracking-wide text-balance sm:text-4xl"
              >
                {section.title}
              </h2>
              <div className="mt-5 space-y-4 text-base leading-7 text-berry/80">
                {section.blocks.map((block, index) => (
                  <Block key={index} block={block} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
