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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎯 StepperGO - Module Overview Dashboard
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Complete implementation status of all platform modules
          </p>
          
          {/* Overall Progress */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Overall Progress</h2>
              <span className="text-3xl font-bold text-emerald-600">100%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-4 rounded-full w-full transition-all duration-1000"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-600">{modules.length}</div>
                <div className="text-gray-600">Modules Complete</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {modules.reduce((acc, module) => acc + module.features.length, 0)}
                </div>
                <div className="text-gray-600">Features Built</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">200+</div>
                <div className="text-gray-600">Components</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">50+</div>
                <div className="text-gray-600">Routes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {modules.map((module) => {
            const IconComponent = module.icon;
            return (
              <div
                key={module.id}
                onClick={() => setSelectedModule(module)}
                className={`
                  p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105
                  ${getModuleColorClasses(module.color)}
                  ${selectedModule?.id === module.id ? 'ring-4 ring-blue-300' : ''}
                `}
              >
                <div className="flex items-center mb-4">
                  <IconComponent className={`h-8 w-8 text-${module.color}-600 mr-3`} />
                  <h3 className="text-lg font-semibold text-gray-800">{module.name}</h3>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{module.description}</p>
                
                {/* Status Badge */}
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(module.status)}`}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {module.status === 'complete' ? 'Complete' : module.status}
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{module.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`bg-${module.color}-500 h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${module.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Feature Count */}
                <div className="mt-4 text-sm text-gray-500">
                  {module.features.length} features implemented
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Module Detail */}
        {selectedModule && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <selectedModule.icon className={`h-10 w-10 text-${selectedModule.color}-600 mr-4`} />
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{selectedModule.name}</h2>
                  <p className="text-gray-600">{selectedModule.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedModule(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Features & Components</h3>
              {selectedModule.features.map((feature, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div
                    onClick={() => setExpandedFeature(expandedFeature === `${selectedModule.id}-${index}` ? null : `${selectedModule.id}-${index}`)}
                    className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-800">{feature.name}</h4>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                    <ChevronRight 
                      className={`h-5 w-5 text-gray-400 transition-transform ${
                        expandedFeature === `${selectedModule.id}-${index}` ? 'rotate-90' : ''
                      }`} 
                    />
                  </div>
                  
                  {expandedFeature === `${selectedModule.id}-${index}` && (
                    <div className="p-4 bg-white border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Components */}
                        <div>
                          <h5 className="font-medium text-gray-800 mb-2">Components Built</h5>
                          <div className="space-y-1">
                            {feature.components.map((component, idx) => (
                              <div key={idx} className="flex items-center text-sm">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                                <code className="text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs">
                                  {component}
                                </code>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Routes */}
                        <div>
                          <h5 className="font-medium text-gray-800 mb-2">Routes Available</h5>
                          <div className="space-y-1">
                            {feature.routes.map((route, idx) => (
                              <div key={idx} className="flex items-center text-sm">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                <code className="text-gray-700 bg-blue-100 px-2 py-1 rounded text-xs">
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

            {/* Implementation Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <h4 className="font-semibold text-emerald-800">Components</h4>
                <div className="text-2xl font-bold text-emerald-600">
                  {selectedModule.features.reduce((acc, feature) => acc + feature.components.length, 0)}
                </div>
                <div className="text-emerald-700 text-sm">UI Components Built</div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800">Routes</h4>
                <div className="text-2xl font-bold text-blue-600">
                  {selectedModule.features.reduce((acc, feature) => acc + feature.routes.length, 0)}
                </div>
                <div className="text-blue-700 text-sm">Pages & Endpoints</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-800">Completion</h4>
                <div className="text-2xl font-bold text-purple-600">{selectedModule.progress}%</div>
                <div className="text-purple-700 text-sm">Implementation Complete</div>
              </div>
            </div>
          </div>
        )}

        {/* Integration Status */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">🎉 Ready for Integration!</h2>
            <p className="text-xl mb-6">
              All modules are complete and ready to be integrated into a unified platform
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold">15+</div>
                <div>Features Complete</div>
              </div>
              <div>
                <div className="text-3xl font-bold">200+</div>
                <div>Components Built</div>
              </div>
              <div>
                <div className="text-3xl font-bold">5 weeks</div>
                <div>To Full Integration</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
