# Design — UI Rule Book

## Principles

1.  **Content first, magic second.** Text paints first; effects hydrate after.
2.  **One signature moment per screen.** Hero canvas, graph, orb — never all fighting.
3.  **Everything skippable.** Reduced-motion users get a calm, complete site.
4.  **Dark is default, light is first-class.** Both tested for contrast.

## Color tokens

--bg \#06071a

--surface \#121436

--violet \#8b5cf6

--cyan \#22d3ee

--pink \#f472b6

--lime \#a3e635

--ink \#ecebff

light --bg \#f5f4fb

Graph categories: Frontend = cyan · AI = pink · Backend = lime · Graphics/docs = amber · Projects = violet · Roles = blue.

## Typography

- **Display:** Bricolage Grotesque 800, tracking −0.04em, clamp(40px, 8cqw, 86px)
- **Body:** Inter Tight 400/500, 15–16px, 1.55 line-height
- **Mono / labels:** JetBrains Mono 11–13px, uppercase eyebrow +0.14em

## Spacing, radius, elevation

- 4-pt scale: 4 8 12 16 24 32 48 64 96
- Radius: 8 (chips) · 12 (inputs) · 16–20 (cards)
- Elevation = glow, not shadow: `0 10px 40px -10px violet/35%`
- Glass surfaces: 60–75% surface + 8–18px backdrop blur

## Motion system

| Token   | Value                           | Used for                  |
|---------|---------------------------------|---------------------------|
| fast    | 150 ms                          | hover, focus              |
| base    | 300 ms cubic-bezier(.2,.8,.2,1) | panels, chat open         |
| slow    | 700–800 ms                      | section reveal, hero text |
| ambient | 6–18 s loops                    | orb, gradient text, rings |

- Animate only `transform` and `opacity`; canvas loops pause off-screen and on hidden tab.
- Cursor: dot + lerped ring, grows on interactive; hidden on touch & reduced-motion.
- Magnetic buttons max 8px pull. Tilt cards max 8°.

## Components

Nav · Button (primary / ghost / magnetic) · Chip · Card (glass) · Tilt project card · Graph panel · Chat widget (suggestions, message, citation chip, mic) · Command palette · HUD panel · Timeline item · Form field · Toast · Theme toggle.

## Accessibility

- WCAG 2.2 AA contrast in both themes; visible focus ring (violet 4px halo)
- Graph has an accessible list alternative; chat is a `role="log"` live region
- All features operable by keyboard; Ctrl/⌘ K palette
