import React, { useState } from "react";
import { Link } from "react-router-dom";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  hasSubmenu?: boolean;
}

export default function Sidebar() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(["dashboard"]),
  );
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const navigationItems: SidebarItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
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
          <path d="M6.66667 10.8333V14.1667M13.3333 9.16667V14.1667M10 5.83333V14.1667M6.5 17.5H13.5C14.9001 17.5 15.6002 17.5 16.135 17.2275C16.6054 16.9878 16.9878 16.6054 17.2275 16.135C17.5 15.6002 17.5 14.9001 17.5 13.5V6.5C17.5 5.09987 17.5 4.3998 17.2275 3.86502C16.9878 3.39462 16.6054 3.01217 16.135 2.77248C15.6002 2.5 14.9001 2.5 13.5 2.5H6.5C5.09987 2.5 4.3998 2.5 3.86502 2.77248C3.39462 3.01217 3.01217 3.39462 2.77248 3.86502C2.5 4.3998 2.5 5.09987 2.5 6.5V13.5C2.5 14.9001 2.5 15.6002 2.77248 16.135C3.01217 16.6054 3.39462 16.9878 3.86502 17.2275C4.3998 17.5 5.09987 17.5 6.5 17.5Z" />
        </svg>
      ),
      hasSubmenu: true,
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
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13.3337 17.4999V16.4999C13.3337 15.0998 13.3337 14.3997 13.0612 13.8649C12.8215 13.3945 12.439 13.0121 11.9686 12.7724C11.4339 12.4999 10.7338 12.4999 9.33366 12.4999H5.66699C4.26686 12.4999 3.5668 12.4999 3.03202 12.7724C2.56161 13.0121 2.17916 13.3945 1.93948 13.8649C1.66699 14.3997 1.66699 15.0998 1.66699 16.4999V17.4999M13.3337 4.99992L15.0003 6.66659L18.3337 3.33325M10.417 6.24992C10.417 7.86075 9.11116 9.16659 7.50033 9.16659C5.88949 9.16659 4.58366 7.86075 4.58366 6.24992C4.58366 4.63909 5.88949 3.33325 7.50033 3.33325C9.11116 3.33325 10.417 4.63909 10.417 6.24992Z" />
        </svg>
      ),
    },
    {
      id: "leases",
      label: "Leases",
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
          <path d="M11.6663 9.16675H6.66634M8.33301 12.5001H6.66634M13.333 5.83341H6.66634M16.6663 8.33341V5.66675C16.6663 4.26662 16.6663 3.56655 16.3939 3.03177C16.1542 2.56137 15.7717 2.17892 15.3013 1.93923C14.7665 1.66675 14.0665 1.66675 12.6663 1.66675H7.33301C5.93288 1.66675 5.23281 1.66675 4.69803 1.93923C4.22763 2.17892 3.84517 2.56137 3.60549 3.03177C3.33301 3.56655 3.33301 4.26662 3.33301 5.66675V14.3334C3.33301 15.7335 3.33301 16.4336 3.60549 16.9684C3.84517 17.4388 4.22763 17.8212 4.69803 18.0609C5.23281 18.3334 5.93288 18.3334 7.33301 18.3334H10.4163M14.9997 17.5001C14.9997 17.5001 17.4997 16.3085 17.4997 14.5211V12.4358L15.6767 11.7844C15.2387 11.6275 14.7597 11.6275 14.3217 11.7844L12.4997 12.4358V14.5211C12.4997 16.3085 14.9997 17.5001 14.9997 17.5001Z" />
        </svg>
      ),
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
    {
      id: "reports",
      label: "Reports",
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
          <path d="M17.5 7.5L12.1262 11.3384C11.963 11.455 11.8813 11.5133 11.7939 11.5309C11.7168 11.5464 11.637 11.5398 11.5635 11.5119C11.4801 11.4801 11.4092 11.4092 11.2673 11.2673L8.73267 8.73267C8.5908 8.5908 8.51986 8.51986 8.43652 8.48814C8.36305 8.46017 8.28317 8.45356 8.2061 8.46907C8.11868 8.48666 8.03704 8.54497 7.87378 8.66159L2.5 12.5M6.5 17.5H13.5C14.9001 17.5 15.6002 17.5 16.135 17.2275C16.6054 16.9878 16.9878 16.6054 17.2275 16.135C17.5 15.6002 17.5 14.9001 17.5 13.5V6.5C17.5 5.09987 17.5 4.3998 17.2275 3.86502C16.9878 3.39462 16.6054 3.01217 16.135 2.77248C15.6002 2.5 14.9001 2.5 13.5 2.5H6.5C5.09987 2.5 4.3998 2.5 3.86502 2.77248C3.39462 3.01217 3.01217 3.39462 2.77248 3.86502C2.5 4.3998 2.5 5.09987 2.5 6.5V13.5C2.5 14.9001 2.5 15.6002 2.77248 16.135C3.01217 16.6054 3.39462 16.9878 3.86502 17.2275C4.3998 17.5 5.09987 17.5 6.5 17.5Z" />
        </svg>
      ),
    },
  ];

  const submenuMap: Record<string, Array<{ label: string; path?: string }>> = {
    dashboard: [
      { label: "Portfolios" },
      { label: "Portfolios" },
      { label: "Portfolios" },
    ],
    accounting: [{ label: "Bills", path: "/bills" }],
    maintenance: [
      { label: "Tasks", path: "/" },
      { label: "Field Team Orders", path: "/field-team-orders" },
    ],
  };

  const favoriteItems = ["Lorem Ipsum", "Lorem Ipsum", "Lorem Ipsum"];

  const toggleExpanded = (id: string) => {
    if (isCollapsed) return;
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

  if (isCollapsed) {
    return (
      <div
        className="relative h-screen flex"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setActiveDropdown(null);
        }}
      >
        {/* Collapsed Sidebar */}
        <aside className={`bg-[#F7F7F7] border-r border-gray-200 fixed left-0 top-0 h-screen flex flex-col py-5 px-3 justify-between w-20 transition-all duration-300 z-40 ${
          isHovered ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}>
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-2">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="rounded-md"
              >
                <rect width="32" height="32" rx="6" fill="#013764" />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M14.9194 6.679C14.6822 6.59982 14.4307 6.57292 14.1821 6.60014C13.9335 6.62736 13.6938 6.70806 13.4793 6.8367L9.90933 8.97869C9.65272 9.13266 9.44034 9.35046 9.2929 9.61088C9.14545 9.8713 9.06796 10.1655 9.06796 10.4647V22.1053H8.20146C7.97165 22.1053 7.75125 22.1966 7.58875 22.3591C7.42625 22.5216 7.33496 22.742 7.33496 22.9718C7.33496 23.2016 7.42625 23.422 7.58875 23.5845C7.75125 23.747 7.97165 23.8383 8.20146 23.8383H23.7985C24.0283 23.8383 24.2487 23.747 24.4112 23.5845C24.5737 23.422 24.665 23.2016 24.665 22.9718C24.665 22.742 24.5737 22.5216 24.4112 22.3591C24.2487 22.1966 24.0283 22.1053 23.7985 22.1053H22.932V10.5982C22.9317 10.2347 22.8173 9.88051 22.6047 9.58569C22.3921 9.29086 22.0922 9.07033 21.7475 8.95529L14.9194 6.679ZM13.4005 8.9059L10.801 10.4656V22.1053H13.4005V8.90503V8.9059Z"
                  fill="#DEEFFD"
                />
              </svg>
            </div>

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
                    <path d="M15.6064 12.2727C15.5055 12.5012 15.4755 12.7547 15.52 13.0004C15.5646 13.2462 15.6817 13.473 15.8564 13.6515L15.9018 13.697C16.0427 13.8377 16.1545 14.0048 16.2307 14.1887C16.307 14.3727 16.3462 14.5698 16.3462 14.7689C16.3462 14.968 16.307 15.1652 16.2307 15.3491C16.1545 15.5331 16.0427 15.7002 15.9018 15.8409C15.7611 15.9818 15.594 16.0935 15.4101 16.1698C15.2261 16.246 15.029 16.2853 14.8299 16.2853C14.6308 16.2853 14.4336 16.246 14.2497 16.1698C14.0657 16.0935 13.8986 15.9818 13.7579 15.8409L13.7124 15.7954C13.5339 15.6208 13.3071 15.5036 13.0614 15.4591C12.8156 15.4145 12.5622 15.4446 12.3337 15.5454C12.1096 15.6415 11.9185 15.8009 11.7839 16.0042C11.6493 16.2074 11.5771 16.4456 11.5761 16.6894V16.8182C11.5761 17.22 11.4165 17.6054 11.1323 17.8895C10.8482 18.1737 10.4628 18.3333 10.0609 18.3333C9.65909 18.3333 9.2737 18.1737 8.98956 17.8895C8.70541 17.6054 8.54578 17.22 8.54578 16.8182V16.75C8.53991 16.4992 8.45875 16.256 8.31283 16.052C8.16692 15.848 7.963 15.6926 7.7276 15.606C7.4991 15.5052 7.24563 15.4751 6.99988 15.5197C6.75413 15.5642 6.52735 15.6814 6.34881 15.8561L6.30336 15.9015C6.16264 16.0424 5.99554 16.1541 5.8116 16.2304C5.62766 16.3066 5.4305 16.3459 5.23139 16.3459C5.03227 16.3459 4.83511 16.3066 4.65117 16.2304C4.46724 16.1541 4.30013 16.0424 4.15942 15.9015C4.01854 15.7608 3.90679 15.5937 3.83054 15.4097C3.75429 15.2258 3.71504 15.0286 3.71504 14.8295C3.71504 14.6304 3.75429 14.4333 3.83054 14.2493C3.90679 14.0654 4.01854 13.8983 4.15942 13.7576L4.20487 13.7121C4.37952 13.5336 4.49668 13.3068 4.54124 13.061C4.5858 12.8153 4.55572 12.5618 4.45487 12.3333C4.35884 12.1093 4.19938 11.9182 3.99613 11.7836C3.79288 11.649 3.55471 11.5767 3.31093 11.5757H3.18214C2.7803 11.5757 2.39492 11.4161 2.11077 11.132C1.82662 10.8478 1.66699 10.4624 1.66699 10.0606C1.66699 9.65875 1.82662 9.27337 2.11077 8.98922C2.39492 8.70508 2.7803 8.54544 3.18214 8.54544H3.25033C3.50108 8.53958 3.74427 8.45841 3.94828 8.3125C4.15229 8.16658 4.30769 7.96267 4.39426 7.72726C4.49511 7.49877 4.52519 7.2453 4.48063 6.99954C4.43607 6.75379 4.31891 6.52702 4.14426 6.34847L4.09881 6.30302C3.95794 6.1623 3.84618 5.9952 3.76993 5.81126C3.69368 5.62733 3.65444 5.43016 3.65444 5.23105C3.65444 5.03194 3.69368 4.83477 3.76993 4.65084C3.84618 4.4669 3.95794 4.2998 4.09881 4.15908C4.23953 4.01821 4.40663 3.90645 4.59057 3.8302C4.7745 3.75395 4.97167 3.71471 5.17078 3.71471C5.36989 3.71471 5.56706 3.75395 5.75099 3.8302C5.93493 3.90645 6.10203 4.01821 6.24275 4.15908L6.2882 4.20454C6.46675 4.37918 6.69352 4.49634 6.93927 4.5409C7.18503 4.58546 7.4385 4.55538 7.66699 4.45454H7.7276C7.95167 4.3585 8.14276 4.19905 8.27737 3.9958C8.41197 3.79255 8.4842 3.55437 8.48517 3.3106V3.18181C8.48517 2.77996 8.64481 2.39458 8.92895 2.11043C9.2131 1.82629 9.59848 1.66666 10.0003 1.66666C10.4022 1.66666 10.7876 1.82629 11.0717 2.11043C11.3558 2.39458 11.5155 2.77996 11.5155 3.18181V3.24999C11.5164 3.49377 11.5887 3.73194 11.7233 3.93519C11.8579 4.13844 12.049 4.2979 12.2731 4.39393C12.5015 4.49477 12.755 4.52486 13.0008 4.4803C13.2465 4.43574 13.4733 4.31858 13.6518 4.14393L13.6973 4.09847C13.838 3.9576 14.0051 3.84585 14.1891 3.7696C14.373 3.69335 14.5702 3.6541 14.7693 3.6541C14.9684 3.6541 15.1655 3.69335 15.3495 3.7696C15.5334 3.84585 15.7005 3.9576 15.8412 4.09847C15.9821 4.23919 16.0939 4.4063 16.1701 4.59023C16.2464 4.77417 16.2856 4.97133 16.2856 5.17044C16.2856 5.36956 16.2464 5.56672 16.1701 5.75066C16.0939 5.93459 15.9821 6.1017 15.8412 6.24241L15.7958 6.28787C15.6211 6.46641 15.504 6.69318 15.4594 6.93894C15.4149 7.18469 15.4449 7.43816 15.5458 7.66666V7.72726C15.6418 7.95133 15.8013 8.14243 16.0045 8.27703C16.2078 8.41163 16.4459 8.48387 16.6897 8.48484H16.8185C17.2204 8.48484 17.6057 8.64447 17.8899 8.92862C18.174 9.21276 18.3337 9.59815 18.3337 9.99999C18.3337 10.4018 18.174 10.7872 17.8899 11.0714C17.6057 11.3555 17.2204 11.5151 16.8185 11.5151H16.7503C16.5065 11.5161 16.2684 11.5883 16.0651 11.723C15.8619 11.8576 15.7024 12.0486 15.6064 12.2727Z" />
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
              alt="User avatar"
              src="https://api.builder.io/api/v1/image/assets/TEMP/2566780a27c3990d201697798765d924dce1c93a?width=80"
              className="w-[38px] h-[38px] rounded-md shadow-md"
            />
          </div>
        </aside>

        {/* Expanded Sidebar on Hover */}
        <aside
          className={`bg-gray-50 border-r border-gray-200 fixed left-0 top-0 h-screen flex flex-col py-4 px-5 justify-between w-64 transition-all duration-300 z-30 transform ${
            isHovered ? "translate-x-0" : "-translate-x-full"
          }`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setActiveDropdown(null);
          }}
        >
          {/* Top Section */}
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
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
                  setIsCollapsed(true);
                  setIsHovered(false);
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

            {/* Navigation */}
            <div className="flex flex-col gap-1" onMouseLeave={() => setActiveDropdown(null)}>
              {navigationItems.map((item) => (
                <div key={item.id}>
                  <button
                    onClick={() => item.hasSubmenu && toggleExpanded(item.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white transition-colors text-gray-700 text-sm"
                  >
                    <div className="flex items-center gap-2 flex-1 text-left">
                      <span className="flex items-center justify-center text-gray-600">
                        {item.icon}
                      </span>
                      <span className="font-normal">{item.label}</span>
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
                          "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white transition-colors text-gray-600 text-sm h-10";

                        return isLink ? (
                          <Link
                            key={idx}
                            to={subitem.path!}
                            className={className}
                          >
                            <div className="flex items-center h-full">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                            </div>
                            <span className="text-sm">{subitem.label}</span>
                          </Link>
                        ) : (
                          <button key={idx} className={className}>
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
            <div className="h-px bg-gray-300"></div>

            {/* Favorites */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-semibold text-gray-700 uppercase">
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
                      <path d="M5 12h14M12 5v14" />
                    </svg>
                  </button>
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
              {favoriteItems.map((item, idx) => (
                <button
                  key={idx}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white transition-colors text-gray-700 text-sm"
                >
                  <span>{item}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 17v5" />
                    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col gap-4">
            {/* Settings & Help */}
            <div className="flex flex-col gap-1">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white transition-colors text-gray-700 text-sm">
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
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white transition-colors text-gray-700 text-sm">
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
            <div className="flex items-center justify-between p-2 rounded-lg border border-gray-300 bg-white">
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
                className="text-gray-700"
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
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-screen py-4 px-5 justify-between transition-all duration-300">
      {/* Top Section */}
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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

        {/* Navigation */}
        <div className="flex flex-col gap-1">
          {navigationItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => item.hasSubmenu && toggleExpanded(item.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white transition-colors text-gray-700 text-sm"
              >
                <div className="flex items-center gap-2 flex-1 text-left">
                  <span className="flex items-center justify-center text-gray-600">
                    {item.icon}
                  </span>
                  <span className="font-normal">{item.label}</span>
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
                      "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white transition-colors text-gray-600 text-sm h-10";

                    return isLink ? (
                      <Link key={idx} to={subitem.path!} className={className}>
                        <div className="flex items-center h-full">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                        </div>
                        <span className="text-sm">{subitem.label}</span>
                      </Link>
                    ) : (
                      <button key={idx} className={className}>
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
        <div className="h-px bg-gray-300"></div>

        {/* Favorites */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold text-gray-700 uppercase">
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
                  <path d="M5 12h14M12 5v14" />
                </svg>
              </button>
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
          {favoriteItems.map((item, idx) => (
            <button
              key={idx}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white transition-colors text-gray-700 text-sm"
            >
              <span>{item}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 17v5" />
                <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col gap-4">
        {/* Settings & Help */}
        <div className="flex flex-col gap-1">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white transition-colors text-gray-700 text-sm">
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
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white transition-colors text-gray-700 text-sm">
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
        <div className="flex items-center justify-between p-2 rounded-lg border border-gray-300 bg-white">
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
            className="text-gray-700"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </aside>
  );
}
