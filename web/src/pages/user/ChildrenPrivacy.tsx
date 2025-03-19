import React from 'react';

const ChildSafetyPolicy = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-blue-600 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold">Freedombook</h1>
          <p className="mt-2 text-xl">Child Safety Standards Policy</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 bg-white shadow-md my-6 rounded-lg">
        <p className="text-sm text-gray-500 mb-6">Last Updated: March 19, 2025</p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">1. Introduction</h2>
          <p className="text-gray-700 leading-relaxed">
            Freedombook is committed to creating a safe, inclusive, and responsible social networking environment.
            We take child safety seriously and ensure that our platform adheres to industry best practices,
            including compliance with Google Play's policies, COPPA (Children's Online Privacy Protection Act),
            and GDPR-K (General Data Protection Regulation for Kids).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">2. Age Restrictions</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Freedombook is designed for users aged 13 years and above.</li>
            <li>Users under 18 must have parental or guardian consent before registering.</li>
            <li>Accounts found to be operated by children under 13 will be removed.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">3. Content Moderation & Safety Measures</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>We use AI-based content moderation and human review to filter out inappropriate content, including violence, nudity, hate speech, and cyberbullying.</li>
            <li>Users can report content, and our moderation team will review and take necessary action within 24 hours.</li>
            <li>Child exploitation content or harmful interactions will be reported to law enforcement authorities.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">4. Privacy & Data Protection</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Freedombook does not collect, store, or share personal data of children without parental consent.</li>
            <li>Profile visibility settings allow minors to restrict access to their content.</li>
            <li>We use encryption and secure storage practices to protect user data.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">5. Parental Controls & Guidance</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Parents and guardians can monitor and restrict access to certain app features.</li>
            <li>Educational resources on online safety and digital well-being are provided within the app.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">6. Messaging & Friend Requests</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Users under 18 have default privacy settings restricting messaging from strangers.</li>
            <li>Stranger friend requests require approval before communication is enabled.</li>
            <li>AI-based detection identifies suspicious activities or harmful interactions.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">7. Reporting & Blocking</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Users can report inappropriate content, harassment, or safety concerns directly within the app.</li>
            <li>The blocking feature allows users to prevent interactions with unwanted individuals.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">8. Compliance & Enforcement</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Freedombook adheres to Google Play's Families Policy, COPPA, and GDPR-K regulations.</li>
            <li>Regular audits and updates ensure compliance with evolving safety standards.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">9. Contact & Support</h2>
          <p className="text-gray-700 mb-2">For safety concerns or policy-related inquiries, contact us at:</p>
          <p className="flex items-center text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <a href="mailto:support@freedombook.com" className="hover:underline">support@freedombook.com</a>
          </p>
        </section>
      </main>
    </div>
  );
};

export default ChildSafetyPolicy;