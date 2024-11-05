import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const PrivacyPolicy = () => {
    return (
        <div className="max-w-4xl mx-auto p-6">
            <Card>
                <CardContent className="p-6">
                    <h1 className="text-3xl font-bold mb-8">Privacy Policy for Freedombook</h1>
                    <p className="text-sm text-gray-500 mb-6">Last Updated: November 5, 2024</p>

                    <div className="space-y-6">
                        <section>
                            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>

                            <h3 className="text-xl font-semibold mb-3">1.1 Information You Provide</h3>
                            <p className="mb-4">We collect information you provide directly to us, including:</p>
                            <ul className="list-disc pl-6 mb-4 space-y-2">
                                <li>Account information (name, email address, password)</li>
                                <li>Profile information (profile picture, bio, location)</li>
                                <li>Content you post (text, images, videos, comments)</li>
                                <li>Communications with other users</li>
                                <li>Feedback and correspondence with us</li>
                            </ul>

                            <h3 className="text-xl font-semibold mb-3">1.2 Automatically Collected Information</h3>
                            <p className="mb-4">Using AWS and Google Analytics, we automatically collect:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Device information (device type, operating system, unique device identifiers)</li>
                                <li>Log data (IP address, browser type, pages visited)</li>
                                <li>Location data (with your permission)</li>
                                <li>Usage patterns and preferences</li>
                                <li>Interaction with content and advertisements</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
                            <p className="mb-4">We use collected information to:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Provide and maintain the Platform</li>
                                <li>Personalize your experience</li>
                                <li>Process and deliver content moderation decisions</li>
                                <li>Analyze Platform usage and optimize performance</li>
                                <li>Communicate with you about updates and features</li>
                                <li>Protect against misuse and ensure Platform safety</li>
                                <li>Comply with legal obligations</li>
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
                <PrivacyPolicy />
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