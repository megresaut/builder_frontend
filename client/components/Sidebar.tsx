import React, { useState, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { TabContext } from "@/hooks/useTabContext";
import { useFavorites } from "@/hooks/FavoritesContext";

interface SidebarItem {
  id: string;
  label: string;
  iconLight: React.ReactNode;
  iconDark: React.ReactNode;
  hasSubmenu?: boolean;
}

export default function Sidebar() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set([]));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { favorites, removeFavorite } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();

  // Detect screen size changes
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Determine which section is currently active based on the pathname
  const getActiveSection = (): string | null => {
    const path = location.pathname;
    if (path === "/all-properties" || path === "/") return "properties";
    if (path === "/bills") return "accounting";
    if (
      path.includes("/all-tasks") ||
      path.includes("/recurring-tasks") ||
      path.includes("/field-team-orders") ||
      path.includes("/work-orders")
    ) {
      return "maintenance";
    }
    return null;
  };

  const activeSection = getActiveSection();

  // Determine which icon to show (dark when expanded or active)
  const getIcon = (item: SidebarItem): React.ReactNode => {
    const isExpanded = expandedItems.has(item.id);
    const isActive = activeSection === item.id;
    return isExpanded || isActive ? item.iconDark : item.iconLight;
  };

  const navigationItems: SidebarItem[] = [
    {
      id: "properties",
      label: "Properties",
      iconLight: (
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
      iconDark: (
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
            d="M11.1155 1.66675H8.88455C8.44528 1.66674 8.06627 1.66672 7.75414 1.69223C7.42469 1.71914 7.09701 1.77857 6.78169 1.93923C6.31129 2.17892 5.92883 2.56137 5.68915 3.03177C5.52849 3.34709 5.46906 3.67477 5.44214 4.00423C5.41664 4.31637 5.41665 4.69534 5.41667 5.13463L5.41667 8.33342L3.80674 8.33342C3.59643 8.33339 3.39161 8.33337 3.21815 8.34754C3.02765 8.36311 2.80287 8.39983 2.57669 8.51508C2.26308 8.67486 2.00811 8.92983 1.84833 9.24344C1.73308 9.46962 1.69635 9.6944 1.68079 9.8849C1.66662 10.0584 1.66664 10.2632 1.66667 10.4735L1.66667 16.6667C1.20643 16.6667 0.833332 17.0398 0.833332 17.5001C0.833332 17.9603 1.20643 18.3334 1.66667 18.3334H2.49768L2.5 18.3334L2.50233 18.3334H17.4977L17.5 18.3334L17.5023 18.3334H18.3333C18.7936 18.3334 19.1667 17.9603 19.1667 17.5001C19.1667 17.0398 18.7936 16.6667 18.3333 16.6667L18.3333 10.4734C18.3334 10.2631 18.3334 10.0583 18.3192 9.8849C18.3036 9.6944 18.2669 9.46962 18.1517 9.24344C17.9919 8.92983 17.7369 8.67486 17.4233 8.51508C17.1971 8.39983 16.9724 8.36311 16.7819 8.34754C16.6084 8.33337 16.4036 8.33339 16.1932 8.33342L14.5833 8.33342V5.13453C14.5833 4.69529 14.5834 4.31634 14.5579 4.00423C14.5309 3.67477 14.4715 3.34709 14.3109 3.03177C14.0712 2.56137 13.6887 2.17892 13.2183 1.93923C12.903 1.77857 12.5753 1.71914 12.2459 1.69223C11.9337 1.66672 11.5547 1.66674 11.1155 1.66675ZM8.33333 5.83342C8.33333 5.37318 8.70643 5.00008 9.16667 5.00008H10.8333C11.2936 5.00008 11.6667 5.37318 11.6667 5.83342C11.6667 6.29365 11.2936 6.66675 10.8333 6.66675H9.16667C8.70643 6.66675 8.33333 6.29365 8.33333 5.83342ZM8.33333 9.16675C8.33333 8.70651 8.70643 8.33342 9.16667 8.33342H10.8333C11.2936 8.33342 11.6667 8.70651 11.6667 9.16675C11.6667 9.62699 11.2936 10.0001 10.8333 10.0001H9.16667C8.70643 10.0001 8.33333 9.62699 8.33333 9.16675ZM8.33333 12.5001C8.33333 12.0398 8.70643 11.6667 9.16667 11.6667H10.8333C11.2936 11.6667 11.6667 12.0398 11.6667 12.5001C11.6667 12.9603 11.2936 13.3334 10.8333 13.3334H9.16667C8.70643 13.3334 8.33333 12.9603 8.33333 12.5001Z"
            fill="#303030"
          />
        </svg>
      ),
      hasSubmenu: true,
    },
    {
      id: "accounting",
      label: "Accounting",
      iconLight: (
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
      iconDark: (
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
            stroke="#303030"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      hasSubmenu: true,
    },
    {
      id: "maintenance",
      label: "Maintenance",
      iconLight: (
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
      iconDark: (
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
      hasSubmenu: true,
    },
  ];

  const submenuMap: Record<
    string,
    Array<{ label: string; path?: string; sectionId?: string }>
  > = {
    dashboard: [],
    properties: [
      {
        label: "All Properties",
        path: "/all-properties",
        sectionId: "all-properties",
      },
    ],
    screening: [],
    leases: [],
    accounting: [{ label: "Bills", path: "/bills", sectionId: "bills" }],
    maintenance: [
      {
        label: "All Tasks",
        path: "/all-tasks",
        sectionId: "all-tasks",
      },
      {
        label: "Recurring Tasks",
        path: "/recurring-tasks",
        sectionId: "recurring-tasks",
      },
      {
        label: "Field Team Orders",
        path: "/field-team-orders",
        sectionId: "field-team-orders",
      },
      {
        label: "Work Orders",
        path: "/work-orders",
        sectionId: "work-orders",
      },
    ],
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleIconClick = (id: string) => {
    if (submenuMap[id]) {
      setActiveDropdown(activeDropdown === id ? null : id);
      toggleExpanded(id);
    }
  };

  const tabContext = useContext(TabContext);

  const handleNavigation = (
    label: string,
    sectionId?: string,
    path?: string,
  ) => {
    if (tabContext) {
      if (tabContext.selectedTab.startsWith("new-tab-") && sectionId) {
        tabContext.setTabMetadata(tabContext.selectedTab, {
          label,
          sectionId,
          route: path,
          scrollPosition: 0,
        });
      } else if (sectionId) {
        tabContext.setTabMetadata(sectionId, {
          label,
          sectionId,
          route: path,
          scrollPosition: 0,
        });
        tabContext.setSelectedTab(sectionId);
      }
    }
  };

  // Desktop: show expanded sidebar on hover with left edge trigger
  if (!isMobile) {
    const isExpanded = isHovered || isPinned;

    return (
      <div
        className="relative h-screen flex-shrink-0 transition-all"
        style={{ width: isExpanded ? "262px" : "0px" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          if (!isPinned) {
            setIsHovered(false);
            setActiveDropdown(null);
          }
        }}
      >
        <div
          className="fixed left-0 top-0 h-screen w-16 z-10"
          onMouseEnter={() => setIsHovered(true)}
          style={{ cursor: "default" }}
        />

        <aside
          className={`bg-gray-50 border-r absolute left-0 top-0 h-screen flex flex-col justify-between z-20 ${
            isExpanded
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          style={{
            width: "262px",
            padding: "20px",
            transition: "opacity 0.3s ease",
            borderRightColor: "transparent",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            if (!isPinned) {
              setIsHovered(false);
              setActiveDropdown(null);
            }
          }}
        >
          <div className="flex flex-col">
            <div
              className="flex items-center justify-between"
              style={{ marginBottom: "24px" }}
            >
              <div className="flex items-center gap-2">
                <img
                  alt="AVM Logo"
                  src="https://cdn.builder.io/api/v1/image/assets%2Fba2f0cd1a4c64ebda0865daf8dd0ff2a%2F72e0b6d48d514377b9ff522722ec83c2?format=webp&width=800"
                  className="w-8 h-8"
                />
                <span className="text-xl font-semibold text-gray-900">AVM</span>
              </div>
              <button
                onClick={() => setIsPinned(!isPinned)}
                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {isPinned ? (
                    <>
                      <path d="M4 7h16M9 4v4M15 4v4M6 11v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-9M9 14h6M9 18h6" />
                    </>
                  ) : (
                    <path d="M10.5 1.5H3.75A2.25 2.25 0 0 0 1.5 3.75V20.25A2.25 2.25 0 0 0 3.75 22.5H20.25A2.25 2.25 0 0 0 22.5 20.25V13.5M16.5 6L8.25 14.25M8.25 6L16.5 14.25" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="flex flex-col">
              <div
                className="flex flex-col gap-1.5"
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {navigationItems.map((item) => (
                  <div key={item.id}>
                    <button
                      onClick={() => item.hasSubmenu && toggleExpanded(item.id)}
                      className="w-full flex items-center justify-between px-3 rounded-lg hover:bg-white transition-colors text-gray-700 text-base"
                      style={{ minHeight: "38px" }}
                    >
                      <div className="flex items-center gap-2 flex-1 text-left min-w-0">
                        <span className="flex items-center justify-center flex-shrink-0">
                          {getIcon(item)}
                        </span>
                        <span className="font-normal whitespace-nowrap overflow-hidden text-ellipsis">
                          {item.label}
                        </span>
                      </div>
                      {item.hasSubmenu && expandedItems.has(item.id) && (
                        <svg
                          className="w-4 h-4 text-gray-900"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 9l6 6 6-6"
                          />
                        </svg>
                      )}
                    </button>

                    {item.hasSubmenu && expandedItems.has(item.id) && (
                      <div className="ml-6 mt-1 flex flex-col gap-0">
                        {(submenuMap[item.id] || []).map((subitem, idx) => (
                          <Link
                            key={idx}
                            to={subitem.path!}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white transition-colors text-gray-600 text-sm h-10 whitespace-nowrap"
                            onClick={() => {
                              handleNavigation(
                                subitem.label,
                                subitem.sectionId,
                                subitem.path,
                              );
                              setIsHovered(false);
                              setActiveDropdown(null);
                            }}
                          >
                            <div className="flex items-center h-full">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                            </div>
                            <span className="text-sm">{subitem.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div
                className="h-px bg-gray-300"
                style={{ marginTop: "16px" }}
              ></div>

              <div
                className="flex flex-col"
                style={{ marginTop: "16px", gap: "4px" }}
              >
                <div
                  className="flex items-center justify-between px-3"
                  style={{ minHeight: "36px" }}
                >
                  <span className="text-sm font-medium text-gray-700">
                    Favorites
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="p-0 text-gray-600 hover:text-gray-900">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="19" cy="12" r="1" />
                        <circle cx="5" cy="12" r="1" />
                      </svg>
                    </button>
                  </div>
                </div>
                {favorites.length === 0 ? (
                  <div
                    className="px-3 py-2 text-sm text-gray-500"
                    style={{ minHeight: "38px" }}
                  >
                    Click the star icon on any page to add favorites
                  </div>
                ) : (
                  favorites.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 text-base"
                      style={{ minHeight: "38px" }}
                    >
                      <button
                        onClick={() => navigate(item.path)}
                        className="flex-1 text-left truncate bg-transparent border-none p-0 hover:opacity-80 cursor-pointer"
                      >
                        {item.label}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFavorite(item.id);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col" style={{ gap: "16px" }}>
            <div
              className="flex flex-col"
              style={{ paddingTop: "16px", paddingBottom: "16px", gap: "6px" }}
            >
              <button
                className="flex items-center gap-2 px-3 rounded-lg hover:bg-white transition-colors text-gray-700 text-base"
                style={{ minHeight: "38px" }}
              >
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
                  <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>Settings</span>
              </button>
              <button
                className="flex items-center gap-2 px-3 rounded-lg hover:bg-white transition-colors text-gray-700 text-base"
                style={{ minHeight: "38px" }}
              >
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
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
                <span>Help Center</span>
              </button>
            </div>

            <div
              className="flex items-center justify-between rounded-lg border border-gray-300 bg-white"
              style={{ padding: "8px 12px 8px 8px", gap: "35px" }}
            >
              <div className="flex items-center gap-2">
                <img
                  alt="User avatar"
                  src="https://api.builder.io/api/v1/image/assets/TEMP/2566780a27c3990d201697798765d924dce1c93a?width=80"
                  className="w-10 h-10 rounded"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">
                    Roger Botosh
                  </span>
                  <span className="text-xs text-gray-600">Admin</span>
                </div>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-700 flex-shrink-0"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </aside>
      </div>
    );
  }

  // Mobile: show collapsed sidebar with hover behavior
  if (isCollapsed) {
    return (
      <div
        className="relative h-screen flex-shrink-0 group transition-all"
        style={{ width: isHovered ? "262px" : "40px" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setActiveDropdown(null);
        }}
      >
        <aside
          className={`bg-[#F7F7F7] absolute left-0 top-0 h-screen flex flex-col justify-between z-10 ${
            isHovered ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{
            width: "30px",
            padding: "20px 0px",
            transition: "opacity 0.3s ease",
            overflow: "hidden",
          }}
        >
          <div className="flex flex-col items-center gap-6">
            <img
              alt="AVM Logo"
              src="https://cdn.builder.io/api/v1/image/assets%2Fba2f0cd1a4c64ebda0865daf8dd0ff2a%2F72e0b6d48d514377b9ff522722ec83c2?format=webp&width=800"
              className="w-8 h-8"
            />
            <div className="flex flex-col items-center gap-4 w-full">
              {navigationItems.map((item) => (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => handleIconClick(item.id)}
                    className="flex w-[38px] h-[38px] justify-center items-center rounded-lg hover:bg-white transition-colors"
                  >
                    {getIcon(item)}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <aside
          className={`bg-gray-50 border-r border-gray-200 absolute left-0 top-0 h-screen flex flex-col justify-between z-20 ${
            isHovered
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          style={{
            width: "262px",
            padding: "20px",
            transition: "opacity 0.3s ease",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setActiveDropdown(null);
          }}
        >
          <div className="flex flex-col">
            <div
              className="flex items-center justify-between"
              style={{ marginBottom: "24px" }}
            >
              <div className="flex items-center gap-2">
                <img
                  alt="AVM Logo"
                  src="https://cdn.builder.io/api/v1/image/assets%2Fba2f0cd1a4c64ebda0865daf8dd0ff2a%2F72e0b6d48d514377b9ff522722ec83c2?format=webp&width=800"
                  className="w-8 h-8"
                />
                <span className="text-xl font-semibold text-gray-900">AVM</span>
              </div>
              <button
                onClick={() => {
                  setIsCollapsed(false);
                  setActiveDropdown(null);
                }}
                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="#919191"
                  strokeWidth="1.5"
                >
                  <path
                    d="M7.5 2.5V17.5M6.5 2.5H13.5C14.9001 2.5 15.6002 2.5 16.135 2.77248C16.6054 3.01217 16.9878 3.39462 17.2275 3.86502C17.5 4.3998 17.5 5.09987 17.5 6.5V13.5C17.5 14.9001 17.5 15.6002 17.2275 16.135C16.9878 16.6054 16.6054 16.9878 16.135 17.2275C15.6002 17.5 14.9001 17.5 13.5 17.5H6.5C5.09987 17.5 4.3998 17.5 3.86502 17.2275C3.39462 16.9878 3.01217 16.6054 2.77248 16.135C2.5 15.6002 2.5 14.9001 2.5 13.5V6.5C2.5 5.09987 2.5 4.3998 2.77248 3.86502C3.01217 3.39462 3.39462 3.01217 3.86502 2.77248C4.3998 2.5 5.09987 2.5 6.5 2.5Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="flex flex-col">
              <div
                className="flex flex-col gap-1.5"
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {navigationItems.map((item) => (
                  <div key={item.id}>
                    <button
                      onClick={() => item.hasSubmenu && toggleExpanded(item.id)}
                      className="w-full flex items-center justify-between px-3 rounded-lg hover:bg-white transition-colors text-gray-700 text-base"
                      style={{ minHeight: "38px" }}
                    >
                      <div className="flex items-center gap-2 flex-1 text-left min-w-0">
                        <span className="flex items-center justify-center flex-shrink-0">
                          {getIcon(item)}
                        </span>
                        <span className="font-normal whitespace-nowrap overflow-hidden text-ellipsis">
                          {item.label}
                        </span>
                      </div>
                      {item.hasSubmenu && expandedItems.has(item.id) && (
                        <svg
                          className="w-4 h-4 text-gray-900"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 9l6 6 6-6"
                          />
                        </svg>
                      )}
                    </button>

                    {item.hasSubmenu && expandedItems.has(item.id) && (
                      <div className="ml-6 mt-1 flex flex-col gap-0">
                        {(submenuMap[item.id] || []).map((subitem, idx) => (
                          <Link
                            key={idx}
                            to={subitem.path!}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white transition-colors text-gray-600 text-sm h-10 whitespace-nowrap"
                            onClick={() => {
                              handleNavigation(
                                subitem.label,
                                subitem.sectionId,
                                subitem.path,
                              );
                              setIsHovered(false);
                              setActiveDropdown(null);
                            }}
                          >
                            <div className="flex items-center h-full">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                            </div>
                            <span className="text-sm">{subitem.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div
                className="h-px bg-gray-300"
                style={{ marginTop: "16px" }}
              ></div>

              <div
                className="flex flex-col"
                style={{ marginTop: "16px", gap: "4px" }}
              >
                <div
                  className="flex items-center justify-between px-3"
                  style={{ minHeight: "36px" }}
                >
                  <span className="text-sm font-medium text-gray-700">
                    Favorites
                  </span>
                </div>
                {favorites.length === 0 ? (
                  <div
                    className="px-3 py-2 text-sm text-gray-500"
                    style={{ minHeight: "38px" }}
                  >
                    Click the star icon on any page to add favorites
                  </div>
                ) : (
                  favorites.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 text-base"
                      style={{ minHeight: "38px" }}
                    >
                      <button
                        onClick={() => navigate(item.path)}
                        className="flex-1 text-left truncate bg-transparent border-none p-0 hover:opacity-80 cursor-pointer"
                      >
                        {item.label}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFavorite(item.id);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col" style={{ gap: "16px" }}>
            <div
              className="flex flex-col"
              style={{ paddingTop: "16px", paddingBottom: "16px", gap: "6px" }}
            >
              <button
                className="flex items-center gap-2 px-3 rounded-lg hover:bg-white transition-colors text-gray-700 text-base"
                style={{ minHeight: "38px" }}
              >
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
                  <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>Settings</span>
              </button>
              <button
                className="flex items-center gap-2 px-3 rounded-lg hover:bg-white transition-colors text-gray-700 text-base"
                style={{ minHeight: "38px" }}
              >
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
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
                <span>Help Center</span>
              </button>
            </div>

            <div
              className="flex items-center justify-between rounded-lg border border-gray-300 bg-white"
              style={{ padding: "8px 12px 8px 8px", gap: "35px" }}
            >
              <div className="flex items-center gap-2">
                <img
                  alt="User avatar"
                  src="https://api.builder.io/api/v1/image/assets/TEMP/2566780a27c3990d201697798765d924dce1c93a?width=80"
                  className="w-10 h-10 rounded"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">
                    Roger Botosh
                  </span>
                  <span className="text-xs text-gray-600">Admin</span>
                </div>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-700 flex-shrink-0"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </aside>
      </div>
    );
  }

  // Mobile expanded sidebar (not collapsed)
  return (
    <aside
      className="bg-gray-50 flex flex-col h-screen justify-between transition-all duration-300"
      style={{ width: "262px", padding: "20px" }}
    >
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: "24px" }}
      >
        <div className="flex items-center gap-2">
          <img
            alt="AVM Logo"
            src="https://cdn.builder.io/api/v1/image/assets%2Fba2f0cd1a4c64ebda0865daf8dd0ff2a%2F72e0b6d48d514377b9ff522722ec83c2?format=webp&width=800"
            className="w-8 h-8"
          />
          <span className="text-xl font-semibold text-gray-900">AVM</span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-0.5 hover:bg-gray-200 rounded transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="#919191"
            strokeWidth="1.5"
          >
            <path
              d="M7.5 2.5V17.5M6.5 2.5H13.5C14.9001 2.5 15.6002 2.5 16.135 2.77248C16.6054 3.01217 16.9878 3.39462 17.2275 3.86502C17.5 4.3998 17.5 5.09987 17.5 6.5V13.5C17.5 14.9001 17.5 15.6002 17.2275 16.135C16.9878 16.6054 16.6054 16.9878 16.135 17.2275C15.6002 17.5 14.9001 17.5 13.5 17.5H6.5C5.09987 17.5 4.3998 17.5 3.86502 17.2275C3.39462 16.9878 3.01217 16.6054 2.77248 16.135C2.5 15.6002 2.5 14.9001 2.5 13.5V6.5C2.5 5.09987 2.5 4.3998 2.77248 3.86502C3.01217 3.39462 3.39462 3.01217 3.86502 2.77248C4.3998 2.5 5.09987 2.5 6.5 2.5Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col">
          <div className="flex flex-col gap-1.5">
            {navigationItems.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => item.hasSubmenu && toggleExpanded(item.id)}
                  className="w-full flex items-center justify-between px-3 rounded-lg hover:bg-white transition-colors text-gray-700 text-base"
                  style={{ minHeight: "38px" }}
                >
                  <div className="flex items-center gap-2 flex-1 text-left min-w-0">
                    <span className="flex items-center justify-center flex-shrink-0">
                      {getIcon(item)}
                    </span>
                    <span className="font-normal whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.label}
                    </span>
                  </div>
                  {item.hasSubmenu && expandedItems.has(item.id) && (
                    <svg
                      className="w-4 h-4 text-gray-900"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 9l6 6 6-6"
                      />
                    </svg>
                  )}
                </button>

                {item.hasSubmenu && expandedItems.has(item.id) && (
                  <div className="ml-6 mt-1 flex flex-col gap-0">
                    {(submenuMap[item.id] || []).map((subitem, idx) => (
                      <Link
                        key={idx}
                        to={subitem.path!}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white transition-colors text-gray-600 text-sm h-10 whitespace-nowrap"
                        onClick={() =>
                          handleNavigation(
                            subitem.label,
                            subitem.sectionId,
                            subitem.path,
                          )
                        }
                      >
                        <div className="flex items-center h-full">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                        </div>
                        <span className="text-sm">{subitem.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="h-px bg-gray-300" style={{ marginTop: "16px" }}></div>

          <div
            className="flex flex-col"
            style={{ marginTop: "16px", gap: "4px" }}
          >
            <div
              className="flex items-center justify-between px-3"
              style={{ minHeight: "36px" }}
            >
              <span className="text-sm font-medium text-gray-700">
                Favorites
              </span>
              <div className="flex items-center gap-2">
                <button className="p-0 text-gray-600 hover:text-gray-900">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                  </svg>
                </button>
              </div>
            </div>
            {favorites.length === 0 ? (
              <div
                className="px-3 py-2 text-sm text-gray-500"
                style={{ minHeight: "38px" }}
              >
                Click the star icon on any page to add favorites
              </div>
            ) : (
              favorites.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 text-base"
                  style={{ minHeight: "38px" }}
                >
                  <button
                    onClick={() => navigate(item.path)}
                    className="flex-1 text-left truncate bg-transparent border-none p-0 hover:opacity-80 cursor-pointer"
                  >
                    {item.label}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(item.id);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col" style={{ gap: "16px" }}>
        <div
          className="flex flex-col"
          style={{ paddingTop: "16px", paddingBottom: "16px", gap: "6px" }}
        >
          <button
            className="flex items-center gap-2 px-3 rounded-lg hover:bg-white transition-colors text-gray-700 text-base"
            style={{ minHeight: "38px" }}
          >
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
              <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>Settings</span>
          </button>
          <button
            className="flex items-center gap-2 px-3 rounded-lg hover:bg-white transition-colors text-gray-700 text-base"
            style={{ minHeight: "38px" }}
          >
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
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
            <span>Help Center</span>
          </button>
        </div>

        <div
          className="flex items-center justify-between rounded-lg border border-gray-300 bg-white"
          style={{ padding: "8px 12px 8px 8px", gap: "35px" }}
        >
          <div className="flex items-center gap-2">
            <img
              alt="User avatar"
              src="https://api.builder.io/api/v1/image/assets/TEMP/2566780a27c3990d201697798765d924dce1c93a?width=80"
              className="w-10 h-10 rounded"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900">
                Roger Botosh
              </span>
              <span className="text-xs text-gray-600">Admin</span>
            </div>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-700 flex-shrink-0"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </aside>
  );
}
