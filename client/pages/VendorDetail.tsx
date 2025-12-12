import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Pencil, Plus } from "lucide-react";

interface Vendor {
  id: number;
  name: string;
  category: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  servicesProvided?: string;
}

const mockVendors: Vendor[] = [
  {
    id: 1,
    name: "Dolce Heating & Plumbing",
    category: "Uncategorized",
    email: "staff@avappraisalmgmt.com",
    phone: undefined,
    address: undefined,
    website: undefined,
    servicesProvided: undefined,
  },
];

export default function VendorDetail() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const vendor = mockVendors.find((v) => v.id === Number(vendorId)) || mockVendors[0];

  return (
    <div className="bg-white min-h-screen" style={{ fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif" }}>
      <div className="px-6 pt-9 pb-6 flex flex-col">
        {/* Header Section */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Title and Meta */}
          <div className="flex flex-col min-w-[240px]">
            <h1 className="text-[#303030] text-2xl font-semibold leading-[1.25]">
              {vendor.name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[#71717A] text-base font-medium leading-none">
                Vendor
              </span>
              <span className="text-[#71717A] text-base font-medium leading-none">
                {vendor.category}
              </span>
              <button className="flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] rounded-lg hover:opacity-80 transition-opacity">
                <Pencil className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>
          </div>

          {/* Inactivate Button */}
          <div className="flex items-center gap-3">
            <button className="flex items-center justify-center min-h-[40px] px-4 py-2 bg-white border border-[#DADADA] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.03)] text-[#303030] text-base font-normal leading-[1.4] tracking-[-0.32px] hover:bg-gray-50 transition-colors">
              Inactivate Vendor
            </button>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-9">
          <div className="border-b border-[#E5E5E5] flex items-start gap-6 min-h-9">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-1.5 pt-2 pb-2 text-base font-medium leading-[1.25] whitespace-nowrap ${
                activeTab === "overview"
                  ? "border-b-2 border-[#09090B] text-[#09090B]"
                  : "text-[#71717A] hover:text-[#303030]"
              }`}
            >
              Overview
            </button>
          </div>

          {/* Content Area */}
          <div className="mt-6 flex items-start gap-6">
            <div className="flex-1 min-w-[240px] w-full">
              <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col">
                {/* Vendor Information Section */}
                <div className="flex flex-col font-medium">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
                      Vendor Information
                    </h2>
                    <button className="flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] whitespace-nowrap rounded-lg hover:opacity-80 transition-opacity">
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* Contact Details Grid */}
                  <div className="mt-3 flex flex-col whitespace-nowrap">
                    <div className="flex items-start gap-10 flex-wrap">
                      {/* Email */}
                      <div className="flex flex-col w-[220px]">
                        <div className="text-[#71717A] text-xs font-medium leading-[1.33]">
                          EMAIL
                        </div>
                        {vendor.email ? (
                          <div className="mt-1 flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] rounded-lg">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M11.6673 11.667H2.33398C1.59961 11.667 1.00065 11.068 1.00065 10.3337V3.66699C1.00065 2.93262 1.59961 2.33366 2.33398 2.33366H11.6673C12.4017 2.33366 13.0007 2.93262 13.0007 3.66699V10.3337C13.0007 11.068 12.4017 11.667 11.6673 11.667Z"
                                stroke="#2463EB"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M1.33398 3.33301L7.00065 7.66634L12.6673 3.33301"
                                stroke="#2463EB"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span>{vendor.email}</span>
                          </div>
                        ) : (
                          <div className="mt-1 text-[#303030] text-sm font-medium leading-[1.29]">
                            --
                          </div>
                        )}
                      </div>

                      {/* Phone */}
                      <div className="flex flex-col">
                        <div className="text-[#71717A] text-xs font-medium leading-[1.33]">
                          PHONE
                        </div>
                        <div className="mt-1 text-[#303030] text-sm font-medium leading-[1.29]">
                          {vendor.phone || "--"}
                        </div>
                      </div>

                      {/* Address */}
                      <div className="flex flex-col">
                        <div className="text-[#71717A] text-xs font-medium leading-[1.33]">
                          ADDRESS
                        </div>
                        <div className="mt-1 text-[#303030] text-sm font-medium leading-[1.29]">
                          {vendor.address || "--"}
                        </div>
                      </div>

                      {/* Website */}
                      <div className="flex flex-col">
                        <div className="text-[#71717A] text-xs font-medium leading-[1.33]">
                          WEBSITE
                        </div>
                        <div className="mt-1 text-[#303030] text-sm font-medium leading-[1.29]">
                          {vendor.website || "--"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services Provided */}
                  <div className="mt-3 flex flex-col">
                    <div className="flex items-start gap-10">
                      <div className="flex flex-col">
                        <div className="text-[#71717A] text-xs font-medium leading-[1.33]">
                          SERVICES PROVIDED
                        </div>
                        <div className="mt-1 text-[#303030] text-sm font-medium leading-[1.29]">
                          {vendor.servicesProvided || "--"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="mt-5 w-full h-px" style={{ aspectRatio: "1000", objectFit: "contain" }}>
                  <svg width="100%" height="1" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="0" x2="100%" y2="0" stroke="#E5E5E5" strokeWidth="1" />
                  </svg>
                </div>

                {/* Vendor Insurance Section */}
                <div className="mt-5 flex flex-col font-medium">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
                      Vendor Insurance
                    </h2>
                    <button className="flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] whitespace-nowrap rounded-lg hover:opacity-80 transition-opacity">
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                  <p className="mt-3 text-[#303030] text-sm font-medium leading-[1.29]">
                    No vendor insurance information on file.
                  </p>
                </div>

                {/* Divider */}
                <div className="mt-5 w-full h-px">
                  <svg width="100%" height="1" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="0" x2="100%" y2="0" stroke="#E5E5E5" strokeWidth="1" />
                  </svg>
                </div>

                {/* Custom Fields Section */}
                <div className="mt-5 flex flex-col font-medium">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
                      Custom Fields
                    </h2>
                    <button className="flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] whitespace-nowrap rounded-lg hover:opacity-80 transition-opacity">
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-center min-h-[56px] w-full border border-[#DADADA] rounded-lg">
                    <p className="flex-1 text-[#303030] text-sm font-normal leading-[1.29] text-center px-3">
                      There are no custom fields created to track additional information in this location. Contact your administrator to add custom fields.
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="mt-5 w-full h-px">
                  <svg width="100%" height="1" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="0" x2="100%" y2="0" stroke="#E5E5E5" strokeWidth="1" />
                  </svg>
                </div>

                {/* Recent Notes Section */}
                <div className="mt-5 flex flex-col">
                  <div className="flex items-center justify-between gap-4 flex-wrap font-medium">
                    <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
                      Recent Notes
                    </h2>
                    <button className="flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] whitespace-nowrap rounded-lg hover:opacity-80 transition-opacity">
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-1 w-full px-3 py-1.5 bg-[#F9F9F9] border border-[#DADADA] rounded">
                    <p className="text-[#303030] text-sm font-normal leading-[1.29]">
                      You don't have any notes for this vendor right now.{" "}
                      <span className="font-medium text-[#2463EB] cursor-pointer hover:underline">
                        Add your first note
                      </span>
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="mt-5 w-full h-px">
                  <svg width="100%" height="1" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="0" x2="100%" y2="0" stroke="#E5E5E5" strokeWidth="1" />
                  </svg>
                </div>

                {/* Recent Files Section */}
                <div className="mt-5 flex flex-col">
                  <div className="flex items-center justify-between gap-4 flex-wrap font-medium">
                    <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
                      Recent Files
                    </h2>
                    <button className="flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] whitespace-nowrap rounded-lg hover:opacity-80 transition-opacity">
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-1 w-full px-3 py-1.5 bg-[#F9F9F9] border border-[#DADADA] rounded">
                    <p className="text-[#303030] text-sm font-normal leading-[1.29]">
                      You don't have any files for this vendor right now.{" "}
                      <span className="font-medium text-[#2463EB] cursor-pointer hover:underline">
                        Add your first file
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
