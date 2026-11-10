# content/: seed data for the portfolio

This folder holds the **first version** of all portfolio content. From Phase 2 on, the
**database is the source of truth**: content is edited in `/admin`, and `make content-export`
(Phase 3) writes the database back here so every change is versioned in git.

| Path            | What                                                                       |
| --------------- | -------------------------------------------------------------------------- |
| `data/*.json`   | Profile, skills, experience, education, projects, about, graph extras, lab |
| `schemas/`      | JSON Schemas: the contract for the files above                             |
| `projects/*.md` | Case-study bodies (Problem → Approach → Result → What I'd do differently)  |
| `media/`        | Images (avatar, covers). Prefer WebP/AVIF.                                 |
| `resume/`       | Put `resume.pdf` here                                                      |
| `evals/`        | Agent eval cases (questions + what an answer must / must not say)          |

## Knowledge graph

Graph nodes are **derived**, not listed by hand:

- every skill → `skill:<id>` (`"concept": true` skills are smaller concept nodes), project →
  `project:<slug>`, organization → `org:<id>`, education → `edu:<id>`
- `role.skills` → `org USED skill` (no role nodes), `project.skills` → `USED`,
  `project.org` → `BUILT_AT`, `education.skills` → `STUDIED`
- each skill category gets a hub node (`hub:frontend`, …) and every skill links to its hub
- skills with `"proficiency": "learning"` are flagged as growing (dashed ring)

`data/graph.json` only adds **topics** and **extra edges** (`RELATED`, `BUILT_ON`, `DEMONSTRATES`).

## Rules

- **Durations are never typed in.** Years of experience and role durations are computed from
  `start` / `end` dates (LinkedIn style: both months count).
- **Employer projects** (`"type": "professional"`) use public titles only, never have links,
  screenshots or code; their thumbnails are recreated illustrations.
- **Internal product names are never written anywhere in this repo.** The repo is public.
  `make confidential-check` (also in CI) fails if any appears; it stores only SHA-256 hashes
  of the forbidden words, so the list itself doesn't leak them.

## Placeholders

Anything with `"placeholder": true` (or listed in `profile.placeholderFields`) is dummy data.
`make content-check` validates every file and lists the placeholders still left.

## License

The code in this repository is MIT-licensed. The **content in this folder** (text, photos,
resume) is © Chandrashekhar, all rights reserved.
