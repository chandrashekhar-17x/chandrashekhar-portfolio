# content/: seed data for the portfolio

This folder holds the **first version** of all portfolio content. From Phase 2 on, the
**database is the source of truth**: content is edited in `/admin`, and `make content-export`
(Phase 3) writes the database back here so every change is versioned in git.

| Path            | What                                                                      |
| --------------- | ------------------------------------------------------------------------- |
| `data/*.json`   | Profile, skills, experience, projects, graph extras, lab                  |
| `schemas/`      | JSON Schemas: the contract for the files above                            |
| `projects/*.md` | Case-study bodies (Problem → Approach → Result → What I'd do differently) |
| `media/`        | Images (avatar, covers). Prefer WebP/AVIF.                                |
| `resume/`       | Put `resume.pdf` here                                                     |

## Knowledge graph

Graph nodes are **derived**, not listed by hand:

- every skill → `skill:<id>`, project → `project:<slug>`, organization → `org:<id>`, role → `role:<id>`
- `project.skills` / `role.skills` → `USED` edges, `project.org` → `BUILT_AT`, `role.org` → `WORKED_AT`
- each skill category gets a hub node (`hub:frontend`, …) and every skill links to its hub
- skills with `"learning": true` are flagged on the node (drawn as "learning")

`data/graph.json` only adds **topics** and **extra edges** (e.g. `RELATED`).

## Placeholders

Anything with `"placeholder": true` (or listed in `profile.placeholderFields`) is dummy data.
`make content-check` validates every file and lists the placeholders still left.

## License

The code in this repository is MIT-licensed. The **content in this folder** (text, photos,
resume) is © Chandrashekhar, all rights reserved.
