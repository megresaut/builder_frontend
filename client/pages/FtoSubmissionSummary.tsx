import React from "react";
import PageTemplate from "@/layout/PageTemplate";
import SubPageHeaderV2 from "@/components/SubPageHeaderV2";
import BlueButton from "@/components/BlueButton";

export default function FtoSubmissionSummary() {
  return (
    <PageTemplate>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Submission History</h1>
          <p className="text-gray-600 mt-2">View your submission history</p>
        </div>

        <SubPageHeaderV2
          rightContent={
            <BlueButton>Submit</BlueButton>
          }
        />

        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <p className="text-gray-700">
            Your submission history will appear here.
          </p>
        </div>
      </div>
    </PageTemplate>
  );
}
