---
name: ASNOR Inventory
description: A calm, warm ledger for a tech-resale shop's stock, deals and profit.
colors:
  clay-terracotta: "#ad4f2d"
  clay-terracotta-hover: "#9a4527"
  clay-tint: "#f7edea"
  ledger-cream: "#FAF9F7"
  card-white: "#ffffff"
  parchment-wash: "#f5f0eb"
  sand-accent: "#e8ddd4"
  warm-hairline: "#e8e2db"
  field-border: "#8f8780"
  stone-text: "#6b6560"
  ledger-ink: "#1a1a1a"
  alert-red: "#dc2626"
  alert-red-hover: "#b91c1c"
  gain-green: "#16a34a"
  caution-amber: "#d97706"
  gain-wash: "#dcfce7"
  gain-ink: "#166534"
  caution-wash: "#fef3c7"
  caution-ink: "#92400e"
typography:
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.333
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
  metric:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.333
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.43
  caption:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.333
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.clay-terracotta}"
    textColor: "{colors.card-white}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.clay-terracotta-hover}"
  button-outline:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ledger-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "40px"
  button-outline-hover:
    backgroundColor: "{colors.parchment-wash}"
  button-destructive:
    backgroundColor: "{colors.alert-red}"
    textColor: "{colors.card-white}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "40px"
  input:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ledger-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
    height: "40px"
  card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ledger-ink}"
    rounded: "{rounded.xl}"
    padding: "24px"
  nav-item:
    textColor: "{colors.stone-text}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
  nav-item-active:
    backgroundColor: "{colors.clay-tint}"
    textColor: "{colors.clay-terracotta}"
  badge-secondary:
    backgroundColor: "{colors.parchment-wash}"
    textColor: "{colors.ledger-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-success:
    backgroundColor: "{colors.gain-wash}"
    textColor: "{colors.gain-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-warning:
    backgroundColor: "{colors.caution-wash}"
    textColor: "{colors.caution-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

# Design System: ASNOR Inventory

## Overview

**Creative North Star: "The Counter Ledger"**

ASNOR looks like a well-kept shop ledger that happens to be a web app: cream paper, a single clay-terracotta ink, hairline rules between rows, and figures set plainly so a price or a profit can be read at a glance across a counter. It is a working tool used all day by the owner and staff of a tech-resale shop, so the interface stays calm and gets out of the way. The warmth is real but quiet; nothing performs.

The mood is calm, warm and readable. It must never read as a cold enterprise dashboard, a neon fintech console, or a dense spreadsheet grid. Density is moderate and generous: 24px card padding, 32px between page sections, 14px body text. Colour is rationed so the one loud thing on any screen is the next action.

**Key Characteristics:**
- Cream page, white cards, warm hairline borders; depth is mostly borders and tone.
- One accent, clay terracotta, for the primary action, the active nav item and the lead chart series.
- Green and red appear only as money signals (gain/loss, growth) and status, never as decoration.
- Inter throughout, sentence case, weights 400 to 700, no display face.
- Soft, restrained controls: 12px control corners, 16px card corners, near-invisible shadows.

## Colors

A warm, low-chroma neutral field with a single saturated clay accent and two functional signals.

