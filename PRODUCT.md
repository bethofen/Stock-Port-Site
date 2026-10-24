# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing static HTML/CSS/JavaScript site; retain the current static hosting model.

## Users

The owner of the Stock Port and Copytrade-Quant projects, checking portfolio state and recent analysis, usually from a browser and often on a phone.

## Product Purpose

Provide one authenticated home dashboard that summarizes the latest available Stock and Copy Quant status, with separate paths to each system's detailed report.

## Positioning

A unified view of two distinct portfolio workflows: personal stock holdings and Binance Futures copy-trading analysis. The dashboard helps the owner scan both while preserving each system's separate data and meaning.

## Operating Context

The existing site is a static website. Stock details are rendered in `report/`; portfolio actions are handled by a Telegram Mini App in `miniapp/`. Copytrade-Quant produces daily snapshots and Thai reports in a separate project. The dashboard is intended for the project owner, not public investors.

## Capabilities and Constraints

- The home route is the dashboard, not a product-selection page.
- Show a concise latest status and results for Stock and Copy Quant as distinct sections, then link to their detailed views.
- Use one password gate across the site, consistent with the existing report access pattern; data decryption remains client-side.
- Keep each source's timestamps and freshness visible. Show one estimated THB asset total only when every source balance converts through a dated FX reference rate and both feeds are fresh; keep source values separate. Never infer a combined return from lead ROI or raw balance change.
- Copytrade-Quant reports lead risk and analysis; they do not represent the owner's personal copy positions or guarantee trade execution.
- The site is static and depends on generated data files; provide a clear unavailable/stale state when a source has not published fresh data.

## Brand Commitments

The owner requested a dark-mode, cyber-minimal visual world with Japanese undersea atmosphere.

## Evidence on Hand

- Existing Stock report UI: `report/index.html`.
- Existing Stock encrypted report metadata and payload: `report/meta.json` and `report/site-data.json.enc`.
- Telegram portfolio tool: `miniapp/index.html`.
- Copytrade source project: `C:/Users/AUT/Desktop/claude/Copytrade-Quant`.
- No verified cross-project dashboard data feed exists yet; do not fabricate current values.

## Product Principles

- One home dashboard gives the owner a quick read across both systems.
- Keep Stock and Copy Quant data separate and clearly attributed.
- Show data freshness and gaps before the user relies on a number.
- The website reports and analyzes; it does not execute trades.


## Consolidated return constraint

The combined return percentage remains unavailable until Stock Port and Copy Quant both publish comparable owner-level PnL and cash-flow-adjusted return data. The current Copy Quant source has no copier-level PnL, so lead results must not fill this gap.
