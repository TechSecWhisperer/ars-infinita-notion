<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     Source:    plugins/the-system-player/skills/armor/references/resume-library.json
     Regenerate: node tools/resume_library.mjs build
     Verify:     node tools/resume_library.mjs check
     A hand-edit here is overwritten by the next build and fails `check`. -->

# Resume Library

Canonical guidance for `/armor`. Library version **1.0.0**.

The section library, layout presets, regional conventions and formatting standards behind `/armor`. Everything here is authored in `resume-library.json` and rendered from it — edit the JSON, then run `node tools/resume_library.mjs build`.

## How to read the provenance tags

- **V** — VERIFIED against the cited source page, read in full during an authoring session. Carries the source id and the date it was read.
- **S** — SECONDARY / UNVERIFIED. Attributed to a cited source by search-engine summaries or third-party write-ups, but the source page itself was NOT read. Treat as a lead to confirm, not as a quotation.
- **G** — GENERAL PRACTICE. A widely-established convention across career-services guidance and applicant-tracking documentation. Not attributed to any single source and does not need to be.

> No rule in this file may be presented to a player as coming from a named institution unless its tag is V. This is the same provenance discipline the System Log applies to claimed rulings: an uncited claim is struck or downgraded, never repeated with confidence it has not earned.

> **Authoring note.** At v1.0.0 NO rule is tagged V, and that is a deliberate record of what the authoring session could actually establish. The session (2026-08-27) could not read any external page: the environment's egress proxy refused every outbound fetch, for every domain — curl returned CONNECT 403, and the fetch tool returned EGRESS_BLOCKED for the source URL and for a control URL alike, so the block was environmental rather than specific to the source host. Every S tag below is therefore a lead awaiting confirmation, not a quotation. `node tools/resume_library.mjs sources` is the mechanism that confirms them from a networked environment: it records a content snapshot per source, after which a rule can be promoted from S to V by a human or agent who has actually read the page.

## Sources

