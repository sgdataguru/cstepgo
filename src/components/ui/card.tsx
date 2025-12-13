import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * 🎮 Gaming Card Component - Dark Theme with Neon Accents
 * 
 * Uses gaming aesthetics design tokens:
 * - Dark backgrounds (#1a1a1a, #1f1f1f)
 * - Neon cyan borders and glows
 * - Glass morphism effects
 * - Hover glow animations
 */

const cardVariants = cva(
  "backdrop-blur-sm transition-all duration-300",
  {
    variants: {
      variant: {
        default: "card",
        sm: "card-sm",
        lg: "card-lg",
        elevated: "card-elevated",
        interactive: "card-interactive",
        ghost: "bg-transparent border-0 shadow-none p-0",
        neonCyan: "bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#00f0ff]/20 hover:border-[#00f0ff]/60 hover:shadow-[0_0_30px_rgba(0,240,255,0.2)]",
        neonPurple: "bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#cc00ff]/20 hover:border-[#cc00ff]/60 hover:shadow-[0_0_30px_rgba(204,0,255,0.2)]",
        neonGreen: "bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#00ff88]/20 hover:border-[#00ff88]/60 hover:shadow-[0_0_30px_rgba(0,255,136,0.2)]",
        glass: "bg-[#111111]/70 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_20px_40px_rgba(0,0,0,0.5)]",
      },
      padding: {
        none: "!p-0",
        sm: "",
        default: "",
        lg: "",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-heading-4 text-white",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-body-small text-[#b3b3b3]", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
