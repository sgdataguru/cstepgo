---
applyTo: '**'
---
# AI Assistant Rules and Guidelines

## 1. Code Quality Standards

### Naming Conventions
- Use descriptive, meaningful names for variables, functions, and classes
- Follow language-specific conventions (camelCase for JavaScript/TypeScript, PascalCase for React components)
- Prefix private members with underscore
- Use verb phrases for functions (e.g., getUserData) and noun phrases for variables (e.g., userData)

### Code Structure
- Functions: Maximum 30 lines
- Files: Maximum 400 lines
- Line length: Maximum 80 characters
- Parameters: Maximum 3 per function
- Apply Single Responsibility Principle

### Code Safety
- Validate all input parameters
- Implement comprehensive error handling
- Use TypeScript for type safety
- Prevent common vulnerabilities (XSS, CSRF, SQL injection)
- Use environment variables for sensitive data

### Performance
- Optimize database queries and API calls
- Implement proper caching strategies
- Use appropriate data structures
- Consider memory management
- Implement lazy loading where beneficial

## 2. Architecture & Design Guidelines

### Design Patterns
- Follow SOLID principles
- Use appropriate design patterns (Factory, Singleton, Observer etc.)
- Implement dependency injection
- Keep components loosely coupled
- Maintain high cohesion

### System Architecture
- Follow Next.js best practices
- Implement proper routing structure
- Separate concerns (UI, business logic, data access)
- Use proper state management
- Implement error boundaries

### Security Protocols
- Implement authentication and authorization
- Use HTTPS for all communications
- Follow OWASP security guidelines
- Implement rate limiting
- Secure API endpoints

### 🎮 Gaming Aesthetics Design System

StepperGO uses a modern gaming-inspired UI with dark themes, neon accents, and immersive visual effects. This creates an engaging, premium experience for users.

#### Core Design Philosophy
- **Dark-first approach**: Deep blacks and dark grays as primary backgrounds
- **Neon highlights**: Vibrant accent colors that pop against dark backgrounds
- **Glass morphism**: Frosted glass effects for depth and modern feel
- **Responsive animations**: Smooth micro-interactions and transitions
- **Immersive gradients**: Dynamic color flows inspired by gaming interfaces

#### Gaming Color Palette
```typescript
// Gaming Aesthetics Color System
export const gamingColors = {
  // Dark Theme Backgrounds
  background: {
    primary: '#0a0a0a',      // Deep black
    secondary: '#111111',    // Soft black
    tertiary: '#1a1a1a',     // Dark gray
    elevated: '#252525',     // Elevated surfaces
    card: '#1f1f1f',         // Card backgrounds
  },
  
  // Neon Accent Colors
  neon: {
    cyan: '#00f0ff',         // Primary neon - Electric cyan
    cyanGlow: '#0099ff',     // Cyan variant for glows
    purple: '#cc00ff',       // Secondary neon - Magenta
    purpleGlow: '#ff00ff',   // Purple variant for glows
    green: '#00ff88',        // Success/CTA - Neon green
    greenGlow: '#39ff14',    // Green variant for glows
    orange: '#ff6600',       // Warning - Neon orange
    orangeGlow: '#ff9500',   // Orange variant for glows
    red: '#ff0055',          // Error - Neon red
    redGlow: '#ff3366',      // Red variant for glows
    gold: '#FFD700',         // Premium/Accent - Gold
  },
  
  // Text Colors on Dark
  text: {
    primary: '#ffffff',      // Main headings
    secondary: '#b3b3b3',    // Body text
    muted: '#666666',        // Hints and disabled
    accent: '#00f0ff',       // Links and highlights
  },
  
  // Gradient Presets
  gradients: {
    neonCyan: 'linear-gradient(135deg, #00f0ff 0%, #0099ff 100%)',
    neonPurple: 'linear-gradient(135deg, #cc00ff 0%, #ff00ff 100%)',
    neonDual: 'linear-gradient(135deg, #00f0ff 0%, #cc00ff 100%)',
    darkFade: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
    cardGlow: 'linear-gradient(145deg, rgba(0,240,255,0.1) 0%, rgba(204,0,255,0.1) 100%)',
  }
};
```

