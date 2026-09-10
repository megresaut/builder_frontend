import { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { TabContext } from "@/hooks/useTabContext";
import { useFavorites } from "@/hooks/FavoritesContext";
import { useAuth } from "@/auth/useAuth";
import { fetchJSON } from "@/api/fetchJSON";
import { logoutRequest } from "@/api/auth";
import { ChevronDownIcon, CloseIcon, StarIcon } from "@/components/icons";
import NavLayoutToggle from "@/components/NavLayoutToggle";
import { useNavLayoutMode } from "@/hooks/useNavLayoutMode";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  hasSubmenu?: boolean;
}

interface SubmenuEntry {
  label: string;
  path?: string;
  sectionId?: string;
}

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 10L10 3.333 17.5 10v6.667c0 .368-.14.72-.39.97-.25.25-.603.39-.971.39H3.86c-.368 0-.72-.14-.97-.39a1.372 1.372 0 0 1-.39-.97V10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.5 17.5v-5h5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PropertiesNavIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6.25 9.16667H3.83334C3.36663 9.16667 3.13327 9.16667 2.95501 9.25749C2.79821 9.33739 2.67073 9.46487 2.59083 9.62167C2.50001 9.79993 2.50001 10.0333 2.50001 10.5V17.5M13.75 9.16667H16.1667C16.6334 9.16667 16.8667 9.16667 17.045 9.25749C17.2018 9.33739 17.3293 9.46487 17.4092 9.62167C17.5 9.79993 17.5 10.0333 17.5 10.5V17.5M13.75 17.5V5.16667C13.75 4.23325 13.75 3.76654 13.5683 3.41002C13.4086 3.09641 13.1536 2.84144 12.84 2.68166C12.4835 2.5 12.0168 2.5 11.0833 2.5H8.91667C7.98325 2.5 7.51654 2.5 7.16002 2.68166C6.84642 2.84144 6.59145 3.09641 6.43166 3.41002C6.25001 3.76654 6.25 4.23325 6.25 5.16667V17.5M18.3333 17.5H1.66667M9.16667 5.83333H10.8333M9.16667 9.16667H10.8333M9.16667 12.5H10.8333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const AccountingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14.5833 5.41667L5.41667 14.5833M7.08333 8.75V5.41667M5.41667 7.08333H8.75M11.25 12.9167H14.5833M6.5 17.5H13.5C14.9001 17.5 15.6002 17.5 16.135 17.2275C16.6054 16.9878 16.9878 16.6054 17.2275 16.135C17.5 15.6002 17.5 14.9001 17.5 13.5V6.5C17.5 5.09987 17.5 4.3998 17.2275 3.86502C16.9878 3.39462 16.6054 3.01217 16.135 2.77248C15.6002 2.5 14.9001 2.5 13.5 2.5H6.5C5.09987 2.5 4.3998 2.5 3.86502 2.77248C3.39462 3.01217 3.01217 3.39462 2.77248 3.86502C2.5 4.3998 2.5 5.09987 2.5 6.5V13.5C2.5 14.9001 2.5 15.6002 2.77248 16.135C3.01217 16.6054 3.39462 16.9878 3.86502 17.2275C4.3998 17.5 5.09987 17.5 6.5 17.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MaintenanceIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5 5.00008L8.75 8.75008M5 5.00008H2.5L1.66667 2.50008L2.5 1.66675L5 2.50008V5.00008ZM16.0492 2.28426L13.8595 4.47394C13.5295 4.80395 13.3645 4.96896 13.3026 5.15923C13.2482 5.3266 13.2482 5.50689 13.3026 5.67426C13.3645 5.86454 13.5295 6.02954 13.8595 6.35956L14.0572 6.55727C14.3872 6.88729 14.5522 7.05229 14.7425 7.11412C14.9099 7.1685 15.0901 7.1685 15.2575 7.11412C15.4478 7.05229 15.6128 6.88729 15.9428 6.55727L17.9911 4.50901C18.2117 5.04582 18.3333 5.63374 18.3333 6.25008C18.3333 8.78139 16.2813 10.8334 13.75 10.8334C13.4448 10.8334 13.1466 10.8036 12.8581 10.7467C12.453 10.6668 12.2505 10.6268 12.1277 10.6391C11.9971 10.6521 11.9328 10.6717 11.8171 10.7336C11.7083 10.7918 11.5991 10.9009 11.3809 11.1192L5.41667 17.0834C4.72631 17.7738 3.60702 17.7738 2.91667 17.0834C2.22631 16.393 2.22631 15.2738 2.91667 14.5834L8.88086 8.61922C9.09915 8.40094 9.20829 8.29179 9.26652 8.18299C9.32842 8.06731 9.34799 8.00297 9.361 7.87242C9.37324 7.74963 9.33329 7.54707 9.25339 7.14195C9.19649 6.85346 9.16667 6.55526 9.16667 6.25008C9.16667 3.71878 11.2187 1.66675 13.75 1.66675C14.5879 1.66675 15.3733 1.8916 16.0492 2.28426ZM10 12.5L14.5833 17.0833C15.2737 17.7737 16.393 17.7737 17.0833 17.0833C17.7737 16.393 17.7737 15.2737 17.0833 14.5833L13.3128 10.8128C13.0458 10.7876 12.7856 10.7394 12.534 10.6704C12.2098 10.5814 11.8541 10.646 11.6164 10.8837L10 12.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const VendorsNavIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.3333 17.5V15.8333C13.3333 14.9493 12.9821 14.1014 12.357 13.4763C11.7319 12.8512 10.884 12.5 10 12.5H5C4.11595 12.5 3.26811 12.8512 2.64299 13.4763C2.01787 14.1014 1.66667 14.9493 1.66667 15.8333V17.5M18.3333 17.5V15.8333C18.3327 15.0948 18.087 14.3773 17.6345 13.7936C17.182 13.2099 16.5485 12.793 15.8333 12.6083M13.3333 2.60833C13.0503 2.69322 12.7829 2.82267 12.5427 2.99117C12.3025 3.15967 12.0933 3.36422 11.9241 3.59583C11.7549 3.82744 11.6287 4.08233 11.5514 4.35C11.4741 4.61767 11.4469 4.89333 11.4711 5.16717C11.4953 5.441 11.5705 5.70833 11.6933 5.957C11.8161 6.20567 11.984 6.43133 12.1885 6.62283C12.3931 6.81433 12.6305 6.96867 12.8885 7.07733C13.1465 7.186 13.4203 7.247 13.6957 7.2575C13.971 7.268 14.2453 7.228 14.5037 7.13967C14.762 7.05133 15.0 6.91617 15.2037 6.7425C15.4075 6.56883 15.5733 6.36017 15.6927 6.12817C15.812 5.89617 15.883 5.64517 15.9017 5.38833C15.9203 5.1315 15.8862 4.87383 15.8013 4.63C15.7163 4.38617 15.5822 4.16033 15.407 3.96583C15.2318 3.77133 15.0188 3.61217 14.7805 3.49717C14.5422 3.38217 14.2832 3.31383 14.018 3.29583C13.7528 3.27783 13.4867 3.31067 13.2342 3.39283L13.3333 2.60833ZM11.6667 7.5C11.6667 9.34095 10.1743 10.8333 8.33334 10.8333C6.49239 10.8333 5 9.34095 5 7.5C5 5.65905 6.49239 4.16667 8.33334 4.16667C10.1743 4.16667 11.6667 5.65905 11.6667 7.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CalendarNavIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2.5" y="3.33334" width="15" height="13.3333" rx="1.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.3333 1.66667V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.66667 1.66667V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2.5 8.33334H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface TopNavProps {
  hidden?: boolean;
}