| Source | Role | Last read | Status |
|---|---|---|---|
| [Harvard FAS Mignone Center for Career Success — Create a Strong Resume](https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/) | primary | — | `never-read` |
| [Harvard College Bullet Point Resume Template](https://careerservices.fas.harvard.edu/resources/bullet-point-resume-template/) | secondary | — | `never-read` |
| [Harvard College Resumes & Cover Letters Guide](https://careerservices.fas.harvard.edu/resources/harvard-college-guide-to-resumes-cover-letters/) | secondary | — | `never-read` |

Run `node tools/resume_library.mjs sources` to check these for drift.

## Formatting standards

- One page for most candidates. A second page is earned by content, not filled to look substantial — and in most markets is normal past roughly ten years of relevant experience.
- Single column. Multi-column layouts read out of order in most applicant-tracking parsers, which silently scrambles dates against employers. _(unverified — attributed to harvard-strong-resume, source page not read)_
- No graphics, photos, colour blocks, icons, text boxes or headshots on an ATS-bound resume. They either drop out or corrupt the parse. _(unverified — attributed to harvard-strong-resume, source page not read)_
- Standard serif or sans-serif face at 10–12pt body size. Consistency matters more than which face. _(unverified — attributed to harvard-strong-resume, source page not read)_
- Margins around 1 inch / 2.5cm; never below 0.5 inch / 1.25cm, which reads as cramped and breaks print.
- Dates right-aligned and formatted identically everywhere. Mixed formats are the single most common self-inflicted parse failure. _(unverified — attributed to harvard-strong-resume, source page not read)_
- The resume and its cover letter use the same font family and size — they are one document set. _(unverified — attributed to harvard-strong-resume, source page not read)_
- Submit as PDF unless the posting asks for .docx. PDF preserves layout; .docx is what some ATS explicitly demand.
- Name the file predictably: Firstname-Lastname-Role.pdf. Never 'resume-final-v3.pdf'.
- Section headings in the conventional words for the target market. A parser looks for 'Experience' and 'Education'; it does not know what 'My Journey' means.

## Writing bullets

- Every bullet opens with a past-tense action verb. No 'Responsible for', no 'Duties included', no leading pronoun. _(unverified — attributed to harvard-strong-resume, source page not read)_
- Quantify the result wherever a real number exists — scale, money, time, percentage, headcount, volume. _(unverified — attributed to harvard-strong-resume, source page not read)_
- Formula: ACTION VERB + WHAT YOU DID + HOW / WITH WHAT + MEASURED RESULT. Not every bullet reaches all four, but a bullet with none of the last two is a job description, not evidence.
- Accomplishment, not duty. What changed because you were there, rather than what you were assigned.
- Three to six bullets for a recent, relevant role; one to three for older or less relevant ones. Depth follows relevance, not chronology.
- One to two lines per bullet. A bullet that wraps to three is two bullets or an over-written one.
- Mirror the posting's own vocabulary where it is honestly true of you — the same skill named two ways scores as neither. _(unverified — attributed to harvard-strong-resume, source page not read)_
- Never fabricate a metric. An honest unquantified bullet beats an invented number, and an invented number is the one thing a reference check reliably catches.

## Applicant-tracking (ATS) rules

- No tables. A parser flattens them and the columns interleave.
- No headers or footers for content that matters — many parsers discard that region entirely, including contact details placed there.
- No text inside images. It is invisible to every parser.
- Spell out an acronym once with the acronym alongside: 'Security Information and Event Management (SIEM)'. Postings search for either.
- Standard bullet characters only. Wingdings and custom glyphs arrive as question marks.

## Action verbs

Grouped by what the verb claims. Pick for accuracy, not for force — an inflated verb is a claim the interview will test. _(unverified — attributed to harvard-strong-resume, source page not read)_

- **Led / owned:** Led, Directed, Managed, Oversaw, Chaired, Coordinated, Headed, Supervised, Orchestrated
- **Built / created:** Built, Designed, Developed, Engineered, Architected, Created, Established, Founded, Launched, Implemented
- **Improved / changed:** Improved, Optimized, Streamlined, Reduced, Increased, Accelerated, Consolidated, Modernized, Refactored, Automated
- **Analysed / found:** Analyzed, Assessed, Audited, Diagnosed, Evaluated, Investigated, Identified, Measured, Researched, Synthesized
- **Delivered / executed:** Delivered, Executed, Completed, Deployed, Shipped, Migrated, Integrated, Resolved, Maintained
- **Persuaded / worked with:** Advised, Negotiated, Presented, Influenced, Partnered, Facilitated, Trained, Mentored, Briefed, Secured

## Section library

Every section below is an addressable feature. Refer to one by its **id** or any
of its aliases — "move skills above experience", "drop the interests bit",
"add work rights" all resolve through this table.

| id | Section | Core | Movable | Also called |
|---|---|---|---|---|
| `header` | Header / Contact | yes | no | contact, contact details, contact info, top, name block, personal info |
| `summary` | Professional Summary | no | yes | profile, summary, professional profile, about, personal statement, career summary, executive summary |
| `objective` | Objective | no | yes | career objective, goal, target role |
| `skills` | Core Skills | yes | yes | skills, technical skills, key skills, competencies, core competencies, expertise, tech stack, toolkit |
| `experience` | Professional Experience | yes | yes | experience, work experience, employment, work history, career history, roles, professional background |
| `education` | Education | yes | yes | education, academic background, qualifications, degrees, schooling, academics |
| `projects` | Projects | no | yes | projects, selected projects, portfolio, side projects, personal projects, key projects |
| `certifications` | Certifications & Licences | no | yes | certifications, certs, licences, licenses, credentials, accreditations, professional certifications |
| `leadership` | Leadership & Activities | no | yes | leadership, activities, extracurricular, involvement, societies, clubs, community |
| `publications` | Publications | no | yes | publications, papers, articles, writing, authored works |
| `presentations` | Talks & Presentations | no | yes | presentations, talks, speaking, conferences, keynotes, speaking engagements |
| `awards` | Awards & Honours | no | yes | awards, honors, honours, recognition, prizes, scholarships, distinctions |
| `volunteering` | Volunteering | no | yes | volunteering, volunteer work, pro bono, community service, charity |
| `languages` | Languages | no | yes | languages, language skills, spoken languages, fluency |
| `work-authorization` | Work Authorisation | no | yes | work authorization, visa, visa status, right to work, work rights, immigration status, sponsorship |
| `security-clearance` | Security Clearance | no | yes | clearance, security clearance, vetting, baseline, nv1, sc, dv |
| `memberships` | Professional Memberships | no | yes | memberships, affiliations, professional bodies, associations, chartered status |
| `interests` | Interests | no | yes | interests, hobbies, personal interests, outside work, activities outside work |
| `referees` | Referees | no | yes | references, referees, reference contacts |
| `personal-details` | Personal Details | no | yes | personal details, photo, date of birth, dob, nationality, marital status, personal data |
| `gdpr-clause` | Data Processing Consent | no | yes | gdpr, gdpr clause, data consent, privacy clause, rodo |
| `additional` | Additional Information | no | yes | additional, additional information, other, miscellaneous, extras |

### `header` — Header / Contact

**Purpose.** Says who you are and how to reach you. Always first — this is the one section that cannot move.

**Also called:** contact, contact details, contact info, top, name block, personal info

- Name, phone with country code, professional email, city + country, LinkedIn. Nothing else is mandatory.
- Never in the page header/footer region — parsers discard it.
- Full street address is obsolete in most markets; city and country are enough and are what recruiters filter on.
- One professional email. Not a work address — screening a candidate on their current employer's mail is a hazard for both sides.

### `summary` — Professional Summary

**Purpose.** Two to four lines positioning you for THIS role. The highest-leverage lines on the page because they are the ones actually read.

**Also called:** profile, summary, professional profile, about, personal statement, career summary, executive summary

- Rewritten per application. A generic summary is worse than none — it costs prime space to say nothing.
- Name the discipline, the seniority, and the two or three things this posting is actually buying.
- No first person, no adjective piles. 'Passionate self-starter' is unfalsifiable and reads as filler.
- Distinct from an Objective: a summary says what you bring, an objective says what you want. Prefer the summary except in a deliberate career change.

### `objective` — Objective

**Purpose.** States the role sought. Largely retired in favour of a summary; still useful for a career change or an early-career candidate where the direction is not obvious from the history.

**Also called:** career objective, goal, target role

- Use instead of a summary, never alongside it.
- If it could be pasted onto any application unchanged, cut it.

### `skills` — Core Skills

**Purpose.** A scannable keyword surface. Does double duty: a human reads it in three seconds, a parser matches it against the posting.

**Also called:** skills, technical skills, key skills, competencies, core competencies, expertise, tech stack, toolkit

- Group into labelled clusters rather than one long comma run — 'Cloud & Infrastructure:', 'Governance & Risk:'.
- Only skills you would defend in an interview. This section is the most over-claimed on the page and the easiest to test.
- Drop proficiency bars and star ratings. They are unparseable and self-assessed, so they carry no information.
- Place high when the role is skills-gated (technical, contract, career change); place lower when the employer names carry the story.

### `experience` — Professional Experience

**Purpose.** The evidence base. Reverse-chronological by default.

**Also called:** experience, work experience, employment, work history, career history, roles, professional background

- Per role: title, employer, location, dates. Consistent order and format across every entry.
- Reverse-chronological — most recent first — unless deliberately using a functional or hybrid layout.
- Bullets selected for THIS posting from the full history, not the same block reused everywhere.
- A promotion within one employer is nested under that employer, not duplicated as a separate company.
- Employment gaps: state them plainly and briefly if they exceed several months. An unexplained gap draws more attention than an explained one.
- Add a one-line company descriptor when the employer is not internationally recognised — 'Origin (ASX-listed energy retailer, 4,000 staff)'. Essential when applying across borders.

### `education` — Education

**Purpose.** Formal qualifications.

**Also called:** education, academic background, qualifications, degrees, schooling, academics

- Degree, institution, location, completion year. Reverse-chronological.
- Above Experience while a student or within roughly two years of graduating; below it thereafter.
- Include grade only where the market expects it and it helps — see the region profile; GPA is a US convention and reads as odd elsewhere.
- Add an equivalence note for a foreign qualification: 'Bachelor of Engineering (4 years, equivalent to AQF Level 7)'. A reader who cannot place your degree discounts it.
- Secondary schooling drops off once you hold a degree.

### `projects` — Projects

**Purpose.** Demonstrated capability where employment history does not yet show it — career changers, early career, or skills used outside a paid role.

**Also called:** projects, selected projects, portfolio, side projects, personal projects, key projects

- Same bullet discipline as Experience: action, substance, outcome.
- Link to something inspectable where one exists.
- State your own contribution on anything collaborative.

### `certifications` — Certifications & Licences

**Purpose.** Named credentials, especially where a role gates on them.

**Also called:** certifications, certs, licences, licenses, credentials, accreditations, professional certifications

- Full name, issuing body, year. Include expiry where the credential has one.
- Move high — even directly under the summary — when the posting lists a certification as a requirement.
- Mark in-progress credentials honestly with an expected date. Never list an unearned one as held.

### `leadership` — Leadership & Activities

**Purpose.** Responsibility carried outside a job title. Weighted heavily for students and early career; thins out as employment history grows.

**Also called:** leadership, activities, extracurricular, involvement, societies, clubs, community

- Treat like Experience — role, organisation, dates, outcome bullets.
- Retain later in a career only where it carries genuine scope: a board seat, a chaired committee, a conference track.

### `publications` — Publications

**Purpose.** Published work. Expected in academic and research contexts, selective elsewhere.

**Also called:** publications, papers, articles, writing, authored works

- One consistent citation style throughout.
- On an industry resume, select three to five and title the section 'Selected Publications'. A full list belongs on an academic CV.

### `presentations` — Talks & Presentations

**Purpose.** Conference talks, invited lectures, panels — external credibility a job title does not convey.

**Also called:** presentations, talks, speaking, conferences, keynotes, speaking engagements

- Title, venue, year. Note invited or keynote status where it applies.

### `awards` — Awards & Honours

**Purpose.** Third-party recognition — the only section where someone else is doing the claiming.

**Also called:** awards, honors, honours, recognition, prizes, scholarships, distinctions

- Award, awarding body, year, and one clause on selectivity where it is not obvious: 'top 2% of 1,400 staff'.
- May be folded into Education or Experience when there are only one or two.

### `volunteering` — Volunteering

**Purpose.** Unpaid contribution. Also a legitimate way to account for a career break.

**Also called:** volunteering, volunteer work, pro bono, community service, charity

- Include where it shows relevant skill, sustained commitment, or covers a gap. Otherwise optional.
- Political and religious affiliations are a discrimination risk in most markets — include only where genuinely relevant to the role.

### `languages` — Languages

**Purpose.** Working languages and level. Materially more important outside monolingual markets.

**Also called:** languages, language skills, spoken languages, fluency

- Name a recognised scale: CEFR (A1–C2) in Europe, or plain words — Native / Fluent / Professional working / Conversational.
- Do not list the posting's own language as a skill when you are applying in it natively.

### `work-authorization` — Work Authorisation

**Purpose.** Whether you can legally work in the target country. The single most consequential line on an international application and the one most often left off.

**Also called:** work authorization, visa, visa status, right to work, work rights, immigration status, sponsorship

- State it plainly in one line when applying across a border. Recruiters screen on it first, and silence is read as 'needs sponsorship'.
- State the entitlement, not the personal circumstance: 'Australian citizen — unrestricted work rights' or 'UK Skilled Worker visa, valid to 2029'.
- Where sponsorship IS required, saying so early saves both sides a cycle. It is not a weakness to hide; it is a filter to pass honestly.
- Sits in the header line or immediately under the summary — it is a screening fact, not an afterthought.

### `security-clearance` — Security Clearance

**Purpose.** Held clearance level and status. Gates entire job families in defence, government and adjacent industry.

**Also called:** clearance, security clearance, vetting, baseline, nv1, sc, dv

- Level, sponsoring country, and current status only. Never project details, agency names, or anything the clearance itself covers.
- Place high where the posting requires it — it is often a hard filter before anything else is read.
- Clearances are country-specific and rarely transfer. State the issuing country.

### `memberships` — Professional Memberships

**Purpose.** Professional body membership and chartered status — load-bearing in engineering, accounting, law and medicine.

**Also called:** memberships, affiliations, professional bodies, associations, chartered status

- Body, membership grade, and year admitted. Chartered or registered status is a qualification, not a hobby — say it clearly.

### `interests` — Interests

**Purpose.** A short human line. Genuinely conventional in some markets, space-wasting in others.

**Also called:** interests, hobbies, personal interests, outside work, activities outside work

- One line, three or four specifics. 'Reading, travel, music' says nothing about anyone.
- First thing to cut when the page is tight.

### `referees` — Referees

**Purpose.** Named referees with contact details. Expected up front in some markets, actively discouraged in others.

**Also called:** references, referees, reference contacts

- 'References available on request' is filler in every market. Either list them because the market expects it, or omit the section entirely.
- Never list a referee you have not asked. It costs you the reference and the referee's goodwill at once.
- Where listed: name, title, organisation, relationship to you, and a contact channel they have agreed to.

### `personal-details` — Personal Details

**Purpose.** Photo, date of birth, nationality, marital status. Conventional in parts of Europe, Asia, the Middle East and Latin America; a legal and discrimination hazard in the US, UK, Canada and Australia.

**Also called:** personal details, photo, date of birth, dob, nationality, marital status, personal data

- Governed entirely by the region profile. Include ONLY where the target market expects it.
- In the US, UK, Canada, Australia, New Zealand and Ireland, a photo or date of birth can force an employer to discard the application to protect themselves against a discrimination claim. This is not a style preference.
- Never volunteer marital status, dependants, religion, or health information in any market unless a legal requirement is documented.

### `gdpr-clause` — Data Processing Consent

**Purpose.** A short consent line permitting the employer to process your personal data. Conventional and sometimes required in parts of the EU, most strictly in Poland.

**Also called:** gdpr, gdpr clause, data consent, privacy clause, rodo

- One line at the foot of the document. Where required, an application without it may be discarded unread.
- Meaningless outside the jurisdictions that ask for it — omit rather than include 'just in case'.

### `additional` — Additional Information

**Purpose.** A deliberate catch-all for one-line facts that earn a mention but not a section: a driving licence where the job needs one, willingness to relocate, notice period.

**Also called:** additional, additional information, other, miscellaneous, extras

- Keep it to a few lines. A long 'Additional' section means something in it deserved its own heading.

## Layout presets

A layout is nothing but an ordered list of section ids. Swapping layout
never rewrites content — it reorders the same sections.

### `ats-reverse-chron` — ATS Reverse-Chronological _(default)_

**When to use.** The default, and correct for the large majority of applications — any online portal, any recruiter, any established career in one field.

**Order:** `header` → `summary` → `skills` → `experience` → `education` → `certifications` → `projects` → `awards` → `additional`

### `early-career` — Early Career / Graduate

**When to use.** Student, new graduate, or within roughly two years of finishing study. Education carries the weight that employment cannot yet.

**Order:** `header` → `summary` → `education` → `skills` → `experience` → `projects` → `leadership` → `awards` → `additional`

### `career-change` — Career Change / Hybrid

**When to use.** Moving between fields, where transferable capability matters more than the sequence of employers.

**Order:** `header` → `summary` → `skills` → `projects` → `experience` → `certifications` → `education` → `additional`

### `technical` — Technical / Engineering

**When to use.** Roles gated on a named stack, where the first screen is a keyword match against tools.

**Order:** `header` → `summary` → `skills` → `experience` → `projects` → `certifications` → `education` → `additional`

### `cleared-govt` — Cleared / Government

**When to use.** Defence, government or regulated roles where clearance and citizenship are hard filters applied before the resume is read properly.

**Order:** `header` → `work-authorization` → `security-clearance` → `summary` → `skills` → `experience` → `certifications` → `education` → `additional`

### `academic-cv` — Academic CV

**When to use.** Faculty, postdoctoral, research and fellowship applications. Length is driven by the record — multi-page is expected, not a fault.

**Order:** `header` → `education` → `experience` → `publications` → `presentations` → `awards` → `memberships` → `languages` → `referees`

### `international-relocation` — International / Relocating

**When to use.** Applying across a border. Front-loads the two facts a foreign recruiter screens on before anything else — can you work here, and can I place your background.

**Order:** `header` → `work-authorization` → `summary` → `skills` → `experience` → `education` → `languages` → `certifications` → `additional`

## Regional conventions

Resume convention is not universal, and applying one market's rules to
another is a common and costly error in both directions — a photo that voids
a US application, a missing consent clause that voids a Polish one.

### `au-nz` — Australia & New Zealand

**Countries:** Australia, New Zealand

- **Document is called:** Resume (or CV — used interchangeably)
- **Length:** 2–3 pages is normal and expected. The one-page rule is a US convention and reading it as universal actively hurts you here.
- **Spelling:** Australian/British — organisation, specialise, programme.
- **Dates:** DD/MM/YYYY
- **Omit:** `personal-details`

- `referees` — Commonly listed, or 'available on request' is tolerated here more than elsewhere. Two referees is standard.
- `education` — No GPA convention. WAM or a class of honours may be given where strong.
- `work-authorization` — Citizenship or visa status is routinely stated and often explicitly asked for. Say it.
- `security-clearance` — AGSVA levels (Baseline, NV1, NV2, PV) are widely recognised and worth naming precisely.

> ⚠️ No photo, date of birth, marital status or nationality beyond work rights.

### `us` — United States

**Countries:** United States

- **Document is called:** Resume ('CV' means the academic document only)
- **Length:** One page is the strong default; two pages past roughly ten years of experience.
- **Spelling:** US — organization, specialize, program.
- **Dates:** MM/YYYY
- **Omit:** `personal-details`, `referees`

- `education` — GPA conventionally included if 3.0+ and within a few years of graduating; dropped thereafter.
- `referees` — Never on the resume. Supplied separately when asked.
- `work-authorization` — State it if you are not a citizen or permanent resident — 'Authorized to work in the US without sponsorship' is the standard line.

> ⚠️ A photo, date of birth or marital status can force an employer to discard the application to avoid a discrimination claim. This is the strictest market on this point.

### `uk-ie` — United Kingdom & Ireland

**Countries:** United Kingdom, Ireland

- **Document is called:** CV
- **Length:** Two pages is the firm convention. One page reads as thin, three as undisciplined.
- **Spelling:** British — organisation, specialise, programme.
- **Dates:** DD/MM/YYYY
- **Omit:** `personal-details`

- `referees` — 'References available on request' is still common but adds nothing. Omitting the section is safe.
- `education` — Degree classification (First, 2:1) is expected and is the grade signal — not GPA.
- `memberships` — Chartered status (CEng, CITP, ACA) is significant and belongs high.
- `work-authorization` — Post-Brexit this matters for EU nationals too. State settled status or visa type.

> ⚠️ No photo, date of birth, nationality or marital status.

### `ca` — Canada

**Countries:** Canada

- **Document is called:** Resume
- **Length:** One to two pages.
- **Spelling:** Canadian — a British/US hybrid; 'organization' but 'centre'.
- **Dates:** YYYY-MM or MM/YYYY
- **Omit:** `personal-details`, `referees`

- `languages` — English/French bilingualism is a genuine differentiator, especially federally and in Quebec.
- `work-authorization` — State PR or citizenship status plainly.
- `education` — Foreign credentials benefit from an equivalency note (WES or similar) where you have one.

> ⚠️ Human rights legislation makes photo, age, marital status and nationality inappropriate.

### `dach` — Germany, Austria & Switzerland

**Countries:** Germany, Austria, Switzerland

- **Document is called:** Lebenslauf (CV), usually inside a full Bewerbung application set
- **Length:** One to two pages, tabular and factual.
- **Spelling:** German where applying in German; otherwise standard English.
- **Dates:** DD.MM.YYYY
- **Requires:** `personal-details`

- `personal-details` — A professional headshot remains conventional, though declining. Date and place of birth and nationality are commonly included. This is the inverse of the Anglophone markets — follow the local norm, not the US one.
- `experience` — Gaps are scrutinised more than in most markets; account for them explicitly.
- `certifications` — Reference letters (Arbeitszeugnisse) from prior employers are a distinct expected artefact — not part of the CV, but assemble them.
- `languages` — CEFR levels expected. German level is often the deciding factor.

> ⚠️ Signing and dating the document is still conventional in traditional sectors.

### `fr` — France

**Countries:** France

- **Document is called:** CV
- **Length:** One page strongly preferred, even at senior level.
- **Spelling:** French where applying in French.
- **Dates:** DD/MM/YYYY

- `personal-details` — Photo is common but no longer expected; age is sometimes included. Optional either way — omitting it is safe.
- `education` — The grande école / university distinction carries real weight; name the institution precisely.
- `languages` — Expected, with CEFR levels.

> ⚠️ Anti-discrimination guidance has moved against photos; treat them as optional, never mandatory.

### `nl-nordics` — Netherlands, Belgium & the Nordics

**Countries:** Netherlands, Belgium, Denmark, Sweden, Norway, Finland, Iceland

- **Document is called:** CV
- **Length:** Two pages.
- **Spelling:** British English where applying in English.
- **Dates:** DD-MM-YYYY

- `personal-details` — Photo is optional and increasingly skipped. Date of birth is still fairly common in the Netherlands.
- `summary` — A short personal profile is conventional and read.
- `languages` — Expected. English fluency is assumed rather than impressive; the local language is the differentiator.

> ⚠️ Flat organisational cultures — over-claimed seniority reads badly.

### `southern-eu` — Spain, Italy & Portugal

**Countries:** Spain, Italy, Portugal

- **Document is called:** CV / Curriculum Vitae
- **Length:** One to two pages.
- **Spelling:** Local language where applying locally.
- **Dates:** DD/MM/YYYY

- `personal-details` — Photo and date of birth remain common.
- `gdpr-clause` — A data-processing consent line is conventional.
- `languages` — Expected with CEFR levels.

> ⚠️ The Europass format is recognised but generic — a tailored CV usually reads better unless a public-sector posting asks for Europass specifically.

### `cee` — Poland & Central/Eastern Europe

**Countries:** Poland, Czechia, Slovakia, Hungary, Romania

- **Document is called:** CV
- **Length:** One to two pages.
- **Spelling:** Local language or English depending on the employer.
- **Dates:** DD.MM.YYYY
- **Requires:** `gdpr-clause`

- `gdpr-clause` — In Poland this is the strictest case anywhere: a CV without a data-processing consent clause is routinely discarded unread, because the employer has no lawful basis to retain it.
- `personal-details` — Photo is common.

> ⚠️ Do not omit the consent clause to match an Anglophone template. It is the one section that can void the application outright.

### `jp` — Japan

**Countries:** Japan

- **Document is called:** Rirekisho + Shokumu keirekisho (two distinct documents)
- **Length:** Prescribed by the form, not by you.
- **Spelling:** Japanese for domestic employers; English for international firms.
- **Dates:** YYYY/MM
- **Requires:** `personal-details`

- `personal-details` — The rirekisho is a standardised form with a required photo, date of birth and personal particulars. Deviating from the form is itself a negative signal.
- `experience` — The shokumu keirekisho is the separate narrative career-history document where achievements actually go.
- `languages` — JLPT level where you hold one.

> ⚠️ A Western-style resume is not a substitute for the rirekisho at a domestic employer. Foreign-owned firms in Japan often accept a standard CV — confirm which you are applying to.

### `cn-hk-sg` — China, Hong Kong & Singapore

**Countries:** China, Hong Kong, Singapore, Taiwan

- **Document is called:** Resume / CV
- **Length:** One to two pages.
- **Spelling:** British English in Singapore and Hong Kong; simplified Chinese for mainland domestic employers.
- **Dates:** YYYY-MM or DD/MM/YYYY

- `personal-details` — Photo, date of birth and nationality are commonly included in mainland China; less so in Singapore and Hong Kong, where Anglophone norms increasingly apply.
- `work-authorization` — Singapore employment pass eligibility and Hong Kong residency status are primary screening facts. State them.
- `languages` — Mandarin and Cantonese proficiency stated precisely — spoken and written levels may differ and both matter.

> ⚠️ Singapore's Fair Consideration Framework has moved employers away from personal particulars — when unsure there, follow the Anglophone convention.

### `in` — India

**Countries:** India

- **Document is called:** Resume / CV / Biodata (biodata is the older, more personal format)
- **Length:** Two to three pages is accepted.
- **Spelling:** British English.
- **Dates:** DD/MM/YYYY

- `personal-details` — Date of birth, marital status and father's name appear in traditional formats. Modern private-sector and multinational employers do not expect them — match the employer, not the tradition.
- `education` — Percentages and class of degree are the expected grade signal. Include the board or university.
- `additional` — Notice period is conventionally stated and recruiters screen on it.

> ⚠️ When applying to a multinational, use the international convention and drop the biodata fields.

### `gulf` — UAE & the Gulf

**Countries:** United Arab Emirates, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman

- **Document is called:** CV
- **Length:** Two to three pages.
- **Spelling:** British English.
- **Dates:** DD/MM/YYYY
- **Requires:** `work-authorization`

- `personal-details` — Photo, date of birth and nationality are conventional and widely expected.
- `work-authorization` — Visa status and sponsorship transferability are decisive screening facts. State current visa type and whether an NOC is required.
- `languages` — Arabic proficiency is a genuine differentiator where you have it.

> ⚠️ Nationality materially affects hiring and packages in this market. State it, since it will be asked immediately regardless.

### `latam` — Brazil & Latin America

**Countries:** Brazil, Mexico, Argentina, Chile, Colombia, Peru

- **Document is called:** Currículo / Hoja de vida / CV
- **Length:** One to two pages.
- **Spelling:** Portuguese in Brazil; Spanish elsewhere.
- **Dates:** DD/MM/YYYY

- `personal-details` — Photo and date of birth are common. Brazil conventionally includes CPF on domestic applications.
- `languages` — English fluency is a strong differentiator — state the level precisely.
- `education` — Name the institution; regional reputation carries weight.

> ⚠️ Never include a national identity number on an international application — only on a domestic one where it is conventional.

### `za` — South Africa

**Countries:** South Africa

- **Document is called:** CV
- **Length:** Two to three pages.
- **Spelling:** British English.
- **Dates:** DD/MM/YYYY

- `referees` — Commonly listed in full with contact details.
- `personal-details` — Employment-equity status is often requested on a separate form; it does not belong in the CV body.
- `work-authorization` — State citizenship or permit type.

> ⚠️ Identity numbers are conventional domestically but should never appear on an international application.