#### Dark Theme Implementation
```css
/* CSS Variables for Dark Gaming Theme */
:root {
  /* Background Layers */
  --bg-primary: #0a0a0a;
  --bg-secondary: #111111;
  --bg-tertiary: #1a1a1a;
  --bg-elevated: #252525;
  --bg-card: rgba(31, 31, 31, 0.8);
  
  /* Neon Accents */
  --neon-cyan: #00f0ff;
  --neon-purple: #cc00ff;
  --neon-green: #00ff88;
  --neon-orange: #ff6600;
  --neon-red: #ff0055;
  
  /* Glow Effects */
  --glow-cyan: 0 0 20px rgba(0, 240, 255, 0.5);
  --glow-purple: 0 0 20px rgba(204, 0, 255, 0.5);
  --glow-green: 0 0 20px rgba(0, 255, 136, 0.5);
  
  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
  --text-muted: #666666;
}
```

#### Neon Glow Effects
```typescript
// Neon Glow Animation System
export const neonGlowEffects = {
  // Static glow
  staticGlow: (color: string) => `
    box-shadow: 
      0 0 5px ${color},
      0 0 10px ${color},
      0 0 20px ${color};
  `,
  
  // Animated pulsing glow
  pulsingGlow: `
    @keyframes neonPulse {
      0%, 100% { 
        box-shadow: 0 0 5px var(--neon-cyan), 0 0 10px var(--neon-cyan);
      }
      50% { 
        box-shadow: 0 0 10px var(--neon-cyan), 0 0 20px var(--neon-cyan), 0 0 30px var(--neon-cyan);
      }
    }
  `,
  
  // Text glow
  textGlow: (color: string) => `
    text-shadow: 
      0 0 5px ${color},
      0 0 10px ${color},
      0 0 20px ${color},
      0 0 40px ${color};
  `,
  
  // Border glow on hover
  borderGlow: `
    transition: all 0.3s ease;
    &:hover {
      border-color: var(--neon-cyan);
      box-shadow: 
        0 0 5px var(--neon-cyan),
        0 0 10px var(--neon-cyan),
        inset 0 0 5px rgba(0, 240, 255, 0.1);
    }
  `
};
```

#### Gaming UI Components

##### Cards with Neon Borders
```tsx
// Gaming Card Component
const GamingCard = styled.div`
  background: rgba(17, 17, 17, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  
  /* Subtle gradient overlay */
  background-image: linear-gradient(
    145deg,
    rgba(0, 240, 255, 0.05) 0%,
    rgba(204, 0, 255, 0.05) 100%
  );
  
  /* Hover glow effect */
  transition: all 0.3s ease;
  &:hover {
    border-color: var(--neon-cyan);
    box-shadow: 
      0 0 20px rgba(0, 240, 255, 0.3),
      inset 0 0 20px rgba(0, 240, 255, 0.05);
    transform: translateY(-4px);
  }
`;
```

##### Neon Buttons
```tsx
// Primary Neon Button
const NeonButton = styled.button<{ variant?: 'cyan' | 'purple' | 'green' }>`
  background: ${({ variant = 'cyan' }) => 
    variant === 'cyan' ? 'var(--neon-cyan)' :
    variant === 'purple' ? 'var(--neon-purple)' :
    'var(--neon-green)'
  };
  color: #0a0a0a;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  
  /* Glow effect */
  box-shadow: 0 0 10px currentColor;
  
  /* Transitions */
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 
      0 0 20px currentColor,
      0 0 40px currentColor;
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

// Outlined Neon Button
const NeonButtonOutline = styled.button`
  background: transparent;
  color: var(--neon-cyan);
  border: 2px solid var(--neon-cyan);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 240, 255, 0.1);
    box-shadow: 
      0 0 10px var(--neon-cyan),
      inset 0 0 10px rgba(0, 240, 255, 0.1);
  }
`;
```

##### Gaming Input Fields
```tsx
// Neon Input Field
const GamingInput = styled.input`
  background: rgba(17, 17, 17, 0.9);
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 8px;
  padding: 14px 16px;
  color: var(--text-primary);
  font-size: 16px;
  
  /* Placeholder styling */
  &::placeholder {
    color: var(--text-muted);
  }
  
  /* Focus state with glow */
  &:focus {
    outline: none;
    border-color: var(--neon-cyan);
    box-shadow: 
      0 0 10px rgba(0, 240, 255, 0.3),
      inset 0 0 5px rgba(0, 240, 255, 0.1);
  }
  
  /* Error state */
  &.error {
    border-color: var(--neon-red);
    &:focus {
      box-shadow: 0 0 10px rgba(255, 0, 85, 0.3);
    }
  }
`;
```

#### Glass Morphism Effects
```tsx
// Glass Panel Component
const GlassPanel = styled.div`
  background: rgba(17, 17, 17, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  
  /* Subtle light reflection */
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 20px 40px rgba(0, 0, 0, 0.5);
`;

// Frosted Overlay
const FrostedOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 10, 0.8);
  backdrop-filter: blur(10px);
  z-index: 50;
