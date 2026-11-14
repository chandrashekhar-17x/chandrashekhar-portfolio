# Resume

Two versions are shown on `/resume`:

| Tab                  | Source                                                           | How to update                                               |
| -------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| **Portfolio resume** | Built from `content/data/*.json` at render time                  | Edit the content; it follows automatically                  |
| **My resume** (PDF)  | `resume.html` → `resume.pdf` + `resume.png` (preview for phones) | Edit `resume.html`, run `make resume-pdf`, commit all three |

The build copies `resume.pdf` and `resume.png` to the site (`/resume.pdf`, `/resume.png`).
Without `resume.pdf`, the page shows only the portfolio resume.

Rules for `resume.html` (it is public): public project titles only (`make confidential-check`),
no email or phone number (contact goes through the site's form), and only facts that are true.
