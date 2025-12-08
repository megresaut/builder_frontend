import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TabContext } from "@/hooks/useTabContext";
import { useFavorites } from "@/hooks/FavoritesContext";

interface Tab {
  id: string;
  icon: React.ReactNode;
  label: string;
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const getCurrentPageLabel = (): { label: string; path: string; id: string } | null => {
    const path = location.pathname;

    if (path.includes("/property/")) {
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
          return { label: `${label} - ${tab}`, path, id: `property-${propertyId}-${tab}` };
        }
        return { label, path, id: `property-${propertyId}` };
      }
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
    }

    return null;
  };

  const currentPage = getCurrentPageLabel();
  const isCurrentPageFavorite = currentPage ? isFavorite(currentPage.id) : false;

  const handleFavoriteClick = () => {
    if (currentPage) {
      if (isCurrentPageFavorite) {
        removeFavorite(currentPage.id);
      } else {
        addFavorite({ id: currentPage.id, label: currentPage.label, path: currentPage.path });
      }
    }
  };

  const getBreadcrumbItems = () => {
    const path = location.pathname;
    const items: { label: string; href?: string }[] = [];

    if (path.includes("/property/")) {
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
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6.25033 9.16667H3.83366C3.36695 9.16667 3.13359 9.16667 2.95533 9.25749C2.79853 9.33739 2.67105 9.46487 2.59115 9.62167C2.50033 9.79993 2.50033 10.0333 2.50033 10.5V17.5M13.7503 9.16667H16.167C16.6337 9.16667 16.8671 9.16667 17.0453 9.25749C17.2021 9.33739 17.3296 9.46487 17.4095 9.62167C17.5003 9.79993 17.5003 10.0333 17.5003 10.5V17.5M13.7503 17.5V5.16667C13.7503 4.23325 13.7503 3.76654 13.5687 3.41002C13.4089 3.09641 13.1539 2.84144 12.8403 2.68166C12.4838 2.5 12.0171 2.5 11.0837 2.5H8.91699C7.98357 2.5 7.51686 2.5 7.16034 2.68166C6.84674 2.84144 6.59177 3.09641 6.43198 3.41002C6.25033 3.76654 6.25033 4.23325 6.25033 5.16667V17.5M18.3337 17.5H1.66699M9.16699 5.83333H10.8337M9.16699 9.16667H10.8337M9.16699 12.5H10.8337" />
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
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5833 5.41667L5.41667 14.5833M7.08333 8.75V5.41667M5.41667 7.08333H8.75M11.25 12.9167H14.5833M6.5 17.5H13.5C14.9001 17.5 15.6002 17.5 16.135 17.2275C16.6054 16.9878 16.9878 16.6054 17.2275 16.135C17.5 15.6002 17.5 14.9001 17.5 13.5V6.5C17.5 5.09987 17.5 4.3998 17.2275 3.86502C16.9878 3.39462 16.6054 3.01217 16.135 2.77248C15.6002 2.5 14.9001 2.5 13.5 2.5H6.5C5.09987 2.5 4.3998 2.5 3.86502 2.77248C3.39462 3.01217 3.01217 3.39462 2.77248 3.86502C2.5 4.3998 2.5 5.09987 2.5 6.5V13.5C2.5 14.9001 2.5 15.6002 2.77248 16.135C3.01217 16.6054 3.39462 16.9878 3.86502 17.2275C4.3998 17.5 5.09987 17.5 6.5 17.5Z" />
        </svg>
      ),
    },
    {
      id: "field-team-orders",
      label: "Field Team Orders",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M13.7497 0.833252C10.7581 0.833252 8.33299 3.25838 8.33299 6.24992C8.33299 6.58964 8.36437 6.92276 8.42459 7.24633L5.83303 4.65476V2.49994C5.83303 2.14125 5.60351 1.8228 5.26322 1.70937L2.76322 0.876038C2.46377 0.776223 2.13363 0.854159 1.91044 1.07735L1.07711 1.91069C0.853915 2.13388 0.775979 2.46402 0.875794 2.76346L1.70913 5.26346C1.82256 5.60375 2.14101 5.83327 2.4997 5.83327H4.65452L7.57115 8.74991L2.32707 13.994C1.31128 15.0098 1.31128 16.6567 2.32707 17.6725C3.34286 18.6883 4.98979 18.6883 6.00558 17.6725L9.99971 13.6784L13.9938 17.6724C15.0095 18.6882 16.6565 18.6882 17.6723 17.6724C18.6881 16.6566 18.688 15.0097 17.6722 13.9939L15.1596 11.4813C17.4675 10.8608 19.1663 8.75375 19.1663 6.24992C19.1663 5.71818 19.0895 5.20294 18.9457 4.71544C18.8625 4.43345 18.6369 4.21614 18.352 4.1436C18.0671 4.07106 17.765 4.15403 17.5571 4.36192L15.9021 6.00792C15.7007 6.20816 15.6 6.30828 15.4937 6.36564C15.246 6.49926 14.9477 6.49885 14.7004 6.36455C14.5942 6.3069 14.4938 6.2065 14.293 6.00571C14.0922 5.80489 13.9918 5.70447 13.9341 5.59831C13.7998 5.35098 13.7994 5.05255 13.9331 4.80487C13.9905 4.69856 14.0906 4.59789 14.2909 4.39654L16.08 2.59812C16.2771 2.40103 16.3626 2.11845 16.3079 1.84516C16.2531 1.57186 16.0653 1.34404 15.8075 1.23809C15.172 0.97688 14.4765 0.833252 13.7497 0.833252Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      id: "work-orders",
      label: "Work Orders",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M13.7497 0.833252C10.7581 0.833252 8.33299 3.25838 8.33299 6.24992C8.33299 6.58964 8.36437 6.92276 8.42459 7.24633L5.83303 4.65476V2.49994C5.83303 2.14125 5.60351 1.8228 5.26322 1.70937L2.76322 0.876038C2.46377 0.776223 2.13363 0.854159 1.91044 1.07735L1.07711 1.91069C0.853915 2.13388 0.775979 2.46402 0.875794 2.76346L1.70913 5.26346C1.82256 5.60375 2.14101 5.83327 2.4997 5.83327H4.65452L7.57115 8.74991L2.32707 13.994C1.31128 15.0098 1.31128 16.6567 2.32707 17.6725C3.34286 18.6883 4.98979 18.6883 6.00558 17.6725L9.99971 13.6784L13.9938 17.6724C15.0095 18.6882 16.6565 18.6882 17.6723 17.6724C18.6881 16.6566 18.688 15.0097 17.6722 13.9939L15.1596 11.4813C17.4675 10.8608 19.1663 8.75375 19.1663 6.24992C19.1663 5.71818 19.0895 5.20294 18.9457 4.71544C18.8625 4.43345 18.6369 4.21614 18.352 4.1436C18.0671 4.07106 17.765 4.15403 17.5571 4.36192L15.9021 6.00792C15.7007 6.20816 15.6 6.30828 15.4937 6.36564C15.246 6.49926 14.9477 6.49885 14.7004 6.36455C14.5942 6.3069 14.4938 6.2065 14.293 6.00571C14.0922 5.80489 13.9918 5.70447 13.9341 5.59831C13.7998 5.35098 13.7994 5.05255 13.9331 4.80487C13.9905 4.69856 14.0906 4.59789 14.2909 4.39654L16.08 2.59812C16.2771 2.40103 16.3626 2.11845 16.3079 1.84516C16.2531 1.57186 16.0653 1.34404 15.8075 1.23809C15.172 0.97688 14.4765 0.833252 13.7497 0.833252Z"
            fill="currentColor"
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
  const tabContext = useContext(TabContext);

  if (!tabContext) {
    throw new Error("Header must be used within TabContext provider");
  }

  const { selectedTab, setSelectedTab, tabMetadata, setTabMetadata } = tabContext;

  // Map section IDs to their parent category icons
  const getIconForSection = (sectionId?: string) => {
    const sectionIconMap: Record<string, React.ReactNode> = {
      // Properties sections
      "all-properties": (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6.25033 9.16667H3.83366C3.36695 9.16667 3.13359 9.16667 2.95533 9.25749C2.79853 9.33739 2.67105 9.46487 2.59115 9.62167C2.50033 9.79993 2.50033 10.0333 2.50033 10.5V17.5M13.7503 9.16667H16.167C16.6337 9.16667 16.8671 9.16667 17.0453 9.25749C17.2021 9.33739 17.3296 9.46487 17.4095 9.62167C17.5003 9.79993 17.5003 10.0333 17.5003 10.5V17.5M13.7503 17.5V5.16667C13.7503 4.23325 13.7503 3.76654 13.5687 3.41002C13.4089 3.09641 13.1539 2.84144 12.8403 2.68166C12.4838 2.5 12.0171 2.5 11.0837 2.5H8.91699C7.98357 2.5 7.51686 2.5 7.16034 2.68166C6.84674 2.84144 6.59177 3.09641 6.43198 3.41002C6.25033 3.76654 6.25033 4.23325 6.25033 5.16667V17.5M18.3337 17.5H1.66699M9.16699 5.83333H10.8337M9.16699 9.16667H10.8337M9.16699 12.5H10.8337" />
        </svg>
      ),
      // Accounting sections
      bills: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5833 5.41667L5.41667 14.5833M7.08333 8.75V5.41667M5.41667 7.08333H8.75M11.25 12.9167H14.5833M6.5 17.5H13.5C14.9001 17.5 15.6002 17.5 16.135 17.2275C16.6054 16.9878 16.9878 16.6054 17.2275 16.135C17.5 15.6002 17.5 14.9001 17.5 13.5V6.5C17.5 5.09987 17.5 4.3998 17.2275 3.86502C16.9878 3.39462 16.6054 3.01217 16.135 2.77248C15.6002 2.5 14.9001 2.5 13.5 2.5H6.5C5.09987 2.5 4.3998 2.5 3.86502 2.77248C3.39462 3.01217 3.01217 3.39462 2.77248 3.86502C2.5 4.3998 2.5 5.09987 2.5 6.5V13.5C2.5 14.9001 2.5 15.6002 2.77248 16.135C3.01217 16.6054 3.39462 16.9878 3.86502 17.2275C4.3998 17.5 5.09987 17.5 6.5 17.5Z" />
        </svg>
      ),
      // Maintenance sections
      "all-tasks": (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M13.7497 0.833252C10.7581 0.833252 8.33299 3.25838 8.33299 6.24992C8.33299 6.58964 8.36437 6.92276 8.42459 7.24633L5.83303 4.65476V2.49994C5.83303 2.14125 5.60351 1.8228 5.26322 1.70937L2.76322 0.876038C2.46377 0.776223 2.13363 0.854159 1.91044 1.07735L1.07711 1.91069C0.853915 2.13388 0.775979 2.46402 0.875794 2.76346L1.70913 5.26346C1.82256 5.60375 2.14101 5.83327 2.4997 5.83327H4.65452L7.57115 8.74991L2.32707 13.994C1.31128 15.0098 1.31128 16.6567 2.32707 17.6725C3.34286 18.6883 4.98979 18.6883 6.00558 17.6725L9.99971 13.6784L13.9938 17.6724C15.0095 18.6882 16.6565 18.6882 17.6723 17.6724C18.6881 16.6566 18.688 15.0097 17.6722 13.9939L15.1596 11.4813C17.4675 10.8608 19.1663 8.75375 19.1663 6.24992C19.1663 5.71818 19.0895 5.20294 18.9457 4.71544C18.8625 4.43345 18.6369 4.21614 18.352 4.1436C18.0671 4.07106 17.765 4.15403 17.5571 4.36192L15.9021 6.00792C15.7007 6.20816 15.6 6.30828 15.4937 6.36564C15.246 6.49926 14.9477 6.49885 14.7004 6.36455C14.5942 6.3069 14.4938 6.2065 14.293 6.00571C14.0922 5.80489 13.9918 5.70447 13.9341 5.59831C13.7998 5.35098 13.7994 5.05255 13.9331 4.80487C13.9905 4.69856 14.0906 4.59789 14.2909 4.39654L16.08 2.59812C16.2771 2.40103 16.3626 2.11845 16.3079 1.84516C16.2531 1.57186 16.0653 1.34404 15.8075 1.23809C15.172 0.97688 14.4765 0.833252 13.7497 0.833252Z"
            fill="currentColor"
          />
        </svg>
      ),
      "recurring-tasks": (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M13.7497 0.833252C10.7581 0.833252 8.33299 3.25838 8.33299 6.24992C8.33299 6.58964 8.36437 6.92276 8.42459 7.24633L5.83303 4.65476V2.49994C5.83303 2.14125 5.60351 1.8228 5.26322 1.70937L2.76322 0.876038C2.46377 0.776223 2.13363 0.854159 1.91044 1.07735L1.07711 1.91069C0.853915 2.13388 0.775979 2.46402 0.875794 2.76346L1.70913 5.26346C1.82256 5.60375 2.14101 5.83327 2.4997 5.83327H4.65452L7.57115 8.74991L2.32707 13.994C1.31128 15.0098 1.31128 16.6567 2.32707 17.6725C3.34286 18.6883 4.98979 18.6883 6.00558 17.6725L9.99971 13.6784L13.9938 17.6724C15.0095 18.6882 16.6565 18.6882 17.6723 17.6724C18.6881 16.6566 18.688 15.0097 17.6722 13.9939L15.1596 11.4813C17.4675 10.8608 19.1663 8.75375 19.1663 6.24992C19.1663 5.71818 19.0895 5.20294 18.9457 4.71544C18.8625 4.43345 18.6369 4.21614 18.352 4.1436C18.0671 4.07106 17.765 4.15403 17.5571 4.36192L15.9021 6.00792C15.7007 6.20816 15.6 6.30828 15.4937 6.36564C15.246 6.49926 14.9477 6.49885 14.7004 6.36455C14.5942 6.3069 14.4938 6.2065 14.293 6.00571C14.0922 5.80489 13.9918 5.70447 13.9341 5.59831C13.7998 5.35098 13.7994 5.05255 13.9331 4.80487C13.9905 4.69856 14.0906 4.59789 14.2909 4.39654L16.08 2.59812C16.2771 2.40103 16.3626 2.11845 16.3079 1.84516C16.2531 1.57186 16.0653 1.34404 15.8075 1.23809C15.172 0.97688 14.4765 0.833252 13.7497 0.833252Z"
            fill="currentColor"
          />
        </svg>
      ),
      "field-team-orders": (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M13.7497 0.833252C10.7581 0.833252 8.33299 3.25838 8.33299 6.24992C8.33299 6.58964 8.36437 6.92276 8.42459 7.24633L5.83303 4.65476V2.49994C5.83303 2.14125 5.60351 1.8228 5.26322 1.70937L2.76322 0.876038C2.46377 0.776223 2.13363 0.854159 1.91044 1.07735L1.07711 1.91069C0.853915 2.13388 0.775979 2.46402 0.875794 2.76346L1.70913 5.26346C1.82256 5.60375 2.14101 5.83327 2.4997 5.83327H4.65452L7.57115 8.74991L2.32707 13.994C1.31128 15.0098 1.31128 16.6567 2.32707 17.6725C3.34286 18.6883 4.98979 18.6883 6.00558 17.6725L9.99971 13.6784L13.9938 17.6724C15.0095 18.6882 16.6565 18.6882 17.6723 17.6724C18.6881 16.6566 18.688 15.0097 17.6722 13.9939L15.1596 11.4813C17.4675 10.8608 19.1663 8.75375 19.1663 6.24992C19.1663 5.71818 19.0895 5.20294 18.9457 4.71544C18.8625 4.43345 18.6369 4.21614 18.352 4.1436C18.0671 4.07106 17.765 4.15403 17.5571 4.36192L15.9021 6.00792C15.7007 6.20816 15.6 6.30828 15.4937 6.36564C15.246 6.49926 14.9477 6.49885 14.7004 6.36455C14.5942 6.3069 14.4938 6.2065 14.293 6.00571C14.0922 5.80489 13.9918 5.70447 13.9341 5.59831C13.7998 5.35098 13.7994 5.05255 13.9331 4.80487C13.9905 4.69856 14.0906 4.59789 14.2909 4.39654L16.08 2.59812C16.2771 2.40103 16.3626 2.11845 16.3079 1.84516C16.2531 1.57186 16.0653 1.34404 15.8075 1.23809C15.172 0.97688 14.4765 0.833252 13.7497 0.833252Z"
            fill="currentColor"
          />
        </svg>
      ),
      "work-orders": (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M13.7497 0.833252C10.7581 0.833252 8.33299 3.25838 8.33299 6.24992C8.33299 6.58964 8.36437 6.92276 8.42459 7.24633L5.83303 4.65476V2.49994C5.83303 2.14125 5.60351 1.8228 5.26322 1.70937L2.76322 0.876038C2.46377 0.776223 2.13363 0.854159 1.91044 1.07735L1.07711 1.91069C0.853915 2.13388 0.775979 2.46402 0.875794 2.76346L1.70913 5.26346C1.82256 5.60375 2.14101 5.83327 2.4997 5.83327H4.65452L7.57115 8.74991L2.32707 13.994C1.31128 15.0098 1.31128 16.6567 2.32707 17.6725C3.34286 18.6883 4.98979 18.6883 6.00558 17.6725L9.99971 13.6784L13.9938 17.6724C15.0095 18.6882 16.6565 18.6882 17.6723 17.6724C18.6881 16.6566 18.688 15.0097 17.6722 13.9939L15.1596 11.4813C17.4675 10.8608 19.1663 8.75375 19.1663 6.24992C19.1663 5.71818 19.0895 5.20294 18.9457 4.71544C18.8625 4.43345 18.6369 4.21614 18.352 4.1436C18.0671 4.07106 17.765 4.15403 17.5571 4.36192L15.9021 6.00792C15.7007 6.20816 15.6 6.30828 15.4937 6.36564C15.246 6.49926 14.9477 6.49885 14.7004 6.36455C14.5942 6.3069 14.4938 6.2065 14.293 6.00571C14.0922 5.80489 13.9918 5.70447 13.9341 5.59831C13.7998 5.35098 13.7994 5.05255 13.9331 4.80487C13.9905 4.69856 14.0906 4.59789 14.2909 4.39654L16.08 2.59812C16.2771 2.40103 16.3626 2.11845 16.3079 1.84516C16.2531 1.57186 16.0653 1.34404 15.8075 1.23809C15.172 0.97688 14.4765 0.833252 13.7497 0.833252Z"
            fill="currentColor"
          />
        </svg>
      ),
    };
    return sectionIconMap[sectionId || ""] || null;
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
    const newTab: Tab = {
      id: newTabId,
      label: "New Tab",
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
          <path d="M12 5v14M5 12h14" />
        </svg>
      ),
    };

    setTabs([...tabs, newTab]);
    setOpenTabs(new Set([...openTabs, newTabId]));
    setSelectedTab(newTabId);
    tabContext.setTabMetadata(newTabId, { label: "New Tab" });
    setNextNewTabId(nextNewTabId + 1);
    navigate("/");
  };

  return (
    <header className="bg-white">
      {/* Tabs Section */}
      <div
        className="flex items-center gap-0 px-0 py-0 bg-[#f7f7f7]"
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
            const sectionId = metadata?.sectionId || (!tab.id.startsWith("new-tab-") ? tab.id : undefined);
            const sectionIcon = getIconForSection(sectionId);
            const displayIcon = sectionIcon || tab.icon;
            return (
              <div
                key={tab.id}
                className="flex items-center transition-all whitespace-nowrap"
                style={{
                  backgroundColor: isSelected
                    ? "rgba(255, 255, 255, 1)"
                    : "#f7f7f7",
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
                <button
                  onClick={() => {
                    if (tab.id !== selectedTab) {
                      saveScrollPosition();
                      navigateToTabRoute(tab.id);
                    }
                    setSelectedTab(tab.id);
                  }}
                  className="flex items-center gap-2"
                >
                  <span className="flex items-center justify-center w-5 h-5">
                    {displayIcon}
                  </span>
                  <span
                    className="text-sm font-medium text-[#303030]"
                    style={{
                      fontFamily:
                        "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                      lineHeight: "24px",
                    }}
                  >
                    {displayLabel}
                  </span>
                </button>
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

      {/* Navigation & Search Section */}
      <div
        className="flex items-center justify-between px-6 py-4 gap-6"
        style={{
          borderColor: "rgb(210, 209, 207)",
          borderWidth: "1px",
          borderRightWidth: "0px",
          borderBottomWidth: "1px",
        }}
      >
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

        {/* Search and Actions */}
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
              className={isCurrentPageFavorite ? "text-yellow-500" : "text-gray-700"}
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
        </div>
      </div>
    </header>
  );
}