`;
```

#### Responsive Design System

##### Breakpoints
```typescript
// Gaming UI Breakpoints
export const breakpoints = {
  mobile: '320px',      // Small phones
  mobileLg: '480px',    // Large phones
  tablet: '768px',      // Tablets
  laptop: '1024px',     // Laptops
  desktop: '1280px',    // Desktops
  ultrawide: '1536px',  // Ultra-wide monitors
  gaming: '1920px',     // Gaming monitors (1080p)
  gaming4k: '2560px',   // 4K displays
};

// Tailwind Media Query Shortcuts
export const media = {
  sm: '@media (min-width: 640px)',
  md: '@media (min-width: 768px)',
  lg: '@media (min-width: 1024px)',
  xl: '@media (min-width: 1280px)',
  '2xl': '@media (min-width: 1536px)',
};
```

##### Mobile-First Responsive Patterns
```tsx
// Responsive Gaming Container
const ResponsiveContainer = styled.div`
  /* Mobile First - Base styles */
  width: 100%;
  padding: 16px;
  
  /* Tablet and up */
  @media (min-width: 768px) {
    padding: 24px;
    max-width: 720px;
    margin: 0 auto;
  }
  
  /* Desktop */
  @media (min-width: 1024px) {
    padding: 32px;
    max-width: 960px;
  }
  
  /* Large Desktop / Gaming */
  @media (min-width: 1280px) {
    max-width: 1200px;
  }
  
  /* Ultra-wide */
  @media (min-width: 1536px) {
    max-width: 1400px;
  }
`;

// Responsive Grid for Gaming Cards
const GamingGrid = styled.div`
  display: grid;
  gap: 16px;
  
  /* Single column on mobile */
  grid-template-columns: 1fr;
  
  /* Two columns on tablet */
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  /* Three columns on desktop */
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
  
  /* Four columns on large screens */
  @media (min-width: 1280px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;
```

##### Touch-Friendly Mobile Design
```typescript
// Mobile Gaming UI Guidelines
export const mobileGuidelines = {
  // Minimum touch targets
  touchTarget: {
    min: '44px',        // Minimum iOS/Android recommendation
    comfortable: '48px', // Comfortable touch size
  },
  
  // Spacing for thumbs
  thumbZone: {
    bottom: '0-300px',   // Easy reach
    middle: '300-500px', // Comfortable
    top: '500px+',       // Hard to reach
  },
  
  // Swipe gestures
  swipeThreshold: '50px',
  
  // Safe areas for notch/rounded corners
  safeArea: {
    top: 'env(safe-area-inset-top)',
    bottom: 'env(safe-area-inset-bottom)',
    left: 'env(safe-area-inset-left)',
    right: 'env(safe-area-inset-right)',
  }
};
```

#### Animation & Motion Design
```typescript
// Gaming Animation Presets
export const gamingAnimations = {
  // Entrance animations
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }
  },
  
  // Neon flicker effect
  neonFlicker: `
    @keyframes flicker {
      0%, 100% { opacity: 1; }
      41% { opacity: 1; }
      42% { opacity: 0.8; }
      43% { opacity: 1; }
      45% { opacity: 0.3; }
      46% { opacity: 1; }
    }
  `,
  
  // Scanning line effect (retro gaming)
  scanLine: `
    @keyframes scan {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(100vh); }
    }
  `,
  
  // Hover scale with glow
  hoverGlow: {
    scale: 1.05,
    transition: { type: 'spring', stiffness: 400, damping: 10 }
  },
  
  // Loading pulse
  loadingPulse: `
    @keyframes pulse {
      0%, 100% { 
        opacity: 1;
        box-shadow: 0 0 10px var(--neon-cyan);
      }
      50% { 
        opacity: 0.5;
        box-shadow: 0 0 20px var(--neon-cyan);
      }
    }
  `
};

