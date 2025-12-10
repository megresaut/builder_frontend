import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PropertiesTemplate } from "@/layout/PropertiesTemplate";
import { usePageState } from "@/hooks/usePageState";

interface Property {
  id: number;
  address: string;
  location: string;
  manager: string;
  type: string;
  buildingId: string;
  status: "active" | "inactive";
}

interface UtilityAccount {
  id: number;
  provider: string;
  account: string;
  status: "active" | "inactive";
  lastBillDate: string;
  lastBillAmount: string;
  lastImport: string;
  icon?: React.ReactNode;
}

const properties: Property[] = [
  {
    id: 1,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT",
    manager: "Jerry Sanchez",
    type: "Concierge",
    buildingId: "624090",
    status: "inactive",
  },
  {
    id: 2,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT",
    manager: "Jerry Sanchez",
    type: "Rental",
    buildingId: "624090",
    status: "active",
  },
  {
    id: 3,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT",
    manager: "Jerry Sanchez",
    type: "Commercial",
    buildingId: "624090",
    status: "active",
  },
  {
    id: 4,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT",
    manager: "Jerry Sanchez",
    type: "OR",
    buildingId: "624090",
    status: "active",
  },
  {
    id: 5,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT",
    manager: "Jerry Sanchez",
    type: "HOA",
    buildingId: "624090",
    status: "active",
  },
  {
    id: 6,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT",
    manager: "Jerry Sanchez",
    type: "Concierge",
    buildingId: "624090",
    status: "active",
  },
  {
    id: 7,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT",
    manager: "Jerry Sanchez",
    type: "Concierge",
    buildingId: "624090",
    status: "active",
  },
  {
    id: 8,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT",
    manager: "Jerry Sanchez",
    type: "Concierge",
    buildingId: "624090",
    status: "active",
  },
  {
    id: 9,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT",
    manager: "Jerry Sanchez",
    type: "Concierge",
    buildingId: "624090",
    status: "active",
  },
  {
    id: 10,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT",
    manager: "Jerry Sanchez",
    type: "Concierge",
    buildingId: "624090",
    status: "active",
  },
];

const getProviderIcon = (provider: string) => {
  switch (provider) {
    case "National Grid":
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.2558 18.9774C14.2023 18.3873 18.0123 16.2674 18.0123 10.7863C18.0123 5.79907 14.3616 2.47739 11.7365 0.951337C11.1531 0.612005 10.4716 1.05785 10.4716 1.7318V3.45485C10.4716 4.81406 9.90036 7.29495 8.31305 8.32709C7.50242 8.85399 6.62581 8.06505 6.52778 7.10361L6.44672 6.31372C6.35246 5.39564 5.41742 4.83857 4.68408 5.39847C3.3654 6.40232 1.98828 8.16496 1.98828 10.7854C1.98828 17.4881 6.97363 19.165 9.46583 19.165C9.61162 19.165 9.76369 19.1602 9.92204 19.1508C8.69102 19.0462 6.70122 18.2827 6.70122 15.8131C6.70122 13.8808 8.11039 12.5753 9.18117 11.9391C9.4696 11.7694 9.8061 11.9909 9.8061 12.3255V12.8817C9.8061 13.3058 9.97106 13.9704 10.3622 14.4247C10.8052 14.9393 11.4547 14.4002 11.5065 13.7234C11.5235 13.5104 11.7384 13.3746 11.9232 13.4821C12.5274 13.8356 13.2993 14.5896 13.2993 15.8131C13.2993 17.7435 12.2352 18.6315 11.2558 18.9774Z"
            fill="#BC423E"
          />
        </svg>
      );
    case "ConEd":
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.6593 1.77024C11.7052 1.40316 11.5036 1.04977 11.1642 0.902458C10.8249 0.755151 10.429 0.849194 10.1922 1.13339L2.751 10.0628C2.6224 10.2171 2.49215 10.3733 2.39732 10.5107C2.30763 10.6405 2.14387 10.8958 2.13881 11.2314C2.13302 11.6155 2.3042 11.981 2.60301 12.2224C2.86402 12.4334 3.16499 12.471 3.32217 12.4852C3.48835 12.5003 3.69176 12.5002 3.89258 12.5002L9.05509 12.5002L8.33884 18.2302C8.29295 18.5973 8.49456 18.9507 8.83391 19.098C9.17326 19.2453 9.56909 19.1512 9.80592 18.867L17.2471 9.93758C17.3757 9.78332 17.506 9.62707 17.6008 9.48977C17.6905 9.35991 17.8543 9.1046 17.8593 8.76906C17.8651 8.38491 17.6939 8.01945 17.3951 7.77798C17.1341 7.56705 16.8331 7.52941 16.676 7.51518C16.5098 7.50013 16.3064 7.50017 16.1055 7.50021L10.9431 7.50021L11.6593 1.77024Z"
            fill="#EBA524"
          />
        </svg>
      );
    case "Greenwich Water":
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.0005 19.165C7.85413 19.165 6.06437 18.4286 4.63119 16.956C3.198 15.4833 2.4811 13.6503 2.48047 11.457C2.48047 10.4856 2.6998 9.5143 3.13847 8.54297C3.57713 7.57163 4.12547 6.63947 4.78347 5.74647C5.44147 4.85347 6.1543 4.0153 6.92197 3.23197C7.68963 2.44864 8.40246 1.76714 9.06046 1.18747C9.1858 1.06214 9.33087 0.972211 9.49568 0.917691C9.6605 0.863171 9.82876 0.835598 10.0005 0.834971C10.1722 0.834345 10.3407 0.861918 10.5062 0.917691C10.6716 0.973465 10.8164 1.06339 10.9405 1.18747C11.5985 1.76714 12.3113 2.44864 13.079 3.23197C13.8466 4.0153 14.5595 4.85347 15.2175 5.74647C15.8755 6.63947 16.4238 7.57163 16.8625 8.54297C17.3011 9.5143 17.5205 10.4856 17.5205 11.457C17.5205 13.6503 16.8039 15.4833 15.3707 16.956C13.9375 18.4286 12.1474 19.165 10.0005 19.165ZM10.259 16.345C10.447 16.3293 10.6077 16.2547 10.7412 16.1212C10.8747 15.9878 10.9411 15.8273 10.9405 15.64C10.9405 15.4206 10.87 15.2445 10.729 15.1117C10.588 14.9788 10.4078 14.9199 10.1885 14.935C9.54613 14.982 8.86463 14.8059 8.14396 14.4067C7.4233 14.0075 6.96897 13.2828 6.78097 12.2325C6.74963 12.0601 6.66754 11.9191 6.53469 11.8095C6.40183 11.6998 6.24893 11.645 6.07597 11.645C5.85663 11.645 5.67647 11.7274 5.53547 11.8922C5.39447 12.057 5.34747 12.2488 5.39447 12.4675C5.6608 13.8931 6.28747 14.9115 7.27447 15.5225C8.26147 16.1335 9.2563 16.4076 10.259 16.345Z"
            fill="#2463EB"
          />
        </svg>
      );
    case "Optium":
      return (
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
            d="M12.9469 5.87503C13.2724 5.54959 13.8 5.54959 14.1254 5.87503C16.4035 8.15308 16.4035 11.8465 14.1254 14.1246C13.8 14.45 13.2724 14.45 12.9469 14.1246C12.6215 13.7992 12.6215 13.2715 12.9469 12.9461C14.5741 11.3189 14.5741 8.68072 12.9469 7.05354C12.6215 6.7281 12.6215 6.20046 12.9469 5.87503Z"
            fill="#059669"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7.05437 5.875C7.37981 6.20043 7.37981 6.72807 7.05437 7.05351C5.42719 8.68069 5.42719 11.3189 7.05437 12.9461C7.37981 13.2715 7.37981 13.7991 7.05437 14.1246C6.72894 14.45 6.2013 14.45 5.87586 14.1246C3.5978 11.8465 3.5978 8.15306 5.87586 5.875C6.2013 5.54956 6.72894 5.54956 7.05437 5.875Z"
            fill="#059669"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.69735 3.518C5.02279 3.84344 5.02279 4.37108 4.69735 4.69651C1.76842 7.62545 1.76842 12.3742 4.69735 15.3031C5.02279 15.6286 5.02279 16.1562 4.69735 16.4816C4.37191 16.8071 3.84428 16.8071 3.51884 16.4816C-0.0609673 12.9018 -0.0609673 7.09781 3.51884 3.518C3.84428 3.19257 4.37191 3.19257 4.69735 3.518Z"
            fill="#059669"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M15.304 3.51804C15.6294 3.1926 16.157 3.1926 16.4825 3.51804C20.0623 7.09785 20.0623 12.9019 16.4825 16.4817C16.157 16.8071 15.6294 16.8071 15.304 16.4817C14.9785 16.1562 14.9785 15.6286 15.304 15.3032C18.2329 12.3742 18.2329 7.62549 15.304 4.69655C14.9785 4.37112 14.9785 3.84348 15.304 3.51804Z"
            fill="#059669"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7.50065 9.99982C7.50065 8.6191 8.61994 7.49982 10.0007 7.49982C11.3814 7.49982 12.5007 8.6191 12.5007 9.99982C12.5007 11.3805 11.3814 12.4998 10.0007 12.4998C8.61994 12.4998 7.50065 11.3805 7.50065 9.99982Z"
            fill="#059669"
          />
        </svg>
      );
    default:
      return null;
  }
};

