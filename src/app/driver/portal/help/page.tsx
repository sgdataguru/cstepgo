'use client';

import { useState } from 'react';
import { 
  HelpCircle, 
  MessageCircle, 
  Mail, 
  Phone, 
  Search,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    category: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const faqs: FAQItem[] = [
    {
      category: 'Getting Started',
      question: 'How do I accept a trip request?',
      answer: 'When a trip request comes in, you\'ll receive a notification in your dashboard. You have 30 seconds to accept or decline the trip. Click "Accept Trip" to confirm and the trip details will be added to your schedule.'
    },
    {
      category: 'Getting Started',
      question: 'How do I update my availability status?',
      answer: 'Go to your Profile page and toggle your availability status between Available, Busy, or Offline. You\'ll only receive trip requests when you\'re set to Available.'
    },
    {
      category: 'Earnings',
      question: 'When will I receive my payments?',
      answer: 'Payments are processed weekly, every Monday. You\'ll receive payment for all completed trips from the previous week. Check the Earnings page to see your payment history and upcoming payouts.'
    },
    {
      category: 'Earnings',
      question: 'What percentage does StepperGO take as a platform fee?',
      answer: 'StepperGO charges a 15% platform fee on each trip. This means you keep 85% of the total fare. The platform fee covers payment processing, insurance, and platform maintenance.'
    },
    {
      category: 'Trips',
      question: 'Can I cancel a trip after accepting it?',
      answer: 'Yes, but cancellations affect your driver rating. If you need to cancel, do so as early as possible and only in emergencies. Frequent cancellations may result in account suspension.'
    },
    {
      category: 'Trips',
      question: 'What should I do if a passenger doesn\'t show up?',
      answer: 'Wait at the pickup location for 10 minutes past the scheduled departure time. If the passenger doesn\'t arrive, you can mark them as no-show in the trip management section. You\'ll still receive a partial payment for your time.'
    },
    {
      category: 'Account',
      question: 'How do I update my vehicle information?',
      answer: 'Go to your Profile page and click "Edit Profile". You can update your vehicle color and luggage capacity. For major changes like vehicle model or license plate, please contact support.'
    },
    {
      category: 'Account',
      question: 'How can I improve my driver rating?',
      answer: 'Provide excellent service: be punctual, maintain a clean vehicle, drive safely, be friendly and professional with passengers, and respond professionally to feedback.'
    },
    {
      category: 'Technical',
      question: 'The app is not loading properly. What should I do?',
      answer: 'Try refreshing your browser or clearing your cache. If the issue persists, log out and log back in. For continued problems, contact our technical support team.'
    },
    {
      category: 'Technical',
      question: 'How do I enable notifications?',
      answer: 'Go to your Notifications page and enable the notification types you want to receive. Make sure your browser allows notifications from StepperGO.'
    },
  ];

  const categories = Array.from(new Set(faqs.map(faq => faq.category)));

  const filteredFAQs = searchQuery
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setContactForm({ subject: '', message: '', category: 'general' });
      setTimeout(() => setSubmitSuccess(false), 5000);
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Support Center</h1>
        <p className="text-gray-600">Find answers to common questions or contact our support team</p>
      </div>

      {/* Quick Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Call Us</h3>
          <p className="text-sm text-gray-600 mb-3">24/7 Driver Support</p>
          <a href="tel:+77001234567" className="text-blue-600 hover:text-blue-800 font-medium">
            +7 700 123 4567
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
          <p className="text-sm text-gray-600 mb-3">Chat with support</p>
          <button className="text-green-600 hover:text-green-800 font-medium">
            Start Chat
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Email Us</h3>
          <p className="text-sm text-gray-600 mb-3">Get help via email</p>
          <a href="mailto:drivers@steppergo.com" className="text-purple-600 hover:text-purple-800 font-medium">
            drivers@steppergo.com
          </a>
        </div>
      </div>

      {/* Search FAQs */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for help articles..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
          <HelpCircle className="w-6 h-6 mr-2" />
          Frequently Asked Questions
        </h2>

        {categories.map((category) => {
          const categoryFAQs = filteredFAQs.filter(faq => faq.category === category);
          if (categoryFAQs.length === 0) return null;

          return (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryFAQs.map((faq, index) => {
                  const globalIndex = faqs.indexOf(faq);
                  const isExpanded = expandedFAQ === globalIndex;
                  
                  return (
                    <div key={globalIndex} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => setExpandedFAQ(isExpanded ? null : globalIndex)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900">{faq.question}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0 ml-2" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 text-gray-700 border-t border-gray-200 pt-4">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredFAQs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No FAQs found matching your search.</p>
          </div>
        )}
      </div>

      {/* Contact Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Still Need Help?</h2>
        <p className="text-gray-600 mb-6">Send us a message and we'll get back to you as soon as possible.</p>

        {submitSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <p className="text-green-800 font-medium">Message sent successfully!</p>
              <p className="text-green-700 text-sm">We'll respond within 24 hours.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitContact} className="space-y-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              value={contactForm.category}
              onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="general">General Question</option>
              <option value="technical">Technical Issue</option>
              <option value="payment">Payment Issue</option>
              <option value="account">Account Issue</option>
              <option value="trip">Trip Issue</option>
              <option value="feedback">Feedback</option>
            </select>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              value={contactForm.subject}
              onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of your issue"
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              id="message"
              value={contactForm.message}
              onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Please provide as much detail as possible..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            <Send className="w-5 h-5 mr-2" />
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}
