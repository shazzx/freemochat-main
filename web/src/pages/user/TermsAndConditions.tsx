import { Card, CardContent } from '@/components/ui/card';

const TermsAndConditions = () => {
    return (
        <div className="max-w-4xl mx-auto p-6">
            <Card>
                <CardContent className="p-6">
                    <h1 className="text-3xl font-bold mb-8">Terms and Conditions for Freedombook</h1>
                    <p className="text-sm text-gray-500 mb-6">Last Updated: November 5, 2024</p>

                    <div className="space-y-6">
                        <section>
                            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
                            <p className="mb-4">
                                By accessing or using Freedombook (freedombook.co) and our mobile application
                                (collectively, the "Platform"), you agree to be bound by these Terms and Conditions.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">2. Platform Access</h2>

                            <h3 className="text-xl font-semibold mb-3">2.1 Account Creation</h3>
                            <ul className="list-disc pl-6 mb-4 space-y-2">
                                <li>You must be 16 years or older to use the Platform</li>
                                <li>You must provide accurate and complete registration information</li>
                                <li>You are responsible for maintaining account security</li>
                                <li>You must notify us of any unauthorized account use</li>
                            </ul>

                            <h3 className="text-xl font-semibold mb-3">2.2 Account Termination</h3>
                            <p className="mb-4">We reserve the right to:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Suspend or terminate accounts</li>
                                <li>Remove or edit content</li>
                                <li>Deny access to any user</li>
                                <li>Take appropriate legal action</li>
                            </ul>
                        </section>

                        {/* Add remaining sections similarly */}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const LegalPages = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="shadow-sm p-4 bg-card">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-semibold">Freedombook</h1>
                </div>
            </nav>

            <main className="py-8">
                <TermsAndConditions />
            </main>

            <footer className="bg-white shadow-sm mt-8 py-6">
                <div className="max-w-4xl mx-auto text-center text-gray-600">
                    <p>© 2024 Freedombook. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LegalPages;