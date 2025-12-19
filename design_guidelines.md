# Design Guidelines: AI Interview Practice Platform

## Design Approach
**System-Based Design** inspired by modern productivity tools (Linear, Notion) with elements from video conferencing platforms (Zoom, Google Meet) for the live session interface. This approach prioritizes clarity, focus, and functional efficiency appropriate for a learning/practice tool.

**Core Principles:**
- Clean, distraction-free interface that keeps users focused on practice
- Clear information hierarchy for complex features (rubrics, feedback, analytics)
- Professional but approachable aesthetic suitable for university students
- Consistent patterns across setup, live sessions, and review workflows

## Typography
**Font System:**
- **Primary:** Inter or SF Pro (clean, professional, excellent readability)
- **Headings:** Font weights 600-700, sizes ranging from text-2xl to text-4xl
- **Body:** Font weight 400-500, text-base to text-lg
- **UI Elements:** Font weight 500-600, text-sm to text-base
- **Captions/Labels:** Font weight 500, text-xs to text-sm

## Layout System
**Spacing Units:** Use Tailwind units of **2, 3, 4, 6, 8, 12, 16** for consistent rhythm
- Component padding: p-4 to p-8
- Section spacing: space-y-6 to space-y-12
- Card spacing: p-6 to p-8
- Button padding: px-6 py-3

**Grid Structure:**
- Max-width containers: max-w-7xl for main content areas
- Sidebar: Fixed width (w-64 to w-72) for navigation
- Two-column layouts for setup flows (form + preview)
- Card grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 for exercise library

## Component Library

### Navigation
**Sidebar Navigation:**
- Fixed left sidebar (w-64) with hierarchical menu structure
- Active state clearly distinguished with background highlight
- Icons paired with labels for main navigation items
- Account/plan status at bottom of sidebar
- Collapsible on mobile

### Session Setup Interface
**Roleplay Selection Cards:**
- Card-based layout with clear visual hierarchy
- Template cards showing: title, description, rubric preview, difficulty indicator
- Dropdown/autocomplete for Role and Company selection
- Interviewer persona selector with visual representations
- Question bank list with inline editing capability

### Live Session Interface
**Video Session Layout:**
- Split-screen design: AI interviewer (left) + user (right if camera enabled)
- Floating control bar at bottom: captions toggle, pause, end session (red button)
- Timer display (top center or integrated into control bar)
- Turn indicator showing who should speak
- Minimal chrome to maximize focus on the practice

### Exercise Library
**Exercise Cards:**
- Grid layout (3 columns desktop, 2 tablet, 1 mobile)
- Each card contains: illustration/icon, title, skill tags (as chips/badges), description, CTA button
- Filtering by skill tags and difficulty
- Progress indicators (trophy icons, completion percentages)

### Recording History
**Table View:**
- Clean data table with columns: Title, Date, Roleplay Type, Score/Metrics
- Search and filter controls
- Tabs for "My Recordings" vs "Shared with me"
- Row actions: view details, share, delete

### Dashboard & Analytics
**Metrics Display:**
- Stat cards for key metrics (sessions completed, average score, improvement)
- Chart components for progress over time
- Rubric breakdown visualization
- Recent activity feed

### Onboarding Flow
**Progressive Steps:**
- Full-screen onboarding cards with clear progression indicator
- Single focus per step with centered content
- Skip option available but not prominent
- Personalization questions with icon-based selection options

## Buttons & Interactive Elements
**Primary Actions:** Prominent solid buttons for main CTAs ("Get Started", "Start Practicing")
**Secondary Actions:** Outlined or ghost buttons for alternative paths
**Destructive Actions:** Red for session end, deletion (clearly distinguished)
**Button Sizes:** px-6 py-3 for standard, px-8 py-4 for prominent CTAs

## Forms & Inputs
**Input Fields:**
- Clear labels above inputs
- Autocomplete/typeahead for searchable selections (Role, Company)
- Validation feedback inline
- Helpful placeholder text

## Feedback & Status
**Rubric Display:** Badge/chip components showing evaluation criteria
**Skill Tags:** Small, colored badges for categorization
**Progress Indicators:** Progress bars, percentage displays, trophy/achievement icons
**Plan Limits:** Subtle but visible indicator of usage ("X Yoodlis remaining")

## Images
**Hero Section:** Not applicable - this is an app, not a marketing site
**Avatar/Persona Images:** AI interviewer personas shown as illustrations or stylized avatars in session
**Exercise Illustrations:** Custom icons or simple illustrations for exercise cards
**Onboarding Graphics:** Explanatory illustrations showing how the platform works

## Accessibility Notes
- High contrast for readability during practice sessions
- Clear focus states for keyboard navigation
- Captions/transcript options for live sessions
- Screen reader friendly labels throughout