export default function TopNav({ hidden = false }: TopNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, role } = useAuth();
  const { favorites, removeFavorite } = useFavorites();
  const tabContext = useContext(TabContext);
  const [navMode, setNavMode] = useNavLayoutMode();

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openMenu]);

  useEffect(() => {
    if (userId) {
      fetchJSON(`/users/${userId}`)
        .then((user: any) => setUserName(user.name || ""))
        .catch(() => setUserName(""));
    }
  }, [userId]);

  const formatRole = (roleName: string | null): string => {
    if (!roleName) return "User";
    if (roleName === "property_manager") return "Property Manager";
    if (roleName === "field_team_member") return "Field Manager";
    return roleName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleLogout = async () => {
    await logoutRequest();
    navigate("/login");
  };

  const getActiveSection = (): string | null => {
    const path = location.pathname;
    if (path === "/dashboard") return "dashboard";
    if (path === "/") return "properties";
    if (path === "/insurance") return "properties";
    if (path === "/inspection-dashboard") return "properties";
    if (path === "/bills") return "accounting";
    if (path === "/chart-of-accounts") return "accounting";
    if (path === "/reimbursements") return "accounting";
    if (path === "/reconciliation") return "accounting";
    if (path.startsWith("/accounting/")) return "accounting";
    if (
      path.includes("/all-tasks") ||
      path.includes("/recurring-tasks") ||
      path.includes("/field-team-orders") ||
      path.includes("/work-orders") ||
      path.includes("/projects") ||
      path.includes("/activity-feed")
    ) {
      return "maintenance";
    }
    if (path.includes("/operations")) return "operations";
    return null;
  };
  const activeSection = getActiveSection();

  const submenuMap: Record<string, SubmenuEntry[]> = {
    dashboard: [{ label: "Dashboard", path: "/dashboard", sectionId: "dashboard" }],
    properties: [
      { label: "All Properties", path: "/all-properties", sectionId: "all-properties" },
      { label: "Insurance", path: "/insurance", sectionId: "insurance" },
      { label: "Inspections", path: "/inspection-dashboard", sectionId: "inspection-dashboard" },
    ],
    accounting: [
      { label: "Bills", path: "/bills", sectionId: "bills" },
      { label: "Bill Drafts", path: "/accounting/bill-drafts", sectionId: "bill-drafts" },
      { label: "Invoices", path: "/accounting/invoices", sectionId: "invoices" },
      { label: "Vendor Credits", path: "/accounting/vendor-credits", sectionId: "vendor-credits" },
      { label: "Print Checks", path: "/accounting/print-checks", sectionId: "print-checks" },
      { label: "Reimbursements", path: "/reimbursements", sectionId: "reimbursements" },
      { label: "Reconciliation", path: "/reconciliation", sectionId: "reconciliation" },
      { label: "General Ledger", path: "/accounting/general-ledger", sectionId: "general-ledger" },
      { label: "Chart of Accounts", path: "/chart-of-accounts", sectionId: "chart-of-accounts" },
    ],
    maintenance: [
      { label: "All Tasks", path: "/all-tasks", sectionId: "all-tasks" },
      { label: "Projects", path: "/projects", sectionId: "projects" },
      { label: "Recurring Tasks", path: "/recurring-tasks", sectionId: "recurring-tasks" },
      { label: "Field Team Orders", path: "/field-team-orders", sectionId: "field-team-orders" },
      { label: "Work Orders", path: "/work-orders", sectionId: "work-orders" },
      { label: "Activity Feed", path: "/activity-feed", sectionId: "activity-feed" },
    ],
    vendors: [
      { label: "All Vendors", path: "/vendors", sectionId: "vendors" },
      { label: "Compliance", path: "/vendor-compliance", sectionId: "vendor-compliance" },
    ],
    operations: [
      { label: "Calendar", path: "/operations?tab=calendar", sectionId: "operations-calendar" },
      { label: "Reminders", path: "/operations?tab=reminders", sectionId: "operations-reminders" },
      { label: "To-Dos", path: "/operations?tab=todos", sectionId: "operations-todos" },
    ],
  };

  const navigationItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    { id: "properties", label: "Properties", icon: <PropertiesNavIcon />, hasSubmenu: true },
    { id: "accounting", label: "Accounting", icon: <AccountingIcon />, hasSubmenu: true },
    { id: "maintenance", label: "Maintenance", icon: <MaintenanceIcon />, hasSubmenu: true },
    { id: "vendors", label: "Vendors", icon: <VendorsNavIcon />, hasSubmenu: true },
    ...(role === "admin" || role === "property_manager"
      ? [{ id: "operations", label: "Calendar", icon: <CalendarNavIcon />, hasSubmenu: true }]
      : []),
  ];

  const handleNavigation = (label: string, sectionId?: string, path?: string) => {
    if (tabContext && sectionId) {
      const currentTabMetadata = tabContext.tabMetadata[tabContext.selectedTab];
      tabContext.setTabMetadata(tabContext.selectedTab, {
        ...currentTabMetadata,
        label,
        sectionId,
        ...(path && { route: path }),
        scrollPosition: 0,
      });
    }
  };

  const handleItemClick = (item: NavItem) => {
    const submenu = submenuMap[item.id] || [];
    if (item.hasSubmenu) {
      setOpenMenu(openMenu === item.id ? null : item.id);
      return;
    }
    const first = submenu[0];
    if (first?.path) {
      navigate(first.path);
      handleNavigation(first.label, first.sectionId, first.path);
    }
  };

  if (hidden) return null;

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-between bg-gray-50 border-b flex-shrink-0"
      style={{ borderBottomColor: "#d2d1cf", padding: "8px 16px", minHeight: "56px" }}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2 flex-shrink-0" style={{ marginRight: "8px" }}>
          <img
            alt="AVM Logo"
            src="https://cdn.builder.io/api/v1/image/assets%2Fba2f0cd1a4c64ebda0865daf8dd0ff2a%2F72e0b6d48d514377b9ff522722ec83c2?format=webp&width=800"
            className="w-7 h-7"
          />
          <span className="text-lg font-semibold text-gray-900">AVM</span>
        </div>

        <div className="flex items-center gap-1">
          {navigationItems.map((item) => {
            const isActive = activeSection === item.id;
            const isOpen = openMenu === item.id;
            return (
              <div key={item.id} className="relative">
                <button
                  onClick={() => handleItemClick(item)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    isActive ? "bg-white text-gray-900" : "text-gray-600 hover:bg-white hover:text-gray-900"
                  }`}
                >
                  <span className="flex items-center justify-center">{item.icon}</span>
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.hasSubmenu && (
                    <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  )}
                </button>

                {item.hasSubmenu && isOpen && (
                  <div className="absolute left-0 top-full mt-1 min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                    {(submenuMap[item.id] || []).map((subitem, idx) => (
                      <Link
                        key={idx}
                        to={subitem.path!}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          handleNavigation(subitem.label, subitem.sectionId, subitem.path);
                          setOpenMenu(null);
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                        {subitem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === "favorites" ? null : "favorites")}
            className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
              openMenu === "favorites" ? "bg-white text-gray-900" : "text-gray-500 hover:bg-white hover:text-gray-900"
            }`}
            title="Favorites"
            aria-label="Favorites"
          >
            <StarIcon width={18} height={18} />
          </button>
          {openMenu === "favorites" && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
              <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Favorites</div>
              {favorites.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  Click the star icon on any page to add favorites
                </div>
              ) : (
                favorites.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <button
                      onClick={() => {
                        navigate(item.path);
                        setOpenMenu(null);
                      }}
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
                      <CloseIcon width={14} height={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => navigate("/settings/bugs")}
          className="flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-white hover:text-gray-900 transition-colors"
          title="Settings"
          aria-label="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        <button
          className="flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-white hover:text-gray-900 transition-colors"
          title="Help Center"
          aria-label="Help Center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
        </button>

        <NavLayoutToggle mode={navMode} onChange={setNavMode} className="mx-1" />

        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === "profile" ? null : "profile")}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white cursor-pointer hover:bg-gray-50"
            style={{ padding: "6px 10px 6px 6px" }}
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold text-gray-900">{userName || "User"}</span>
              <span className="text-xs text-gray-600">{formatRole(role)}</span>
            </div>
            <ChevronDownIcon className="w-4 h-4 text-gray-700 flex-shrink-0" />
          </button>
          {openMenu === "profile" && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
