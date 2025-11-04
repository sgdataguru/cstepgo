import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-modernSg to-primary-peranakan">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-6xl font-display font-bold mb-6">
            Welcome to StepperGO
          </h1>
          <p className="text-2xl mb-12 font-body opacity-90">
            Group Travel Made Easy - Join shared rides across Kazakhstan and Kyrgyzstan
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center mb-12">
            <Link
              href="/trips"
              className="bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-xl transition-all duration-200"
            >
              Browse Trips
            </Link>
            <Link
              href="/trips/create"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-gray-900 transition-all duration-200"
            >
              Create Trip
            </Link>
            </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-3">Real-time Pricing</h3>
              <p className="opacity-80">Price drops as more people join your trip</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-3">Verified Drivers</h3>
              <p className="opacity-80">All drivers thoroughly vetted and rated</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-3">Easy Communication</h3>
              <p className="opacity-80">WhatsApp groups for every trip</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