// Reduced motion support
export const reducedMotion = `
  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
    transition: none !important;
  }
`;
```

#### Typography for Gaming UI
```typescript
// Gaming Typography System
export const gamingTypography = {
  fonts: {
    display: '"Orbitron", "Space Grotesk", sans-serif',  // Futuristic headings
    body: '"Inter", "Rajdhani", sans-serif',             // Clean body text
    mono: '"JetBrains Mono", monospace',                 // Code/stats
  },
  
  // Heading styles with neon effect
  headingStyles: {
    h1: `
      font-family: var(--font-display);
      font-size: clamp(2rem, 5vw, 4rem);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-primary);
      text-shadow: 0 0 10px var(--neon-cyan);
    `,
    h2: `
      font-family: var(--font-display);
      font-size: clamp(1.5rem, 3vw, 2.5rem);
      font-weight: 600;
      color: var(--text-primary);
    `
  }
};
```

#### Accessibility on Dark Theme
```typescript
// Gaming Accessibility Guidelines
export const gamingA11y = {
  // Ensure WCAG AA contrast on dark backgrounds
  contrastRatios: {
    primaryText: '15:1',     // White on #0a0a0a
    secondaryText: '7:1',    // #b3b3b3 on #0a0a0a
    neonAccent: '4.5:1',     // Neon colors meet minimum
  },
  
  // Focus states must be visible
  focusRing: `
    &:focus-visible {
      outline: 2px solid var(--neon-cyan);
      outline-offset: 2px;
      box-shadow: 0 0 10px var(--neon-cyan);
    }
  `,
  
  // High contrast mode support
  highContrast: `
    @media (prefers-contrast: high) {
      border-color: white !important;
      --neon-cyan: #00ffff;
      --text-secondary: #ffffff;
    }
  `
};
```

### Modern UI Design Guidelines

#### Singaporean & Gen Z Design Elements
```typescript
// Color Palette
export const colors = {
  primary: {
    peranakan: '#FF6B6B',      // Vibrant Peranakan pink
    modernSg: '#00C2B0',       // Singapore modern teal
    accent: '#FFD93D'          // Gen Z yellow
  },
  neutral: {
    light: '#F8F9FA',
    dark: '#212529',
    glass: 'rgba(255, 255, 255, 0.8)'
  },
  gradients: {
    // Inspired by Singapore skyline
    sunset: 'linear-gradient(to right, #FF6B6B, #FFD93D)',
    marina: 'linear-gradient(to right, #00C2B0, #4FACFE)'
  }
};

// Typography System
export const typography = {
  fontFamily: {
    display: '"Space Grotesk", sans-serif',  // Modern Gen Z font
    body: '"Inter", sans-serif',             // Clean, readable font
    accent: '"Clash Display", sans-serif'    // Statement headlines
  },
  fontSize: {
    display: 'clamp(2.5rem, 5vw, 4rem)',     // Responsive sizing
    h1: 'clamp(2rem, 4vw, 3rem)',
    body: 'clamp(1rem, 1.2vw, 1.2rem)'
  }
};
```

#### Responsive Design Patterns
```typescript
// Responsive Container Component
export const Container = styled.div<{ fluid?: boolean }>\`
  width: 100%;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing(2)};
  
  // Progressive enhancement
  @container (min-width: 640px) {
    max-width: ${({ fluid }) => fluid ? '100%' : '640px'};
  }
  @container (min-width: 1024px) {
    max-width: ${({ fluid }) => fluid ? '100%' : '1024px'};
  }
\`;

// Modern Card Component
export const Card = styled.div\`
  background: ${({ theme }) => theme.colors.neutral.glass};
  backdrop-filter: blur(8px);
  border-radius: 24px;
  padding: ${({ theme }) => theme.spacing(3)};
  
  // Hover effects
  transition: transform 0.3s ease;
  &:hover {
    transform: translateY(-4px);
  }
  
  // Dark mode support
  @media (prefers-color-scheme: dark) {
    background: rgba(0, 0, 0, 0.8);
  }
\`;
```

