# 0007. ATS resume engine and PDF export: Rationale

## Context

Modern hiring workflows rely heavily on Applicant Tracking Systems (ATS) that parse incoming resumes, extract candidate skills, and calculate keyword match relevance before any recruiter inspects the document. Candidates frequently fail initial screening because their authentic accomplishments lack standard keyword phrasing or clear quantifiable structure. Standard resumes formatted with multi column sidebars, graphics, tables, or non standard font encodings frequently garble in automated parsers, turning qualified job seekers into rejected applicants.

Furthermore, applicants need their achievements framed in high impact formats such as the Google XYZ formula ("Accomplished [X] as measured by [Y], by doing [Z]"). However, generative AI tools frequently hallucinate unearned numbers, fabricated percentages, or unearned responsibilities when attempting to satisfy this formula. CareerCraft AI requires an optimization engine that strictly honors authentic experience, restructuring statements for maximum impact without inventing unverified facts.

Finally, bilingual candidates applying for positions across international and Middle Eastern markets face significant technical obstacles when exporting Arabic resumes. Arabic script requires continuous cursive shaping and right to left bidirectional text reordering. Standard PDF generators frequently render Arabic letters disconnected or backwards, breaking both automated text extraction and human readability. The export engine must deliver selectable, vector searchable PDF documents in both English and Arabic while honoring candidate privacy through ephemeral in memory generation.

## Options considered

### Option 1: Hybrid ATS engine with zero hallucination Google XYZ rewriting and server side React PDF with text shaping

A multi stage architecture combining deterministic keyword extraction with structured AI evaluation. An ATS scorer calculates a 0 to 100 score with keyword gap analysis. The bullet rewriting engine restructures experience into the Google XYZ formula with strict zero hallucination guards. PDF export compiles vector documents in server memory using `@react-pdf/renderer` with embedded IBM Plex Sans Arabic and Geist Sans fonts, using `arabic-persian-reshaper` and `bidi-js` for Arabic text shaping.

**Pros**:

- Produces lightweight, ATS searchable vector PDFs with crisp typography in both English and Arabic.
- Zero server side browser overhead, running smoothly in memory without headless Chromium containers.
- Hybrid scoring combines predictable keyword verification with intelligent semantic evaluation.
- Full respect for user privacy with ephemeral streaming and no disk storage requirements.

**Cons**:

- Requires embedding true type font files and running bidi text shaping in Node.js runtime.
- Complex multi page layout rules must be declared using React PDF primitives rather than standard HTML/CSS.

### Option 2: Headless browser rendering (Puppeteer or Playwright) converting HTML and CSS to PDF

The application renders a standard web page view using Tailwind CSS and uses a headless Chromium browser instance on the server to print the page to PDF via browser print emulation.

**Pros**:

- Direct reuse of existing React web components and Tailwind CSS styles for both screen and print.
- Browser layout engine natively handles complex Arabic cursive script and bidirectional text flow.

**Cons**:

- Massive container footprint, adding several hundred megabytes of Chromium binaries to the deployment image.
- High server memory consumption and cold start latency on serverless and container runtimes.
- Significant scaling and concurrency bottlenecks when multiple users request PDF downloads simultaneously.

### Option 3: Client side browser print dialog (window.print) with CSS print stylesheets

The browser renders a printable version of the resume on screen and triggers the operating system print dialog using `window.print()`, delegating PDF creation entirely to the user browser.

**Pros**:

- Zero server compute overhead and no new runtime dependencies or font embedding complexity.
- Browser natively handles Arabic script shaping and printing.

**Cons**:

- Highly inconsistent visual output across different operating systems, browsers, and user print margins.
- Users must manually select "Save as PDF" and toggle print headers and footers, creating a poor user experience.
- Automated ATS compatibility cannot be guaranteed due to varied browser PDF virtual printer implementations.

## Rationale

Option 1 is selected because it satisfies all architectural and privacy requirements with minimal server overhead. Headless Chromium (Option 2) introduces unacceptable deployment bloat and memory spikes that jeopardize affordable hosting for open source projects. Relying on client side browser print dialogs (Option 3) produces inconsistent layout margins and breaks the polished product bar expected of an autonomous career agent.

By using `@react-pdf/renderer` with server embedded fonts and cursive text shaping, CareerCraft AI delivers clean, searchable, single column vector PDFs that parse reliably in automated applicant tracking systems. The hybrid scoring pipeline ensures that keyword gaps are highlighted accurately, while prompt invariants guarantee that experience bullets are restructured with impact without inventing deceptive metrics.
