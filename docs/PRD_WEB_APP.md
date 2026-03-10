# ELI5 Reader Web App PRD

## 1. Document control
- Product: ELI5 Reader (web app)
- Status: Source of truth for active web behavior and next-phase engineering
- Version: 1.0
- Last updated: 2026-03-06
- Code baseline branch: `codex/web-snapshot`

## 2. Product summary
ELI5 Reader is a browser-based reading app that lets users import TXT/EPUB books, read inside the app, select text for AI explanations, and save useful explanations into a notebook.

The product uses a dark, editorial visual style with strong typography and high-contrast accent colors. The core user loop is:
1. Import book
2. Read
3. Select text and request ELI5 explanation
4. Save explanation to notebook
5. Revisit terms later

## 3. Goals and non-goals
### Goals
- Make importing and opening books fast and predictable.
- Keep a distraction-light reading experience.
- Provide a fast ELI5 action on selected text.
- Persist reading progress and saved terms locally.
- Support installable web/PWA behavior with stable metadata.

### Non-goals (current phase)
- Guaranteed offline reading/content sync.
- Multi-device/cloud sync.
- Collaboration, sharing, or social features.
- PDF parsing (currently intentionally disabled).
- Server-side key management (client-side prototype behavior remains).

## 4. Target users and jobs-to-be-done
- Solo learners reading long-form books/articles who need quick simplification of difficult phrases.
- Users who want lightweight local note capture while reading.
- Users who prefer web access and optional iPhone home-screen install.

Primary jobs:
- "I want to import a book and start reading immediately."
- "I want to select a hard phrase and get a simpler explanation."
- "I want to keep the best explanations in one notebook."

## 5. Information architecture
- Top-level routes:
  - `Library`
  - `Import`
  - `Reader`
  - `Notebook`
- Global bottom navigation (`NavigationBar`) available on Library, Import, Notebook.
- Reader uses a top-right menu for routing to `Library` and `Notebook`.

## 6. Functional requirements (screen-by-screen)
### 6.1 Library screen
Purpose: Browsing and opening imported books.

UI sections:
- Header: "MY" + "Library" and rotating green import sticker.
- Search bar: filters by title/author.
- Current Reads section:
  - Includes books with `lastOpenedAt` or `isCurrentRead=true`.
  - Displays large cover card, 3-dot menu, progress bar above title, title, author.
  - Progress bar always rendered; fill width from `readingProgress.percentComplete` (0-100).
- Recent Uploads section:
  - Includes books never opened (`!lastOpenedAt && !isCurrentRead`).
  - Displays row list with thumbnail, title, author/format, 3-dot menu.

Interactions:
- Tap current/recent book -> `openBook()` then navigate `Reader`.
- 3-dot menu -> Delete with confirm dialog.
- Search updates both sections in real time.

Edge/empty state:
- If no books: empty state prompt to import first book.

### 6.2 Import screen
Purpose: Bring new content into the library.

UI sections:
- Header: "IMPORT" + "Knowledge" and rotating green sticker.
- Upload area (dashed dropzone style).
- Supported formats chips.
- Recent uploads list (last 5 by `uploadedAt`) with delete menu.
- Processing overlay while parsing.
- Book details modal (title/author editable) before final save.

Supported formats:
- TXT: enabled.
- EPUB: enabled.
- PDF: blocked with explicit error message.

Flow:
1. User selects file (`input[type=file]` on web; document picker on native).
2. App reads file (text or array buffer).
3. App parses content via `parseFile()`.
4. App opens pending import modal prefilled from file metadata or filename.
5. On confirm, app creates `Book` object and saves.
6. Success alert offers:
  - View Library
  - Start Reading (opens Reader immediately)

Constraints:
- Title is required.
- Author defaults to "Unknown Author" if blank.

### 6.3 Reader screen
Purpose: Core reading and ELI5 explanation workflow.

UI sections:
- Header with current book title and author.
- Top-right menu button (3 stripes) with options: Library, Notebook.
- Long-form reading area (all chapters rendered in one continuous scroll).
- Floating selection action menu (web only).
- ELI5 bottom sheet (white surface with purple sticker).

Reading behavior:
- Loads selected `currentBook`; if missing, redirects to Library with alert.
- Restores saved scroll position when reopening.
- Debounced progress save every ~2s while scrolling.
- Progress computed by scroll offset / max scroll.

Selection + ELI5 behavior (web):
1. User selects text in paragraph.
2. Selection menu appears near selected range with:
  - `ELI5`
  - `Copy`
  - `Remove` (only if phrase already highlighted)
  - Close `x`
3. `ELI5` opens sheet in loading state, then fills response from AI service.
4. User can close or save to notebook.
5. Any explained phrase is added to local highlight list for the session.

