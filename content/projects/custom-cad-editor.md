---
slug: custom-cad-editor
title: Building a CAD editor from zero
subtitle: How I took an uncertain R&D problem to a production Three.js CAD viewer/editor that became the foundation of a core railway-signalling workflow.
type: professional
featured: true
role: Frontend engineer → primary owner of the CAD viewer/editor; led UI technical direction for the first ~2 months
stack: [Angular, TypeScript, Three.js, WebGL, Canvas, R-tree, DXF, PDF export]
period: Apr 2026 – present
confidentiality: Internal names, client, screenshots and code are omitted. Visuals are recreated illustrations or come from my public CAD Playground demo.
---

## TL;DR

- Started with **zero CAD background** (DWG, DXF, CAD-editor architecture were new to me).
- Evaluated **3 approaches**, pivoted twice when I hit hard limits, and shipped a **custom editor in Three.js + Canvas + R-tree**.
- It renders **8 DXF entity types + CAD tables**, supports a full **editing suite with undo/redo**, exports **DXF and PDF**, and handles **CAD drawings and JSON domain data in the same editor**.
- It became the **foundation of a core product workflow**: railway signalling-plan digitisation, generation and editing.

## The problem

The product needed users to view, digitise and edit engineering drawings, and then work with structured, railway-specific data (signals, track circuits, aspect control charts) on top of them. Standard CAD viewers understand CAD geometry, not our JSON domain model. Accurate text, hatch patterns and tables are notoriously hard to render on the web.

## My R&D journey

1. **DWG/DXF research:** formats, DWG→DXF conversion, rendering options, existing libraries.
2. **Approach 1: backend + frontend rendering** · ✗
   Basic rendering worked, but accurate text, patterns, tables and CAD-specific rendering couldn't reach the required quality. _Decision:_ stop investing in a path that had hit its ceiling.
3. **Approach 2: existing DXF viewer library** · ◐
   Fine for basic viewing; limited for text, patterns, tables and editing. Crucially, it only understood CAD data, not our JSON domain data or railway editing rules.
4. **Approach 3: custom viewer/editor** · ✓
   Three.js + Canvas + an R-tree spatial index, with DXF and JSON rendered in one scene, then domain features on top.

## Architecture

```
DXF file ──► parser ──► entity model ──┐
JSON plan ─► domain model ─────────────┼─► scene builder (Three.js / Canvas) ─► renderer
                                       │
                         R-tree spatial index ◄── hit-testing · selection · search
                                       │
        tools & commands (insert/move/copy/delete/group) ─► undo/redo history
                                       │
             exporters: DXF · JSON→DXF preview · PDF
```

## What I built

**Rendering engine:** line · polyline · arc · circle · ellipse · solid · text · MText · CAD tables · layers · properties
**Interaction:** selection · highlighting · search · zoom · pan · fit-to-screen · R-tree spatial indexing
**Editing:** drawing tools · insert · move · copy · delete · grouping · group move/copy · undo/redo
**Import/export:** DXF export · JSON→DXF preview · PDF rendering & export
**Domain layer:** DXF + JSON in one editor · entity ↔ asset links · signals, track circuits, aspect control charts · add/edit/delete assets · plan digitisation & generation · **red/green change detection** · search & navigation

## Hard problems & how I solved them

| Challenge                                | Approach                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| Accurate text, patterns and tables       | Custom rendering per entity type instead of relying on a generic viewer   |
| Fast selection among many entities       | R-tree spatial index for hit-testing and search                           |
| CAD graphics + JSON domain data together | A shared scene with links between DXF entities and domain assets          |
| Domain editing that DXF can't express    | Domain-aware tools and validation on top of standard CAD edits            |
| Safe editing                             | Command-based operations with undo/redo; red/green diff to review changes |
| Getting data out                         | DXF export, JSON→DXF preview, PDF export                                  |

## Outcome

- The custom editor is the **foundation of the signalling-plan workflow**.
- **No dependency on third-party CAD SDKs** for core rendering and editing; full control over domain features.

## Leadership

Led UI and CAD-viewer implementation and technical direction for roughly the first two months of the workflow's UI development, then owned the editor as its primary developer, working with backend and domain teammates.

## What I learned

- Timebox R&D and **pivot on evidence**, not sunk cost.
- Read the format spec, not just the library docs: CAD accuracy lives in the details (text metrics, patterns, tables).
- Separate the **geometry layer** from the **domain layer**, so the editor can grow beyond CAD.
- Spatial indexing and undo/redo are architecture decisions, not features to add later.

## Try it

→ **CAD Playground**: my public, open-source mini editor on sample DXF files (pan/zoom, select, R-tree overlay, move/copy/delete, undo/redo, export). No employer code.
