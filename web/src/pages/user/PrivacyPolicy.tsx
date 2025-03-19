const PrivacyPolicy = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-blue-600 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold">Freedombook</h1>
          <p className="mt-2 text-xl">Privacy Policy</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 bg-white shadow-md my-6 rounded-lg">
        {/* <p className="text-sm text-gray-500 mb-6">Last Updated: November 5, 2024</p> */}
        <p className="text-sm text-gray-500 mb-6">Last Updated: March 19, 2025</p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">1. Information We Collect</h2>

          <h3 className="text-xl font-semibold text-blue-800 mb-3">1.1 Information You Provide</h3>
          <p className="mb-4 text-gray-700">We collect information you provide directly to us, including:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Account information (name, email address, password)</li>
            <li>Profile information (profile picture, bio, location)</li>
            <li>Content you post (text, images, videos, comments)</li>
            <li>Communications with other users</li>
            <li>Feedback and correspondence with us</li>
          </ul>

          <h3 className="text-xl font-semibold text-blue-800 mb-3">1.2 Automatically Collected Information</h3>
          <p className="mb-4 text-gray-700">Using AWS and Google Analytics, we automatically collect:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Device information (device type, operating system, unique device identifiers)</li>
            <li>Log data (IP address, browser type, pages visited)</li>
            <li>Location data (with your permission)</li>
            <li>Usage patterns and preferences</li>
            <li>Interaction with content and advertisements</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">2. How We Use Your Information</h2>
          <p className="mb-4 text-gray-700" >We use collected information to:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Provide and maintain the Platform</li>
            <li>Personalize your experience</li>
            <li>Process and deliver content moderation decisions</li>
            <li>Analyze Platform usage and optimize performance</li>
            <li>Communicate with you about updates and features</li>
            <li>Protect against misuse and ensure Platform safety</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">3 Contact & Support</h2>
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

export default PrivacyPolicy