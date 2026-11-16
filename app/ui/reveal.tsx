// Text that reveals word by word: each word slides up out of its own mask.
// "load" plays once when the page opens; "scroll" plays as the text scrolls into view (CSS scroll timelines).
// Without support, or under reduced motion, the text is simply there.
import { Fragment, type CSSProperties } from "react";

export function Words({ text, mode = "scroll", delay = 0 }: { text: string; mode?: "load" | "scroll"; delay?: number }) {
  return (
    <span className={mode === "load" ? "words-load" : "words-scroll"} style={{ "--d": `${delay}ms` } as CSSProperties}>
      {text.split(/\s+/).map((w, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <span className="word">
            <span style={{ "--i": i } as CSSProperties}>{w}</span>
          </span>
        </Fragment>
      ))}
    </span>
  );
}
