"use client";

import { useEffect, useRef, useState } from "react";

// Sticky in-page tabs. Highlights the section in view and keeps its tab visible in the strip.
export function SectionTabs({ sections }: { sections: [id: string, label: string][] }) {
  const [active, setActive] = useState(sections[0]?.[0]);
  const strip = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const els = sections.map(([id]) => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    // A section counts as "in view" when it crosses a line about a third down the screen.
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-30% 0px -65% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  useEffect(() => {
    // Scroll only the strip (not the page) so the active tab is centred.
    const ul = strip.current;
    const tab = ul?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (ul && tab) ul.scrollTo({ left: tab.offsetLeft - ul.clientWidth / 2 + tab.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  return (
    <nav aria-label="Sections" className="sticky top-16 z-20 -mx-4 border-b border-line bg-paper sm:mx-0 sm:rounded-full sm:border sm:bg-surface sm:shadow-card">
      <ul
        ref={strip}
        className="no-scrollbar flex gap-1 overflow-x-auto px-4 py-2 [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-24px),transparent)] sm:px-2 sm:[mask-image:none]"
      >
        {sections.map(([id, label]) => (
          <li key={id} className="shrink-0">
            <a
              href={`#${id}`}
              data-tab={id}
              aria-current={active === id ? "location" : undefined}
              className="press inline-flex h-9 items-center rounded-full px-4 text-sm font-medium text-muted hover:text-ink aria-[current]:bg-brand aria-[current]:text-white"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
