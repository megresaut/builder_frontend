import { useNavigate } from "react-router-dom";

export const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-600 mt-2">Last updated: December 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-lg max-w-none text-gray-700 space-y-8">
          <div className="border-b-2 border-gray-300 pb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              PRIVACY POLICY
            </h1>
            <p className="text-gray-600 text-sm">
              Reasonable Automations Dashboard
            </p>
            <p className="text-gray-600 text-sm">Last Updated: December 2025</p>
          </div>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Scope & Roles
            </h2>
            <p>
              This Privacy Policy describes how data is handled within the
              Platform.
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>
                AVM is the data controller for all information entered into the
                Platform.
              </li>
              <li>
                Reasonable Automations acts as a data processor, processing
                information solely at AVM's direction and for Platform
                operation.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Information Processed
            </h2>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                a. User & Account Data
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Names</li>
                <li>Email addresses</li>
                <li>Roles and permissions</li>
                <li>Authentication and access metadata</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">
                b. Client-Provided Operational Data
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Property, unit, lease, vendor, and maintenance records</li>
                <li>Invoices, bills, and related financial documents</li>
                <li>Files, notes, and internal workflow information</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">
                c. Integration Data
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Data retrieved from third-party systems connected at AVM's
                  request
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Purpose of Processing
            </h2>
            <p>Data is processed solely to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Operate and maintain the Platform</li>
              <li>Perform workflow automation and reporting</li>
              <li>Provide technical support and troubleshooting</li>
              <li>Improve system performance and reliability</li>
            </ul>
            <p className="mt-3">
              Reasonable Automations does not use AVM data for advertising,
              resale, or unrelated commercial purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Infrastructure & Hosting
            </h2>
            <p>
              Platform data is stored and processed using third-party cloud and
              infrastructure providers that meet industry-standard security and
              reliability practices.
            </p>
            <p className="mt-3">
              Reasonable Automations does not independently operate physical
              data centers and does not control the underlying infrastructure
              operated by such providers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Data Security
            </h2>
            <p>
              Reasonable Automations employs commercially reasonable
              administrative, technical, and organizational safeguards.
              Sensitive information is encrypted in transit and at rest using
              industry-standard encryption methods.
            </p>
            <p className="mt-3 font-semibold">However, AVM acknowledges:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>No system can be guaranteed to be completely secure</li>
              <li>
                Reasonable Automations does not warrant absolute security or
                regulatory compliance
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Client Responsibilities
            </h2>
            <p>AVM is responsible for:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Accuracy, legality, and appropriateness of all data submitted
              </li>
              <li>
                Compliance with applicable privacy, property, tenant, and
                financial laws
              </li>
              <li>Managing user access, credentials, and permissions</li>
              <li>Determining retention requirements for its data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Data Sharing
            </h2>
            <p>Reasonable Automations does not sell Client data.</p>
            <p className="mt-3">Data may be shared only with:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Authorized AVM users</li>
              <li>
                Infrastructure or service providers supporting Platform
                operations under confidentiality obligations
              </li>
              <li>Third-party systems explicitly configured by AVM</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Data Retention & Deletion
            </h2>
            <p>Data is retained for the duration of the engagement.</p>
            <p className="mt-3">
              Upon termination, AVM may request data export.
            </p>
            <p className="mt-3">
              Data deletion or archival will be handled subject to written
              instruction, contractual obligations, and applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Reusable Components
            </h2>
            <p>
              Reasonable Automations may develop and reuse generalized software
              modules across clients. Client data is never reused, incorporated,
              or disclosed in connection with such components.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Compliance & Limitation
            </h2>
            <p>
              Reasonable Automations does not provide legal, regulatory,
              accounting, or compliance advice. AVM remains solely responsible
              for determining whether use of the Platform satisfies applicable
              regulatory obligations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Policy Updates
            </h2>
            <p>
              This Privacy Policy may be updated periodically. Material changes
              will be communicated to AVM.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              12. Contact
            </h2>
            <p>
              Questions regarding these Terms or privacy practices may be
              directed to:
            </p>
            <p className="mt-3 font-semibold">
              Reasonable Automations
              <br />
              <a
                href="mailto:matt@reasonableautomations.com"
                className="text-blue-600 hover:text-blue-700"
              >
                matt@reasonableautomations.com
              </a>
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center text-gray-600 text-sm">
          <p>
            © 2025 AVM. All rights reserved. Developed by Reasonable
            Automations
          </p>
        </div>
      </div>
    </div>
  );
};
