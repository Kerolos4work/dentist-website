---
name: Dr. Adel Yousry Dental Clinic
description: An RTL Arabic clinic system with a V3 diagnostic smile blueprint.
colors:
  ink: "#060809"
  surface: "#0b1012"
  card: "#101619"
  card-strong: "#151d20"
  red: "#c42536"
  red-soft: "#e68089"
  red-deep: "#7d1420"
  cyan: "#2da7c4"
  cyan-soft: "#9ad9e5"
  blue-line: "rgba(45, 167, 196, 0.18)"
  blue-line-strong: "rgba(45, 167, 196, 0.46)"
  muted: "#a7b2b5"
  dim: "#748083"
  text: "#f3f1ec"
typography:
  display:
    fontFamily: "Cairo, sans-serif"
    fontSize: "clamp(54px, 7.4vw, 96px)"
    fontWeight: 800
    lineHeight: 1.06
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Cairo, sans-serif"
    fontSize: "clamp(30px, 4vw, 52px)"
    fontWeight: 800
    lineHeight: 1.28
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Cairo, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.85
  label:
    fontFamily: "Anton, Impact, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.16em"
  script:
    fontFamily: "Pinyon Script, cursive"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.2
spacing:
  gutter: "clamp(20px, 4vw, 48px)"
  section: "clamp(64px, 8vw, 116px)"
  max-width: "1240px"
rounded:
  sharp: "2px"
components:
  button-primary:
    backgroundColor: "{colors.red}"
    textColor: "{colors.text}"
    padding: "0 26px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    padding: "0 26px"
    height: "48px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    padding: "0 4px"
    height: "48px"
  anchor-nav:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    padding: "0 {spacing.gutter}"
    height: "52px"
  v3-readout:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    padding: "15px 18px 14px"
    height: "auto"
  v3-map-tile:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.text}"
    padding: "24px 22px 20px"
    height: "214px"
  v3-case-plate:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    padding: "0"
    height: "auto"
---

# Design System: Dr. Adel Yousry Dental Clinic

## Overview

**Creative North Star: "The Smile Blueprint".**

V3 is a diagnostic drafting system built on the clinic's ink/red/cyan brand. It replaces editorial cropping with modular panels, cyan measurement grids, corner ticks, numbered axes, and sparse clinical annotations. The original multi-page site keeps the editorial case-folio language.

The system is Arabic-first and RTL. It pairs oversized Cairo display with Anton for Latin numerals and Pinyon Script for the doctor's signature. Nothing is wrapped in a decorative card stack: services are ruled rows or map tiles, reviews are typographic blocks or notes, and images are treated as evidence with captions.

### V3 surface contract

- **Thesis:** A drafted treatment plan, not an editorial folio. Measurements, indices, verified readouts, and approved case plates sit on a diagnostic grid.
- **Own-world:** Ink ground; cyan measurement grid, reticles, and corner ticks; red reserved for the decisive action and approval stamp. Cairo carries Arabic display, Anton carries coordinates and specimen labels, Pinyon signs the doctor record.
- **Story:** Premise → verified readouts → eight-specialty map → case plates → three-step protocol → doctor record → patient notes → clinic coordinates → approval action.
- **First viewport:** Physical left column holds the oversized Arabic premise; physical right column holds the portrait in a scan frame; the verified readout strip is pinned below. This is explicit because the document is RTL and grid order alone would invert it.

**Key Characteristics:**
- Diagnostic drafting-grid rhythm: readouts, map tiles, case plates, and a plotted protocol.
- Asymmetric compositions that collapse cleanly to one column on mobile.
- Proof integrated into the page edge or grid, not floating as a card row.
- Hard edges, hairline borders, no rounded cards.

## Colors

The palette is a dark clinical ink with two accents used for distinct jobs.

