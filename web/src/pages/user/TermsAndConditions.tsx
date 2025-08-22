const TermsAndConditions = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-blue-600 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold">Freemochat</h1>
          <p className="mt-2 text-xl">Terms and Conditions</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 bg-white shadow-md my-6 rounded-lg">
        {/* <p className="text-sm text-gray-500 mb-6">Last Updated: November 5, 2024</p> */}
        <p className="text-sm text-gray-500 mb-6">Last Updated: March 19, 2025</p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">1. Agreement to Terms</h2>
          <p className="text-gray-700 leading-relaxed">By accessing or using Freemochat (freemochat.com) and our mobile application (collectively, the "Platform"), you agree to be bound by these Terms and Conditions.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">2. Platform Access</h2>

          <h3 className="text-xl font-semibold text-blue-800 mb-3">2.1 Account Creation</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>You must be 16 years or older to use the Platform</li>
            <li>You must provide accurate and complete registration information</li>
            <li>You are responsible for maintaining account security</li>
            <li>You must notify us of any unauthorized account use</li>
          </ul>

          <h3 className="text-xl font-semibold text-blue-800 mb-3">2.2 Account Termination</h3>
          <p className="mb-4 text-gray-700">We reserve the right to:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Suspend or terminate accounts</li>
            <li>Remove or edit content</li>
            <li>Deny access to any user</li>
            <li>Take appropriate legal action</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">3 Contact & Support</h2>
          <p className="text-gray-700 mb-2">For safety concerns or terms and conditions inquiries, contact us at:</p>
          <p className="flex items-center text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <a href="mailto:support@freemochat.com" className="hover:underline">support@freemochat.com</a>
          </p>
        </section>
      </main>
    </div>
  );
};

export default TermsAndConditions