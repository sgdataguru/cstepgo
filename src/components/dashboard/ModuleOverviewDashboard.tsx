'use client';

import React, { useState } from 'react';
import { CheckCircle, ChevronRight, Settings, Map, Users, CreditCard, Truck, Store, Shield } from 'lucide-react';

interface Feature {
  name: string;
  description: string;
  components: string[];
  routes: string[];
}

interface Module {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'complete' | 'in-progress' | 'pending';
  features: Feature[];
  color: string;
  progress: number;
}

const modules: Module[] = [
  {
    id: 'core-platform',
    name: 'Core Platform',
    description: 'Landing page, search functionality, and trip listings',
    icon: Settings,
    status: 'complete',
    progress: 100,
    color: 'emerald',
    features: [
      {
        name: 'Landing Page',
        description: 'Modern hero section with search widget',
        components: ['HeroSection.tsx', 'SearchWidget.tsx', 'FeatureCards.tsx'],
        routes: ['/']
      },
      {
        name: 'Search Widget',
        description: 'Location autocomplete with date picker',
        components: ['LocationAutocomplete/', 'DatePicker.tsx', 'SearchForm.tsx'],
        routes: ['/search']
      },
      {
        name: 'Trip Listings',
        description: 'Trip cards with pricing and urgency indicators',
        components: ['TripCard.tsx', 'CountdownBadge.tsx', 'PricingDisplay.tsx'],
        routes: ['/trips']
      }
    ]
  },
  {
    id: 'trip-management',
    name: 'Trip Management',
    description: 'Create trips, view itineraries, and track urgency status',
    icon: Map,
    status: 'complete',
    progress: 100,
    color: 'blue',
    features: [
      {
        name: 'Create Trip',
        description: 'Multi-step trip creation with itinerary builder',
        components: ['ItineraryBuilder/', 'ActivityBlock.tsx', 'DayTabs.tsx'],
        routes: ['/trips/create']
      },
      {
        name: 'View Itinerary',
        description: 'Modal with day-by-day activity breakdown',
        components: ['ItineraryModal.tsx', 'ItineraryActivity.tsx'],
        routes: ['/trips/[tripId]/itinerary']
      },
      {
        name: 'Urgency Status',
        description: 'Real-time countdown with urgency indicators',
        components: ['CountdownBadge.tsx', 'useCountdown.ts'],
        routes: ['embedded']
      }
    ]
  },
  {
    id: 'location-services',
    name: 'Location Services',
    description: 'Autocomplete, famous locations, and map integration',
    icon: Map,
    status: 'complete',
    progress: 100,
    color: 'teal',
    features: [
      {
        name: 'Autocomplete',
        description: 'Google Places API integration with debounced search',
        components: ['LocationAutocomplete/', 'useGooglePlaces.ts'],
        routes: ['global']
      },
      {
        name: 'Famous Locations',
        description: 'Pre-defined popular destinations in Central Asia',
        components: ['FamousLocationAutocomplete/', 'famous-locations.ts'],
        routes: ['global']
      },
      {
        name: 'Maps',
        description: 'Interactive maps with location selection',
        components: ['MapPicker.tsx', 'LocationDisplay.tsx'],
        routes: ['global']
      }
    ]
  },
  {
    id: 'user-management',
    name: 'User Management',
    description: 'Passenger registration and driver applications',
    icon: Users,
    status: 'complete',
    progress: 100,
    color: 'purple',
    features: [
      {
        name: 'Passenger Registration',
        description: 'Multi-step registration with email verification',
        components: ['PassengerSignup.tsx', 'EmailVerification.tsx'],
        routes: ['/auth/register', '/auth/verify']
      },
      {
        name: 'Driver Application',
        description: '6-step driver application with document upload',
        components: ['ApplicationFlow/', 'DocumentUploader.tsx'],
        routes: ['/drivers/apply']
      }
    ]
  },
  {
    id: 'payment-system',
    name: 'Payment System',
    description: 'Stripe integration, Kaspi Pay, and driver payouts',
    icon: CreditCard,
    status: 'complete',
    progress: 100,
    color: 'green',
    features: [
      {
        name: 'Stripe Integration',
        description: 'Secure payment processing with Stripe Elements',
        components: ['CheckoutForm.tsx', 'PaymentMethods.tsx'],
        routes: ['/checkout/[bookingId]']
      },
      {
        name: 'Kaspi Pay',
        description: 'Local Kazakhstan payment method integration',
        components: ['KaspiPayButton.tsx', 'KaspiCheckout.tsx'],
        routes: ['/payment/kaspi']
      },
      {
        name: 'Payouts',
        description: 'Automated driver payout system',
        components: ['PayoutDashboard.tsx', 'EarningsOverview.tsx'],
        routes: ['/drivers/payouts']
      }
    ]
  },
  {
    id: 'driver-portal',
    name: 'Driver Portal',
    description: 'Driver profiles, applications, and document management',
    icon: Truck,
    status: 'complete',
    progress: 100,
    color: 'orange',
    features: [
      {
        name: 'Profiles',
        description: 'Comprehensive driver profile pages with reviews',
        components: ['ProfileHeader.tsx', 'ReviewsSection.tsx', 'VehicleCard.tsx'],
        routes: ['/drivers/[driverId]']
      },
      {
        name: 'Applications',
        description: 'Multi-step application process with OCR validation',
        components: ['ApplicationSteps/', 'BackgroundCheck.tsx'],
        routes: ['/drivers/apply']
      },
      {
        name: 'Document Upload',
        description: 'Secure document upload with encryption',
        components: ['DocumentUploader.tsx', 'FileValidator.tsx'],
        routes: ['/drivers/documents']
      }
    ]
  },
  {
    id: 'activity-owners',
    name: 'Activity Owners',
    description: 'Business registration and activity management platform',
    icon: Store,
    status: 'complete',
    progress: 100,
    color: 'indigo',
    features: [
      {
        name: 'Registration Wizard',
        description: '5-step business registration process',
        components: ['BusinessInfoStep.tsx', 'ActivityCategoriesStep.tsx', 'DocumentUploadStep.tsx'],
        routes: ['/activity-owners/auth/register']
      },
      {
        name: 'Business Profiles',
        description: 'Comprehensive business profile management',
        components: ['BusinessProfile.tsx', 'ActivityManagement.tsx'],
        routes: ['/activity-owners/dashboard']
      }
    ]
  },
  {
    id: 'admin-system',
    name: 'Admin System',
    description: 'Driver approval and payment management tools',
    icon: Shield,
    status: 'complete',
    progress: 100,
    color: 'red',
    features: [
      {
        name: 'Driver Approval',
        description: 'Admin interface for reviewing driver applications',
        components: ['DriverApprovalQueue.tsx', 'DocumentReview.tsx'],
        routes: ['/admin/drivers']
      },
      {
        name: 'Payment Management',
        description: 'Payment monitoring and dispute resolution',
        components: ['PaymentDashboard.tsx', 'TransactionMonitor.tsx'],
        routes: ['/admin/payments']
      }
    ]
  }
];