const utilityAccounts: UtilityAccount[] = [
  {
    id: 1,
    provider: "National Grid",
    account: "#28591-03",
    status: "active",
    lastBillDate: "Oct 1, 2025",
    lastBillAmount: "$420",
    lastImport: "2h ago",
    icon: getProviderIcon("National Grid"),
  },
  {
    id: 2,
    provider: "ConEd",
    account: "#19374-09",
    status: "inactive",
    lastBillDate: "Sep 28, 2025",
    lastBillAmount: "$180",
    lastImport: "4h ago",
    icon: getProviderIcon("ConEd"),
  },
  {
    id: 3,
    provider: "Greenwich Water",
    account: "#57392-02",
    status: "active",
    lastBillDate: "Sep 9, 2025",
    lastBillAmount: "$95",
    lastImport: "2 days ago",
    icon: getProviderIcon("Greenwich Water"),
  },
  {
    id: 4,
    provider: "Optium",
    account: "#95738-08",
    status: "active",
    lastBillDate: "Sep 5, 2025",
    lastBillAmount: "$89",
    lastImport: "3 days ago",
    icon: getProviderIcon("Optium"),
  },
  {
    id: 5,
    provider: "Optium",
    account: "#36829-05",
    status: "active",
    lastBillDate: "Sep 2, 2025",
    lastBillAmount: "$89",
    lastImport: "4 days ago",
    icon: getProviderIcon("Optium"),
  },
];

interface Bill {
  id: number;
  provider: string;
  date: string;
  aiUsageInsight: "High" | "Normal" | "Low";
  changeFromLastBill: string;
  status: "Pushed" | "Push Failed";
  amount: string;
  icon?: React.ReactNode;
}

const bills: Bill[] = [
  {
    id: 1,
    provider: "ConEd",
    date: "Oct 4, 2025",
    aiUsageInsight: "High",
    changeFromLastBill: "↑ 8%",
    status: "Push Failed",
    amount: "$234",
    icon: getProviderIcon("ConEd"),
  },
  {
    id: 2,
    provider: "National Grid",
    date: "Oct 3, 2025",
    aiUsageInsight: "Normal",
    changeFromLastBill: "↓ 1.3%",
    status: "Pushed",
    amount: "$287",
    icon: getProviderIcon("National Grid"),
  },
  {
    id: 3,
    provider: "Greenwich Water",
    date: "Oct 2, 2025",
    aiUsageInsight: "Normal",
    changeFromLastBill: "↓ 9%",
    status: "Pushed",
    amount: "$156",
    icon: getProviderIcon("Greenwich Water"),
  },
  {
    id: 4,
    provider: "Optium",
    date: "Oct 1, 2025",
    aiUsageInsight: "Normal",
    changeFromLastBill: "↑ 7.2%",
    status: "Pushed",
    amount: "$234",
    icon: getProviderIcon("Optium"),
  },
  {
    id: 5,
    provider: "ConEd",
    date: "Oct 1, 2025",
    aiUsageInsight: "Normal",
    changeFromLastBill: "↓ 5%",
    status: "Push Failed",
    amount: "$167",
    icon: getProviderIcon("ConEd"),
  },
  {
    id: 6,
    provider: "National Grid",
    date: "Sep 30, 2025",
    aiUsageInsight: "Normal",
    changeFromLastBill: "↑ 9.4%",
    status: "Pushed",
    amount: "$312",
    icon: getProviderIcon("National Grid"),
  },
  {
    id: 7,
    provider: "Greenwich Water",
    date: "Sep 29, 2025",
    aiUsageInsight: "Normal",
    changeFromLastBill: "↓ 0.8%",
    status: "Pushed",
    amount: "$256",
    icon: getProviderIcon("Greenwich Water"),
  },
  {
    id: 8,
    provider: "Optium",
    date: "Sep 28, 2025",
    aiUsageInsight: "Low",
    changeFromLastBill: "↓ 8.5%",
    status: "Pushed",
    amount: "$178",
    icon: getProviderIcon("Optium"),
  },
  {
    id: 9,
    provider: "ConEd",
    date: "Sep 28, 2025",
    aiUsageInsight: "Normal",
    changeFromLastBill: "↑ 2.1%",
    status: "Pushed",
    amount: "$213",
    icon: getProviderIcon("ConEd"),
  },
  {
    id: 10,
    provider: "Greenwich Water",
    date: "Sep 28, 2025",
    aiUsageInsight: "Normal",
    changeFromLastBill: "↓ 5%",
    status: "Pushed",
    amount: "$145",
    icon: getProviderIcon("Greenwich Water"),
  },
];

