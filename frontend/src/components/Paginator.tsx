import { useState } from 'react';
import './Paginator.css';

interface Props {
  pageCount: number;              // total pages
  current: number;                // zero-based
  onPage: (pageIndex: number) => void;
}

/* clamp helper for the jump-to input */
function safeIndex(numStr: string, total: number): number | null {
  const n = Number(numStr);
  return Number.isFinite(n) && n >= 1 && n <= total ? n - 1 : null;
}

export default function Paginator({ pageCount, current, onPage }: Props) {
  /* which gap is being edited */
  const [editGap, setEditGap] = useState<'left' | 'right' | null>(null);
  const [draft, setDraft] = useState('');

  /* ---- build compact array ------------------------------------------------ */
  const pages: (number | 'leftGap' | 'rightGap')[] = (() => {
    if (pageCount <= 5) return [...Array(pageCount).keys()];      // show all

    const first = 0;
    const last = pageCount - 1;

    // first three pages (0,1,2)
    if (current <= 2) return [0, 1, 2, 'rightGap', last];

    // last three pages
    if (current >= pageCount - 3) return [first, 'leftGap', last - 2, last - 1, last];

    // middle somewhere else
    return [first, 'leftGap', current, 'rightGap', last];
  })();

  /* ---- shared callbacks --------------------------------------------------- */
  const go = (idx: number) => idx !== current && onPage(idx);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const idx = safeIndex(draft, pageCount);
    if (idx !== null) go(idx);
    setEditGap(null);
    setDraft('');
  };

  /* ---- render ------------------------------------------------------------- */
  return (
    <div className="pager-wrapper">
      <ul className="pager">
        {/* ← Back */}
        <li
          className={`pager__item pager__arrow ${current === 0 ? 'pager__item--disabled' : ''}`}
          onClick={() => current > 0 && go(current - 1)}
        >
          <span className="pager__link">← Back</span>
        </li>

        {pages.map((p, i) => {
          if (p === 'leftGap' || p === 'rightGap') {
            const side = p === 'leftGap' ? 'left' : 'right';
            return (
              <li key={p + i} className="pager__item pager__gap">
                {editGap === side ? (
                  <form onSubmit={submit}>
                    <input
                      autoFocus
                      type="number"
                      min={1}
                      max={pageCount}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={() => setEditGap(null)}
                    />
                  </form>
                ) : (
                  <button className="pager__link" onClick={() => setEditGap(side)}>
                    …
                  </button>
                )}
              </li>
            );
          }

          return (
            <li
              key={p}
              className={`pager__item ${p === current ? 'pager__item--active' : ''}`}
              onClick={() => go(p)}
            >
              <span className="pager__link">{p + 1}</span>
            </li>
          );
        })}

        {/* Next → */}
        <li
          className={`pager__item pager__arrow ${
            current === pageCount - 1 ? 'pager__item--disabled' : ''
          }`}
          onClick={() => current < pageCount - 1 && go(current + 1)}
        >
          <span className="pager__link">Next →</span>
        </li>
      </ul>
    </div>
  );
}