export default function ModuleOverviewDashboard() {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'in-progress':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'pending':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getModuleColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      emerald: 'border-emerald-500 bg-emerald-50 hover:bg-emerald-100',
      blue: 'border-blue-500 bg-blue-50 hover:bg-blue-100',
      teal: 'border-teal-500 bg-teal-50 hover:bg-teal-100',
      purple: 'border-purple-500 bg-purple-50 hover:bg-purple-100',
      green: 'border-green-500 bg-green-50 hover:bg-green-100',
      orange: 'border-orange-500 bg-orange-50 hover:bg-orange-100',
      indigo: 'border-indigo-500 bg-indigo-50 hover:bg-indigo-100',
      red: 'border-red-500 bg-red-50 hover:bg-red-100'
    };
    return colorMap[color] || 'border-gray-500 bg-gray-50 hover:bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎯 StepperGO - <span className="text-[#00f0ff] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">Module Overview</span> Dashboard
          </h1>
          <p className="text-xl text-[#b3b3b3] mb-8">
            Complete implementation status of all platform modules
          </p>
          
          {/* Overall Progress - Gaming Card */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#00f0ff]/20 rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-3 text-white">Overall Progress</h2>
              <span className="text-display-md font-bold text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]">100%</span>
            </div>
            <div className="w-full bg-[#252525] rounded-full h-4 mb-4">
              <div className="bg-gradient-to-r from-[#00f0ff] to-[#00ff88] h-4 rounded-full w-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,255,136,0.5)]"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-heading-3 text-[#00ff88]">{modules.length}</div>
                <div className="text-body-small text-[#808080]">Modules Complete</div>
              </div>
              <div>
                <div className="text-heading-3 text-[#00f0ff]">
                  {modules.reduce((acc, module) => acc + module.features.length, 0)}
                </div>
                <div className="text-body-small text-[#808080]">Features Built</div>
              </div>
              <div>
                <div className="text-heading-3 text-[#cc00ff]">200+</div>
                <div className="text-body-small text-[#808080]">Components</div>
              </div>
              <div>
                <div className="text-heading-3 text-[#ff6600]">50+</div>
                <div className="text-body-small text-[#808080]">Routes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Grid - Gaming Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {modules.map((module) => {
            const IconComponent = module.icon;
            return (
              <div
                key={module.id}
                onClick={() => setSelectedModule(module)}
                className={`
                  p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105
                  bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#00f0ff]/20
                  hover:border-[#00f0ff]/60 hover:shadow-[0_0_30px_rgba(0,240,255,0.2)]
                  ${selectedModule?.id === module.id ? 'ring-2 ring-[#00f0ff] shadow-[0_0_30px_rgba(0,240,255,0.3)]' : ''}
                `}
              >
                <div className="flex items-center mb-4">
                  <IconComponent className="h-8 w-8 text-[#00f0ff] mr-3" />
                  <h3 className="text-lg font-semibold text-white">{module.name}</h3>
                </div>
                
                <p className="text-[#808080] text-sm mb-4">{module.description}</p>
                
                {/* Status Badge - Neon Green */}
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border border-[#00ff88]/30 bg-[#00ff88]/10 text-[#00ff88]">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {module.status === 'complete' ? 'Complete' : module.status}
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-[#808080] mb-1">
                    <span>Progress</span>
                    <span>{module.progress}%</span>
                  </div>
                  <div className="w-full bg-[#252525] rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-[#00f0ff] to-[#cc00ff] h-2 rounded-full transition-all duration-500 shadow-[0_0_5px_rgba(0,240,255,0.5)]"
                      style={{ width: `${module.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Feature Count */}
                <div className="mt-4 text-sm text-[#666666]">
                  {module.features.length} features implemented
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Module Detail - Gaming Style */}
        {selectedModule && (
          <div className="bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#00f0ff]/20 rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <selectedModule.icon className="h-10 w-10 text-[#00f0ff] mr-4" />
                <div>
                  <h2 className="text-3xl font-bold text-white">{selectedModule.name}</h2>
                  <p className="text-[#b3b3b3]">{selectedModule.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedModule(null)}
                className="text-[#666666] hover:text-[#00f0ff] text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-4">Features & Components</h3>
              {selectedModule.features.map((feature, index) => (
                <div
                  key={index}
                  className="border border-[#333333] rounded-lg overflow-hidden"
                >
                  <div
                    onClick={() => setExpandedFeature(expandedFeature === `${selectedModule.id}-${index}` ? null : `${selectedModule.id}-${index}`)}
                    className="p-4 bg-[#252525] cursor-pointer hover:bg-[#333333] transition-colors flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-white">{feature.name}</h4>
                      <p className="text-[#808080] text-sm">{feature.description}</p>
                    </div>
                    <ChevronRight 
                      className={`h-5 w-5 text-[#00f0ff] transition-transform ${
                        expandedFeature === `${selectedModule.id}-${index}` ? 'rotate-90' : ''
                      }`} 
                    />
                  </div>
                  
                  {expandedFeature === `${selectedModule.id}-${index}` && (
                    <div className="p-4 bg-[#1a1a1a] border-t border-[#333333]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Components */}
                        <div>
                          <h5 className="font-medium text-white mb-2">Components Built</h5>
                          <div className="space-y-1">
                            {feature.components.map((component, idx) => (
                              <div key={idx} className="flex items-center text-sm">
                                <div className="w-2 h-2 bg-[#00ff88] rounded-full mr-2"></div>
                                <code className="text-[#b3b3b3] bg-[#252525] px-2 py-1 rounded text-xs">
                                  {component}
                                </code>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Routes */}
                        <div>
                          <h5 className="font-medium text-white mb-2">Routes Available</h5>
                          <div className="space-y-1">
                            {feature.routes.map((route, idx) => (
                              <div key={idx} className="flex items-center text-sm">
                                <div className="w-2 h-2 bg-[#00f0ff] rounded-full mr-2"></div>
                                <code className="text-[#b3b3b3] bg-[#00f0ff]/10 px-2 py-1 rounded text-xs">
                                  {route}
                                </code>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Implementation Stats - Neon Cards */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#00ff88]/10 border border-[#00ff88]/30 p-4 rounded-lg">
                <h4 className="font-semibold text-[#00ff88]">Components</h4>
                <div className="text-2xl font-bold text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]">
                  {selectedModule.features.reduce((acc, feature) => acc + feature.components.length, 0)}
                </div>
                <div className="text-[#808080] text-sm">UI Components Built</div>
              </div>
              
              <div className="bg-[#00f0ff]/10 border border-[#00f0ff]/30 p-4 rounded-lg">
                <h4 className="font-semibold text-[#00f0ff]">Routes</h4>
                <div className="text-2xl font-bold text-[#00f0ff] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
                  {selectedModule.features.reduce((acc, feature) => acc + feature.routes.length, 0)}
                </div>
                <div className="text-[#808080] text-sm">Pages & Endpoints</div>
              </div>
              
              <div className="bg-[#cc00ff]/10 border border-[#cc00ff]/30 p-4 rounded-lg">
                <h4 className="font-semibold text-[#cc00ff]">Completion</h4>
                <div className="text-2xl font-bold text-[#cc00ff] drop-shadow-[0_0_10px_rgba(204,0,255,0.5)]">{selectedModule.progress}%</div>
                <div className="text-[#808080] text-sm">Implementation Complete</div>
              </div>
            </div>
          </div>
        )}

        {/* Integration Status - Neon Gradient Banner */}
        <div className="mt-12 bg-gradient-to-r from-[#00f0ff]/20 via-[#cc00ff]/20 to-[#00ff88]/20 border border-[#00f0ff]/30 rounded-2xl text-white p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">🎉 Ready for <span className="text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]">Integration!</span></h2>
            <p className="text-xl text-[#b3b3b3] mb-6">
              All modules are complete and ready to be integrated into a unified platform
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-[#00f0ff]">15+</div>
                <div className="text-[#808080]">Features Complete</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#cc00ff]">200+</div>
                <div className="text-[#808080]">Components Built</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#00ff88]">5 weeks</div>
                <div className="text-[#808080]">To Full Integration</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