export const StatusBadge = ({ status }: { status: "active" | "inactive" }) => {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_approved)">
            <path
              d="M4.99967 8.00004L6.99967 10L10.9997 6.00004M14.6663 8.00004C14.6663 11.6819 11.6816 14.6667 7.99967 14.6667C4.31778 14.6667 1.33301 11.6819 1.33301 8.00004C1.33301 4.31814 4.31778 1.33337 7.99967 1.33337C11.6816 1.33337 14.6663 4.31814 14.6663 8.00004Z"
              stroke="#059669"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_inactive)">
          <path
            d="M8.00065 5.3335V8.00016M8.00065 10.6668H8.00732M14.6673 8.00016C14.6673 11.6821 11.6825 14.6668 8.00065 14.6668C4.31875 14.6668 1.33398 11.6821 1.33398 8.00016C1.33398 4.31826 4.31875 1.3335 8.00065 1.3335C11.6825 1.3335 14.6673 4.31826 14.6673 8.00016Z"
            stroke="#DC2626"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
      Inactive
    </span>
  );
};

export const BillStatusBadge = ({
  status,
}: {
  status: "Pushed" | "Push Failed";
}) => {
  if (status === "Pushed") {
    return (
      <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_pushed)">
            <path
              d="M5.00065 8.00016L7.00065 10.0002L11.0007 6.00016M14.6673 8.00016C14.6673 11.6821 11.6825 14.6668 8.00065 14.6668C4.31875 14.6668 1.33398 11.6821 1.33398 8.00016C1.33398 4.31826 4.31875 1.3335 8.00065 1.3335C11.6825 1.3335 14.6673 4.31826 14.6673 8.00016Z"
              stroke="#059669"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
        Pushed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_failed)">
          <path
            d="M8.00065 5.3335V8.00016M8.00065 10.6668H8.00732M14.6673 8.00016C14.6673 11.6821 11.6825 14.6668 8.00065 14.6668C4.31875 14.6668 1.33398 11.6821 1.33398 8.00016C1.33398 4.31826 4.31875 1.3335 8.00065 1.3335C11.6825 1.3335 14.6673 4.31826 14.6673 8.00016Z"
            stroke="#DC2626"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
      Push Failed
    </span>
  );
};