#### Animation Guidelines
```typescript
// Micro-interactions
export const buttonVariants = {
  hover: {
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  },
  tap: { scale: 0.98 }
};

// Page Transitions
export const pageTransitions = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1.0]
    }
  },
  exit: { opacity: 0, y: -20 }
};
```

#### UI Component Patterns
```typescript
// Modern Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'primary' | 'secondary' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = styled.button<ButtonProps>\`
  // Base styles
  padding: ${props => getButtonPadding(props.size)};
  border-radius: 12px;
  font-family: ${props => props.theme.typography.display};
  font-weight: 600;
  
  // Variant styles
  background: ${props => getButtonBackground(props.variant)};
  color: ${props => getButtonColor(props.variant)};
  
  // Modern effects
  backdrop-filter: ${props => props.variant === 'glass' ? 'blur(8px)' : 'none'};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  
  // Responsive hover states
  @media (hover: hover) {
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    }
  }
\`;
```

#### Responsive Layout Rules
- Mobile-first approach with progressive enhancement
- Use CSS Grid and Flexbox for modern layouts
- Implement Container Queries for component-level responsiveness
- Support both portrait and landscape orientations
- Consider foldable devices and ultra-wide screens

#### Cultural Integration Guidelines
- Use Peranakan-inspired patterns for decorative elements
- Incorporate local cultural motifs in illustrations
- Balance modern minimalism with traditional elements
- Use Singlish phrases thoughtfully in casual UI copy
- Consider cultural color meanings

#### Accessibility & Inclusivity
- Support multiple languages (English, Mandarin, Malay, Tamil)
- Ensure sufficient color contrast (WCAG 2.1)
- Implement proper text scaling
- Support reduced motion preferences
- Provide alt text in multiple languages

#### Modern UI Design Trends 2025
```typescript
// Innovative Layout System
export const layoutSystem = {
  // Fluid Grid System
  grid: {
    mobile: 'repeat(auto-fit, minmax(280px, 1fr))',
    tablet: 'repeat(auto-fit, minmax(320px, 1fr))',
    desktop: 'repeat(auto-fit, minmax(380px, 1fr))'
  },
  
  // 3D Transforms for Depth
  transforms: {
    subtle: 'translateZ(0) rotateX(2deg)',
    medium: 'translateZ(20px) rotateX(4deg)',
    strong: 'translateZ(40px) rotateX(8deg)'
  },
  
  // Dynamic Spacing (Golden Ratio)
  spacing: {
    base: '8px',
    golden: (level: number) => `${8 * 1.618 ** level}px`
  }
};

// Neomorphic Shadows with Dynamic Light Source
export const createNeomorphicShadow = (
  lightSource: { x: number; y: number },
  intensity: number = 1
) => {
  const angle = Math.atan2(lightSource.y, lightSource.x);
  const distance = Math.sqrt(lightSource.x ** 2 + lightSource.y ** 2);
  
  return \`
    ${Math.cos(angle) * distance * intensity}px 
    ${Math.sin(angle) * distance * intensity}px 
    ${distance * 2}px rgba(255,255,255,0.1),
    ${-Math.cos(angle) * distance * intensity}px 
    ${-Math.sin(angle) * distance * intensity}px 
    ${distance * 2}px rgba(0,0,0,0.1)
  \`;
};

// Interactive Color System
export const interactiveColors = {
  primary: {
    base: 'hsl(var(--hue, 210), 100%, 50%)',
    hover: 'hsl(var(--hue, 210), 100%, 45%)',
    active: 'hsl(var(--hue, 210), 100%, 40%)',
    getCustom: (hue: number) => \`hsl(\${hue}, 100%, 50%)\`
  }
};
```

