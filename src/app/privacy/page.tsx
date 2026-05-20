import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | indian.rent",
  description: "Data protection and privacy practices for indian.rent. Learn how we collect, use, and safeguard your information.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      <div className="max-w-container mx-auto px-mobile md:px-desktop py-24">
        <h1 className="text-4xl font-black mb-12">Privacy Policy</h1>
        <div className="prose prose-invert max-w-3xl space-y-6">
          <section>
            <h2 className="text-2xl font-black mb-4">Data Protection</h2>
            <p className="text-on-surface-variant">
              We are committed to protecting your privacy. This policy outlines how we collect, use, and safeguard your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black mb-4">Information We Collect</h2>
            <p className="text-on-surface-variant">
              We collect information you voluntarily provide, such as when you create an account, deploy a node, or contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black mb-4">How We Use Your Information</h2>
            <p className="text-on-surface-variant">
              Your information is used to provide, maintain, and improve our services, communicate with you, and comply with legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black mb-4">Contact Us</h2>
            <p className="text-on-surface-variant">
              For privacy concerns, please contact us at{' '}
              <a href="mailto:support@wishlabs.in" className="text-primary hover:underline">
                support@wishlabs.in
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
