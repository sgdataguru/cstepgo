# Design Tokens Reference

This document outlines the design tokens used for visual consistency across the StepperGO application.

## Color Palette

### Primary Colors
| Token | Variable | Value | Usage |
|-------|----------|-------|-------|
| Primary | `--color-primary` | `#00C2B0` | Main brand color, CTAs |
| Peranakan | `--color-primary-peranakan` | `#FF6B6B` | Secondary brand, highlights |
| ModernSg | `--color-primary-modernSg` | `#00C2B0` | Main teal color |
| Accent | `--color-primary-accent` | `#FFD93D` | Accent elements, emphasis |
| Light | `--color-primary-light` | `#E6FAF8` | Backgrounds, hover states |
| Dark | `--color-primary-dark` | `#009688` | Active states, borders |

### Semantic Colors
| Token | Variable | Value | Usage |
|-------|----------|-------|-------|
| Success | `--color-success` | `#22C55E` | Success states, confirmations |
| Warning | `--color-warning` | `#F59E0B` | Warning states, alerts |
| Error | `--color-error` | `#EF4444` | Error states, destructive actions |
| Info | `--color-info` | `#3B82F6` | Informational states |

### Neutral Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-neutral-50` | `#F9FAFB` | Lightest background |
| `--color-neutral-100` | `#F3F4F6` | Light backgrounds |
| `--color-neutral-200` | `#E5E7EB` | Borders, dividers |
| `--color-neutral-300` | `#D1D5DB` | Disabled states |
| `--color-neutral-400` | `#9CA3AF` | Placeholder text |
| `--color-neutral-500` | `#6B7280` | Secondary text |
| `--color-neutral-600` | `#4B5563` | Body text |
| `--color-neutral-700` | `#374151` | Headings |
| `--color-neutral-800` | `#1F2937` | Dark text |
| `--color-neutral-900` | `#111827` | Darkest text |

## Typography Scale

### Display (Headings)
| Token | Size | Usage |
|-------|------|-------|
| `--text-display-2xl` | 60px | Hero headings |
| `--text-display-xl` | 48px | Page titles |
| `--text-display-lg` | 36px | Section headings |
| `--text-display-md` | 30px | Card titles |
| `--text-display-sm` | 24px | Subheadings |

### Body
| Token | Size | Usage |
|-------|------|-------|
| `--text-body-xl` | 20px | Large body text |
| `--text-body-lg` | 18px | Lead paragraphs |
| `--text-body-md` | 16px | Default body |
| `--text-body-sm` | 14px | Small text |

### Caption/Labels
| Token | Size | Usage |
|-------|------|-------|
| `--text-caption` | 12px | Captions, labels |
| `--text-overline` | 10px | Overline text |

### Typography CSS Classes
```css
.text-heading-1  /* 48px bold display font */
.text-heading-2  /* 36px bold display font */
.text-heading-3  /* 30px semibold display font */
.text-heading-4  /* 24px semibold display font */
.text-body-large /* 18px body font */
.text-body       /* 16px body font */
.text-body-small /* 14px body font */
.text-caption    /* 12px neutral-500 */
.text-overline   /* 10px uppercase tracking-wide */
```

## Card & Panel Styles

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-card` | 12px | Default card radius |
| `--radius-card-sm` | 8px | Small cards |
| `--radius-card-lg` | 16px | Large cards/panels |
| `--radius-button` | 8px | Buttons |
| `--radius-input` | 8px | Input fields |
| `--radius-badge` | 9999px | Badges/pills |

### Shadows (Elevation)
| Token | Usage |
|-------|-------|
| `--shadow-card` | Default card shadow |
| `--shadow-card-hover` | Card hover state |
| `--shadow-card-elevated` | Elevated cards, modals |
| `--shadow-dropdown` | Dropdown menus |
| `--shadow-modal` | Modal overlays |
| `--shadow-button` | Button default |
| `--shadow-button-hover` | Button hover |

### Spacing
| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-card` | 24px | Default card padding |
| `--spacing-card-sm` | 16px | Small card padding |
| `--spacing-card-lg` | 32px | Large card padding |

### Card CSS Classes
```css
.card             /* Default card: 12px radius, sm shadow, 24px padding */
.card-sm          /* Small card: 8px radius, sm shadow, 16px padding */
.card-lg          /* Large card: 16px radius, elevated shadow, 32px padding */
.card-elevated    /* Elevated card: 12px radius, elevated shadow */
.card-interactive /* Interactive card: hover effect with transform */
```

## Tailwind CSS Usage

### Colors
```jsx
// Use the tokenized colors
<div className="bg-primary text-white" />
<div className="bg-success-light text-success-dark" />
<div className="bg-neutral-100 text-neutral-700" />
```

### Typography
```jsx
// Use the typography scale
<h1 className="text-display-xl" />
<p className="text-body-lg" />
<span className="text-caption" />
```

### Cards
```jsx
// Use the Card component
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

<Card variant="default">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>

// Or use CSS classes directly
<div className="card">Default card</div>
<div className="card-interactive">Interactive card</div>
```

### Border Radius
```jsx
<div className="rounded-card" />     // 12px
<div className="rounded-card-sm" />  // 8px
<div className="rounded-card-lg" />  // 16px
<div className="rounded-button" />   // 8px
<div className="rounded-badge" />    // full round
```

### Shadows
```jsx
<div className="shadow-card" />          // Default shadow
<div className="shadow-card-hover" />    // Hover shadow
<div className="shadow-card-elevated" /> // Elevated shadow
<div className="shadow-modal" />         // Modal shadow
```

## Badge Styles

```jsx
<span className="badge badge-success">Success</span>
<span className="badge badge-warning">Warning</span>
<span className="badge badge-error">Error</span>
<span className="badge badge-info">Info</span>
<span className="badge badge-neutral">Neutral</span>
```

## Migration Guide

### Before (ad-hoc styling)
```jsx
<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
  <h3 className="text-xl font-semibold">Title</h3>
</div>
```

### After (using tokens)
```jsx
<Card>
  <CardTitle>Title</CardTitle>
</Card>

// Or with classes
<div className="card">
  <h3 className="text-heading-4">Title</h3>
</div>
```

## Best Practices

1. **Use tokenized colors** instead of hardcoded hex values
2. **Use typography scale** for consistent text sizing
3. **Use Card component** for consistent card styling
4. **Use semantic color tokens** for state-based styling (success, warning, error)
5. **Avoid mixing** old and new patterns in the same component
