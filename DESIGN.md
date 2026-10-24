# Design system — Deep Current

## Direction

An owner-operated portfolio instrument inspired by a Japanese deep-ocean observatory: quiet, precise, dark, and legible over long sessions. The page reads as a data station rather than a generic finance product. A sonar sweep and measured cyan traces provide the identity; values and freshness remain the main signal.

## Palette and materials

- Ink: `#071218`; deep water: `#0A1C24`; instrument panel: `#0C2029`.
- Main text: `#E6F0ED`; secondary text: `#95AAA8`; fine detail: `#6F8988`.
- Active data: `#84E2D3`; quiet teal: `#42B5AA`; warning: `#F18D78`; danger: `#FF6D6D`.
- Hairline rules, low-contrast grid marks, and flat panels. No glass blur, gradients on type, or ornamental card stacks.

## Type and data

Thai/Japanese interface text uses language-capable sans fallbacks. Numeric data uses a monospaced face with tabular numerals. Monospace is reserved for timestamps, labels, IDs, and measurements. Currency, source, timezone, and freshness sit adjacent to values.

## Composition and behavior

One full-width horizontal navigation bar; no sidebar. Dashboard first, then separate Stock Port and Copy Quant routes. Dashboard consolidates source totals only when currencies convert and data is fresh; the sources remain visually distinct. It never presents lead ROI as copier return. Keyboard focus is cyan and visible; reduced-motion preferences are respected; mobile navigation wraps into a second horizontal row.

## Surface status

The home dashboard and Copy Quant details use this system. The Stock report uses a dark theme override while retaining its established report interactions. The Telegram Mini App remains outside this redesign.
