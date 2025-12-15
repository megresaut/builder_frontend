import React from "react";
import { useNavigate } from "react-router-dom";

interface Vendor {
  id: number;
  name: string;
  phone: string;
  email: string;
  notes: string;
  servicesProvided: string[];
}

interface VendorTableBodyProps {
  vendors: Vendor[];
  columnOrder: string[];
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  ActionButton: React.ComponentType<{
    vendorId: number;
    openMenuId: number | null;
    setOpenMenuId: (id: number | null) => void;
  }>;
}

export default function VendorTableBody({
  vendors,
  columnOrder,
  openMenuId,
  setOpenMenuId,
  ActionButton,
}: VendorTableBodyProps) {
  const navigate = useNavigate();

  const renderCellContent = (vendor: Vendor, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return (
          <span className="text-gray-900 font-normal text-base whitespace-nowrap">
            {vendor.name}
          </span>
        );
      case "phone":
        return (
          <span className="text-gray-900 font-normal text-base whitespace-nowrap">
            {vendor.phone}
          </span>
        );
      case "email":
        return (
          <span className="text-gray-900 font-normal text-base">
            {vendor.email}
          </span>
        );
      case "servicesProvided":
        return (
          <div className="flex flex-wrap gap-2">
            {vendor.servicesProvided.map((service) => (
              <span
                key={service}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {service}
              </span>
            ))}
          </div>
        );
      case "notes":
        return (
          <span className="text-gray-900 font-normal text-base">
            {vendor.notes}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <tbody>
      {vendors.map((vendor) => (
        <tr
          key={vendor.id}
          onClick={() => navigate(`/vendors/${vendor.id}`)}
          className="border-b border-gray-200 hover:bg-gray-50 transition-colors h-12 cursor-pointer"
        >
          {columnOrder.map((columnKey) => (
            <td
              key={columnKey}
              className="px-3 py-3 border-r border-gray-200"
            >
              {renderCellContent(vendor, columnKey)}
            </td>
          ))}
          <td
            onClick={(e) => e.stopPropagation()}
            className="sticky right-0 px-2 py-3 flex items-center justify-center"
            style={{
              borderLeftWidth: "2px",
              width: "80px",
              border:
                "1px none rgb(226, 232, 240) rgb(226, 232, 240) rgb(226, 232, 240) rgb(210, 209, 207)",
              borderLeftColor: "transparent",
              backgroundColor: "white",
            }}
          >
            <ActionButton
              vendorId={vendor.id}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
            />
          </td>
        </tr>
      ))}
    </tbody>
  );
}
