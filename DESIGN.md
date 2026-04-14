# Design System Document: Precision Performance Athleticism

## 1. Overview & Creative North Star: "The Kinetic Monolith"
This design system moves beyond the generic "fitness tracker" aesthetic to establish a premium, high-performance environment. Our North Star, **The Kinetic Monolith**, represents the intersection of unyielding data precision and explosive athletic energy. 

We break the "template" look by rejecting the standard mobile grid in favor of **intentional asymmetry** and **tonal depth**. The UI is treated not as a flat screen, but as a sophisticated hardware interface. We utilize high-contrast typography scales and overlapping elements to create a sense of forward momentum. This is an editorial approach to data: bold, unapologetic, and hyper-legible.

## 2. Colors: High-Contrast Vitality
The palette is rooted in a deep, atmospheric foundation to make performance data "pop" with neon-like intensity.

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined solely through background color shifts or tonal transitions. Use `surface-container-low` against a `background` to define a section. Content defines its own space through volume, not lines.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. We use the Material surface tiers to create "nested" depth:
- **Base Layer:** `surface` (#0c0e11) for the overall application backdrop.
- **Sectional Layer:** `surface-container-low` (#111417) for large content areas.
- **Interactive Layer:** `surface-container-high` (#1d2024) for cards and primary UI blocks.
- **Focus Layer:** `surface-bright` (#292c31) for active states or secondary "lifted" elements.

### The "Glass & Gradient" Rule
To elevate the experience, floating elements (like music controllers or quick-action FABs) must use **Glassmorphism**. Apply `surface-variant` at 60% opacity with a `24px` backdrop blur. 
- **Signature Textures:** Apply a linear gradient from `primary` (#f4ffc9) to `primary-container` (#cefc22) at a 135° angle for primary CTAs and progress rings to provide a "pulsing" energetic soul.

## 3. Typography: Editorial Authority
Our typography is the backbone of the "athletic" feel. We mix high-character display faces with technical monospaced fonts for a "stopwatch" precision.

*   **Display & Headlines (Lexend):** Used for big numbers, personal records, and motivational headers. Its geometric clarity feels modern and authoritative.
*   **Body & Titles (Inter):** The workhorse. Inter provides maximum legibility during high-intensity movement.
*   **Labels & Data (Space Grotesk):** Used for weights, reps, and timestamps. Its technical, slightly monospaced feel mimics high-end gym equipment displays.

**Hierarchy as Identity:** Use `display-lg` for daily step counts or heart rate to make the data the "hero" of the layout. Don't be afraid of oversized type; let it bleed off-center to create a dynamic, editorial composition.

## 4. Elevation & Depth: Tonal Layering
We avoid the "card-on-canvas" look. Depth is achieved through light and shadow, mimicking a physical cockpit.

*   **The Layering Principle:** Place a `surface-container-highest` (#23262a) card on a `surface-container-low` (#111417) section. This creates a soft, natural lift that feels integrated into the OS rather than "pasted on."
*   **Ambient Shadows:** Floating elements use extra-diffused shadows. 
    *   *Spec:* `0px 20px 40px rgba(0, 0, 0, 0.4)`. The shadow should feel like a soft glow of "absence" rather than a harsh dark line.
*   **The "Ghost Border" Fallback:** If a container requires further definition (e.g., in a complex data table), use a "Ghost Border": `outline-variant` (#46484b) at **15% opacity**.

## 5. Components: The Performance Kit

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary-container`), `xl` (1.5rem) roundedness. Text is `on-primary-fixed` (#3b4a00).
*   **Secondary:** Glassmorphic background (`surface-bright` at 40% opacity) with a `px` Ghost Border.
*   **Tertiary:** No background. Bold `secondary` (#00e3fd) text with `label-md` styling.

### Cards & Data Lists
*   **Rule:** Forbid divider lines. Use `8px` of vertical white space (Spacing `2`) and a color shift to `surface-container-lowest` (#000000) for the card background to separate workout history items.
*   **The "Progress Blade":** Use `secondary` (#00e3fd) for "live" data indicators. These should be thin (2px-4px) bars that run vertically along the left edge of a card to indicate active tracking.

### Inputs & Selection
*   **Input Fields:** Use `surface-container-highest` for the field body. The active state is signaled not by a border, but by a 2px underline of `primary-dim` (#c1ed00).
*   **Chips:** Use `xl` roundedness. Unselected: `surface-container-high`. Selected: `primary` with `on-primary` text.

### Custom Components
*   **The "Performance Ring":** A custom progress component using `secondary` for the main metric and `secondary_container` for the track. Apply a subtle outer glow using the `secondary` color at 20% opacity.

## 6. Do's and Don'ts

### Do:
*   **Use Asymmetry:** Place titles on the far left and large display numbers slightly offset to the right to create visual tension.
*   **Embrace the Dark:** Keep 90% of the UI in the `surface` and `surface-container` range to ensure the `primary` and `secondary` accents feel electric.
*   **Use Monospaced Nuance:** Always use `Space Grotesk` for numbers that change rapidly (timers, heart rate) to prevent layout "jumping."

### Don't:
*   **No High-Contrast Borders:** Never use #FFFFFF or high-opacity `outline` colors. It breaks the "monolith" feel.
*   **No Standard Shadows:** Avoid small, muddy shadows. If it doesn't need to "float" 20px off the screen, use tonal layering instead.
*   **No Centered "Safe" Layouts:** Avoid centering everything. It feels like a template. Align to a strict grid but use white space to push elements to the edges.

### Accessibility Note
While we use a dark theme, ensure all `on-surface-variant` text for secondary labels meets WCAG AA contrast ratios against `surface-container` backgrounds. Use `primary-dim` instead of `primary` for small text to ensure legibility against dark slate.