### Primary
- **Clay Terracotta** (#ad4f2d): the only accent, a burnt, deepened clay (5.3:1 against white, 5.1:1 on cream) so it carries white button text and link text at AA. Primary buttons, active navigation text, focus rings, links such as "View all", and the lead series (sales) in charts. **Clay Tint** (#f7edea, a solid fill, 4.6:1 for clay text) fills the active nav item and the logo and avatar chips; **Clay Terracotta Hover** (#9a4527) is the pressed-in button state.

### Neutral
- **Ledger Cream** (#FAF9F7): the page background behind every screen, including login.
- **Card White** (#ffffff): cards, dialogs, inputs, popovers, the sidebar and toasts; anything that holds content sits on white.
- **Parchment Wash** (#f5f0eb): secondary and muted fills: ghost/outline hover, secondary badges, the demo-credentials panel, skeleton blocks.
- **Sand Accent** (#e8ddd4): reserved accent fill token for emphasised neutral surfaces.
- **Warm Hairline** (#e8e2db): card borders, dividers, table rules and chart gridlines. Decorative only.
- **Field Border** (#8f8780, 3.5:1 on white): the outline of inputs, selects, textareas and checkboxes. Controls must be findable, so they get a firmer edge than a card.
- **Stone Text** (#6b6560): secondary text: labels, descriptions, captions, inactive nav, axis ticks.
- **Ledger Ink** (#1a1a1a): primary text and all numerals.

### Signals
- **Gain Green** (#16a34a, 3.3:1 on white, so large figures and fills only): positive profit, positive growth percentage, the selling price in the inventory price cell, the profit chart series, success toasts. Its soft form, **Gain Wash** (#dcfce7) with **Gain Ink** (#166534) text, is the success badge (Brand New, Available, Sell, Both). Gain Ink is also the colour for small positive-money text such as the growth percentage and daily profit rows.
- **Alert Red** (#dc2626): losses and negative growth, the purchase price in the inventory price cell, destructive buttons and badges (For Parts), error toasts. The login error uses red-50 with red-200 border and red-700 text.
- **Caution Amber** (#d97706): warnings; its soft form, **Caution Wash** (#fef3c7) with **Caution Ink** (#92400e), is the warning badge (Reserved).

### Named Rules
**The Field Edge Rule.** A control's boundary is Field Border; a container's boundary is Warm Hairline. Never use the hairline to outline something the user has to type into.

**The One Clay Voice Rule.** Clay terracotta is the only accent. If a second thing on a screen is terracotta and neither is the primary action or the current location, one of them is wrong.

**The Money Signal Rule.** Green and red mean money or state (gain and loss, sell and buy price, available and for-parts), nothing else. They are never used to tint a card, a header or an icon for atmosphere.

**The Warm Neutral Rule.** Every neutral leans warm (cream, parchment, sand, stone). No cool grey or pure black is introduced; ink is #1a1a1a.

## Typography

**Display Font:** none; headings use the body face.
**Body Font:** Inter (with ui-sans-serif, system-ui, sans-serif)
**Label/Mono Font:** Inter; the system monospace stack (`--font-mono`) is used only for serial numbers and IMEIs on the product detail page. No mono face is downloaded.

**Character:** One humanist-neutral sans in a few weights. Hierarchy comes from size, weight and the warm grey of secondary text, not from a second typeface.

### Hierarchy
- **Headline** (600, 1.5rem/24px, 1.333): page titles such as "Dashboard", with a muted 14px line beneath.
- **Title** (600, 1.125rem/18px, tight -0.025em tracking): card and dialog titles. Dashboard list cards step down to 1rem/16px.
- **Metric** (700, 1.5rem/24px): the headline figure inside a metric card; numerals in Ledger Ink, or Gain Green / Alert Red when it is profit.
- **Body** (400, 0.875rem/14px, 1.43): table cells, form text, list rows. The working size of the whole app. Text fields step up to 1rem/16px below 768px so phones do not zoom on focus.
- **Label** (500, 0.875rem/14px): buttons, nav items, field labels, row names. Metric-card titles use this in Stone Text.
- **Caption** (400, 0.75rem/12px): helper text, timestamps, badge text (500), row sub-lines.

### Named Rules
**The Plain Figures Rule.** Prices, counts and profits are set in Inter at the same weight as their neighbours (or 700 for the single headline metric), with tabular numerals so columns and metric rows align. No display numerals, no monospaced decoration, no gradient text.

## Layout

A fixed 256px sidebar on the left and a scrolling main column. The main column is centred with a 1280px maximum width and 24px padding (32px from 1024px up). Pages are stacked sections separated by 32px; card grids use a 16px gap on one column, two at 768px and four at 1024px for metrics, and a 24px gap for paired list cards.

Spacing follows the 4px Tailwind scale; the observed rhythm is 4, 8, 12, 16, 24, 32. Rows inside cards are separated by hairlines and 12px of vertical padding, not by extra boxes.

Below 1024px the sidebar becomes an overlay drawer (at most 85% of the screen wide) opened from a fixed 56px top bar that carries the menu button and the app name; the content column is padded below that bar and takes the full width, and the page height follows the dynamic viewport so browser toolbars never hide the bottom edge. The inventory list drops its table below 768px for stacked rows (name, meta, price, badges, actions) so nothing needs a sideways scroll; the other list tables still scroll horizontally inside their container.

On touch devices (`pointer: coarse`) buttons, icon buttons, inputs and selects grow to 44px (small buttons to 40px) and nav links and the Units/Accessories switch get taller. Mouse and trackpad keep the 40px sizes.

## Elevation & Depth

Flat by default with ambient lift. Surfaces rest on a Warm Hairline border and a barely-there shadow; tone (cream page under white cards) does most of the separating. Real elevation is reserved for things that float above the page.

### Shadow Vocabulary
- **Rest** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.03)`): cards and primary buttons at rest.
- **Lift** (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)`): clickable cards on hover.
- **Float** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)`): dialogs and toasts, with dialogs over a 40% black scrim and 4px backdrop blur.

### Named Rules
**The Ambient Lift Rule.** Shadows never exceed 5% black. A shadow that can be seen on its own is too strong; it exists to hint at a layer, not to draw it.

## Shapes

Softly rounded, never pill-shaped controls. Controls (buttons, inputs, selects, nav items, toasts) use a 12px radius; small buttons step down to 8px; cards and dialogs use 16px. Badges and avatar chips are fully round (9999px), and the logo tile is a 12px rounded square tinted with Clay Tint. Borders are always 1px Warm Hairline; there are no thick strokes, dashed boxes or decorative outlines.

## Components

Soft and restrained: controls are quiet until acted on, and the terracotta button is the only loud element on a screen.

### Buttons
- **Shape:** 12px corners (small: 8px); 40px tall at 16px side padding, 36px small, 44px large, 40px square icon button (44px, 40px and 44px on touch devices).
- **Primary:** Clay Terracotta fill, white 14px/500 label, Rest shadow; hover deepens to Clay Terracotta Hover (#9a4527), 6.5:1 with the white label.
- **Outline:** white fill, 1px Warm Hairline border, Ledger Ink label; hover fills Parchment Wash.
- **Secondary / Ghost:** Parchment Wash fill or no fill; ghost shows Parchment Wash on hover. Sign-out is a ghost button in Stone Text.
- **Destructive:** Alert Red fill, white label; hover deepens to Alert Red Hover (#b91c1c).
- **Focus:** 2px clay ring with 2px offset. Disabled drops to 50% opacity with no pointer events. Transitions run 200ms.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** Card White on the cream page.
- **Shadow Strategy:** Rest; clickable cards use Lift on hover.
- **Border:** 1px Warm Hairline.
- **Internal Padding:** 24px; a header with a 14px/500 Stone Text title and a 16px Stone Text icon at the right, then the Metric figure and a 12px caption.

### Inputs / Fields
- **Style:** Card White fill, 1px Field Border, 12px radius, 40px tall, 12px side padding, Stone Text placeholder.
- **Focus:** 2px clay ring, 1px offset.
- **Error / Disabled:** disabled fields fade to 50% with a not-allowed cursor. An invalid field gets an Alert Red border and its message in Alert Red under the label, and focus moves to it; an error that belongs to no field is a bordered alert above the form buttons. Entries are never cleared by a failed save.

### Navigation
- **Style:** 14px/500 items in a vertical list, 12px radius, 10px by 12px padding, a 20px outline icon at the left.
- **States:** inactive in Stone Text, hover fills Parchment Wash and darkens text to Ledger Ink, active fills Clay Tint with Clay Terracotta text.
- **Mobile:** an overlay drawer under 1024px, opened from the top-bar menu button, closed on selection, on Escape or on scrim tap. While closed it is invisible, so it is out of the tab order and the accessibility tree. The brand block (clay-tinted icon tile, "ASNOR", "Inventory System") sits at the top and the signed-in user (initial chip, name, lowercase role) and sign-out sit at the bottom, each separated by a hairline.

### Badges
- **Style:** fully round, 12px/500 text, 10px by 2px padding. Secondary (Parchment Wash) marks Buy, Secondhand, Sold and Customer; success (Gain Wash) marks Sell, Brand New, Available and Both; warning (Caution Wash) marks Reserved; destructive (Alert Red, white text) marks For Parts; default (Clay Terracotta) marks Admin and Supplier.

### Tables
- **Style:** hairline row dividers, 44px header row in Stone Text 500, cells with 16px by 12px padding, a Parchment Wash tint at 50% on row hover, 14px text.

### Dialogs and Toasts
- **Dialog:** centred, 512px maximum and never taller than the viewport (it scrolls inside), 16px radius, 24px padding, Float shadow, a 16px close icon at the top right at 70% opacity. Focus moves in on open (an autofocus field wins), Escape closes, and failures are shown inside it next to the action.
- **Toast:** bottom-right stack (full width on phones), 300 to 400px wide, white with a hairline, a 16px status icon (green, red, or neutral for info), 14px message and a named dismiss button. Confirmations last four seconds, errors eight; hovering or focusing a toast pauses it. Errors are announced as alerts, the rest politely, identical messages don't stack, and at most four show at once.

### Loading
- **Skeleton:** Parchment Wash blocks with a gentle pulse, shaped like the content they stand in for.

## Do's and Don'ts

### Do:
- **Do** keep Clay Terracotta (#ad4f2d) for the primary action, active location, focus rings, links and the lead chart series.
- **Do** sit content on Card White over Ledger Cream with a 1px Warm Hairline, and keep shadows at or below the Rest, Lift and Float values.
- **Do** use Gain Green and Alert Red only for money and state (profit, loss, growth, prices, status), and always pair them with a sign, a label or an icon so colour is never the only cue.
- **Do** keep controls at 40px tall with 12px corners and the clay focus ring, and cards at 16px corners with 24px padding.
- **Do** set secondary information in Stone Text at 12 to 14px under the primary line, as the dashboard list rows do.

### Don't:
- **Don't** introduce a second accent hue, a gradient, or a cool grey; the palette is warm neutrals plus clay.
- **Don't** make it look like a cold enterprise dashboard, a neon fintech console or a dense spreadsheet grid.
- **Don't** use shadows that read as a dark outline, or use elevation to rank importance on the page; use size and weight instead.
- **Don't** tint whole cards, headers or backgrounds green or red.
- **Don't** add a display typeface or monospaced numerals for effect; Inter at its existing weights carries the system.
- **Don't** use pill-shaped buttons or inputs; full rounding belongs to badges and avatar chips.
