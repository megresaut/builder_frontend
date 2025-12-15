import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TabContext } from "@/hooks/useTabContext";
import { useFavorites } from "@/hooks/FavoritesContext";

// Global state for fullscreen mode using localStorage
const FULLSCREEN_KEY = "app-fullscreen-mode";
const getFullscreenMode = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(FULLSCREEN_KEY) === "true";
  }
  return false;
};
const setFullscreenMode = (value: boolean) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(FULLSCREEN_KEY, String(value));
  }
};

interface Tab {
  id: string;
  iconLight: React.ReactNode;
  iconDark: React.ReactNode;
  label: string;
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  // Helper function to determine the section ID based on the current pathname
  const getSectionIdFromPath = (path: string): string | undefined => {
    // Properties section
    if (path === "/all-properties" || path === "/" || path.includes("/property/")) {
      return "all-properties";
    }

    // Accounting section
    if (path === "/bills" || path.includes("/bills/record") || path === "/record-bill" || path === "/utilities/view-bill") {
      return "bills";
    }

    // Maintenance section (includes all maintenance subsections)
    if (
      path === "/all-tasks" ||
      path.includes("/tasks/") ||
      path === "/recurring-tasks" ||
      path === "/field-team-orders" ||
      path === "/work-orders" ||
      path === "/vendors" ||
      path.includes("/vendors/")
    ) {
      return "all-tasks"; // Use "all-tasks" as the main maintenance section icon
    }

    return undefined;
  };

  const getCurrentPageLabel = (): {
    label: string;
    path: string;
    id: string;
  } | null => {
    const path = location.pathname;

    // Handle vendor detail pages (/vendors/:vendorId)
    if (path.includes("/vendors/") && !path.endsWith("/vendors")) {
      const match = path.match(/\/vendors\/(\d+)/);
      if (match) {
        const vendorId = match[1];
        // Map vendorId to vendor information (mock data)
        const vendorData: Record<string, string> = {
          "1": "Dolce Heating & Plumbing",
          "2": "David Smith",
          "3": "David Smith",
          "4": "David Smith",
          "5": "David Smith",
          "6": "David Smith",
          "7": "David Smith",
          "8": "David Smith",
          "9": "David Smith",
          "10": "David Smith",
        };
        const label = vendorData[vendorId] || `Vendor ${vendorId}`;
        return {
          label,
          path,
          id: `vendor-${vendorId}`,
        };
      }
    } else if (path.includes("/tasks/")) {
      const match = path.match(/\/tasks\/(\d+)/);
      if (match) {
        const taskId = match[1];
        // Map taskId to task information (mock data)
        const taskData: Record<string, string> = {
          "1": "Edgerton - Quote",
          "2": "Downtown Renovation",
          "3": "HVAC Installation",
          "4": "Electrical Rewiring",
          "5": "Plumbing Repairs",
          "6": "Roof Inspection",
          "7": "Window Replacement",
          "8": "Door Repairs",
          "9": "Painting Project",
          "10": "Foundation Work",
        };
        const label = taskData[taskId] || `Task ${taskId}`;
        return {
          label,
          path,
          id: `task-${taskId}`,
        };
      }
    } else if (path.includes("/property/")) {
      const match = path.match(/\/property\/(\d+)(?:\/(\w+))?/);
      if (match) {
        const propertyId = match[1];
        const tab = match[2];

        // Map property types for unique identification
        const propertyTypes: Record<string, string> = {
          "1": "Concierge",
          "2": "Rental",
          "3": "Commercial",
          "4": "OR",
          "5": "HOA",
          "6": "Concierge",
          "7": "Concierge",
          "8": "Concierge",
          "9": "Concierge",
          "10": "Concierge",
        };

        const propertyType = propertyTypes[propertyId] || "Property";
        const label = `${propertyType} - Property ${propertyId}`;

        if (tab && tab !== "Overview") {
          return {
            label: `${label} - ${tab}`,
            path,
            id: `property-${propertyId}-${tab}`,
          };
        }
        return { label, path, id: `property-${propertyId}` };
      }
    } else if (path === "/blank") {
      return { label: "New Tab", path, id: "blank" };
    } else if (path === "/all-properties") {
      return { label: "All Properties", path, id: "all-properties" };
    } else if (path === "/all-tasks") {
      return { label: "All Tasks", path, id: "all-tasks" };
    } else if (path === "/utilities") {
      return { label: "Utilities", path, id: "utilities" };
    } else if (path === "/bills") {
      return { label: "Bills", path, id: "bills" };
    } else if (path === "/field-team-orders") {
      return { label: "Field Team Orders", path, id: "field-team-orders" };
    } else if (path === "/work-orders") {
      return { label: "Work Orders", path, id: "work-orders" };
    } else if (path === "/recurring-tasks") {
      return { label: "Recurring Tasks", path, id: "recurring-tasks" };
    } else if (path === "/vendors") {
      return { label: "Vendors", path, id: "vendors" };
    } else if (path === "/utilities/view-bill") {
      return { label: "View Bill", path, id: "utilities-view-bill" };
    } else if (
      path === "/record-bill" ||
      path === "/bills/record" ||
      path.includes("/bills/record")
    ) {
      // Handle /bills/record, /property/:id/bills/record, etc.
      let pageId = "record-bill";

      if (path.includes("/property/")) {
        const match = path.match(/\/property\/(\d+)/);
        if (match) {
          pageId = `record-bill-property-${match[1]}`;
        }
      }
      return { label: "Record Bill", path, id: pageId };
    } else if (path === "/") {
      return { label: "All Tasks", path, id: "all-tasks" };
    }

    return null;
  };

  const currentPage = getCurrentPageLabel();
  const isCurrentPageFavorite = currentPage
    ? isFavorite(currentPage.id)
    : false;

  const handleFavoriteClick = () => {
    if (currentPage) {
      if (isCurrentPageFavorite) {
        removeFavorite(currentPage.id);
      } else {
        addFavorite({
          id: currentPage.id,
          label: currentPage.label,
          path: currentPage.path,
        });
      }
    }
  };

