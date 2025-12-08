import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TabContext } from "@/hooks/useTabContext";
import { useFavorites } from "@/hooks/FavoritesContext";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  hasSubmenu?: boolean;
}

export default function Sidebar() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set([]));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { favorites, removeFavorite } = useFavorites();
  const navigate = useNavigate();

  const navigationItems: SidebarItem[] = [
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
      hasSubmenu: true,
    },
    {
      id: "accounting",
      label: "Accounting",
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
      hasSubmenu: true,
    },
    {
      id: "maintenance",
      label: "Maintenance",
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
            fill="#303030"
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
    }
  };

  const tabContext = useContext(TabContext);

  const handleNavigation = (label: string, sectionId?: string) => {
    if (
      tabContext &&
      tabContext.selectedTab.startsWith("new-tab-") &&
      sectionId
    ) {
      tabContext.setTabMetadata(tabContext.selectedTab, {
        label,
        sectionId,
      });
    }
  };

  if (isCollapsed) {
    return (
      <div
        className={`relative h-screen flex-shrink-0 group transition-all`}
        style={{
          width: isHovered ? "262px" : "80px",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setActiveDropdown(null);
        }}
      >
        {/* Collapsed Sidebar */}
        <aside
          className={`bg-[#F7F7F7] absolute left-0 top-0 h-screen flex flex-col justify-between z-10 ${
            isHovered ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{
            width: "80px",
            padding: "20px 12px",
            transition: "opacity 0.3s ease",
            borderRightColor: "transparent",
            border: "1px solid #f7f7f7",
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
                    className={`flex w-[38px] h-[38px] justify-center items-center rounded-lg hover:bg-white transition-colors ${
                      item.id === "maintenance"
                        ? "border border-[#DADADA] shadow-sm"
                        : ""
                    }`}
                  >
                    <span className="text-gray-600">{item.icon}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-1.5">
              <button className="flex w-[38px] h-[38px] justify-center items-center rounded-lg hover:bg-white transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="#717179"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <g clipPath="url(#clip0_11076_320)">
                    <path d="M10.0003 12.5C11.381 12.5 12.5003 11.3807 12.5003 9.99999C12.5003 8.61928 11.381 7.49999 10.0003 7.49999C8.61961 7.49999 7.50033 8.61928 7.50033 9.99999C7.50033 11.3807 8.61961 12.5 10.0003 12.5Z" />
                    <path d="M15.6064 12.2727C15.5055 12.5012 15.4755 12.7547 15.52 13.0004C15.5646 13.2462 15.6817 13.473 15.8564 13.6515L15.9018 13.697C16.0427 13.8377 16.1545 14.0048 16.2307 14.1887C16.307 14.3727 16.3462 14.5698 16.3462 14.7689C16.3462 14.968 16.307 15.1652 16.2307 15.3491C16.1545 15.5331 16.0427 15.7002 15.9018 15.8409C15.7611 15.9818 15.594 16.0935 15.4101 16.1698C15.2261 16.246 15.029 16.2853 14.8299 16.2853C14.6308 16.2853 14.4336 16.246 14.2497 16.1698C14.0657 16.0935 13.8986 15.9818 13.7579 15.8409L13.7124 15.7954C13.5339 15.6208 13.3071 15.5036 13.0614 15.4591C12.8156 15.4145 12.5622 15.4446 12.3337 15.5454C12.1096 15.6415 11.9185 15.8009 11.7839 16.0042C11.6493 16.2074 11.5771 16.4456 11.5761 16.6894V16.8182C11.5761 17.22 11.4165 17.6054 11.1323 17.8895C10.8482 18.1737 10.4628 18.3333 10.0609 18.3333C9.65909 18.3333 9.2737 18.1737 8.98956 17.8895C8.70541 17.6054 8.54578 17.22 8.54578 16.8182V16.75C8.53991 16.4992 8.45875 16.256 8.31283 16.052C8.16692 15.848 7.963 15.6926 7.7276 15.606C7.4991 15.5052 7.24563 15.4751 6.99988 15.5197C6.75413 15.5642 6.52735 15.6814 6.34881 15.8561L6.30336 15.9015C6.16264 16.0424 5.99554 16.1541 5.8116 16.2304C5.62766 16.3066 5.4305 16.3459 5.23139 16.3459C5.03227 16.3459 4.83511 16.3066 4.65117 16.2304C4.46724 16.1541 4.30013 16.0424 4.15942 15.9015C4.01854 15.7608 3.90679 15.5937 3.83054 15.4097C3.75429 15.2258 3.71504 15.0286 3.71504 14.8295C3.71504 14.6304 3.75429 14.4333 3.83054 14.2493C3.90679 14.0654 4.01854 13.8983 4.15942 13.7576C4.30013 13.6168 4.46724 13.5051 4.65117 13.4289C4.83511 13.3526 5.03227 13.3134 5.23139 13.3134C5.4305 13.3134 5.62766 13.3526 5.8116 13.4289C5.99554 13.5051 6.16264 13.6168 6.30336 13.7576L6.34881 13.8031C6.52735 13.9778 6.75413 14.095 6.99988 14.1396C7.24563 14.1841 7.4991 14.154 7.7276 14.0532C7.963 13.9571 8.16692 13.7977 8.31283 13.5944C8.45875 13.3911 8.53991 13.1529 8.54578 12.9091V12.7803C8.54578 12.3785 8.70541 11.9931 8.98956 11.709C9.2737 11.4248 9.65909 11.2652 10.0609 11.2652C10.4628 11.2652 10.8482 11.4248 11.1323 11.709C11.4165 11.9931 11.5761 12.3785 11.5761 12.7803V12.8496C11.5826 13.1004 11.6637 13.3437 11.8097 13.5476C11.9556 13.7516 12.1595 13.907 12.395 13.9936C12.6235 14.0944 12.877 14.1245 13.1227 14.0799C13.3685 14.0354 13.5952 13.9182 13.7738 13.7435L13.8193 13.6981C13.96 13.5572 14.1271 13.4455 14.311 13.3692C14.495 13.293 14.6921 13.2537 14.8912 13.2537C15.0903 13.2537 15.2875 13.293 15.4714 13.3692C15.6554 13.4455 15.8225 13.5572 15.9632 13.6981C16.1041 13.8388 16.2158 14.0059 16.2921 14.1898C16.3683 14.3738 16.4076 14.571 16.4076 14.77C16.4076 14.9691 16.3683 15.1662 16.2921 15.3502C16.2158 15.5341 16.1041 15.7012 15.9632 15.8419C15.8225 15.9828 15.6554 16.0945 15.4714 16.1707C15.2875 16.247 15.0903 16.2862 14.8912 16.2862C14.6921 16.2862 14.495 16.247 14.311 16.1707C14.1271 16.0945 13.96 15.9828 13.8193 15.8419L13.7738 15.7965C13.5952 15.6218 13.3685 15.5046 13.1227 15.46C12.877 15.4155 12.6235 15.4455 12.395 15.5463C12.1595 15.633 11.9556 15.7884 11.8097 15.9923C11.6637 16.1963 11.5826 16.4396 11.5761 16.6903V16.8191C11.5761 17.2209 11.4165 17.6063 11.1323 17.8905C10.8482 18.1746 10.4628 18.3342 10.0609 18.3342C9.65909 18.3342 9.2737 18.1746 8.98956 17.8905C8.70541 17.6063 8.54578 17.2209 8.54578 16.8191V16.7498C8.53991 16.499 8.45875 16.2558 8.31283 16.0518C8.16692 15.8479 7.963 15.6925 7.7276 15.6058C7.4991 15.505 7.24563 15.4749 6.99988 15.5195C6.75413 15.564 6.52735 15.6812 6.34881 15.8559L6.30336 15.9013C6.16264 16.0422 5.99554 16.1539 5.8116 16.2302C5.62766 16.3064 5.4305 16.3457 5.23139 16.3457C5.03227 16.3457 4.83511 16.3064 4.65117 16.2302C4.46724 16.1539 4.30013 16.0422 4.15942 15.9013C4.01854 15.7606 3.90679 15.5935 3.83054 15.4095C3.75429 15.2256 3.71504 15.0284 3.71504 14.8293C3.71504 14.6302 3.75429 14.4331 3.83054 14.2491C3.90679 14.0652 4.01854 13.8981 4.15942 13.7574C4.30013 13.6166 4.46724 13.5049 4.65117 13.4287C4.83511 13.3525 5.03227 13.3132 5.23139 13.3132C5.4305 13.3132 5.62766 13.3525 5.8116 13.4287C5.99554 13.5049 6.16264 13.6166 6.30336 13.7574L6.34881 13.8029C6.52735 13.9775 6.75413 14.0948 6.99988 14.1393C7.24563 14.1839 7.4991 14.1538 7.7276 14.053C7.963 13.9569 8.16692 13.7975 8.31283 13.5942C8.45875 13.3909 8.53991 13.1527 8.54578 12.9089V12.7801C8.54578 12.3783 8.70541 11.9929 8.98956 11.7088C9.2737 11.4246 9.65909 11.265 10.0609 11.265C10.4628 11.265 10.8482 11.4246 11.1323 11.7088C11.4165 11.9929 11.5761 12.3783 11.5761 12.7801Z" />
                  </g>
                  <defs>
                    <clipPath id="clip0_11076_320">
                      <rect width="20" height="20" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </button>
              <button className="flex w-[38px] h-[38px] justify-center items-center rounded-lg hover:bg-white transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="#717179"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <g clipPath="url(#clip0_11076_325)">
                    <path d="M7.57533 7.49999C7.77125 6.94305 8.15795 6.47341 8.66695 6.17427C9.17596 5.87512 9.7744 5.76577 10.3563 5.86558C10.9382 5.96539 11.466 6.26793 11.8462 6.7196C12.2264 7.17127 12.4345 7.74292 12.4337 8.33332C12.4337 9.99999 9.93366 10.8333 9.93366 10.8333M10.0003 14.1667H10.0087M18.3337 9.99999C18.3337 14.6024 14.6027 18.3333 10.0003 18.3333C5.39795 18.3333 1.66699 14.6024 1.66699 9.99999C1.66699 5.39762 5.39795 1.66666 10.0003 1.66666C14.6027 1.66666 18.3337 5.39762 18.3337 9.99999Z" />
                  </g>
                  <defs>
                    <clipPath id="clip0_11076_325">
                      <rect width="20" height="20" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </button>
            </div>

            <img
              alt="AVM Logo"
              src="https://cdn.builder.io/api/v1/image/assets%2Fba2f0cd1a4c64ebda0865daf8dd0ff2a%2F72e0b6d48d514377b9ff522722ec83c2?format=webp&width=800"
              className="w-[38px] h-[38px] rounded-md shadow-md"
            />
          </div>
        </aside>

        {/* Expanded Sidebar on Hover */}
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
          {/* Top Section */}
          <div className="flex flex-col">
            {/* Header */}
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

          {/* Scrollable Middle Section */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="flex flex-col">
              {/* Navigation */}
              <div
                className="flex flex-col gap-1.5"
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {navigationItems.map((item) => (
                  <div key={item.id}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (item.hasSubmenu) {
                          toggleExpanded(item.id);
                        }
                      }}
                      className="w-full flex items-center justify-between px-3 rounded-lg hover:bg-white transition-colors text-gray-700 text-base"
                      style={{ minHeight: "38px" }}
                    >
                      <div className="flex items-center gap-2 flex-1 text-left min-w-0">
                        <span className="flex items-center justify-center text-gray-600 flex-shrink-0">
                          {item.icon}
                        </span>
                        <span className="font-normal whitespace-nowrap overflow-hidden text-ellipsis">
                          {item.label}
                        </span>
                      </div>
                      {item.hasSubmenu && expandedItems.has(item.id) && (
                        <svg
                          className="w-4 h-4 text-gray-600"
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

                    {/* Submenu */}
                    {item.hasSubmenu && expandedItems.has(item.id) && (
                      <div className="ml-6 mt-1 flex flex-col gap-0">
                        {(submenuMap[item.id] || []).map((subitem, idx) => {
                          const isLink = subitem.path !== undefined;
                          const className =
                            "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white transition-colors text-gray-600 text-sm h-10 whitespace-nowrap";

                          return isLink ? (
                            <Link
                              key={idx}
                              to={subitem.path!}
                              className={className}
                              onClick={() => {
                                handleNavigation(
                                  subitem.label,
                                  subitem.sectionId,
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
                          ) : (
                            <button
                              key={idx}
                              className={className}
                              onClick={() => {
                                handleNavigation(
                                  subitem.label,
                                  subitem.sectionId,
                                );
                                setIsHovered(false);
                                setActiveDropdown(null);
                              }}
                            >
                              <div className="flex items-center h-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                              </div>
                              <span className="text-sm">{subitem.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div
                className="h-px bg-gray-300"
                style={{ marginTop: "16px" }}
              ></div>

              {/* Favorites */}
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
                    <button
                      key={item.id}
                      onClick={() => navigate(item.path)}
                      className="flex items-center justify-between px-3 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 text-base"
                      style={{ minHeight: "38px" }}
                    >
                      <span className="flex-1 text-left truncate">
                        {item.label}
                      </span>
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
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col" style={{ gap: "16px" }}>
            {/* Settings & Help */}
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

            {/* User Profile */}
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

        {/* Dropdown Menu for Icons - only show when hovering collapsed icon icons */}
        {activeDropdown && submenuMap[activeDropdown] && !isHovered && (
          <div className="fixed left-24 top-20 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-max">
            {submenuMap[activeDropdown].map((item, idx) => {
              const isLink = item.path !== undefined;
              const className =
                "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors";

              return isLink ? (
                <Link key={idx} to={item.path!} className={className}>
                  {item.label}
                </Link>
              ) : (
                <button key={idx} className={className}>
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <aside
      className="bg-gray-50 flex flex-col h-screen justify-between transition-all duration-300"
      style={{ width: "262px", padding: "20px" }}
    >
      {/* Top Section - Header Only */}
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

      {/* Scrollable Middle Section */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col">
          {/* Navigation */}
          <div className="flex flex-col gap-1.5">
            {navigationItems.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => item.hasSubmenu && toggleExpanded(item.id)}
                  className="w-full flex items-center justify-between px-3 rounded-lg hover:bg-white transition-colors text-gray-700 text-base"
                  style={{ minHeight: "38px" }}
                >
                  <div className="flex items-center gap-2 flex-1 text-left min-w-0">
                    <span className="flex items-center justify-center text-gray-600 flex-shrink-0">
                      {item.icon}
                    </span>
                    <span className="font-normal whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.label}
                    </span>
                  </div>
                  {item.hasSubmenu && expandedItems.has(item.id) && (
                    <svg
                      className="w-4 h-4 text-gray-600"
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

                {/* Submenu */}
                {item.hasSubmenu && expandedItems.has(item.id) && (
                  <div className="ml-6 mt-1 flex flex-col gap-0">
                    {(submenuMap[item.id] || []).map((subitem, idx) => {
                      const isLink = subitem.path !== undefined;
                      const className =
                        "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white transition-colors text-gray-600 text-sm h-10 whitespace-nowrap";

                      return isLink ? (
                        <Link
                          key={idx}
                          to={subitem.path!}
                          className={className}
                          onClick={() =>
                            handleNavigation(subitem.label, subitem.sectionId)
                          }
                        >
                          <div className="flex items-center h-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                          </div>
                          <span className="text-sm">{subitem.label}</span>
                        </Link>
                      ) : (
                        <button
                          key={idx}
                          className={className}
                          onClick={() =>
                            handleNavigation(subitem.label, subitem.sectionId)
                          }
                        >
                          <div className="flex items-center h-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                          </div>
                          <span className="text-sm">{subitem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-300" style={{ marginTop: "16px" }}></div>

          {/* Favorites */}
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
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className="flex items-center justify-between px-3 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 text-base"
                  style={{ minHeight: "38px" }}
                >
                  <span className="flex-1 text-left truncate">
                    {item.label}
                  </span>
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
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col" style={{ gap: "16px" }}>
        {/* Settings & Help */}
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

        {/* User Profile */}
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
