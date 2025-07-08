import { readFileSync } from 'fs';
import { join } from 'path';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-sm text-gray-600 mb-6">Last updated: January 2025</p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              WealthBuddy ("we," "our," or "us") collects information you provide directly to us, such as when you create an account, connect your bank accounts, or contact us for support.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Personal Information</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Name and email address</li>
              <li>Authentication credentials</li>
              <li>Financial account information (through secure PSD2 APIs)</li>
              <li>Transaction data from connected accounts</li>
              <li>Usage data and preferences</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Provide AI-powered financial insights and recommendations</li>
              <li>Send technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Information Sharing</h2>
            <p className="mb-4">
              We do not sell, trade, or otherwise transfer your personal information to third parties except as described in this policy:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With service providers who assist in our operations (under strict confidentiality agreements)</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>End-to-end encryption of sensitive data</li>
              <li>Secure authentication protocols</li>
              <li>Regular security audits and updates</li>
              <li>Limited access to personal information</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Your Rights</h2>
            <p className="mb-4">Under GDPR and Danish data protection laws, you have the right to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your personal information</li>
              <li>Restrict processing of your information</li>
              <li>Data portability</li>
              <li>Object to processing</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Bank Data Integration</h2>
            <p className="mb-4">
              We connect to your bank accounts using PSD2-compliant APIs provided by GoCardless (Nordigen). This ensures:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Read-only access to your account information</li>
              <li>No ability to initiate transactions</li>
              <li>Compliance with European banking regulations</li>
              <li>Secure, encrypted data transmission</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. AI and Data Processing</h2>
            <p className="mb-4">
              We use AI services to analyze your financial data and provide insights. This processing:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Is performed on anonymized and aggregated data when possible</li>
              <li>Uses secure, GDPR-compliant AI services</li>
              <li>Does not share your personal information with AI providers</li>
              <li>Can be opted out of at any time</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mb-4">
              Email: privacy@wealthbuddy.dk<br />
              Address: Denmark
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Changes to This Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
