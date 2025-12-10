import { useNavigate } from "react-router-dom";

export const TermsOfService = () => {
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
          <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-gray-600 mt-2">Last updated: December 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-lg max-w-none text-gray-700 space-y-8">
          {/* TERMS OF SERVICE */}
          <div className="border-b-2 border-gray-300 pb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              TERMS OF SERVICE
            </h1>
            <p className="text-gray-600 text-sm">
              Reasonable Automations Dashboard
            </p>
            <p className="text-gray-600 text-sm">Last Updated: December 2025</p>
          </div>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Purpose & Relationship to Existing Agreements
            </h2>
            <p>
              These Terms of Service ("Terms") govern access to and use of the
              Reasonable Automations dashboard, applications, and related tools
              (the "Platform") provided by Reasonable Automations ("Reasonable
              Automations," "we," "us," or "our") to Absolute Value Management
              ("AVM," "Client," or "you").
            </p>
            <p className="mt-3">
              These Terms apply only to use of the Platform and do not replace,
              amend, or override the Master Services Agreement ("MSA"),
              Statement(s) of Work ("SOW"), or any other written agreement
              entered into between the parties. In the event of any conflict,
              the MSA and SOW control.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Account Structure & User Access
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Each AVM workspace has one designated Account Owner who serves
                as the primary administrator.
              </li>
              <li>
                The Account Owner may invite additional users and assign roles
                and permissions.
              </li>
              <li>
                AVM is responsible for all activity conducted under its
                accounts, including actions taken by invited users.
              </li>
              <li>
                AVM must ensure account credentials are kept confidential and
                secure.
              </li>
              <li>
                Reasonable Automations is not responsible for unauthorized
                access resulting from compromised credentials or user
                mismanagement.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Permitted Use
            </h2>
            <p>
              The Platform is provided solely for AVM's internal business
              operations, including property management, maintenance workflows,
              vendor management, finance tracking, and related administrative
              purposes.
            </p>
            <p className="mt-3 font-semibold">AVM agrees not to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Resell, sublicense, or provide Platform access to third parties
              </li>
              <li>Use the Platform for unlawful or unauthorized purposes</li>
              <li>
                Attempt to reverse engineer or extract proprietary system
                components except as permitted by written agreement
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Services, Availability & Modifications
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Platform features may evolve as development progresses.</li>
              <li>
                Reasonable Automations may improve, modify, suspend, or
                discontinue portions of the Platform as reasonably necessary.
              </li>
              <li>
                The Platform may experience downtime due to maintenance,
                updates, or factors outside Reasonable Automations' control.
              </li>
              <li>
                No guarantee is made that the Platform will operate
                uninterrupted or error-free.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Intellectual Property
            </h2>
            <p>
              All intellectual property rights in and to the Platform and
              underlying technology remain with Reasonable Automations, except
              as expressly licensed to AVM under the MSA.
            </p>
            <p className="mt-3">
              Upon full payment, AVM is granted a perpetual, non-exclusive
              license to use the delivered work product internally, consistent
              with the MSA. Reusable components, modules, and general system
              libraries remain the property of Reasonable Automations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Data Handling & Integrations
            </h2>
            <p>
              AVM may connect third-party systems (including property
              management, utility, financial, or vendor platforms). AVM
              represents that it has authority to grant such access.
            </p>
            <p className="mt-3 font-semibold">
              Reasonable Automations is not responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Errors or data issues originating from third-party systems
              </li>
              <li>Service interruptions caused by external providers</li>
              <li>Data inaccuracies supplied by AVM or external sources</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Fees & Payment
            </h2>
            <p>
              All fees, retainers, milestone payments, discretionary expenses,
              and maintenance costs are governed exclusively by the MSA and
              applicable SOW.
            </p>
            <p className="mt-3">
              Failure to pay amounts due may result in suspension or termination
              of Platform access.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Termination & Suspension
            </h2>
            <p>
              Platform access may terminate upon expiration or termination of
              the MSA or applicable SOW.
            </p>
            <p className="mt-3 font-semibold">Upon termination:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>AVM retains its licensed rights to delivered work product</li>
              <li>Hosted services may be deactivated</li>
              <li>Outstanding payment obligations survive</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Disclaimers
            </h2>
            <p>
              The Platform is provided "as is" and "as available." Reasonable
              Automations disclaims all implied warranties to the maximum extent
              permitted by law, including warranties of merchantability, fitness
              for a particular purpose, and non-infringement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law and consistent with the
              MSA:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Reasonable Automations shall not be liable for indirect,
                incidental, consequential, special, or punitive damages
              </li>
              <li>
                Reasonable Automations shall not be liable for data loss,
                security incidents, or service disruptions caused by third-party
                providers or Client actions
              </li>
              <li>
                Total liability shall not exceed amounts payable under the
                applicable SOW
              </li>
              <li>
                Nothing in these Terms expands Reasonable Automations' liability
                beyond what is expressly agreed in the MSA.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Governing Law
            </h2>
            <p>
              These Terms are governed by the laws of the State of New York,
              without regard to conflict-of-law principles.
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
