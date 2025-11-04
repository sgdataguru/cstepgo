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