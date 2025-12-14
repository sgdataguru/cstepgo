# StepperGO - Group Travel Platform

A modern ride-sharing and group trip organization platform built with Next.js 14, TypeScript, and TailwindCSS.

## 🚀 Features

### Implemented Features
1. **View Trip Urgency Status** - Real-time countdown timers with color-coded urgency indicators
2. **View Trip Itinerary** - Detailed day-by-day trip plans with activities
3. **Create Trip with Itinerary** - Block-based itinerary builder with drag-and-drop
4. **Search Locations** - 2GIS Places autocomplete for accurate location selection in Kazakhstan and Central Asia
5. **Dynamic Trip Pricing** - Real-time pricing that adjusts based on occupancy
6. **View Driver Profile** - Comprehensive driver profiles with ratings and verification badges
7. **Register as Passenger** - Quick phone/email registration with OTP verification
8. **Apply as Driver** - Multi-step driver application with document upload
9. **Pay for Trip Booking** - Integrated payment with Stripe and Kaspi Pay
10. **Join WhatsApp Group** - Seamless integration with trip communication groups
11. **GPS Navigation Integration** - Real-time turn-by-turn navigation with ETA updates

## 📁 Project Structure

```
StepperGO/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── (auth)/            # Authentication routes
│   │   ├── trips/             # Trip management
│   │   ├── bookings/          # Booking & payment flows
│   │   ├── drivers/           # Driver profiles & application
│   │   └── api/               # API routes
│   ├── components/            # Reusable UI components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions & services
│   ├── types/                 # TypeScript type definitions
│   ├── constants/             # App constants
│   └── styles/                # Global styles
├── docs/                      # Documentation
│   ├── implementation-plans/  # Feature implementation guides
│   ├── stories/              # User stories
│   └── technical-description/ # Technical specs
└── public/                    # Static assets
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: Radix UI
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod
- **State Management**: React Hooks + Context

### Backend & Services
- **API**: Next.js API Routes
- **Database**: PostgreSQL (via NestJS backend)
- **Cache**: Redis
- **Job Queue**: BullMQ
- **Authentication**: JWT-based auth
- **File Storage**: AWS S3 / Supabase Storage

### External Integrations
- **Maps**: 2GIS Maps API (optimized for Kazakhstan & Central Asia)
- **Navigation**: Real-time GPS tracking with turn-by-turn directions via 2GIS
- **Payments**: Stripe + Kaspi Pay
- **Communication**: WhatsApp API
- **SMS/Email**: Twilio + Postmark
- **Background Checks**: Checkr API

## 📍 GPS Navigation Feature

StepperGO includes comprehensive GPS navigation for drivers and passengers:

- **Real-time Route Calculation** - Optimal routes using 2GIS Directions API
- **Turn-by-Turn Directions** - Step-by-step navigation with distance and time
- **Live ETA Updates** - Continuous arrival time estimates based on traffic
- **Driver Location Tracking** - Real-time position updates during active trips
- **Milestone Notifications** - Alerts when approaching pickup/destination
- **Traffic Visualization** - Optional traffic layer on the map

See [GPS_NAVIGATION.md](docs/GPS_NAVIGATION.md) for detailed documentation.

### Quick Start - Navigation Demo

```bash
# Visit the navigation demo
npm run dev
# Navigate to http://localhost:3000/navigation/demo
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/steppergo.git
cd steppergo
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local` with required API keys:
```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_key_here
STRIPE_SECRET_KEY=your_secret_here

# Kaspi Pay
KASPI_MERCHANT_ID=your_merchant_id
KASPI_API_KEY=your_api_key

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=your_phone

# Postmark (Email)
POSTMARK_API_KEY=your_key
POSTMARK_FROM_EMAIL=noreply@steppergo.com

# AWS S3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your_bucket

# WhatsApp
WHATSAPP_API_KEY=your_key
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Documentation