Highlight behavior:
- Previously ELI5-processed phrases render highlighted in green.
- Clicking a highlighted phrase reopens selection menu with Remove action.
- Remove deletes phrase from local highlight list.

AI behavior:
- Uses OpenAI chat completions (`gpt-4o-mini` default unless settings override).
- Attempts cached response first; caches successful results.
- If API key missing or request fails, returns fallback placeholder explanation text.

### 6.4 Notebook screen
Purpose: Review and manage saved ELI5 terms.

UI sections:
- Header: "My" + "Notebook" and rotating green sticker.
- Search bar (term, explanation, field).
- Grouped collections by book.

Collection behavior:
- Terms grouped by `bookId`.
- Sorted by most recently saved term.
- Collapsed by default; tap book row to expand/collapse.
- Expanded terms show:
  - term text
  - explanation snippet
  - field + complexity
  - delete icon

Interactions:
- Delete term requires confirm dialog.

Empty state:
- If no results: instructional empty state.

## 7. Cross-screen behavior
### Navigation
- Bottom nav icons:
  - Home -> Library
  - Plus -> Import
  - Notes -> Notebook
- Active tab stroke uses green accent.

### Persistence
- Local-only storage via AsyncStorage:
  - Books
  - Saved terms
  - Reading progress
  - ELI5 cache
  - App settings

### Deletion rules
- Deleting a book also deletes:
  - all terms tied to that book
  - reading progress for that book

## 8. Data model requirements
### Book
Required fields:
- `id`, `title`, `author`, `abbr`, `format`, `accentColor`
- `fileName`, `fileSize`, `filePath`
- `content` with chapters and total word count
- `uploadedAt`

Optional fields:
- `lastOpenedAt`, `isCurrentRead`, `readingProgress`

### SavedTerm
- Must retain `bookId`, `chapterId`, selected `term`, `explanation`, `complexity`, `field`, `contextSnippet`, `savedAt`.

### ReadingProgress
- `bookId`, `currentChapterId`, `currentPosition`, `lastReadAt`, `percentComplete`.

## 9. Styling and UX system (current)
- Base background: near-black (`#050505`).
- Accent green: `#4DFF7E`.
- Accent purple for ELI5 actions/sheet sticker.
- Typography:
  - Bold uppercase sans for primary headings.
  - Italic serif display treatment for subtitles/authors.
  - Serif body in reader/notebook snippets.
- Signature element: rotating circular sticker in headers and ELI5 sheet.

## 10. Web/PWA requirements
- Web app title: `ELI5 Reader`.
- Favicon: custom spinner SVG.
- Required head/meta behavior:
  - theme color
  - Apple standalone tags
  - manifest link
  - apple-touch-icon link
- Service worker registration on HTTPS/localhost.
- Vercel serves `dist/` and rewrites all routes to `index.html`.
- Cache policy:
  - hashed/static assets immutable
  - `index.html`, `manifest.json`, `sw.js`, icons must revalidate

## 11. Error handling and fallback behavior
- Import parse failures show blocking alert message.
- Unsupported format errors are explicit.
- AI failures do not block flow; fallback explanation is shown.
- Confirm dialogs required before destructive deletes.

## 12. Known limitations and risks
- API key UX gap on web branch:
  - Service references saved settings key, but web UI currently lacks settings entry screen.
  - Practical key path is environment variable (`EXPO_PUBLIC_OPENAI_API_KEY`) unless storage seeded elsewhere.
- PDF import disabled.
- Reader highlight state is session-local in reader state (not rehydrated from saved terms on reopen).
- Storage cache cleanup implementation shape is inconsistent (`clearExpiredCache` treats cache as array while cache is stored as object map), so expiration cleanup may be unreliable.
- AI key is client-side in current prototype model and not production-secure.

## 13. Acceptance criteria (baseline behavior)
- User can import TXT/EPUB and confirm title/author in modal.
- Imported book appears in library and can be opened in reader.
- Opened books appear in Current Reads with progress bar rendered.
- Unopened books appear in Recent Uploads.
- User can select text (web), trigger ELI5, and see explanation sheet.
- User can save explanation to notebook and later delete it.
- Book/term data persists across refreshes.
- PWA metadata and routing behavior remain valid on deploy.

## 14. Redesign guardrails (for next branch)
The redesign may change visual style/layout, but must preserve:
- Core route structure (`Library`, `Import`, `Reader`, `Notebook`).
- Import -> read -> ELI5 -> save-to-notebook workflow.
- Deletion confirmations.
- Reading progress persistence.
- Search/filter semantics.
- Web and deploy compatibility for Expo export + Vercel.

## 15. Out-of-scope backlog (future PRDs)
- Dedicated settings screen on web for model/API key management.
- Server-proxied AI calls for key security.
- Offline-first content cache strategy.
- Cross-device sync and account system.
- Rich annotations (highlights/notes persistent in-book).
