import { Reveal } from "@/components/ui/reveal";
import type {
  AsideGroup,
  AsideLineageStep,
  AsidePanel,
  AsideTerm,
} from "@/content/asides";
import { cn } from "@/lib/utils";

/**
 * The margin panel beside a prose section.
 *
 * One component, three shapes, driven by the discriminated union in
 * src/content/asides.ts — so the four panels share all their chrome (the gold
 * hairline, the heading, the rhythm) and differ only in how their items read.
 *
 * Styled as a marginal note in a book rather than a boxed-in "widget", which
 * keeps the page print-like as the design system intends.
 */
export function SectionAside({ panel }: { panel: AsidePanel }) {
  return (
    <Reveal variant="leaf" delay={0.12}>
      <aside className="relative pl-6">
        {/* A single gold hairline instead of a card border: lighter, and it
            echoes the section dividers. */}
        <span
          aria-hidden="true"
          className="from-gold-300 via-gold-300/40 absolute inset-y-0 left-0 w-px bg-gradient-to-b to-transparent"
        />

        <h3 className="text-lg text-blue-800">{panel.title}</h3>
        {panel.caption && (
          <p className="text-ink-muted mt-1 text-xs">{panel.caption}</p>
        )}

        <div className="mt-5">
          {panel.kind === "terms" && <Terms terms={panel.terms} />}
          {panel.kind === "groups" && <Groups groups={panel.groups} />}
          {panel.kind === "lineage" && <Lineage steps={panel.steps} />}
        </div>
      </aside>
    </Reveal>
  );
}

function Terms({ terms }: { terms: readonly AsideTerm[] }) {
  return (
    <dl className="space-y-4">
      {terms.map((term) => (
        <div key={term.label} className="flex gap-3">
          {term.devanagari && (
            <dt
              aria-hidden="true"
              className="text-magenta-400 w-10 shrink-0 text-xl leading-snug font-(--font-devanagari) select-none"
            >
              {term.devanagari}
            </dt>
          )}
          <div className={cn(!term.devanagari && "flex items-baseline gap-2")}>
            <dt
              className={cn(
                "text-sm font-medium",
                term.highlight ? "text-magenta-700" : "text-blue-800",
              )}
            >
              {term.label}
              {term.highlight && (
                <span
                  aria-hidden="true"
                  className="bg-magenta-500 ml-2 inline-block size-1.5 rounded-full align-middle"
                />
              )}
            </dt>
            {term.note && (
              <dd className="text-ink-muted mt-0.5 text-xs">{term.note}</dd>
            )}
          </div>
        </div>
      ))}
    </dl>
  );
}

function Groups({ groups }: { groups: readonly AsideGroup[] }) {
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-ink-muted mb-2 text-xs tracking-wide uppercase">
            {group.label}
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {group.items.map((item) => (
              <li
                key={item}
                className="border-sand-300 bg-sand-50 rounded-full border px-2.5 py-1 text-xs text-blue-800"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Lineage({ steps }: { steps: readonly AsideLineageStep[] }) {
  return (
    <ol className="relative space-y-5">
      {steps.map((step, i) => (
        <li key={step.name} className="relative pl-6">
          {/* The vertical thread of the parampara — knowledge passed down. */}
          {i < steps.length - 1 && (
            <span
              aria-hidden="true"
              className="bg-magenta-200 absolute top-4 bottom-[-1.25rem] left-[3px] w-px"
            />
          )}
          <span
            aria-hidden="true"
            className="border-magenta-500 bg-sand-50 absolute top-1.5 left-0 size-[7px] rounded-full border"
          />
          <p className="text-sm font-medium text-blue-800">{step.name}</p>
          <p className="text-ink-muted text-xs">{step.note}</p>
        </li>
      ))}
    </ol>
  );
}