  const getBreadcrumbItems = () => {
    const path = location.pathname;
    const items: { label: string; href?: string }[] = [];

    if (path.includes("/vendors/") && !path.endsWith("/vendors")) {
      const match = path.match(/\/vendors\/(\d+)/);
      if (match) {
        const vendorId = match[1];
        // Map vendorId to vendor information (mock data)
        const vendorData: Record<string, string> = {
          "1": "Dolce Heating & Plumbing",
          "2": "David Smith",
          "3": "David Smith",
          "4": "David Smith",
          "5": "David Smith",
          "6": "David Smith",
          "7": "David Smith",
          "8": "David Smith",
          "9": "David Smith",
          "10": "David Smith",
        };
        items.push({ label: "Vendors", href: "/vendors" });
        items.push({ label: vendorData[vendorId] || `Vendor ${vendorId}` });
      }
    } else if (path === "/utilities/view-bill") {
      items.push({ label: "Utilities", href: "/utilities" });
      items.push({ label: "View Bill" });
    } else if (path === "/record-bill" || path.includes("/bills/record")) {
      items.push({ label: "Bills", href: "/bills" });
      items.push({ label: "Record Bill" });
    } else if (path.includes("/tasks/")) {
      const match = path.match(/\/tasks\/(\d+)(?:\/(\w+))?(?:\/(\d+))?/);
      if (match) {
        const taskId = match[1];
        const tab = match[2];
        const workOrderId = match[3];
        items.push({ label: "Tasks", href: "/all-tasks" });
        // Map taskId to task information (mock data)
        const taskData: Record<string, string> = {
          "1": "Edgerton - Quote",
          "2": "Downtown Renovation",
          "3": "HVAC Installation",
          "4": "Electrical Rewiring",
          "5": "Plumbing Repairs",
          "6": "Roof Inspection",
          "7": "Window Replacement",
          "8": "Door Repairs",
          "9": "Painting Project",
          "10": "Foundation Work",
        };
        items.push({ label: taskData[taskId] || `Task ${taskId}` });

        // Add tab to breadcrumbs if present
        if (tab && tab !== "summary") {
          const tabLabels: Record<string, string> = {
            workorders: "Work Orders",
            fieldteam: "Field Team Orders",
          };
          items.push({ label: tabLabels[tab] || tab });

          // Add work order to breadcrumbs if present
          if (workOrderId && tab === "workorders") {
            const workOrderData: Record<string, string> = {
              "1": "Doors Need To Be Repaired",
              "2": "Doors Need To Be Repaired",
              "3": "Doors Need To Be Repaired",
              "4": "Doors Need To Be Repaired",
              "5": "Doors Need To Be Repaired",
              "6": "Doors Need To Be Repaired",
              "7": "Doors Need To Be Repaired",
              "8": "Doors Need To Be Repaired",
              "9": "Doors Need To Be Repaired",
              "10": "Doors Need To Be Repaired",
            };
            items.push({
              label: workOrderData[workOrderId] || `Work Order ${workOrderId}`,
            });
          }
        }
      }
    } else if (path.includes("/property/")) {
      const match = path.match(/\/property\/(\d+)(?:\/(\w+))?/);
      if (match) {
        const propertyId = match[1];
        const tab = match[2];
        items.push({ label: "Properties", href: "/all-properties" });

        // Map property IDs to addresses
        const propertyAddresses: Record<string, string> = {
          "1": "22 Indian Chase Dr, Greenwich, CT",
          "2": "22 Indian Chase Dr, Greenwich, CT",
          "3": "22 Indian Chase Dr, Greenwich, CT",
          "4": "22 Indian Chase Dr, Greenwich, CT",
          "5": "22 Indian Chase Dr, Greenwich, CT",
          "6": "22 Indian Chase Dr, Greenwich, CT",
          "7": "22 Indian Chase Dr, Greenwich, CT",
          "8": "22 Indian Chase Dr, Greenwich, CT",
          "9": "22 Indian Chase Dr, Greenwich, CT",
          "10": "22 Indian Chase Dr, Greenwich, CT",
        };

        items.push({ label: propertyAddresses[propertyId] || "Property" });

        if (tab && tab !== "Overview") {
          items.push({ label: tab });
        }
      }
    } else if (path === "/all-properties") {
      items.push({ label: "All Properties" });
    } else if (path === "/all-tasks") {
      items.push({ label: "All Tasks" });
    } else if (path === "/utilities") {
      items.push({ label: "Utilities" });
    } else if (path === "/bills") {
      items.push({ label: "Bills" });
    } else if (path === "/field-team-orders") {
      items.push({ label: "Field Team Orders" });
    } else if (path === "/work-orders") {
      items.push({ label: "Work Orders" });
    } else if (path === "/recurring-tasks") {
      items.push({ label: "Recurring Tasks" });
    } else if (path === "/vendors") {
      items.push({ label: "Vendors" });
    } else if (path === "/record-bill") {
      items.push({ label: "Bills", href: "/bills" });
      items.push({ label: "Record Bill" });
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  const defaultTabs: Tab[] = [
    {
      id: "portfolio",
      label: "Portfolio",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3v16a2 2 0 0 0 2 2h16" />
          <path d="M18 17V9" />
          <path d="M13 17V5" />
          <path d="M8 17v-3" />
        </svg>
      ),
    },
    {
      id: "properties",
      label: "Properties",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11.1155 1.66675H8.88455C8.44528 1.66674 8.06627 1.66672 7.75414 1.69223C7.42469 1.71914 7.09701 1.77857 6.78169 1.93923C6.31129 2.17892 5.92883 2.56137 5.68915 3.03177C5.52849 3.34709 5.46906 3.67477 5.44214 4.00423C5.41664 4.31637 5.41665 4.69534 5.41667 5.13463L5.41667 8.33342L3.80674 8.33342C3.59643 8.33339 3.39161 8.33337 3.21815 8.34754C3.02765 8.36311 2.80287 8.39983 2.57669 8.51508C2.26308 8.67486 2.00811 8.92983 1.84833 9.24344C1.73308 9.46962 1.69635 9.6944 1.68079 9.8849C1.66662 10.0584 1.66664 10.2632 1.66667 10.4735L1.66667 16.6667C1.20643 16.6667 0.833332 17.0398 0.833332 17.5001C0.833332 17.9603 1.20643 18.3334 1.66667 18.3334H2.49768L2.5 18.3334L2.50233 18.3334H17.4977L17.5 18.3334L17.5023 18.3334H18.3333C18.7936 18.3334 19.1667 17.9603 19.1667 17.5001C19.1667 17.0398 18.7936 16.6667 18.3333 16.6667L18.3333 10.4734C18.3334 10.2631 18.3334 10.0583 18.3192 9.8849C18.3036 9.6944 18.2669 9.46962 18.1517 9.24344C17.9919 8.92983 17.7369 8.67486 17.4233 8.51508C17.1971 8.39983 16.9724 8.36311 16.7819 8.34754C16.6084 8.33337 16.4036 8.33339 16.1932 8.33342L14.5833 8.33342V5.13453C14.5833 4.69529 14.5834 4.31634 14.5579 4.00423C14.5309 3.67477 14.4715 3.34709 14.3109 3.03177C14.0712 2.56137 13.6887 2.17892 13.2183 1.93923C12.903 1.77857 12.5753 1.71914 12.2459 1.69223C11.9337 1.66672 11.5547 1.66674 11.1155 1.66675ZM8.33333 5.83342C8.33333 5.37318 8.70643 5.00008 9.16667 5.00008H10.8333C11.2936 5.00008 11.6667 5.37318 11.6667 5.83342C11.6667 6.29365 11.2936 6.66675 10.8333 6.66675H9.16667C8.70643 6.66675 8.33333 6.29365 8.33333 5.83342ZM8.33333 9.16675C8.33333 8.70651 8.70643 8.33342 9.16667 8.33342H10.8333C11.2936 8.33342 11.6667 8.70651 11.6667 9.16675C11.6667 9.62699 11.2936 10.0001 10.8333 10.0001H9.16667C8.70643 10.0001 8.33333 9.62699 8.33333 9.16675ZM9.16667 11.6667C8.70643 11.6667 8.33333 12.0398 8.33333 12.5001C8.33333 12.9603 8.70643 13.3334 9.16667 13.3334H10.8333C11.2936 13.3334 11.6667 12.9603 11.6667 12.5001C11.6667 12.0398 11.2936 11.6667 10.8333 11.6667H9.16667Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      id: "screening",
      label: "Screening",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m16 11 2 2 4-4" />
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      ),
    },
    {
      id: "bills",
      label: "Bills",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.5 6.5C2.5 5.09987 2.5 4.3998 2.77248 3.86502C3.01217 3.39462 3.39462 3.01217 3.86502 2.77248C4.3998 2.5 5.09987 2.5 6.5 2.5H13.5C14.9001 2.5 15.6002 2.5 16.135 2.77248C16.6054 3.01217 16.9878 3.39462 17.2275 3.86502C17.5 4.3998 17.5 5.09987 17.5 6.5V13.5C17.5 14.9001 17.5 15.6002 17.2275 16.135C16.9878 16.6054 16.6054 16.9878 16.135 17.2275C15.6002 17.5 14.9001 17.5 13.5 17.5H6.5C5.09987 17.5 4.3998 17.5 3.86502 17.2275C3.39462 16.9878 3.01217 16.6054 2.77248 16.135C2.5 15.6002 2.5 14.9001 2.5 13.5V6.5Z"
            fill="currentColor"
          />
          <path
            d="M14.5833 5.41667L5.41667 14.5833M7.08333 8.75V5.41667M5.41667 7.08333H8.75M11.25 12.9167H14.5833M6.5 17.5H13.5C14.9001 17.5 15.6002 17.5 16.135 17.2275C16.6054 16.9878 16.9878 16.6054 17.2275 16.135C17.5 15.6002 17.5 14.9001 17.5 13.5V6.5C17.5 5.09987 17.5 4.3998 17.2275 3.86502C16.9878 3.39462 16.6054 3.01217 16.135 2.77248C15.6002 2.5 14.9001 2.5 13.5 2.5H6.5C5.09987 2.5 4.3998 2.5 3.86502 2.77248C3.39462 3.01217 3.01217 3.39462 2.77248 3.86502C2.5 4.3998 2.5 5.09987 2.5 6.5V13.5C2.5 14.9001 2.5 15.6002 2.77248 16.135C3.01217 16.6054 3.39462 16.9878 3.86502 17.2275C4.3998 17.5 5.09987 17.5 6.5 17.5Z"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: "field-team-orders",
      label: "Field Team Orders",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 5.00008L8.75 8.75008M5 5.00008H2.5L1.66667 2.50008L2.5 1.66675L5 2.50008V5.00008ZM16.0492 2.28426L13.8595 4.47394C13.5295 4.80395 13.3645 4.96896 13.3026 5.15923C13.2482 5.3266 13.2482 5.50689 13.3026 5.67426C13.3645 5.86454 13.5295 6.02954 13.8595 6.35956L14.0572 6.55727C14.3872 6.88729 14.5522 7.05229 14.7425 7.11412C14.9099 7.1685 15.0901 7.1685 15.2575 7.11412C15.4478 7.05229 15.6128 6.88729 15.9428 6.55727L17.9911 4.50901C18.2117 5.04582 18.3333 5.63374 18.3333 6.25008C18.3333 8.78139 16.2813 10.8334 13.75 10.8334C13.4448 10.8334 13.1466 10.8036 12.8581 10.7467C12.453 10.6668 12.2505 10.6268 12.1277 10.6391C11.9971 10.6521 11.9328 10.6717 11.8171 10.7336C11.7083 10.7918 11.5991 10.9009 11.3809 11.1192L5.41667 17.0834C4.72631 17.7738 3.60702 17.7738 2.91667 17.0834C2.22631 16.393 2.22631 15.2738 2.91667 14.5834L8.88086 8.61922C9.09915 8.40094 9.20829 8.29179 9.26652 8.18299C9.32842 8.06731 9.34799 8.00297 9.361 7.87242C9.37324 7.74963 9.33329 7.54707 9.25339 7.14195C9.19649 6.85346 9.16667 6.55526 9.16667 6.25008C9.16667 3.71878 11.2187 1.66675 13.75 1.66675C14.5879 1.66675 15.3733 1.8916 16.0492 2.28426ZM10 12.5L14.5833 17.0833C15.2737 17.7737 16.393 17.7737 17.0833 17.0833C17.7737 16.393 17.7737 15.2737 17.0833 14.5833L13.3128 10.8128C13.0458 10.7876 12.7856 10.7394 12.534 10.6704C12.2098 10.5814 11.8541 10.646 11.6164 10.8837L10 12.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: "work-orders",
      label: "Work Orders",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 5.00008L8.75 8.75008M5 5.00008H2.5L1.66667 2.50008L2.5 1.66675L5 2.50008V5.00008ZM16.0492 2.28426L13.8595 4.47394C13.5295 4.80395 13.3645 4.96896 13.3026 5.15923C13.2482 5.3266 13.2482 5.50689 13.3026 5.67426C13.3645 5.86454 13.5295 6.02954 13.8595 6.35956L14.0572 6.55727C14.3872 6.88729 14.5522 7.05229 14.7425 7.11412C14.9099 7.1685 15.0901 7.1685 15.2575 7.11412C15.4478 7.05229 15.6128 6.88729 15.9428 6.55727L17.9911 4.50901C18.2117 5.04582 18.3333 5.63374 18.3333 6.25008C18.3333 8.78139 16.2813 10.8334 13.75 10.8334C13.4448 10.8334 13.1466 10.8036 12.8581 10.7467C12.453 10.6668 12.2505 10.6268 12.1277 10.6391C11.9971 10.6521 11.9328 10.6717 11.8171 10.7336C11.7083 10.7918 11.5991 10.9009 11.3809 11.1192L5.41667 17.0834C4.72631 17.7738 3.60702 17.7738 2.91667 17.0834C2.22631 16.393 2.22631 15.2738 2.91667 14.5834L8.88086 8.61922C9.09915 8.40094 9.20829 8.29179 9.26652 8.18299C9.32842 8.06731 9.34799 8.00297 9.361 7.87242C9.37324 7.74963 9.33329 7.54707 9.25339 7.14195C9.19649 6.85346 9.16667 6.55526 9.16667 6.25008C9.16667 3.71878 11.2187 1.66675 13.75 1.66675C14.5879 1.66675 15.3733 1.8916 16.0492 2.28426ZM10 12.5L14.5833 17.0833C15.2737 17.7737 16.393 17.7737 17.0833 17.0833C17.7737 16.393 17.7737 15.2737 17.0833 14.5833L13.3128 10.8128C13.0458 10.7876 12.7856 10.7394 12.534 10.6704C12.2098 10.5814 11.8541 10.646 11.6164 10.8837L10 12.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  const [tabs, setTabs] = useState<Tab[]>(defaultTabs);
  const [openTabs, setOpenTabs] = useState<Set<string>>(
    new Set(["properties"]),
  );
  const [nextNewTabId, setNextNewTabId] = useState(1);
  const [isFullscreen, setIsFullscreenState] = useState(false);
  const tabContext = useContext(TabContext);

  // Load fullscreen state from localStorage on mount
  useEffect(() => {
    setIsFullscreenState(getFullscreenMode());
  }, []);

  const toggleFullscreen = () => {
    const newValue = !isFullscreen;
    setIsFullscreenState(newValue);
    setFullscreenMode(newValue);
  };

  if (!tabContext) {
    throw new Error("Header must be used within TabContext provider");
  }

  const { selectedTab, setSelectedTab, tabMetadata, setTabMetadata } =
    tabContext;

  // Update the current tab's metadata when location changes (but don't change selected tab)
  useEffect(() => {
    const currentPageInfo = getCurrentPageLabel();
    if (currentPageInfo && selectedTab) {
      const metadata = tabMetadata[selectedTab];
      // Only update route if it changed, keep other metadata
      if (metadata?.route !== currentPageInfo.path) {
        setTabMetadata(selectedTab, {
          ...metadata,
          label: currentPageInfo.label,
          route: currentPageInfo.path,
        });
      }
    }
  }, [location.pathname, selectedTab]);

  // Map section IDs to their parent category icons
  const getIconForSection = (
    sectionId?: string,
    isSelected: boolean = false,
  ) => {
    if (!sectionId) return null;

    // Define light and dark versions of icons
    const iconLibrary = {
      propertiesLight: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6.25 9.16667H3.83334C3.36663 9.16667 3.13327 9.16667 2.95501 9.25749C2.79821 9.33739 2.67073 9.46487 2.59083 9.62167C2.50001 9.79993 2.50001 10.0333 2.50001 10.5V17.5M13.75 9.16667H16.1667C16.6334 9.16667 16.8667 9.16667 17.045 9.25749C17.2018 9.33739 17.3293 9.46487 17.4092 9.62167C17.5 9.79993 17.5 10.0333 17.5 10.5V17.5M13.75 17.5V5.16667C13.75 4.23325 13.75 3.76654 13.5683 3.41002C13.4086 3.09641 13.1536 2.84144 12.84 2.68166C12.4835 2.5 12.0168 2.5 11.0833 2.5H8.91667C7.98325 2.5 7.51654 2.5 7.16002 2.68166C6.84642 2.84144 6.59145 3.09641 6.43166 3.41002C6.25001 3.76654 6.25 4.23325 6.25 5.16667V17.5M18.3333 17.5H1.66667M9.16667 5.83333H10.8333M9.16667 9.16667H10.8333M9.16667 12.5H10.8333"
            stroke="#717179"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      propertiesDark: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11.1155 1.66675H8.88455C8.44528 1.66674 8.06627 1.66672 7.75414 1.69223C7.42469 1.71914 7.09701 1.77857 6.78169 1.93923C6.31129 2.17892 5.92883 2.56137 5.68915 3.03177C5.52849 3.34709 5.46906 3.67477 5.44214 4.00423C5.41664 4.31637 5.41665 4.69534 5.41667 5.13463L5.41667 8.33342L3.80674 8.33342C3.59643 8.33339 3.39161 8.33337 3.21815 8.34754C3.02765 8.36311 2.80287 8.39983 2.57669 8.51508C2.26308 8.67486 2.00811 8.92983 1.84833 9.24344C1.73308 9.46962 1.69635 9.6944 1.68079 9.8849C1.66662 10.0584 1.66664 10.2632 1.66667 10.4735L1.66667 16.6667C1.20643 16.6667 0.833332 17.0398 0.833332 17.5001C0.833332 17.9603 1.20643 18.3334 1.66667 18.3334H2.49768L2.5 18.3334L2.50233 18.3334H17.4977L17.5 18.3334L17.5023 18.3334H18.3333C18.7936 18.3334 19.1667 17.9603 19.1667 17.5001C19.1667 17.0398 18.7936 16.6667 18.3333 16.6667L18.3333 10.4734C18.3334 10.2631 18.3334 10.0583 18.3192 9.8849C18.3036 9.6944 18.2669 9.46962 18.1517 9.24344C17.9919 8.92983 17.7369 8.67486 17.4233 8.51508C17.1971 8.39983 16.9724 8.36311 16.7819 8.34754C16.6084 8.33337 16.4036 8.33339 16.1932 8.33342L14.5833 8.33342V5.13453C14.5833 4.69529 14.5834 4.31634 14.5579 4.00423C14.5309 3.67477 14.4715 3.34709 14.3109 3.03177C14.0712 2.56137 13.6887 2.17892 13.2183 1.93923C12.903 1.77857 12.5753 1.71914 12.2459 1.69223C11.9337 1.66672 11.5547 1.66674 11.1155 1.66675ZM8.33333 5.83342C8.33333 5.37318 8.70643 5.00008 9.16667 5.00008H10.8333C11.2936 5.00008 11.6667 5.37318 11.6667 5.83342C11.6667 6.29365 11.2936 6.66675 10.8333 6.66675H9.16667C8.70643 6.66675 8.33333 6.29365 8.33333 5.83342ZM8.33333 9.16675C8.33333 8.70651 8.70643 8.33342 9.16667 8.33342H10.8333C11.2936 8.33342 11.6667 8.70651 11.6667 9.16675C11.6667 9.62699 11.2936 10.0001 10.8333 10.0001H9.16667C8.70643 10.0001 8.33333 9.62699 8.33333 9.16675ZM9.16667 11.6667C8.70643 11.6667 8.33333 12.0398 8.33333 12.5001C8.33333 12.9603 8.70643 13.3334 9.16667 13.3334H10.8333C11.2936 13.3334 11.6667 12.9603 11.6667 12.5001C11.6667 12.0398 11.2936 11.6667 10.8333 11.6667H9.16667Z"
            fill="#303030"
          />
        </svg>
      ),
      billsLight: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14.5833 5.41667L5.41667 14.5833M7.08333 8.75V5.41667M5.41667 7.08333H8.75M11.25 12.9167H14.5833M6.5 17.5H13.5C14.9001 17.5 15.6002 17.5 16.135 17.2275C16.6054 16.9878 16.9878 16.6054 17.2275 16.135C17.5 15.6002 17.5 14.9001 17.5 13.5V6.5C17.5 5.09987 17.5 4.3998 17.2275 3.86502C16.9878 3.39462 16.6054 3.01217 16.135 2.77248C15.6002 2.5 14.9001 2.5 13.5 2.5H6.5C5.09987 2.5 4.3998 2.5 3.86502 2.77248C3.39462 3.01217 3.01217 3.39462 2.77248 3.86502C2.5 4.3998 2.5 5.09987 2.5 6.5V13.5C2.5 14.9001 2.5 15.6002 2.77248 16.135C3.01217 16.6054 3.39462 16.9878 3.86502 17.2275C4.3998 17.5 5.09987 17.5 6.5 17.5Z"
            stroke="#717179"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      billsDark: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.5 6.5C2.5 5.09987 2.5 4.3998 2.77248 3.86502C3.01217 3.39462 3.39462 3.01217 3.86502 2.77248C4.3998 2.5 5.09987 2.5 6.5 2.5H13.5C14.9001 2.5 15.6002 2.5 16.135 2.77248C16.6054 3.01217 16.9878 3.39462 17.2275 3.86502C17.5 4.3998 17.5 5.09987 17.5 6.5V13.5C17.5 14.9001 17.5 15.6002 17.2275 16.135C16.9878 16.6054 16.6054 16.9878 16.135 17.2275C15.6002 17.5 14.9001 17.5 13.5 17.5H6.5C5.09987 17.5 4.3998 17.5 3.86502 17.2275C3.39462 16.9878 3.01217 16.6054 2.77248 16.135C2.5 15.6002 2.5 14.9001 2.5 13.5V6.5Z"
            fill="#303030"
          />
          <path
            d="M14.5833 5.41667L5.41667 14.5833M7.08333 8.75V5.41667M5.41667 7.08333H8.75M11.25 12.9167H14.5833M6.5 17.5H13.5C14.9001 17.5 15.6002 17.5 16.135 17.2275C16.6054 16.9878 16.9878 16.6054 17.2275 16.135C17.5 15.6002 17.5 14.9001 17.5 13.5V6.5C17.5 5.09987 17.5 4.3998 17.2275 3.86502C16.9878 3.39462 16.6054 3.01217 16.135 2.77248C15.6002 2.5 14.9001 2.5 13.5 2.5H6.5C5.09987 2.5 4.3998 2.5 3.86502 2.77248C3.39462 3.01217 3.01217 3.39462 2.77248 3.86502C2.5 4.3998 2.5 5.09987 2.5 6.5V13.5C2.5 14.9001 2.5 15.6002 2.77248 16.135C3.01217 16.6054 3.39462 16.9878 3.86502 17.2275C4.3998 17.5 5.09987 17.5 6.5 17.5Z"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      maintenanceLight: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 5.00008L8.75 8.75008M5 5.00008H2.5L1.66667 2.50008L2.5 1.66675L5 2.50008V5.00008ZM16.0492 2.28426L13.8595 4.47394C13.5295 4.80395 13.3645 4.96896 13.3026 5.15923C13.2482 5.3266 13.2482 5.50689 13.3026 5.67426C13.3645 5.86454 13.5295 6.02954 13.8595 6.35956L14.0572 6.55727C14.3872 6.88729 14.5522 7.05229 14.7425 7.11412C14.9099 7.1685 15.0901 7.1685 15.2575 7.11412C15.4478 7.05229 15.6128 6.88729 15.9428 6.55727L17.9911 4.50901C18.2117 5.04582 18.3333 5.63374 18.3333 6.25008C18.3333 8.78139 16.2813 10.8334 13.75 10.8334C13.4448 10.8334 13.1466 10.8036 12.8581 10.7467C12.453 10.6668 12.2505 10.6268 12.1277 10.6391C11.9971 10.6521 11.9328 10.6717 11.8171 10.7336C11.7083 10.7918 11.5991 10.9009 11.3809 11.1192L5.41667 17.0834C4.72631 17.7738 3.60702 17.7738 2.91667 17.0834C2.22631 16.393 2.22631 15.2738 2.91667 14.5834L8.88086 8.61922C9.09915 8.40094 9.20829 8.29179 9.26652 8.18299C9.32842 8.06731 9.34799 8.00297 9.361 7.87242C9.37324 7.74963 9.33329 7.54707 9.25339 7.14195C9.19649 6.85346 9.16667 6.55526 9.16667 6.25008C9.16667 3.71878 11.2187 1.66675 13.75 1.66675C14.5879 1.66675 15.3733 1.8916 16.0492 2.28426ZM10 12.5L14.5833 17.0833C15.2737 17.7737 16.393 17.7737 17.0833 17.0833C17.7737 16.393 17.7737 15.2737 17.0833 14.5833L13.3128 10.8128C13.0458 10.7876 12.7856 10.7394 12.534 10.6704C12.2098 10.5814 11.8541 10.646 11.6164 10.8837L10 12.5Z"
            stroke="#717179"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      maintenanceDark: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5 5.00008L8.75 8.75008Z" fill="#303030" />
          <path
            d="M2.5 1.66675L5 2.50008V5.00008H2.5L1.66667 2.50008L2.5 1.66675Z"
            fill="#303030"
          />
          <path
            d="M16.0492 2.28426L13.8595 4.47394C13.5295 4.80395 13.3645 4.96896 13.3026 5.15923C13.2482 5.3266 13.2482 5.50689 13.3026 5.67426C13.3645 5.86454 13.5295 6.02954 13.8595 6.35956L14.0572 6.55727C14.3872 6.88729 14.5522 7.05229 14.7425 7.11412C14.9099 7.1685 15.0901 7.1685 15.2575 7.11412C15.4478 7.05229 15.6128 6.88729 15.9428 6.55727L17.9911 4.50901C18.2117 5.04582 18.3333 5.63374 18.3333 6.25008C18.3333 8.78139 16.2813 10.8334 13.75 10.8334C13.4448 10.8334 13.1466 10.8036 12.8581 10.7467C12.453 10.6668 12.2505 10.6268 12.1277 10.6391C11.9971 10.6521 11.9328 10.6717 11.8171 10.7336C11.7083 10.7918 11.5991 10.9009 11.3809 11.1192L5.41667 17.0834C4.72631 17.7738 3.60702 17.7738 2.91667 17.0834C2.22631 16.393 2.22631 15.2738 2.91667 14.5834L8.88086 8.61922C9.09914 8.40094 9.20829 8.29179 9.26651 8.18299C9.32842 8.06731 9.34799 8.00297 9.361 7.87242C9.37323 7.74963 9.33328 7.54707 9.25339 7.14195C9.19649 6.85346 9.16667 6.55526 9.16667 6.25008C9.16667 3.71878 11.2187 1.66675 13.75 1.66675C14.5879 1.66675 15.3733 1.8916 16.0492 2.28426Z"
            fill="#303030"
          />
          <path
            d="M10 12.5L14.5833 17.0833C15.2737 17.7737 16.393 17.7737 17.0833 17.0833C17.7737 16.393 17.7737 15.2737 17.0833 14.5833L13.3128 10.8128C13.0458 10.7876 12.7856 10.7394 12.534 10.6704C12.2098 10.5814 11.8541 10.646 11.6164 10.8837L10 12.5Z"
            fill="#303030"
          />
          <path
            d="M5 5.00008L8.75 8.75008M5 5.00008H2.5L1.66667 2.50008L2.5 1.66675L5 2.50008V5.00008ZM16.0492 2.28426L13.8595 4.47394C13.5295 4.80395 13.3645 4.96896 13.3026 5.15923C13.2482 5.3266 13.2482 5.50689 13.3026 5.67426C13.3645 5.86454 13.5295 6.02954 13.8595 6.35956L14.0572 6.55727C14.3872 6.88729 14.5522 7.05229 14.7425 7.11412C14.9099 7.1685 15.0901 7.1685 15.2575 7.11412C15.4478 7.05229 15.6128 6.88729 15.9428 6.55727L17.9911 4.50901C18.2117 5.04582 18.3333 5.63374 18.3333 6.25008C18.3333 8.78139 16.2813 10.8334 13.75 10.8334C13.4448 10.8334 13.1466 10.8036 12.8581 10.7467C12.453 10.6668 12.2505 10.6268 12.1277 10.6391C11.9971 10.6521 11.9328 10.6717 11.8171 10.7336C11.7083 10.7918 11.5991 10.9009 11.3809 11.1192L5.41667 17.0834C4.72631 17.7738 3.60702 17.7738 2.91667 17.0834C2.22631 16.393 2.22631 15.2738 2.91667 14.5834L8.88086 8.61922C9.09914 8.40094 9.20829 8.29179 9.26651 8.18299C9.32842 8.06731 9.34799 8.00297 9.361 7.87242C9.37323 7.74963 9.33328 7.54707 9.25339 7.14195C9.19649 6.85346 9.16667 6.55526 9.16667 6.25008C9.16667 3.71878 11.2187 1.66675 13.75 1.66675C14.5879 1.66675 15.3733 1.8916 16.0492 2.28426ZM10 12.5L14.5833 17.0833C15.2737 17.7737 16.393 17.7737 17.0833 17.0833C17.7737 16.393 17.7737 15.2737 17.0833 14.5833L13.3128 10.8128C13.0458 10.7876 12.7856 10.7394 12.534 10.6704C12.2098 10.5814 11.8541 10.646 11.6164 10.8837L10 12.5Z"
            stroke="#303030"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    };

    // Map section IDs to their icon keys
    const sectionIconMap: Record<string, React.ReactNode> = {
      // Properties sections
      "all-properties": (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11.1155 1.66675H8.88455C8.44528 1.66674 8.06627 1.66672 7.75414 1.69223C7.42469 1.71914 7.09701 1.77857 6.78169 1.93923C6.31129 2.17892 5.92883 2.56137 5.68915 3.03177C5.52849 3.34709 5.46906 3.67477 5.44214 4.00423C5.41664 4.31637 5.41665 4.69534 5.41667 5.13463L5.41667 8.33342L3.80674 8.33342C3.59643 8.33339 3.39161 8.33337 3.21815 8.34754C3.02765 8.36311 2.80287 8.39983 2.57669 8.51508C2.26308 8.67486 2.00811 8.92983 1.84833 9.24344C1.73308 9.46962 1.69635 9.6944 1.68079 9.8849C1.66662 10.0584 1.66664 10.2632 1.66667 10.4735L1.66667 16.6667C1.20643 16.6667 0.833332 17.0398 0.833332 17.5001C0.833332 17.9603 1.20643 18.3334 1.66667 18.3334H2.49768L2.5 18.3334L2.50233 18.3334H17.4977L17.5 18.3334L17.5023 18.3334H18.3333C18.7936 18.3334 19.1667 17.9603 19.1667 17.5001C19.1667 17.0398 18.7936 16.6667 18.3333 16.6667L18.3333 10.4734C18.3334 10.2631 18.3334 10.0583 18.3192 9.8849C18.3036 9.6944 18.2669 9.46962 18.1517 9.24344C17.9919 8.92983 17.7369 8.67486 17.4233 8.51508C17.1971 8.39983 16.9724 8.36311 16.7819 8.34754C16.6084 8.33337 16.4036 8.33339 16.1932 8.33342L14.5833 8.33342V5.13453C14.5833 4.69529 14.5834 4.31634 14.5579 4.00423C14.5309 3.67477 14.4715 3.34709 14.3109 3.03177C14.0712 2.56137 13.6887 2.17892 13.2183 1.93923C12.903 1.77857 12.5753 1.71914 12.2459 1.69223C11.9337 1.66672 11.5547 1.66674 11.1155 1.66675ZM8.33333 5.83342C8.33333 5.37318 8.70643 5.00008 9.16667 5.00008H10.8333C11.2936 5.00008 11.6667 5.37318 11.6667 5.83342C11.6667 6.29365 11.2936 6.66675 10.8333 6.66675H9.16667C8.70643 6.66675 8.33333 6.29365 8.33333 5.83342ZM8.33333 9.16675C8.33333 8.70651 8.70643 8.33342 9.16667 8.33342H10.8333C11.2936 8.33342 11.6667 8.70651 11.6667 9.16675C11.6667 9.62699 11.2936 10.0001 10.8333 10.0001H9.16667C8.70643 10.0001 8.33333 9.62699 8.33333 9.16675ZM9.16667 11.6667C8.70643 11.6667 8.33333 12.0398 8.33333 12.5001C8.33333 12.9603 8.70643 13.3334 9.16667 13.3334H10.8333C11.2936 13.3334 11.6667 12.9603 11.6667 12.5001C11.6667 12.0398 11.2936 11.6667 10.8333 11.6667H9.16667Z"
            fill="currentColor"
          />
        </svg>
      ),
      // Accounting sections
      bills: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.5 6.5C2.5 5.09987 2.5 4.3998 2.77248 3.86502C3.01217 3.39462 3.39462 3.01217 3.86502 2.77248C4.3998 2.5 5.09987 2.5 6.5 2.5H13.5C14.9001 2.5 15.6002 2.5 16.135 2.77248C16.6054 3.01217 16.9878 3.39462 17.2275 3.86502C17.5 4.3998 17.5 5.09987 17.5 6.5V13.5C17.5 14.9001 17.5 15.6002 17.2275 16.135C16.9878 16.6054 16.6054 16.9878 16.135 17.2275C15.6002 17.5 14.9001 17.5 13.5 17.5H6.5C5.09987 17.5 4.3998 17.5 3.86502 17.2275C3.39462 16.9878 3.01217 16.6054 2.77248 16.135C2.5 15.6002 2.5 14.9001 2.5 13.5V6.5Z"
            fill="currentColor"
          />
          <path
            d="M14.5833 5.41667L5.41667 14.5833M7.08333 8.75V5.41667M5.41667 7.08333H8.75M11.25 12.9167H14.5833M6.5 17.5H13.5C14.9001 17.5 15.6002 17.5 16.135 17.2275C16.6054 16.9878 16.9878 16.6054 17.2275 16.135C17.5 15.6002 17.5 14.9001 17.5 13.5V6.5C17.5 5.09987 17.5 4.3998 17.2275 3.86502C16.9878 3.39462 16.6054 3.01217 16.135 2.77248C15.6002 2.5 14.9001 2.5 13.5 2.5H6.5C5.09987 2.5 4.3998 2.5 3.86502 2.77248C3.39462 3.01217 3.01217 3.39462 2.77248 3.86502C2.5 4.3998 2.5 5.09987 2.5 6.5V13.5C2.5 14.9001 2.5 15.6002 2.77248 16.135C3.01217 16.6054 3.39462 16.9878 3.86502 17.2275C4.3998 17.5 5.09987 17.5 6.5 17.5Z"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      // Maintenance sections
      "all-tasks": (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 5.00008L8.75 8.75008M5 5.00008H2.5L1.66667 2.50008L2.5 1.66675L5 2.50008V5.00008ZM16.0492 2.28426L13.8595 4.47394C13.5295 4.80395 13.3645 4.96896 13.3026 5.15923C13.2482 5.3266 13.2482 5.50689 13.3026 5.67426C13.3645 5.86454 13.5295 6.02954 13.8595 6.35956L14.0572 6.55727C14.3872 6.88729 14.5522 7.05229 14.7425 7.11412C14.9099 7.1685 15.0901 7.1685 15.2575 7.11412C15.4478 7.05229 15.6128 6.88729 15.9428 6.55727L17.9911 4.50901C18.2117 5.04582 18.3333 5.63374 18.3333 6.25008C18.3333 8.78139 16.2813 10.8334 13.75 10.8334C13.4448 10.8334 13.1466 10.8036 12.8581 10.7467C12.453 10.6668 12.2505 10.6268 12.1277 10.6391C11.9971 10.6521 11.9328 10.6717 11.8171 10.7336C11.7083 10.7918 11.5991 10.9009 11.3809 11.1192L5.41667 17.0834C4.72631 17.7738 3.60702 17.7738 2.91667 17.0834C2.22631 16.393 2.22631 15.2738 2.91667 14.5834L8.88086 8.61922C9.09915 8.40094 9.20829 8.29179 9.26652 8.18299C9.32842 8.06731 9.34799 8.00297 9.361 7.87242C9.37324 7.74963 9.33329 7.54707 9.25339 7.14195C9.19649 6.85346 9.16667 6.55526 9.16667 6.25008C9.16667 3.71878 11.2187 1.66675 13.75 1.66675C14.5879 1.66675 15.3733 1.8916 16.0492 2.28426ZM10 12.5L14.5833 17.0833C15.2737 17.7737 16.393 17.7737 17.0833 17.0833C17.7737 16.393 17.7737 15.2737 17.0833 14.5833L13.3128 10.8128C13.0458 10.7876 12.7856 10.7394 12.534 10.6704C12.2098 10.5814 11.8541 10.646 11.6164 10.8837L10 12.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      "recurring-tasks": (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 5.00008L8.75 8.75008M5 5.00008H2.5L1.66667 2.50008L2.5 1.66675L5 2.50008V5.00008ZM16.0492 2.28426L13.8595 4.47394C13.5295 4.80395 13.3645 4.96896 13.3026 5.15923C13.2482 5.3266 13.2482 5.50689 13.3026 5.67426C13.3645 5.86454 13.5295 6.02954 13.8595 6.35956L14.0572 6.55727C14.3872 6.88729 14.5522 7.05229 14.7425 7.11412C14.9099 7.1685 15.0901 7.1685 15.2575 7.11412C15.4478 7.05229 15.6128 6.88729 15.9428 6.55727L17.9911 4.50901C18.2117 5.04582 18.3333 5.63374 18.3333 6.25008C18.3333 8.78139 16.2813 10.8334 13.75 10.8334C13.4448 10.8334 13.1466 10.8036 12.8581 10.7467C12.453 10.6668 12.2505 10.6268 12.1277 10.6391C11.9971 10.6521 11.9328 10.6717 11.8171 10.7336C11.7083 10.7918 11.5991 10.9009 11.3809 11.1192L5.41667 17.0834C4.72631 17.7738 3.60702 17.7738 2.91667 17.0834C2.22631 16.393 2.22631 15.2738 2.91667 14.5834L8.88086 8.61922C9.09915 8.40094 9.20829 8.29179 9.26652 8.18299C9.32842 8.06731 9.34799 8.00297 9.361 7.87242C9.37324 7.74963 9.33329 7.54707 9.25339 7.14195C9.19649 6.85346 9.16667 6.55526 9.16667 6.25008C9.16667 3.71878 11.2187 1.66675 13.75 1.66675C14.5879 1.66675 15.3733 1.8916 16.0492 2.28426ZM10 12.5L14.5833 17.0833C15.2737 17.7737 16.393 17.7737 17.0833 17.0833C17.7737 16.393 17.7737 15.2737 17.0833 14.5833L13.3128 10.8128C13.0458 10.7876 12.7856 10.7394 12.534 10.6704C12.2098 10.5814 11.8541 10.646 11.6164 10.8837L10 12.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      "field-team-orders": (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 5.00008L8.75 8.75008M5 5.00008H2.5L1.66667 2.50008L2.5 1.66675L5 2.50008V5.00008ZM16.0492 2.28426L13.8595 4.47394C13.5295 4.80395 13.3645 4.96896 13.3026 5.15923C13.2482 5.3266 13.2482 5.50689 13.3026 5.67426C13.3645 5.86454 13.5295 6.02954 13.8595 6.35956L14.0572 6.55727C14.3872 6.88729 14.5522 7.05229 14.7425 7.11412C14.9099 7.1685 15.0901 7.1685 15.2575 7.11412C15.4478 7.05229 15.6128 6.88729 15.9428 6.55727L17.9911 4.50901C18.2117 5.04582 18.3333 5.63374 18.3333 6.25008C18.3333 8.78139 16.2813 10.8334 13.75 10.8334C13.4448 10.8334 13.1466 10.8036 12.8581 10.7467C12.453 10.6668 12.2505 10.6268 12.1277 10.6391C11.9971 10.6521 11.9328 10.6717 11.8171 10.7336C11.7083 10.7918 11.5991 10.9009 11.3809 11.1192L5.41667 17.0834C4.72631 17.7738 3.60702 17.7738 2.91667 17.0834C2.22631 16.393 2.22631 15.2738 2.91667 14.5834L8.88086 8.61922C9.09915 8.40094 9.20829 8.29179 9.26652 8.18299C9.32842 8.06731 9.34799 8.00297 9.361 7.87242C9.37324 7.74963 9.33329 7.54707 9.25339 7.14195C9.19649 6.85346 9.16667 6.55526 9.16667 6.25008C9.16667 3.71878 11.2187 1.66675 13.75 1.66675C14.5879 1.66675 15.3733 1.8916 16.0492 2.28426ZM10 12.5L14.5833 17.0833C15.2737 17.7737 16.393 17.7737 17.0833 17.0833C17.7737 16.393 17.7737 15.2737 17.0833 14.5833L13.3128 10.8128C13.0458 10.7876 12.7856 10.7394 12.534 10.6704C12.2098 10.5814 11.8541 10.646 11.6164 10.8837L10 12.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      "work-orders": (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 5.00008L8.75 8.75008M5 5.00008H2.5L1.66667 2.50008L2.5 1.66675L5 2.50008V5.00008ZM16.0492 2.28426L13.8595 4.47394C13.5295 4.80395 13.3645 4.96896 13.3026 5.15923C13.2482 5.3266 13.2482 5.50689 13.3026 5.67426C13.3645 5.86454 13.5295 6.02954 13.8595 6.35956L14.0572 6.55727C14.3872 6.88729 14.5522 7.05229 14.7425 7.11412C14.9099 7.1685 15.0901 7.1685 15.2575 7.11412C15.4478 7.05229 15.6128 6.88729 15.9428 6.55727L17.9911 4.50901C18.2117 5.04582 18.3333 5.63374 18.3333 6.25008C18.3333 8.78139 16.2813 10.8334 13.75 10.8334C13.4448 10.8334 13.1466 10.8036 12.8581 10.7467C12.453 10.6668 12.2505 10.6268 12.1277 10.6391C11.9971 10.6521 11.9328 10.6717 11.8171 10.7336C11.7083 10.7918 11.5991 10.9009 11.3809 11.1192L5.41667 17.0834C4.72631 17.7738 3.60702 17.7738 2.91667 17.0834C2.22631 16.393 2.22631 15.2738 2.91667 14.5834L8.88086 8.61922C9.09915 8.40094 9.20829 8.29179 9.26652 8.18299C9.32842 8.06731 9.34799 8.00297 9.361 7.87242C9.37324 7.74963 9.33329 7.54707 9.25339 7.14195C9.19649 6.85346 9.16667 6.55526 9.16667 6.25008C9.16667 3.71878 11.2187 1.66675 13.75 1.66675C14.5879 1.66675 15.3733 1.8916 16.0492 2.28426ZM10 12.5L14.5833 17.0833C15.2737 17.7737 16.393 17.7737 17.0833 17.0833C17.7737 16.393 17.7737 15.2737 17.0833 14.5833L13.3128 10.8128C13.0458 10.7876 12.7856 10.7394 12.534 10.6704C12.2098 10.5814 11.8541 10.646 11.6164 10.8837L10 12.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    };

    // Map section IDs to icon types
    const mapping: Record<string, keyof typeof iconLibrary> = {
      "all-properties": isSelected ? "propertiesDark" : "propertiesLight",
      properties: isSelected ? "propertiesDark" : "propertiesLight",
      bills: isSelected ? "billsDark" : "billsLight",
      "all-tasks": isSelected ? "maintenanceDark" : "maintenanceLight",
      "recurring-tasks": isSelected ? "maintenanceDark" : "maintenanceLight",
      "field-team-orders": isSelected ? "maintenanceDark" : "maintenanceLight",
      "work-orders": isSelected ? "maintenanceDark" : "maintenanceLight",
    };

    const iconKey = mapping[sectionId];
    return iconKey ? iconLibrary[iconKey] : null;
  };

  // Save scroll position before switching tabs
  const saveScrollPosition = () => {
    const mainContent = document.querySelector('[data-testid="main-content"]');
    if (mainContent) {
      const currentTab = selectedTab;
      const scrollPos = mainContent.scrollTop || 0;
      const currentMetadata = tabMetadata[currentTab];
      if (currentMetadata) {
        setTabMetadata(currentTab, {
          ...currentMetadata,
          scrollPosition: scrollPos,
        });
      }
    }
  };

  // Navigate to a tab's stored route
  const navigateToTabRoute = (tabId: string) => {
    const metadata = tabMetadata[tabId];
    if (metadata?.route && metadata.route !== location.pathname) {
      navigate(metadata.route);
    }
  };

  // Automatically open the selected tab if it exists and isn't open
  useEffect(() => {
    const tabExists = tabs.some((tab) => tab.id === selectedTab);
    if (tabExists && !openTabs.has(selectedTab)) {
      const newTabs = new Set(openTabs);
      newTabs.add(selectedTab);
      setOpenTabs(newTabs);
      navigateToTabRoute(selectedTab);
    }
  }, [selectedTab, tabs, openTabs]);

  const toggleTab = (tabId: string, isClosing: boolean = false) => {
    const newTabs = new Set(openTabs);
    if (newTabs.has(tabId)) {
      // Prevent closing the last tab
      if (newTabs.size > 1) {
        // If closing the selected tab, select the next tab to the right
        if (isClosing && selectedTab === tabId) {
          saveScrollPosition();
          // Get the current order of open tabs
          const openTabsArray = tabs.filter((tab) => openTabs.has(tab.id));
          const closedTabIndex = openTabsArray.findIndex(
            (tab) => tab.id === tabId,
          );

          // Determine which tab to select next
          let nextTabId: string;
          if (closedTabIndex === openTabsArray.length - 1) {
            // If closing the rightmost tab, select the one to its left
            nextTabId = openTabsArray[closedTabIndex - 1].id;
          } else {
            // Otherwise, select the next tab to the right
            nextTabId = openTabsArray[closedTabIndex + 1].id;
          }
          setSelectedTab(nextTabId);
        }

        newTabs.delete(tabId);
      }
    } else {
      newTabs.add(tabId);
      // Save scroll position before switching tabs
      if (selectedTab !== tabId) {
        saveScrollPosition();
      }
      // Selecting a tab
      setSelectedTab(tabId);
    }
    setOpenTabs(newTabs);
  };

  const addNewTab = () => {
    const newTabId = `new-tab-${nextNewTabId}`;
    const plusIcon = (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
    const newTab: Tab = {
      id: newTabId,
      label: "New Tab",
      iconLight: plusIcon,
      iconDark: plusIcon,
    };

    setTabs([...tabs, newTab]);
    setOpenTabs(new Set([...openTabs, newTabId]));
    setSelectedTab(newTabId);
    // Initialize metadata for new tab with blank page route
    tabContext.setTabMetadata(newTabId, { label: "New Tab", route: "/blank" });
    setNextNewTabId(nextNewTabId + 1);
    // Navigate to blank page
    navigate("/blank");
  };

  return (
    <header className="bg-white">
      {/* Tabs Section */}
      {!isFullscreen && (
        <div
          className="flex items-center gap-0 px-0 py-0 bg-[#f9fafb]"
          style={{
            borderBottomWidth: "0px",
            borderColor: "rgb(210, 209, 207)",
            borderLeftWidth: "0px",
          }}
        >
          {tabs
            .filter((tab) => openTabs.has(tab.id))
            .map((tab) => {
              const isSelected = tab.id === selectedTab;
              const metadata = tabContext.tabMetadata[tab.id];
              const displayLabel = metadata?.label || tab.label;
              // Use metadata sectionId first, then fall back to tab.id for default tabs
              const sectionId =
                metadata?.sectionId ||
                (!tab.id.startsWith("new-tab-") ? tab.id : undefined);
              const sectionIcon = getIconForSection(sectionId, isSelected);
              const displayIcon =
                sectionIcon || (isSelected ? tab.iconDark : tab.iconLight);
              return (
                <div
                  key={tab.id}
                  className="flex items-center transition-all whitespace-nowrap cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    if (tab.id !== selectedTab) {
                      saveScrollPosition();
                      navigateToTabRoute(tab.id);
                    }
                    setSelectedTab(tab.id);
                  }}
                  style={{
                    backgroundColor: isSelected
                      ? "rgba(255, 255, 255, 1)"
                      : "#f9fafb",
                    borderRadius: isSelected ? "12px 12px 0 0" : "0",
                    minHeight: "47px",
                    gap: "35px",
                    margin: "8px 0 -2px",
                    padding: "0 12px",
                    ...(isSelected
                      ? {
                          borderTop: "1px solid #d2d1cf",
                          borderLeft: "1px solid #d2d1cf",
                          borderRight: "1px solid #d2d1cf",
                          borderBottom: "1px solid rgb(255,255,255)",
                        }
                      : {
                          borderTop: "none",
                          borderLeft: "none",
                          borderRight: "none",
                          borderBottom: "1px solid #d2d1cf",
                        }),
                  }}
                >
                  <div
                    className="flex items-center gap-2 pointer-events-none"
                  >
                    <span
                      className="flex items-center justify-center w-5 h-5"
                      style={{
                        color: isSelected ? "#303030" : "#717179",
                      }}
                    >
                      {displayIcon}
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{
                        fontFamily:
                          "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                        lineHeight: "24px",
                        color: isSelected ? "#303030" : "#717179",
                      }}
                    >
                      {displayLabel}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTab(tab.id, true);
                    }}
                    className="ml-1 text-gray-500 hover:text-gray-700 flex-shrink-0"
                    aria-label={`Close ${tab.label} tab`}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          <div
            className="flex-1 flex items-center h-12 px-2"
            style={{
              borderTopWidth: "0px",
              borderLeftWidth: "0px",
              borderRightWidth: "0px",
              margin: "8px 0 -1px",
              border: "1px solid #d2d1cf",
              backgroundColor: "#f9fafb",
              borderRightColor: "transparent",
              borderLeftColor: "transparent",
              borderTopColor: "transparent",
            }}
          >
            <button
              onClick={addNewTab}
              className="text-gray-600 hover:text-gray-900 transition-opacity"
              aria-label="Add new tab"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Navigation & Search Section */}
      <div
        className="flex items-center justify-between px-6"
        style={{
          borderColor: "rgb(210, 209, 207)",
          borderWidth: "1px",
          borderRightWidth: "0px",
          borderBottomWidth: isFullscreen ? "0px" : "1px",
          padding: "12px 24px",
        }}
      >
        {!isFullscreen && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Navigation Buttons */}
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              aria-label="Go back"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
            </button>
            <button
              onClick={() => window.history.forward()}
              className="p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              aria-label="Go forward"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-gray-700 truncate">
              {breadcrumbItems.map((item, index) => (
                <React.Fragment key={index}>
                  {item.href ? (
                    <button
                      onClick={() => navigate(item.href)}
                      className="text-sm font-medium flex-shrink-0 hover:text-gray-900 hover:underline"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span
                      className={`text-sm font-medium ${index === breadcrumbItems.length - 1 ? "truncate" : "flex-shrink-0"}`}
                    >
                      {item.label}
                    </span>
                  )}
                  {index < breadcrumbItems.length - 1 && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="flex-shrink-0"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
        {isFullscreen && <div className="flex-1" />}

        {/* Search and Actions */}
        {!isFullscreen && (
          <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
            {/* Search Bar */}
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 w-28 sm:w-40 md:w-56 lg:w-72 xl:w-96 min-w-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-700 flex-shrink-0"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.34-4.34" />
                </svg>
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-500 min-w-0"
                />
              </div>
              <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 font-medium flex-shrink-0">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
                </svg>
                <span>S</span>
              </div>
            </div>

            {/* Favorites/Star Button */}
            <button
              onClick={handleFavoriteClick}
              className={`p-2 hover:bg-gray-100 rounded-lg border transition-colors flex-shrink-0 relative ${
                isCurrentPageFavorite
                  ? "border-yellow-400 bg-yellow-50"
                  : "border-gray-300 bg-transparent"
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 22 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={
                  isCurrentPageFavorite ? "text-yellow-500" : "text-gray-700"
                }
              >
                <path
                  d="M11.5714 0.646026C11.163 0.451325 10.6886 0.451325 10.2802 0.646026C9.92723 0.81434 9.73259 1.10658 9.63444 1.2669C9.53297 1.43264 9.4288 1.64377 9.32728 1.84955L7.17154 6.21684L2.34949 6.92165C2.1225 6.95478 1.88959 6.98878 1.70068 7.0342C1.51792 7.07815 1.18001 7.1732 0.911096 7.45704C0.600004 7.78541 0.453702 8.23662 0.512923 8.68506C0.564113 9.07269 0.781958 9.34794 0.904158 9.49077C1.03048 9.63841 1.19913 9.80261 1.36349 9.96263L4.85128 13.3597L4.02832 18.158C3.98947 18.3843 3.94961 18.6164 3.93427 18.8101C3.91943 18.9975 3.90509 19.3484 4.09179 19.6922C4.30774 20.0897 4.69162 20.3686 5.13649 20.4511C5.5211 20.5224 5.85038 20.4003 6.02401 20.3282C6.20356 20.2537 6.41198 20.1441 6.61514 20.0372L10.9258 17.7702L15.2365 20.0372C15.4396 20.1441 15.6481 20.2537 15.8276 20.3282C16.0012 20.4003 16.3305 20.5224 16.7151 20.4511C17.16 20.3686 17.5439 20.0897 17.7598 19.6922C17.9465 19.3484 17.9322 18.9975 17.9173 18.8101C17.902 18.6164 17.8621 18.3843 17.8233 18.1581L17.0003 13.3597L20.4882 9.9626C20.6525 9.80258 20.8211 9.6384 20.9475 9.49077C21.0697 9.34794 21.2875 9.07269 21.3387 8.68506C21.3979 8.23662 21.2516 7.78541 20.9405 7.45704C20.6716 7.1732 20.3337 7.07815 20.1509 7.0342C19.962 6.98878 19.7291 6.95478 19.5021 6.92165L14.6801 6.21684L12.5244 1.84963C12.4228 1.64383 12.3187 1.43265 12.2172 1.2669C12.119 1.10658 11.9244 0.81434 11.5714 0.646026Z"
                  fill={isCurrentPageFavorite ? "currentColor" : "white"}
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Notification Button */}
            <button className="p-2 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors flex-shrink-0 relative">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-700"
              >
                <path d="M10.268 21a2 2 0 0 0 3.464 0" />
                <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
              </svg>
            </button>

            {/* Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors flex-shrink-0 relative"
              title={isFullscreen ? "Expand" : "Minimize"}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-700"
              >
                {isFullscreen ? (
                  <path d="m18 15-6-6-6 6" />
                ) : (
                  <path d="m6 9 6 6 6-6" />
                )}
              </svg>
            </button>
          </div>
        )}
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors flex-shrink-0"
            style={{
              position: "fixed",
              top: "16px",
              right: "16px",
              zIndex: 50,
            }}
            title="Expand"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-700"
            >
              <path d="m18 15-6-6-6 6" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
