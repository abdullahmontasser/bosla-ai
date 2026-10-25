# 0006. Resume parsing and ingestion: Rationale

## Context

Job seekers often already have polished resumes in PDF or Word format. Manually retyping work histories, education entries, project descriptions, and technical skills into a web form is tedious and error prone. CareerCraft AI must allow candidates to upload their existing documents and automatically extract structured career data into their master profile.

Resumes present unique extraction challenges. Layouts vary widely from single column chronological lists to multi column designs with sidebars and visual skill bars. In bilingual environments, candidates frequently submit resumes written in Arabic or English, or mixed documents with English company names and Arabic job titles.

Furthermore, applicants who already created or tailored profiles must not suffer accidental data loss when parsing an updated document. A reliable ingestion pipeline must extract text safely, parse structured fields accurately via user configured AI models, and provide an interactive review interface where users can edit fields and decide whether to merge or replace sections before committing changes to their database profile.

## Options considered

### Option 1: Two step local text extraction with unpdf and mammoth followed by Vercel AI SDK generateObject (Recommended)

Extract raw text locally in server memory using modern lightweight libraries (unpdf for PDF and mammoth for DOCX), validate text presence, and pass sanitized text to Vercel AI SDK generateObject with a strict Zod schema matching the Profile data model.

**Pros**:

- Fast local text extraction without heavy native C++ binaries or external services.
- Zero document binary storage costs or privacy liabilities because files are processed in memory and discarded.
- Vercel AI SDK generateObject guarantees type safe schema conformance using whichever AI model the user configured in their BYOK settings.
- Works consistently across cloud providers (OpenAI, Anthropic, Gemini, Groq) and local models (Ollama).

**Cons**:

- Cannot parse image only or scanned PDFs that lack a selectable text layer.

### Option 2: Direct multimodal binary document upload to cloud AI models

Send raw PDF and Word binary buffers directly to multimodal AI models (such as Google Gemini or Anthropic Claude) via vision and document APIs.

**Pros**:

- Handles layout aware visual cues and scanned documents with embedded images directly.
- Avoids installing document extraction packages in Node.js.

**Cons**:

- Incompatible with text only models and local Ollama deployments supported in BYOK settings.
- Significantly higher token costs and latency because full document pages are encoded as images.
- Transmits raw binary documents across third party network boundaries.

### Option 3: Full background queue with Redis and standalone OCR service

Offload file processing to a dedicated asynchronous worker queue (such as BullMQ) with Tesseract OCR or cloud vision services for scanned documents.

**Pros**:

- Fully decouples file processing from web request lifecycles.
- Handles scanned documents and complex image resumes.

**Cons**:

- Introduces heavy external infrastructure (Redis, worker processes, OCR binaries) before the project needs it.
- Unnecessary operational overhead for normal resume documents that take only 2 to 5 seconds to parse.

## Rationale

Option 1 is selected because it delivers fast, reliable, and cost effective parsing that aligns directly with the project architecture. In memory extraction using unpdf and mammoth handles standard PDF and Word resumes without native binary compilation headaches or external dependencies.

Using Vercel AI SDK generateObject with strict Zod schemas ensures that candidate data maps cleanly into our existing Profile, WorkExperience, Education, Skill, and Project database models. Reusing the active user provider settings configured in spec 0004 honors the core product tenet that users own and control their AI keys. Discarding binary buffers after extraction keeps server operations lightweight, avoids cloud storage costs, and minimizes data retention liabilities.

When documents lack extractable text (such as flat scanned images), detecting this condition immediately and advising the user to upload a text selectable version provides a clear recovery path without incurring the complexity and token expense of an OCR subsystem.