#### Creative Component Patterns
```typescript
// Parallax Scroll Container
export const ParallaxContainer = styled.div<{ speed?: number }>\`
  position: relative;
  transform-style: preserve-3d;
  perspective: 1000px;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    transform: translateZ(${({ speed = 1 }) => speed * -100}px);
    z-index: -1;
  }
\`;

// Morphing Shape Background
export const MorphingBackground = styled.div\`
  position: absolute;
  inset: 0;
  background: conic-gradient(
    from var(--angle),
    var(--color-1),
    var(--color-2),
    var(--color-1)
  );
  animation: rotate 8s linear infinite;
  filter: blur(100px);
  opacity: 0.15;
  
  @property --angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
  
  @keyframes rotate {
    to { --angle: 360deg; }
  }
\`;

// Adaptive Layout Component
interface AdaptiveLayoutProps {
  density: 'compact' | 'comfortable' | 'spacious';
  complexity: 'simple' | 'advanced';
  theme: 'light' | 'dark' | 'system';
}

export const AdaptiveLayout = styled.div<AdaptiveLayoutProps>\`
  display: grid;
  gap: ${({ density }) => ({
    compact: '0.5rem',
    comfortable: '1rem',
    spacious: '2rem'
  })[density]};
  
  // Adjust complexity of UI elements
  ${({ complexity }) => complexity === 'simple' && \`
    .advanced-feature {
      display: none;
    }
  \`}
  
  // Dynamic color scheme
  @media (prefers-color-scheme: dark) {
    background: ${({ theme }) => 
      theme === 'system' ? 'var(--dark-bg)' : 'inherit'};
  }
\`;
```

#### Advanced Animation System
```typescript
// Spring Animation Presets
export const springPresets = {
  bounce: {
    type: 'spring',
    stiffness: 300,
    damping: 10,
    mass: 1
  },
  subtle: {
    type: 'spring',
    stiffness: 200,
    damping: 20,
    mass: 0.5
  },
  smooth: {
    type: 'spring',
    stiffness: 100,
    damping: 30,
    mass: 0.8
  }
};

// Gesture Animation System
export const createGestureAnimation = (
  gesture: 'swipe' | 'pinch' | 'rotate',
  intensity: number = 1
) => ({
  drag: {
    scale: 1.02,
    cursor: 'grabbing',
    transition: springPresets.bounce
  },
  hover: {
    scale: 1.05,
    rotateZ: gesture === 'rotate' ? 5 : 0,
    transition: springPresets.subtle
  }
});
```

### Next.js & TypeScript Best Practices

#### Component Structure
```typescript
// Simple component structure
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  children: React.ReactNode;
}

const Button = ({
  variant,
  size = 'md',
  onClick,
  children
}: ButtonProps) => {
  // Component logic here
};

// Complex component structure
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onSort?: (column: keyof T) => void;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  onSort
}: DataTableProps<T>) {
  // Component logic here
}
```

#### Performance Optimization
- Server Components:
  ```typescript
  // Use Server Components for data fetching
  async function ProductList() {
    const products = await fetchProducts();
    return <ProductGrid products={products} />;
  }
  
  // Use Client Components for interactivity
  'use client';
  function ProductCard({ product }: { product: Product }) {
    const [isLiked, setIsLiked] = useState(false);
    // Interactive logic here
  }
  ```
- Image Optimization:
  ```typescript
  import { ImageResponse } from 'next/og';
  import { Image } from 'next/image';
  
  // Use Next.js Image component with proper sizing
  <Image
    src="/hero.jpg"
    alt="Hero"
    width={800}
    height={400}
    placeholder="blur"
    priority={true}
  />
  ```

#### Creative Patterns
- Compound Components:
  ```typescript
  const Select = {
    Root: ({ children }: { children: React.ReactNode }) => {},
    Trigger: ({ label }: { label: string }) => {},
    Options: ({ items }: { items: string[] }) => {},
    Option: ({ value }: { value: string }) => {}
  };
  
  // Usage
  <Select.Root>
    <Select.Trigger label="Choose" />
    <Select.Options items={['A', 'B']} />
  </Select.Root>
  ```
- Render Props Pattern:
  ```typescript
  interface ToggleProps {
    children: (state: boolean, toggle: () => void) => React.ReactNode;
  }
  
  const Toggle = ({ children }: ToggleProps) => {
    const [on, setOn] = useState(false);
    return children(on, () => setOn(!on));
  };
  ```

#### TypeScript Guidelines
- Use Strict Type Checking:
  ```typescript
  // tsconfig.json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true
    }
  }
  ```
