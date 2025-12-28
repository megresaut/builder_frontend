import React from "react";
import PageTemplate from "@/layout/PageTemplate";

export default function FtoHome() {
  return (
    <PageTemplate>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Home</h1>
          <p className="text-gray-600 mt-2">Welcome to Field Team Orders</p>
        </div>

        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <p className="text-gray-700">
            This is your home page for managing field team orders.
          </p>
        </div>
      </div>
    </PageTemplate>
  );
}