### Implementation Plans
Detailed implementation guides for each feature are available in `/docs/implementation-plans/`:

- [01 - View Trip Urgency Status](docs/implementation-plans/01-view-trip-urgency-status.md)
- [02 - View Trip Itinerary](docs/implementation-plans/02-view-trip-itinerary.md)
- [03 - Create Trip with Itinerary](docs/implementation-plans/03-create-trip-with-itinerary.md)
- [04 - Search Locations Autocomplete](docs/implementation-plans/04-search-locations-autocomplete.md)
- [05 - View Dynamic Trip Pricing](docs/implementation-plans/05-view-dynamic-trip-pricing.md)
- [06 - View Driver Profile](docs/implementation-plans/06-view-driver-profile.md)
- [07 - Register as Passenger](docs/implementation-plans/07-register-as-passenger.md)
- [08 - Apply as Driver](docs/implementation-plans/08-apply-as-driver.md)
- [09 - Pay for Trip Booking](docs/implementation-plans/09-pay-for-trip-booking.md)
- [10 - Join WhatsApp Group](docs/implementation-plans/10-join-whatsapp-group.md)

### User Stories
See `/docs/stories/` for detailed user stories and acceptance criteria.

### Technical Specifications
See `/docs/technical-description/overview.md` for comprehensive technical architecture.

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test:coverage
```

### Test Structure
```
src/
├── __tests__/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/              # End-to-end tests
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Environment Setup
- **Frontend**: Vercel
- **Backend API**: Fly.io or Render
- **Database**: Managed PostgreSQL
- **Cache**: Redis Cloud
- **File Storage**: AWS S3 or Supabase

## 📦 Key Components

### Trip Management
- `src/app/trips/components/TripCard.tsx` - Trip card with countdown
- `src/app/trips/components/CountdownBadge.tsx` - Urgency indicator
- `src/app/trips/components/ItineraryModal.tsx` - Itinerary viewer

### Itinerary Builder
- `src/app/trips/create/components/ItineraryBuilder/` - Full builder system
- Drag-and-drop activity reordering
- Template-based trip creation

### Payment System
- `src/app/bookings/payment/` - Complete payment flow
- Stripe Elements integration
- Kaspi Pay local payment support

### Driver Onboarding
- `src/app/driver/apply/` - Multi-step application
- Document upload with OCR
- Background check integration

## 🔧 Development Tools

### Code Quality
- **Linting**: ESLint with Next.js config
- **Formatting**: Prettier (recommended)
- **Type Checking**: TypeScript strict mode
- **Pre-commit**: Husky + lint-staged (optional)

### VS Code Extensions (Recommended)
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features

## 📈 Performance

### Optimization Strategies
- Server Components for data-heavy pages
- Dynamic imports for large features
- Image optimization with Next.js Image
- Route prefetching
- Efficient state management

### Monitoring
- Web Vitals tracking
- Error monitoring (Sentry recommended)
- Analytics (Google Analytics or Mixpanel)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards
- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation
- Follow the established project structure

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Team

- **Product Owner**: [Name]
- **Tech Lead**: [Name]
- **Developers**: [Team]

## 📞 Support

For technical support or questions:
- Email: dev@steppergo.com
- Slack: #steppergo-dev
- Issues: GitHub Issues

## 🗺️ Roadmap

### Phase 1 (Q1 2025)
- ✅ Core trip browsing and booking
- ✅ Payment integration
- ✅ Driver onboarding
- ✅ WhatsApp integration

### Phase 2 (Q2 2025)
- 🔄 Mobile app (React Native)
- 🔄 Advanced analytics dashboard
- 🔄 Multi-language support
- 🔄 Loyalty program

### Phase 3 (Q3 2025)
- ⏳ AI-powered trip recommendations
- ⏳ Dynamic route optimization
- ⏳ Integration with local tourism boards
- ⏳ Corporate travel packages

---

**Made with ❤️ by the StepperGO Team**