### Primary
- **Clinical Red** (#c42536): Booking actions, the hero rule, the accent headline word, and the final call band. It is decisive, not decorative.
- **Soft Red** (#e68089): Small red text on dark surfaces, including credentials and numbered rows.
- **Deep Red** (#7d1420): Text on light surfaces inside the final call band.

### Secondary
- **Diagnostic Cyan** (#2da7c4): Small dots, reticle lines, quiet hover states, and the map treatment.
- **Cyan Mist** (#9ad9e5): Source labels, captions, coordinates, and links on dark surfaces.
- **Blueprint Line** (rgba(45,167,196,0.18–0.46)): V3 grid lines, scan frames, and protocol axes; decorative only.

### Neutral
- **Ink** (#060809): Page ground.
- **Surface** (#0b1012): Section bands and navigation.
- **Card** (#101619): Image placeholders and map frame.
- **Text** (#f3f1ec): Primary Arabic copy.
- **Muted** (#a7b2b5): Body copy and nav.
- **Dim** (#748083): Metadata and captions.

**The Accent Rarity Rule.** Red owns the action and the headline turn. It never becomes a background for ordinary content except the closing call band.

## Typography

**Display Font:** Cairo (Arabic UI and display)
**Label Font:** Anton (Latin numerals, labels, source marks)
**Script Font:** Pinyon Script (signature line only)

**Character:** Cairo gives the page weight and warmth in Arabic; Anton supplies clinical, stamped metadata; Pinyon Script adds a single human signature note. In V3, Cyan Mist may carry the second hero line and Anton labels become coordinates, specimen IDs, and plate tags.

### Hierarchy
- **Display** (800, clamp(54px,7.4vw,96px), 1.06): Hero headline only.
- **Headline** (800, clamp(30px,4vw,52px), 1.28): Section titles.
- **Title** (700, 17–24px): Service rows, case captions, approach steps.
- **Body** (400, 15–19px, 1.7–1.95): Max 42–62ch depending on context.
- **Label** (Anton, 11px, 0.16em, uppercase): Section side labels and proof values.

**The No Eyebrow Rule.** Section headings stand alone. Latin labels sit beside them, never above them.

## Layout

- Container: `max-width: 1240px` with `clamp(20px,4vw,48px)` gutters.
- Section rhythm: `clamp(64px,8vw,116px)` vertical padding, hairline top/bottom borders.
- Hero: asymmetric two-column grid, portrait crop on one side, oversized copy on the other, proof or readout strip pinned to the bottom edge.
- V3 map: 4-column treatment tiles; V3 plates use a 12-column grid with the first plate spanning 6, others spanning 3.
- V3 protocol: three plotted steps on one axis, collapsing to a vertical list below 920px.
- Breakpoints: 1120px and 1040px collapse map and major grids; 920px collapses hero and layout pairs; 760/700px switch proof, Instagram, notes, and plates; 480px tightens type and caption layout.
- Anchors use `scroll-margin-top: 112px` to clear the shared sticky header.

## Elevation & Depth

The system is flat by default. Depth comes from tonal layering (`ink` → `surface` → `card`), 1px borders, and the single hero portrait reveal. There is no shadow vocabulary.

## Shapes

Hard edges everywhere. `2px` radius is the only declared radius and is effectively sharp. Images are clipped by simple rectangles, sometimes with a 12px inset border on the hero portrait. No pills, no blobs, no geometric masks over faces.

## Components

### Buttons
- **Shape:** Square corners, 48–50px height.
- **Primary:** Red fill, white text, 26px horizontal padding; hover turns transparent with the red border retained.
- **Quiet:** Underlined text link in muted/cyan; no fill.

### Anchor Navigation
- **Style:** 50px ruled strip, V3 mark on one end, horizontally scrollable anchor links, and an internal booking CTA on the other. No link to V1.
- **Mobile:** V3 mark hides; the anchor row scrolls and the booking CTA stays compact.

### Appointment Shell
- **Style:** Reuses V1's shared sticky header and visual language, with booking-specific nav links; the `DR / AY` mark and V3 blueprint nav stay out.
- **Pages:** Booking, status, and staff dashboards share this shell with a neutral footer, so V3 navigation remains isolated.

### Proof Rail
- **Style:** Four bordered cells at the hero edge, Anton values with small captions.
- **State:** Value turns Cyan Mist on hover.
- **Mobile:** Two columns with hairline separators.

### Case Figure
- **Style:** Bordered image crop with a caption row: Arabic title plus Anton tag.
- **Variants:** Wide 16:10 and tall 4:5; mobile uses 4:3 for both.

### Review Block
- **Style:** Featured review has a 2px red top rule and large quote type; side reviews are separated by hairlines.
- **Links:** Source links are Cyan Mist with a 1px underline.

### Map Frame
- **Style:** 4:3 bordered iframe, grayscale/invert filter to sit in the dark palette.

### V3 Readout Cell
- **Style:** Flat bordered grid cell with Anton value, Cyan Mist source label, and muted meta line.
- **State:** Border shifts to Blueprint Line on hover.
- **Mobile:** Two columns.

### V3 Treatment Map Tile
- **Style:** Square-cornered 4-column tile with Anton index, Arabic title, short description, and Latin code.
- **State:** Background lifts from Ink to Card on hover; no shadow.

### V3 Case Plate
- **Style:** Bordered image crop with a cyan reticle, Latin tag chip, and Arabic caption.
- **Variants:** First plate spans 6 of 12 columns; the rest span 3. Mobile uses 4:3 crops in one column.

### V3 Protocol Step
- **Style:** Numbered node on a cyan axis; title and explanation sit below the node.
- **Mobile:** Axis becomes a vertical ruled list.

### V3 Patient Note
- **Style:** Flat card with a ruled-paper background, source/score header, quote, and source link.
- **Mobile:** One column.

### V3 Approval Stamp
- **Style:** Small rotated white outline box with Anton text in the red closing band; decorative and aria-hidden.
- **Mobile:** Hidden below 700px.

## Do's and Don'ts

### Do:
- **Do** use real patient images from `SOURCES.md` with consent disclaimers.
- **Do** keep Arabic as the reading order and use `dir="ltr"` only for Latin labels, numbers, and phone strings.
- **Do** let section headings carry their own weight with no label above them.
- **Do** keep external source links `target="_blank" rel="noopener noreferrer"`.
- **Do** keep V1's multi-page structure and V3's diagnostic blueprint as distinct systems; borrow facts, not composition.

### Don't:
- **Don't** add same-size icon cards, gradient text, glass decoration, or hard offset shadows.
- **Don't** turn a rating or fee into a hero-metric card template.
- **Don't** invent opening hours, Facebook statistics, or absolute “painless” claims.
- **Don't** modify V1 routes while working on V3.
- **Don't** make V3 a restyled copy of V1; its grid, readouts, and protocol must carry the difference.