export const AIInsightBadge = ({
  insight,
}: {
  insight: "High" | "Normal" | "Low";
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const colors = {
    High: "#C24A4A",
    Normal: "#3A71C4",
    Low: "#37A74B",
  };

  const explanations = {
    High: "Usage is above average. Consider optimizing your energy consumption or reviewing connected devices.",
    Normal: "Usage is within normal range. Your consumption is consistent with typical patterns.",
    Low: "Usage is below average. Great job maintaining efficient energy consumption.",
  };

  useEffect(() => {
    if (showTooltip && badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    }
  }, [showTooltip]);

  return (
    <>
      <span
        ref={badgeRef}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl text-sm font-normal cursor-help relative"
        style={{
          color: colors[insight],
          boxShadow:
            "-1px 1px 1px 0 rgba(255, 28, 198, 0.10) inset, 1px -1px 1px 0 rgba(3, 57, 219, 0.10) inset, 2px -2px 5px 0 rgba(3, 57, 219, 0.10) inset, -2px 2px 5px 0 rgba(255, 28, 198, 0.10) inset, 0 0 1px 0 #A3A6D1, 0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)",
          letterSpacing: "-0.32px",
          lineHeight: "140%",
        }}
      >
        {insight}
      </span>

      {showTooltip &&
        createPortal(
          <div
            className="bg-[#303030] text-white px-3 py-2 rounded-lg text-sm max-w-xs shadow-lg z-50 pointer-events-none"
            style={{
              position: "fixed",
              top: tooltipPos.top + "px",
              left: tooltipPos.left + "px",
              transform: "translateX(-50%)",
              whiteSpace: "normal",
              wordWrap: "break-word",
            }}
          >
            {explanations[insight]}
            <div
              className="absolute w-2 h-2 bg-[#303030] transform -top-1 left-1/2 -translate-x-1/2 rotate-45"
              style={{
                position: "absolute",
                top: "-4px",
                left: "50%",
                marginLeft: "-4px",
              }}
            />
          </div>,
          document.body,
        )}
    </>
  );
};

export const ActionButton = ({
  propertyId,
  openMenuId,
  setOpenMenuId,
  onEdit,
  onImport,
  onView,
}: {
  propertyId: number;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  onEdit?: () => void;
  onImport?: () => void;
  onView?: () => void;
}) => {
  const showMenu = openMenuId === propertyId;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    let animationFrameId: number;

    const updateMenuPos = () => {
      if (showMenu && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();

        setMenuPos({
          top: rect.bottom + 8,
          left: rect.right - 145,
        });
      }

      if (showMenu) {
        animationFrameId = requestAnimationFrame(updateMenuPos);
      }
    };

    if (showMenu) {
      updateMenuPos();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showMenu]);

  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(target) &&
        !buttonRef.current.contains(target)
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu, setOpenMenuId]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpenMenuId(showMenu ? null : propertyId)}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
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
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </button>

      {showMenu &&
        createPortal(
          <div
            ref={menuRef}
            className="bg-white flex flex-col justify-center items-start gap-4 p-4"
            style={{
              width: "145px",
              border: "0.5px solid #DADADA",
              borderRadius: "8px",
              boxShadow:
                "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
              zIndex: 99999,
              position: "fixed",
              top: menuPos.top + "px",
              left: menuPos.left + "px",
              pointerEvents: "auto",
            }}
            onMouseLeave={() => setOpenMenuId(null)}
          >
            {onEdit && (
              <button
                onClick={() => {
                  if (onEdit) {
                    onEdit();
                  }
                  setOpenMenuId(null);
                }}
                className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
              >
                <span
                  className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                  style={{
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  }}
                >
                  Edit
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15.75 15.7502H9.75002M1.875 16.1252L6.03695 14.5245C6.30316 14.4221 6.43626 14.3709 6.56079 14.3041C6.6714 14.2447 6.77685 14.1761 6.87603 14.0992C6.98769 14.0125 7.08853 13.9117 7.29021 13.71L15.75 5.25023C16.5784 4.4218 16.5784 3.07865 15.75 2.25023C14.9216 1.4218 13.5784 1.4218 12.75 2.25022L4.29021 10.71C4.08853 10.9117 3.98769 11.0125 3.90104 11.1242C3.82408 11.2234 3.75555 11.3288 3.69618 11.4394C3.62933 11.564 3.57814 11.6971 3.47575 11.9633L1.875 16.1252ZM1.875 16.1252L3.41859 12.1119C3.52905 11.8248 3.58428 11.6812 3.67901 11.6154C3.76179 11.5579 3.86423 11.5362 3.96322 11.5551C4.0765 11.5767 4.18529 11.6855 4.40286 11.9031L6.09718 13.5974C6.31475 13.815 6.42354 13.9237 6.44517 14.037C6.46408 14.136 6.44234 14.2385 6.38486 14.3212C6.31908 14.416 6.17549 14.4712 5.8883 14.5817L1.875 16.1252Z"
                    stroke="#525252"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            {onImport && (
              <button
                onClick={() => {
                  onImport();
                  setOpenMenuId(null);
                }}
                className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
              >
                <span
                  className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                  style={{
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  }}
                >
                  Import
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 1.5V11.25M9 1.5L5.25 5.25M9 1.5L12.75 5.25M2.25 8.25V14.25C2.25 14.8023 2.48705 15.3 2.9051 15.6239C3.32315 15.9477 3.88437 16.125 4.5 16.125H13.5C14.1156 16.125 14.6768 15.9477 15.0949 15.6239C15.513 15.3 15.75 14.8023 15.75 14.25V8.25"
                    stroke="#525252"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            {onView ? (
              <button
                onClick={() => {
                  onView();
                  setOpenMenuId(null);
                }}
                className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
              >
                <span
                  className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                  style={{
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  }}
                >
                  View Bill
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 3C5.13 3 1.83 5.34 1.25 8.5C1.83 11.66 5.13 14 9 14C12.87 14 16.17 11.66 16.75 8.5C16.17 5.34 12.87 3 9 3ZM9 12.5C7.07 12.5 5.5 10.93 5.5 9C5.5 7.07 7.07 5.5 9 5.5C10.93 5.5 12.5 7.07 12.5 9C12.5 10.93 10.93 12.5 9 12.5ZM9 7C8.17 7 7.5 7.67 7.5 8.5C7.5 9.33 8.17 10 9 10C9.83 10 10.5 9.33 10.5 8.5C10.5 7.67 9.83 7 9 7Z"
                    fill="#525252"
                  />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => {
                  console.log("Delete clicked for property", propertyId);
                  setOpenMenuId(null);
                }}
                className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
              >
                <span
                  className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                  style={{
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  }}
                >
                  Delete
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.75 2.25H11.25M2.25 4.5H15.75M14.25 4.5L13.724 12.3895C13.6451 13.5732 13.6057 14.165 13.35 14.6138C13.1249 15.0088 12.7854 15.3265 12.3762 15.5248C11.9115 15.75 11.3183 15.75 10.132 15.75H7.86799C6.68168 15.75 6.08852 15.75 5.62375 15.5248C5.21457 15.3265 4.87507 15.0088 4.64999 14.6138C4.39433 14.165 4.35488 13.5732 4.27596 12.3895L3.75 4.5M7.5 7.875V11.625M10.5 7.875V11.625"
                    stroke="#982740"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
};

interface Column {
  id: string;
  label: string;
  key?: string;
  icon?: React.ReactNode;
  renderCell?: (item: any) => React.ReactNode;
}

interface BillsColumn extends Column {
  key: keyof Bill;
  renderCell?: (bill: Bill) => React.ReactNode;
}

interface UtilityColumn extends Column {
  key: keyof UtilityAccount;
  renderCell?: (account: UtilityAccount) => React.ReactNode;
}

const DEFAULT_UTILITY_COLUMNS: UtilityColumn[] = [
  {
    id: "provider",
    label: "Provider",
    key: "provider",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.49968 1.3335H5.66264C5.54298 1.3335 5.48316 1.3335 5.43034 1.35171C5.38363 1.36783 5.34109 1.39412 5.30579 1.42869C5.26587 1.46778 5.23912 1.5213 5.18561 1.62832L2.38561 7.22831C2.25782 7.48389 2.19393 7.61167 2.20927 7.71555C2.22268 7.80625 2.27285 7.88743 2.34798 7.93998C2.43403 8.00016 2.5769 8.00016 2.86264 8.00016H6.99968L4.99968 14.6668L13.1284 6.23703C13.4027 5.95263 13.5398 5.81043 13.5478 5.68875C13.5548 5.58313 13.5112 5.48049 13.4303 5.41218C13.3371 5.3335 13.1396 5.3335 12.7445 5.3335H7.99968L9.49968 1.3335Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "account",
    label: "Account",
    key: "account",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.33267 2L4.33267 14M11.666 2L9.66599 14M13.666 5.33333H2.33268M12.9993 10.6667H1.66602" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "status",
    label: "Status",
    key: "status",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_status)">
          <path d="M8.00065 10.6668V8.00016M8.00065 5.3335H8.00732M14.6673 8.00016C14.6673 11.6821 11.6825 14.6668 8.00065 14.6668C4.31875 14.6668 1.33398 11.6821 1.33398 8.00016C1.33398 4.31826 4.31875 1.3335 8.00065 1.3335C11.6825 1.3335 14.6673 4.31826 14.6673 8.00016Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </svg>
    ),
    renderCell: (account: UtilityAccount) => <StatusBadge status={account.status} />,
  },
  {
    id: "lastBillDate",
    label: "Last Bill Date",
    key: "lastBillDate",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 6.66683H2M10.6667 1.3335V4.00016M5.33333 1.3335V4.00016M5.2 14.6668H10.8C11.9201 14.6668 12.4802 14.6668 12.908 14.4488C13.2843 14.2571 13.5903 13.9511 13.782 13.5748C14 13.147 14 12.5869 14 11.4668V5.86683C14 4.74672 14 4.18667 13.782 3.75885C13.5903 3.38252 13.2843 3.07656 12.908 2.88482C12.4802 2.66683 11.9201 2.66683 10.8 2.66683H5.2C4.0799 2.66683 3.51984 2.66683 3.09202 2.88482C2.71569 3.07656 2.40973 3.38252 2.21799 3.75885C2 4.18667 2 4.74672 2 5.86683V11.4668C2 12.5869 2 13.147 2.21799 13.5748C2.40973 13.9511 2.71569 14.2571 3.09202 14.4488C3.51984 14.6668 4.0799 14.6668 5.2 14.6668Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "lastBillAmount",
    label: "Last Bill Amount",
    key: "lastBillAmount",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 10.6668C4 12.1396 5.19391 13.3335 6.66667 13.3335H9.33333C10.8061 13.3335 12 12.1396 12 10.6668C12 9.19407 10.8061 8.00016 9.33333 8.00016H6.66667C5.19391 8.00016 4 6.80626 4 5.3335C4 3.86074 5.19391 2.66683 6.66667 2.66683H9.33333C10.8061 2.66683 12 3.86074 12 5.3335M8 1.3335V14.6668" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "lastImport",
    label: "Last Import",
    key: "lastImport",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.1333 9L13.8004 7.66667L12.4666 9M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C10.2013 2 12.1257 3.18542 13.1697 4.95273M8 4.66667V8L10 9.33333" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

const DEFAULT_BILLS_COLUMNS: BillsColumn[] = [
  {
    id: "provider",
    label: "Provider",
    key: "provider",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.49968 1.3335H5.66264C5.54298 1.3335 5.48316 1.3335 5.43034 1.35171C5.38363 1.36783 5.34109 1.39412 5.30579 1.42869C5.26587 1.46778 5.23912 1.5213 5.18561 1.62832L2.38561 7.22831C2.25782 7.48389 2.19393 7.61167 2.20927 7.71555C2.22268 7.80625 2.27285 7.88743 2.34798 7.93998C2.43403 8.00016 2.5769 8.00016 2.86264 8.00016H6.99968L4.99968 14.6668L13.1284 6.23703C13.4027 5.95263 13.5398 5.81043 13.5478 5.68875C13.5548 5.58313 13.5112 5.48049 13.4303 5.41218C13.3371 5.3335 13.1396 5.3335 12.7445 5.3335H7.99968L9.49968 1.3335Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "date",
    label: "Statement Date",
    key: "date",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 6.66683H2M10.6667 1.3335V4.00016M5.33333 1.3335V4.00016M5.2 14.6668H10.8C11.9201 14.6668 12.4802 14.6668 12.908 14.4488C13.2843 14.2571 13.5903 13.9511 13.782 13.5748C14 13.147 14 12.5869 14 11.4668V5.86683C14 4.74672 14 4.18667 13.782 3.75885C13.5903 3.38252 13.2843 3.07656 12.908 2.88482C12.4802 2.66683 11.9201 2.66683 10.8 2.66683H5.2C4.0799 2.66683 3.51984 2.66683 3.09202 2.88482C2.71569 3.07656 2.40973 3.38252 2.21799 3.75885C2 4.18667 2 4.74672 2 5.86683V11.4668C2 12.5869 2 13.147 2.21799 13.5748C2.40973 13.9511 2.71569 14.2571 3.09202 14.4488C3.51984 14.6668 4.0799 14.6668 5.2 14.6668Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "aiUsageInsight",
    label: "AI Usage Insight",
    key: "aiUsageInsight",
    renderCell: (bill: Bill) => <AIInsightBadge insight={bill.aiUsageInsight} />,
  },
  {
    id: "changeFromLastBill",
    label: "Change from Last Bill",
    key: "changeFromLastBill",
    icon: (
      <img
        loading="lazy"
        src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/f3223e08811539f2913d760c3f845a57c3ae8328?placeholderIfAbsent=true"
        alt=""
        style={{
          display: "block",
          height: "14px",
          width: "14px",
          objectFit: "contain",
        }}
      />
    ),
  },
  {
    id: "status",
    label: "Status",
    key: "status",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_status)">
          <path d="M8.00065 10.6668V8.00016M8.00065 5.3335H8.00732M14.6673 8.00016C14.6673 11.6821 11.6825 14.6668 8.00065 14.6668C4.31875 14.6668 1.33398 11.6821 1.33398 8.00016C1.33398 4.31826 4.31875 1.3335 8.00065 1.3335C11.6825 1.3335 14.6673 4.31826 14.6673 8.00016Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </svg>
    ),
    renderCell: (bill: Bill) => <BillStatusBadge status={bill.status} />,
  },
  {
    id: "amount",
    label: "Amount",
    key: "amount",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 10.6668C4 12.1396 5.19391 13.3335 6.66667 13.3335H9.33333C10.8061 13.3335 12 12.1396 12 10.6668C12 9.19407 10.8061 8.00016 9.33333 8.00016H6.66667C5.19391 8.00016 4 6.80626 4 5.3335C4 3.86074 5.19391 2.66683 6.66667 2.66683H9.33333C10.8061 2.66683 12 3.86074 12 5.3335M8 1.3335V14.6668" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function Utilities() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = usePageState("currentPage", 1);
  const [itemsPerPage, setItemsPerPage] = usePageState("itemsPerPage", 50);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = usePageState(
    "showPageSizeDropdown",
    false,
  );
  const [openMenuId, setOpenMenuId] = usePageState<number | null>(
    "openMenuId",
    null,
  );
  const [openUtilityMenuId, setOpenUtilityMenuId] = usePageState<number | null>(
    "openUtilityMenuId",
    null,
  );
  const [billsColumns, setBillsColumns] = useState<BillsColumn[]>(DEFAULT_BILLS_COLUMNS);
  const [utilityColumns, setUtilityColumns] = useState<UtilityColumn[]>(DEFAULT_UTILITY_COLUMNS);
  const [draggedColumn, setDraggedColumn] = useState<{id: string; source: "bills" | "utility"} | null>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const savedBillsOrder = localStorage.getItem("table-columns:bills");
    const savedUtilityOrder = localStorage.getItem("table-columns:utility");

    if (savedBillsOrder) {
      try {
        const columnIds = JSON.parse(savedBillsOrder);
        const reorderedColumns = columnIds
          .map((id: string) => DEFAULT_BILLS_COLUMNS.find((col) => col.id === id))
          .filter((col): col is BillsColumn => col !== undefined);
        if (reorderedColumns.length === DEFAULT_BILLS_COLUMNS.length) {
          setBillsColumns(reorderedColumns);
        }
      } catch {
        setBillsColumns(DEFAULT_BILLS_COLUMNS);
      }
    }

    if (savedUtilityOrder) {
      try {
        const columnIds = JSON.parse(savedUtilityOrder);
        const reorderedColumns = columnIds
          .map((id: string) => DEFAULT_UTILITY_COLUMNS.find((col) => col.id === id))
          .filter((col): col is UtilityColumn => col !== undefined);
        if (reorderedColumns.length === DEFAULT_UTILITY_COLUMNS.length) {
          setUtilityColumns(reorderedColumns);
        }
      } catch {
        setUtilityColumns(DEFAULT_UTILITY_COLUMNS);
      }
    }
  }, []);

  const saveColumnsToLocalStorage = (columns: BillsColumn[] | UtilityColumn[], source: "bills" | "utility") => {
    const columnIds = columns.map((col) => col.id);
    localStorage.setItem(`table-columns:${source}`, JSON.stringify(columnIds));
  };

  const handleColumnMouseDown = (columnId: string, source: "bills" | "utility") => {
    setDraggedColumn({ id: columnId, source });
  };

  const handleColumnMouseEnter = (targetColumnId: string, source: "bills" | "utility") => {
    if (!draggedColumn || draggedColumn.source !== source || draggedColumn.id === targetColumnId) {
      return;
    }

    if (source === "bills") {
      const draggedIndex = billsColumns.findIndex((col) => col.id === draggedColumn.id);
      const targetIndex = billsColumns.findIndex((col) => col.id === targetColumnId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      const newColumns = Array.from(billsColumns);
      const [removed] = newColumns.splice(draggedIndex, 1);
      newColumns.splice(targetIndex, 0, removed);

      setBillsColumns(newColumns);
      saveColumnsToLocalStorage(newColumns, "bills");
      setDraggedColumn({ id: targetColumnId, source });
    } else {
      const draggedIndex = utilityColumns.findIndex((col) => col.id === draggedColumn.id);
      const targetIndex = utilityColumns.findIndex((col) => col.id === targetColumnId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      const newColumns = Array.from(utilityColumns);
      const [removed] = newColumns.splice(draggedIndex, 1);
      newColumns.splice(targetIndex, 0, removed);

      setUtilityColumns(newColumns);
      saveColumnsToLocalStorage(newColumns, "utility");
      setDraggedColumn({ id: targetColumnId, source });
    }
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setDraggedColumn(null);
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const updateDropdownPos = () => {
      if (showPageSizeDropdown && dropdownButtonRef.current) {
        const rect = dropdownButtonRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }

      if (showPageSizeDropdown) {
        animationFrameId = requestAnimationFrame(updateDropdownPos);
      }
    };

    if (showPageSizeDropdown) {
      updateDropdownPos();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showPageSizeDropdown]);

  const totalProperties = properties.length;
  const totalPages = Math.ceil(totalProperties / itemsPerPage);

  const getPaginationNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 1) {
      return [1];
    }

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // For totalPages > 7, show exactly 7 consecutive pages without ellipsis
    const windowSize = 7;
    let start = Math.max(1, currentPage - 2);
    let end = start + windowSize - 1;

    // Adjust if we're near the end to keep showing 7 pages
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - windowSize + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <PropertiesTemplate activeTab="Utilities">
      {/* High Usage Insight Banner */}
      <div
        className="flex justify-between items-center self-stretch rounded-2xl border border-[#E5E5FF] px-4 py-3"
        style={{
          boxShadow:
            "4px -4px 14px 0 rgba(0, 28, 237, 0.07) inset, -4px 4px 14px 0 rgba(237, 0, 217, 0.07) inset",
        }}
      >
        <div className="flex items-center gap-2.5">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_star)">
              <path
                d="M3 14.6668V11.3335M3 4.66683V1.3335M1.33333 3.00016H4.66667M1.33333 13.0002H4.66667M8.66667 2.00016L7.51047 5.00607C7.32246 5.49489 7.22845 5.7393 7.08227 5.94489C6.95271 6.12709 6.79352 6.28629 6.61131 6.41585C6.40572 6.56203 6.16131 6.65604 5.67249 6.84404L2.66659 8.00016L5.67249 9.15628C6.16131 9.34429 6.40572 9.43829 6.61131 9.58448C6.79352 9.71404 6.95271 9.87323 7.08227 10.0554C7.22845 10.261 7.32246 10.5054 7.51047 10.9943L8.66659 14.0002L9.8227 10.9943C10.0107 10.5054 10.1047 10.261 10.2509 10.0554C10.3805 9.87323 10.5397 9.71404 10.7219 9.58448C10.9274 9.43829 11.1719 9.34429 11.6607 9.15628L14.6666 8.00016L11.6607 6.84404C11.1719 6.65604 10.9274 6.56203 10.7219 6.41585C10.5397 6.28629 10.3805 6.12709 10.2509 5.94489C10.1047 5.7393 10.0107 5.49489 9.8227 5.00607L8.66667 2.00016Z"
                stroke="#1D407F"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_star">
                <rect width="16" height="16" fill="white" />
              </clipPath>
            </defs>
          </svg>
          <div className="font-medium text-base leading-[140%] tracking-[-0.32px] capitalize">
            <span className="font-bold">High Usage</span>
            <span>
              {" "}
              -Electric usage increased 23% compared to last month. Consider
              energy audit.
            </span>
          </div>
        </div>
        <a
          href="#"
          className="text-[#013764] font-medium text-base leading-[140%] tracking-[-0.32px] capitalize underline hover:no-underline"
        >
          View All Insights
        </a>
      </div>

      {/* Metrics Cards */}
      <div className="flex items-start content-start gap-4 self-stretch flex-wrap">
        {/* Last Bill Imported Card */}
        <div className="flex w-[307px] h-[116px] flex-col items-start gap-4 p-4 rounded-xl border border-[#E9EFF4] shadow-[0_1px_3px_0_rgba(25,54,73,0.03)]">
          <div className="flex items-center self-stretch">
            <div className="flex-1 text-[#717179] font-medium text-base leading-[18px]">
              Last Bill Imported
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.99992 8.6665C8.36811 8.6665 8.66659 8.36803 8.66659 7.99984C8.66659 7.63165 8.36811 7.33317 7.99992 7.33317C7.63173 7.33317 7.33325 7.63165 7.33325 7.99984C7.33325 8.36803 7.63173 8.6665 7.99992 8.6665Z"
                stroke="#303030"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.99992 3.99984C8.36811 3.99984 8.66659 3.70136 8.66659 3.33317C8.66659 2.96498 8.36811 2.6665 7.99992 2.6665C7.63173 2.6665 7.33325 2.96498 7.33325 3.33317C7.33325 3.70136 7.63173 3.99984 7.99992 3.99984Z"
                stroke="#303030"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.99992 13.3332C8.36811 13.3332 8.66659 13.0347 8.66659 12.6665C8.66659 12.2983 8.36811 11.9998 7.99992 11.9998C7.63173 11.9998 7.33325 12.2983 7.33325 12.6665C7.33325 13.0347 7.63173 13.3332 7.99992 13.3332Z"
                stroke="#303030"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1.5 self-stretch">
            <div className="text-[#303030] font-medium text-[26px] leading-[34px]">
              Sep 10 2025
            </div>
          </div>
        </div>

        {/* Active Accounts Card */}
        <div className="flex h-[116px] flex-col items-start gap-4 flex-1 p-4 rounded-xl border border-[#E5E5E5] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
          <div className="flex items-center self-stretch">
            <div className="flex-1 text-[#717179] font-medium text-base leading-[18px]">
              Active Accounts
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.99992 8.6665C8.36811 8.6665 8.66659 8.36803 8.66659 7.99984C8.66659 7.63165 8.36811 7.33317 7.99992 7.33317C7.63173 7.33317 7.33325 7.63165 7.33325 7.99984C7.33325 8.36803 7.63173 8.6665 7.99992 8.6665Z"
                stroke="#303030"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.99992 3.99984C8.36811 3.99984 8.66659 3.70136 8.66659 3.33317C8.66659 2.96498 8.36811 2.6665 7.99992 2.6665C7.63173 2.6665 7.33325 2.96498 7.33325 3.33317C7.33325 3.70136 7.63173 3.99984 7.99992 3.99984Z"
                stroke="#303030"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.99992 13.3332C8.36811 13.3332 8.66659 13.0347 8.66659 12.6665C8.66659 12.2983 8.36811 11.9998 7.99992 11.9998C7.63173 11.9998 7.33325 12.2983 7.33325 12.6665C7.33325 13.0347 7.63173 13.3332 7.99992 13.3332Z"
                stroke="#303030"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-end gap-2 self-stretch">
            <div className="text-[#303030] font-medium text-[26px] leading-[28px]">
              5 Accounts
            </div>
            <div className="text-[#717179] font-normal text-sm leading-5">
              1 account inactive
            </div>
          </div>
        </div>

        {/* Total YoY Utility Spend Card */}
        <div className="flex flex-col items-start gap-3 flex-1 p-4 rounded-xl border border-[#E5E5E5] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
          <div className="flex items-center self-stretch">
            <div className="flex-1 text-[#717179] font-medium text-base leading-[18px]">
              Total YoY Utility Spend Change Spend
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.99992 8.6665C8.36811 8.6665 8.66659 8.36803 8.66659 7.99984C8.66659 7.63165 8.36811 7.33317 7.99992 7.33317C7.63173 7.33317 7.33325 7.63165 7.33325 7.99984C7.33325 8.36803 7.63173 8.6665 7.99992 8.6665Z"
                stroke="#303030"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.99992 3.99984C8.36811 3.99984 8.66659 3.70136 8.66659 3.33317C8.66659 2.96498 8.36811 2.6665 7.99992 2.6665C7.63173 2.6665 7.33325 2.96498 7.33325 3.33317C7.33325 3.70136 7.63173 3.99984 7.99992 3.99984Z"
                stroke="#303030"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.99992 13.3332C8.36811 13.3332 8.66659 13.0347 8.66659 12.6665C8.66659 12.2983 8.36811 11.9998 7.99992 11.9998C7.63173 11.9998 7.33325 12.2983 7.33325 12.6665C7.33325 13.0347 7.63173 13.3332 7.99992 13.3332Z"
                stroke="#303030"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-end self-stretch">
            <div className="flex flex-col justify-center items-start gap-1">
              <div className="text-[#303030] font-medium text-[26px] leading-[34px]">
                $2,120
              </div>
              <div className="flex items-start gap-1.5">
                <div className="flex items-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.0347 4.36018C2.06908 4.25359 2.12733 4.16248 2.20206 4.09837C2.2768 4.03426 2.36467 4.00002 2.45457 4H11.5451C11.6351 3.99991 11.723 4.03407 11.7978 4.09816C11.8726 4.16224 11.9309 4.25338 11.9654 4.36002C11.9998 4.46666 12.0088 4.58401 11.9912 4.69722C11.9737 4.81043 11.9303 4.9144 11.8667 4.99598L7.32142 10.8289C7.27921 10.8832 7.22908 10.9262 7.1739 10.9555C7.11872 10.9849 7.05957 11 6.99984 11C6.94011 11 6.88096 10.9849 6.82578 10.9555C6.7706 10.9262 6.72048 10.8832 6.67826 10.8289L2.13299 4.99598C2.06944 4.91436 2.02619 4.81039 2.00869 4.69721C1.99119 4.58404 2.00024 4.46675 2.0347 4.36018Z"
                      fill="#982740"
                    />
                  </svg>
                  <div className="text-[#982740] font-medium text-xs leading-normal">
                    -12.3%
                  </div>
                </div>
                <div className="text-[#717179] font-normal text-sm leading-4">
                  vs last month
                </div>
              </div>
            </div>
            <div className="flex justify-center items-center flex-1 relative" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Utility Accounts Table */}
        <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-4">
              <h2 className="text-[#303030] font-medium text-[22px] leading-6">
                Utility Accounts
              </h2>
            </div>
            <div className="flex items-start gap-2.5">
              <button className="flex h-9 justify-center items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors">
                <span className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize">
                  Filter
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4.5 6.75L9 11.25L13.5 6.75"
                    stroke="#303030"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button className="flex h-9 items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 4.16667V15.8333M4.16667 10H15.8333"
                    stroke="#303030"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px]">
                  Add Account
                </span>
              </button>
              <button className="flex h-9 justify-center items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors">
                <span className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize">
                  Import
                </span>
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 h-12">
                  {utilityColumns.map((column) => (
                    <th
                      key={column.id}
                      onMouseDown={() => handleColumnMouseDown(column.id, "utility")}
                      onMouseEnter={() => handleColumnMouseEnter(column.id, "utility")}
                      className={`px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap user-select-none transition-all select-none ${
                        draggedColumn?.id === column.id && draggedColumn?.source === "utility"
                          ? "bg-blue-50 border-l-4 border-l-blue-500 opacity-75 cursor-grabbing"
                          : draggedColumn && draggedColumn?.source === "utility"
                          ? "opacity-60 cursor-grab hover:bg-gray-200"
                          : "cursor-grab hover:bg-gray-100"
                      }`}
                      style={{
                        backgroundColor:
                          draggedColumn?.id === column.id && draggedColumn?.source === "utility"
                            ? "rgb(219, 234, 254)"
                            : undefined,
                      }}
                    >
                      <div className="flex items-center gap-2 select-none pointer-events-auto">
                        {column.icon}
                        <span className="font-medium text-sm text-gray-700">
                          {column.label}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th
                    className="sticky right-0 px-2 py-3 text-center w-20"
                    style={{
                      borderLeftWidth: "2px",
                      border: "1px none rgb(226, 232, 240)",
                      backgroundColor: "white",
                    }}
                  >
                    <span className="font-medium text-sm text-gray-700">
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {utilityAccounts.map((account, index) => (
                  <tr
                    key={account.id}
                    className={cn(
                      "hover:bg-gray-50 transition-colors h-12",
                      index === utilityAccounts.length - 1
                        ? "border-b-0"
                        : "border-b border-gray-200",
                    )}
                  >
                    {utilityColumns.map((column) => (
                      <td
                        key={`${account.id}-${column.id}`}
                        className="px-3 py-3 border-r border-gray-200 whitespace-nowrap"
                      >
                        {column.id === "provider" ? (
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                              {account.icon}
                            </div>
                            <span className="text-gray-900 font-normal text-base">
                              {account[column.key]}
                            </span>
                          </div>
                        ) : column.renderCell ? (
                          column.renderCell(account)
                        ) : (
                          <span className="text-gray-900 font-normal text-base">
                            {account[column.key]}
                          </span>
                        )}
                      </td>
                    ))}
                    <td
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
                        propertyId={account.id}
                        openMenuId={openUtilityMenuId}
                        setOpenMenuId={setOpenUtilityMenuId}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bills Table */}
        <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-4">
              <h2 className="text-[#303030] font-medium text-[22px] leading-6">
                Bills
              </h2>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex h-9 items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
                    stroke="#303030"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search..."
                  className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize bg-transparent border-none outline-none placeholder:text-[#303030] w-32 sm:w-48"
                />
              </div>
              <button className="flex h-9 justify-center items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors">
                <span className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize">
                  Filter
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4.5 6.75L9 11.25L13.5 6.75"
                    stroke="#303030"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 h-12">
                  {billsColumns.map((column) => (
                    <th
                      key={column.id}
                      onMouseDown={() => handleColumnMouseDown(column.id, "bills")}
                      onMouseEnter={() => handleColumnMouseEnter(column.id, "bills")}
                      className={`px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap user-select-none transition-all select-none ${
                        draggedColumn?.id === column.id && draggedColumn?.source === "bills"
                          ? "bg-blue-50 border-l-4 border-l-blue-500 opacity-75 cursor-grabbing"
                          : draggedColumn && draggedColumn?.source === "bills"
                          ? "opacity-60 cursor-grab hover:bg-gray-200"
                          : "cursor-grab hover:bg-gray-100"
                      }`}
                      style={{
                        backgroundColor:
                          draggedColumn?.id === column.id && draggedColumn?.source === "bills"
                            ? "rgb(219, 234, 254)"
                            : undefined,
                      }}
                    >
                      <div className="flex items-center gap-2 select-none pointer-events-auto">
                        {column.icon}
                        <span className="font-medium text-sm text-gray-700">
                          {column.label}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th
                    className="sticky right-0 px-2 py-3 text-center w-20"
                    style={{
                      borderLeftWidth: "2px",
                      border: "1px none rgb(226, 232, 240)",
                      backgroundColor: "white",
                    }}
                  >
                    <span className="font-medium text-sm text-gray-700">
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill, index) => (
                  <tr
                    key={bill.id}
                    className={cn(
                      "hover:bg-gray-50 transition-colors h-12",
                      index === bills.length - 1
                        ? "border-b-0"
                        : "border-b border-gray-200",
                    )}
                  >
                    {billsColumns.map((column) => (
                      <td
                        key={`${bill.id}-${column.id}`}
                        className="px-3 py-3 border-r border-gray-200 whitespace-nowrap"
                      >
                        {column.id === "provider" ? (
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                              {bill.icon}
                            </div>
                            <span className="text-gray-900 font-normal text-base">
                              {bill[column.key]}
                            </span>
                          </div>
                        ) : column.id === "changeFromLastBill" ? (
                          <span
                            className={cn(
                              "text-sm font-medium",
                              (bill[column.key] as string).startsWith("↑")
                                ? "text-red-600"
                                : "text-green-600",
                            )}
                          >
                            {bill[column.key]}
                          </span>
                        ) : column.renderCell ? (
                          column.renderCell(bill)
                        ) : (
                          <span className="text-gray-900 font-normal text-base">
                            {bill[column.key]}
                          </span>
                        )}
                      </td>
                    ))}
                    <td
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
                        propertyId={bill.id}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        onView={() => {
                          navigate("/utilities/view-bill?readOnly=true");
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div
            className="flex justify-between items-center px-6 py-4 bg-white gap-4 relative border-t border-gray-200"
            style={{ position: "relative", zIndex: 1, overflow: "visible" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-gray-700 text-sm font-medium">Showing</span>
              <div
                className="relative"
                style={{ position: "relative", zIndex: 10 }}
              >
                <button
                  ref={dropdownButtonRef}
                  onClick={() => setShowPageSizeDropdown(!showPageSizeDropdown)}
                  className="flex items-center justify-center gap-2 h-10 px-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors text-gray-900 font-medium text-sm relative"
                  style={{
                    borderColor: "rgb(218, 218, 218)",
                    borderWidth: "0.909091px",
                    boxShadow:
                      "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
                  }}
                >
                  <div className="text-gray-900 font-medium text-sm">
                    {itemsPerPage}
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>
              <span className="text-gray-700 text-sm font-medium">
                of {bills.length}
              </span>
            </div>
            <div
              className="flex items-center rounded-lg border bg-white overflow-hidden"
              style={{
                borderColor: "rgb(218, 218, 218)",
                borderWidth: "0.909091px",
                boxShadow:
                  "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
              }}
            >
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className={cn(
                  "flex items-center justify-center gap-1.5 h-10 px-3 transition-colors",
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50",
                )}
                style={{
                  borderRightWidth: "0.909091px",
                  borderRightColor: "rgb(229, 229, 229)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={
                    currentPage === 1 ? "rgb(163, 163, 163)" : "currentColor"
                  }
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>
                <div
                  className={cn(
                    "font-medium text-sm",
                    currentPage === 1 ? "text-gray-400" : "text-gray-700",
                  )}
                >
                  Previous
                </div>
              </button>
              {getPaginationNumbers().map((page, idx) => {
                if (page === "...") {
                  return (
                    <button
                      key={`ellipsis-${idx}`}
                      disabled
                      className="flex items-center justify-center h-10 min-w-10 opacity-50 cursor-not-allowed"
                      style={{
                        borderRightWidth: "0.909091px",
                        borderRightColor: "rgb(229, 229, 229)",
                        backgroundColor: "rgba(0, 0, 0, 0)",
                      }}
                    >
                      <div className="text-gray-500 font-medium text-sm">
                        ...
                      </div>
                    </button>
                  );
                }

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page as number)}
                    className={cn(
                      "flex items-center justify-center h-10 min-w-10 transition-colors",
                      currentPage === page
                        ? "hover:bg-gray-50"
                        : "hover:bg-gray-50",
                    )}
                    style={{
                      borderRightWidth: "0.909091px",
                      borderRightColor: "rgb(229, 229, 229)",
                      backgroundColor:
                        currentPage === page ? "white" : "rgba(0, 0, 0, 0)",
                    }}
                  >
                    <div
                      className={cn(
                        "font-medium text-sm",
                        currentPage === page
                          ? "text-gray-900 font-bold"
                          : "text-gray-500",
                      )}
                    >
                      {page}
                    </div>
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                className={cn(
                  "flex items-center justify-center gap-1.5 h-10 px-3 transition-colors hover:bg-gray-50",
                )}
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0)",
                }}
              >
                <div className={cn("font-medium text-sm text-gray-700")}>
                  Next
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={
                    currentPage === totalPages
                      ? "rgb(163, 163, 163)"
                      : "currentColor"
                  }
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Dropdown Menu - Rendered via Portal at body level */}
      {showPageSizeDropdown &&
        createPortal(
          <div
            className="bg-white overflow-hidden"
            style={{
              border: "0.5px solid #DADADA",
              borderRadius: "8px",
              boxShadow:
                "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
              zIndex: 99999,
              minWidth: "56px",
              width: "56px",
              position: "fixed",
              top: dropdownPos.top + "px",
              left: dropdownPos.left + "px",
              pointerEvents: "auto",
            }}
            onMouseLeave={() => setShowPageSizeDropdown(false)}
          >
            {[10, 25, 50].map((size, index) => (
              <button
                key={size}
                onClick={() => {
                  setItemsPerPage(size);
                  setCurrentPage(1);
                  setShowPageSizeDropdown(false);
                }}
                className={cn(
                  "w-full px-4 py-3 text-center text-base transition-colors whitespace-nowrap",
                  itemsPerPage === size
                    ? "bg-gray-50 font-medium text-gray-900"
                    : "text-[#303030] hover:bg-gray-50",
                )}
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  fontSize: "16px",
                  lineHeight: "140%",
                  letterSpacing: "-0.32px",
                  borderRadius: index === 2 ? "0 0 8px 8px" : "0",
                }}
              >
                {size}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </PropertiesTemplate>
  );
}
