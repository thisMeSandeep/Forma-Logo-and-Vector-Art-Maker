# Text SVG Enhancement Features

Currently, text in Forma Studio supports only the basics: font family, size, weight (400–700), solid fill color, and horizontal anchor. Shapes are far richer (opacity, stroke styles, shadow, blur, linear gradient fills, etc.). This document lists features to bring text up to parity with — and beyond — shape styling, while preserving clean, portable SVG output.

---

## 1. Typography Controls

Missing controls in `TextSection.tsx` that have the highest visual impact for the least complexity.

- **Italic toggle** — `font-style: italic` switch next to the weight buttons.
- **Underline / Strikethrough** — `text-decoration` chips.
- **Letter spacing (tracking)** — slider mapped to SVG `letter-spacing`, range roughly `-5..50px`.
- **Line height** — vertical rhythm control (also needed if multi-line is ever added).
- **Vertical alignment** — `dominant-baseline` toggle (top / middle / baseline / bottom) to complement the existing horizontal anchor.
- **Extended weight range** — expose 100, 200, 300, 800, 900 for variable fonts that already ship with Geist.

## 2. Fill & Color (parity with shapes)

Shapes already support `fillKind: 'solid' | 'linear'` and `fillGradient`. Lift the same machinery into text.

- **Linear gradient fill** — reuse the existing `LinearGradient` type; emit `<linearGradient>` in defs and reference via `fill="url(#...)"`.
- **Radial gradient fill** — new `radial` kind; useful for glowing badges and titles.
- **Image-clipped text** — clip a raster or SVG image to the glyph outlines (`<clipPath>` or `mask`).
- **Opacity slider** — to mirror shape opacity.

## 3. Stroke / Outline

Text currently has no stroke at all.

- **Stroke color, width, dash style** — same `StrokeStyle` controls used by shapes.
- **Outline-only mode** — set fill to `none`, useful for outlined display type.

## 4. Effects

Match shapes' `shadow` and `blur` and add a few text-specific presets.

- **Drop shadow** — reuse `ShapeShadow`; emit a single `<filter>` per text node.
- **Gaussian blur** — same as shapes.
- **Glow / neon** — colored `feGaussianBlur` + `feMerge` preset.
- **Long shadow** — stepped stacked shadows preset, popular in flat illustrations.
- **3D extrude** — N stacked offset copies in a depth color.

## 5. Transform

`TransformSection.tsx` already handles shapes; extend it to text.

- **Rotation handle** — currently text has no visible rotation control; expose it in the Transform section.
- **Skew X / Skew Y** — `transform="skewX(...)"`.
- **Flip horizontal / vertical**.

## 6. Font Management

- **Google Fonts picker** — searchable list, lazy-loaded via `<link>` injection; selected fonts inlined into exported SVG as `@font-face` (base64) so files render anywhere.
- **Font preview** — show each option rendered in its own face inside the dropdown.