- Type Utilities:
  ```typescript
  // Create discriminated unions
  type ButtonState = 
    | { state: 'idle' }
    | { state: 'loading' }
    | { state: 'error'; error: string };

  // Use template literal types
  type Theme = 'light' | 'dark';
  type Size = 'sm' | 'lg';
  type ClassName = `theme-${Theme}-size-${Size}`;
  ```
- Custom Type Guards:
  ```typescript
  function isError(value: unknown): value is Error {
    return value instanceof Error;
  }
  ```

#### Performance Best Practices
- Use Dynamic Imports:
  ```typescript
  const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
    loading: () => <Spinner />,
    ssr: false
  });
  ```
- Implement Route Segments:
  ```typescript
  // app/dashboard/layout.tsx
  export default function DashboardLayout({
    children,
    analytics,
    team
  }: {
    children: React.ReactNode;
    analytics: React.ReactNode;
    team: React.ReactNode;
  }) {
    return (
      <div>
        {children}
        <Suspense fallback={<Loading />}>
          {analytics}
        </Suspense>
        <Suspense fallback={<Loading />}>
          {team}
        </Suspense>
      </div>
    );
  }
  ```
- Memory Management:
  ```typescript
  // Use callbacks for expensive operations
  const memoizedCallback = useCallback(
    (items: Item[]) => {
      return items.filter(item => 
        expensiveOperation(item)
      );
    },
    [/* dependencies */]
  );
  
  // Memoize expensive components
  const MemoizedChart = memo(({ data }: ChartProps) => {
    return <ComplexChart data={data} />;
  });
  ```

## 3. Documentation Rules

### Code Documentation
- Document all components and functions
- Include TypeScript types/interfaces
- Maintain comprehensive README.md
- Document environment setup
- Include usage examples

### Comments
- Explain complex logic
- Document key decisions
- Add TODO comments for improvements
- Include references to external resources
- Comment on non-obvious implementations

### Technical Documentation
- Maintain API documentation
- Include component hierarchy diagrams
- Document state management flow
- Provide deployment guides
- Include testing strategies

## 4. Project-Specific Guidelines

### API Structure
- Use RESTful conventions
- Implement proper error handling
- Use consistent response formats
- Include request validation
- Document all endpoints

### Data Flow
- Implement proper data validation
- Use TypeScript interfaces for data models
- Include logging at critical points
- Handle loading and error states
- Implement proper state updates

### Infrastructure
- Use proper Next.js configuration
- Implement CI/CD workflows
- Include monitoring setup
- Follow deployment best practices
- Implement backup strategies

### Code Style
- Follow ESLint configuration
- Use Prettier for formatting
- Organize imports consistently
- Group related components
- Maintain consistent file structure

### Project Structure
- Root Directory Organization:
  ```
  /
  ├── app/                    # Next.js app directory (routes, layouts)
  │   ├── (auth)/            # Authentication related routes
  │   ├── api/               # API routes
  │   ├── components/        # Shared components
  │   ├── lib/               # Utility functions and shared logic
  │   └── styles/            # Global styles
  ├── public/                # Static files
  │   ├── images/           
  │   └── fonts/            
  ├── components/            # Reusable UI components
  │   ├── common/           # Basic UI elements
  │   ├── forms/            # Form-related components
  │   └── layouts/          # Layout components
  ├── hooks/                 # Custom React hooks
  ├── types/                 # TypeScript type definitions
  ├── utils/                 # Utility functions
  ├── constants/             # Constants and configurations
  ├── services/              # API services and external integrations
  ├── styles/                # Component-specific styles
  └── tests/                 # Test files
      ├── unit/             
      ├── integration/      
      └── e2e/             
  ```
- Follow atomic design principles for components
- Keep related files close together
- Use feature-based organization for complex features
- Maintain clear separation of concerns
- Use barrel exports (index.ts) for clean imports

## 5. Response Format

### Communication Style
- Start with "Hi [Funny Name]!"
- Use proper Markdown formatting
- Include code examples with syntax highlighting
- Break down complex solutions
- Provide clear explanations

## 6. AI Assistant Behavior

### Interaction Guidelines
- Provide clear, concise responses
- Ask for clarification when needed
- Suggest improvements proactively
- Maintain professional tone
- Focus on best practices

Note: These rules should be adapted based on specific project requirements and constraints.