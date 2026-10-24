---
mode: Operate
---

# Unified portfolio dashboard

## User and task

The owner scans latest status, source freshness, separate system totals, and an overall THB asset total when valid conversion data is available. They can move into Stock Port or Copy Quant details.

## Required truth

- One shared password prompt; decryption stays in the browser.
- Never sum unlike currencies without a displayed daily FX reference rate.
- Only show the combined value when both source snapshots and the FX date are fresh.
- Combined return is unavailable until owner-level, cash-flow-adjusted PnL exists for both sources.
- Copy Quant lead ROI is explicitly labeled as lead performance.
- Source failures and stale data remain visible.

## Structure and visual system

The approved comp uses a full-width top navigation, an editorial title with a restrained sonar instrument, a compact four-field total summary, a daily signal band, and two distinct system panels. The live implementation uses the Deep Current design system in `DESIGN.md`.
