export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-sm text-gray-600 mb-6">Last updated: January 2025</p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using WealthBuddy ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p className="mb-4">
              WealthBuddy is a personal finance management application that helps users in Denmark track their spending, analyze financial habits, and receive AI-powered insights. The service connects to your bank accounts through secure PSD2-compliant APIs.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
            <p className="mb-4">To use our service, you must:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Be at least 18 years old</li>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use</li>
              <li>Be responsible for all activities under your account</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Bank Account Connection</h2>
            <p className="mb-4">
              By connecting your bank accounts, you authorize us to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Access your account information and transaction history</li>
              <li>Retrieve data through secure PSD2-compliant APIs</li>
              <li>Store and process this information to provide our services</li>
            </ul>
            <p className="mb-4">
              We cannot and will not initiate transactions or access funds in your accounts.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Acceptable Use</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Use the service for any illegal or unauthorized purpose</li>
              <li>Violate any laws in your jurisdiction</li>
              <li>Transmit any harmful or malicious code</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the service</li>
              <li>Share your account with others</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Data and Privacy</h2>
            <p className="mb-4">
              Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these terms by reference.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. AI-Powered Insights</h2>
            <p className="mb-4">
              Our AI analysis features provide insights based on your financial data. These insights are:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>For informational purposes only</li>
              <li>Not financial advice or recommendations</li>
              <li>Based on automated analysis of your data</li>
              <li>Subject to limitations and potential inaccuracies</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Service Availability</h2>
            <p className="mb-4">
              We strive to maintain high availability but cannot guarantee uninterrupted service. We may:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Perform maintenance that temporarily interrupts service</li>
              <li>Experience downtime due to technical issues</li>
              <li>Modify or discontinue features with notice</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Limitation of Liability</h2>
            <p className="mb-4">
              To the maximum extent permitted by law, WealthBuddy shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Termination</h2>
            <p className="mb-4">
              Either party may terminate this agreement at any time. Upon termination:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Your access to the service will cease</li>
              <li>We will delete your data according to our Privacy Policy</li>
              <li>Bank connections will be revoked</li>
              <li>These terms will remain in effect for any outstanding obligations</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Governing Law</h2>
            <p className="mb-4">
              These terms shall be governed by and construed in accordance with the laws of Denmark, without regard to its conflict of law provisions.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the service. Continued use after changes constitutes acceptance of the new terms.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="mb-4">
              Email: support@wealthbuddy.dk<br />
              Address: Denmark
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">14. Severability</h2>
            <p className="mb-4">
              If any provision of these terms is held to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
