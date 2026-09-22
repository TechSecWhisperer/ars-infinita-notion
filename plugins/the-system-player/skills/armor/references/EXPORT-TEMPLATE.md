# Canonical Export Template

The default visual template for every `/armor` export — HTML and .docx alike.
It exists so that two exports built months apart, for two different quests,
look like they came from the same person: one typography, one section
treatment, one rhythm of spacing. A CV that re-invents its own look with every
build reads as machine-generated, which is the exact tell `/ghost` exists to
strip from the words.

**This template is the default, not a cage.** It applies whenever the player
has not chosen otherwise. A layout preset (see `RESUME-LIBRARY.md`) overrides
the section order, and a direct player request ("bigger name", "sans-serif",
"two columns for the print copy even though ATS copy stays single") overrides
any line here. When an override is in force, record it in the master note's
first block next to the layout id, so the next export reproduces the
*overridden* look, not this default.

## Typography

| Element | Specification |
| --- | --- |
| Body face | One serif or sans-serif family throughout — a widely available face (e.g. Georgia, Calibri, Arial, Times New Roman). No mixing of families between body and headings. |
| Body size | 10–11pt. Never below 10pt, never above 12pt. |
| Name | 18–22pt, same family. Not bolded into a shout, not letter-spaced into a logo. |
| Section headings | 12–13pt, bold, small-caps or uppercase optional but consistent. |
| Sub-headings (role title, degree) | 11–12pt, bold. |
| Metadata lines (dates, locations) | Body size, regular weight, not italic-only reliance — italic fails some parsers. |
| The cover letter (/forge) | Same family, same body size — one document set. |

## Spacing

- Margins 2.5cm (1in) all round; never below 1.25cm (0.5in).
- Space above a section heading: 14–18pt. The heading and its section travel
  together — never let a heading sit as the last line of a page.
- Space below a section heading: 4–6pt.
- Between entries (roles, degrees, projects): 8–10pt.
- Between bullets within an entry: 0–2pt. Bullets are one block, not a list
  of floating islands.
- Line spacing: single (1.0) to 1.15. Never 1.5 — it exists to pad, and
  padding is visible.

## Section treatment

- Section headings in the conventional words for the target market
  (`Experience`, `Education` — never `My Journey`).
- A thin rule (hairline, neutral grey) under each section heading is the
  default separator in HTML exports. In .docx, use a bottom border on the
  heading paragraph, not a drawn line (drawn shapes break parsers).
- Header block: name, then one line with location • phone • email • (profile
  link if used), centred or left — pick one, same every export.
- Dates right-aligned on the same line as the role/degree title, formatted
  identically everywhere (`MMM YYYY – MMM YYYY` in the market's convention).
- No photos, icons, colour blocks, tables, columns, text boxes or
  headers/footers carrying content — the ATS rules in `RESUME-LIBRARY.md`
  outrank any visual preference.

## Colour

Default is monochrome: black text, neutral-grey rules. If the player wants an
accent colour, it appears in exactly one place — the section-heading rule —
at full saturation and nowhere else. A CV is not a slide deck.

## What this template does not govern

- **Content.** Wording, bullet construction and honesty rules live in
  `RESUME-LIBRARY.md` and the boot card.
- **Section order.** That is the layout preset's job (`ats-reverse-chron` by
  default).
- **Regional adaptation.** Length, photo, referees, work rights and spelling
  come from the regional profile in `RESUME-LIBRARY.md`; this template renders
  whatever the profile decided.
