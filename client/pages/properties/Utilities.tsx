import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  StatusBadge,
  BillStatusBadge,
  AIInsightBadge,
  ActionButton,
} from "../Utilities";
import EditUtilityAccountModal from "@/components/EditUtilityAccountModal";

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

interface UtilitiesProps {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
}

export const Utilities: React.FC<UtilitiesProps> = ({
  propertyAddress,
  propertyType,
  propertyUnits,
}) => {
  const navigate = useNavigate();
  const [openUtilityMenuId, setOpenUtilityMenuId] = useState<number | null>(
    null,
  );
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [billsCurrentPage, setBillsCurrentPage] = useState<number>(1);
  const [billsItemsPerPage, setBillsItemsPerPage] = useState<number>(10);
  const [showBillsPageSizeDropdown, setShowBillsPageSizeDropdown] = useState<boolean>(false);
  const billsDropdownButtonRef = useRef<HTMLButtonElement>(null);
  const billsDropdownMenuRef = useRef<HTMLDivElement>(null);
  const [billsDropdownPos, setBillsDropdownPos] = useState({ top: 0, left: 0 });
  const [isEditUtilityModalOpen, setIsEditUtilityModalOpen] = useState<boolean>(false);
  const [editingUtilityAccount, setEditingUtilityAccount] = useState<UtilityAccount | null>(null);
  const [utilityModalMode, setUtilityModalMode] = useState<"add" | "edit">("edit");
  const [importStatus, setImportStatus] = useState<"idle" | "importing" | "imported" | "failed">("idle");
  const [accountImportStatus, setAccountImportStatus] = useState<{ [key: number]: "idle" | "importing" | "imported" | "failed" }>({});
  const [accountLastImport, setAccountLastImport] = useState<{ [key: number]: string }>(
    utilityAccounts.reduce((acc, account) => ({ ...acc, [account.id]: account.lastImport }), {})
  );

  useEffect(() => {
    let animationFrameId: number;

    const updateDropdownPos = () => {
      if (showBillsPageSizeDropdown && billsDropdownButtonRef.current) {
        const rect = billsDropdownButtonRef.current.getBoundingClientRect();
        setBillsDropdownPos({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }

      if (showBillsPageSizeDropdown) {
        animationFrameId = requestAnimationFrame(updateDropdownPos);
      }
    };

    if (showBillsPageSizeDropdown) {
      updateDropdownPos();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showBillsPageSizeDropdown]);

  useEffect(() => {
    if (!showBillsPageSizeDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        billsDropdownMenuRef.current &&
        billsDropdownButtonRef.current &&
        !billsDropdownMenuRef.current.contains(target) &&
        !billsDropdownButtonRef.current.contains(target)
      ) {
        setShowBillsPageSizeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showBillsPageSizeDropdown]);

  const billsTotalPages = Math.ceil(bills.length / billsItemsPerPage);

  const getBillsPaginationNumbers = () => {
    const pages: (number | string)[] = [];

    if (billsTotalPages <= 1) {
      return [1];
    }

    if (billsTotalPages <= 7) {
      for (let i = 1; i <= billsTotalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    const windowSize = 7;
    let start = Math.max(1, billsCurrentPage - 2);
    let end = start + windowSize - 1;

    if (end > billsTotalPages) {
      end = billsTotalPages;
      start = Math.max(1, end - windowSize + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="flex flex-col gap-6">
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
        <div
          className="flex w-[307px] h-[116px] flex-col items-start gap-4 p-4 rounded-xl border border-[#E9EFF4] shadow-[0_1px_3px_0_rgba(25,54,73,0.03)]"
          style={{ backgroundColor: "#f3f1fe" }}
        >
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

      {/* Utility Accounts Table */}
      <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
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
            <button
              onClick={() => {
                setEditingUtilityAccount(null);
                setUtilityModalMode("add");
                setIsEditUtilityModalOpen(true);
              }}
              className="flex h-9 justify-center items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-[#fbfbfb] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-100 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#303030] w-5 h-5"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Add Account
            </button>
            <button
              onClick={() => {
                setImportStatus("importing");

                // Trigger import for all utility accounts
                utilityAccounts.forEach((account) => {
                  setAccountImportStatus(prev => ({ ...prev, [account.id]: "importing" }));
                  setAccountLastImport(prev => ({ ...prev, [account.id]: "Importing..." }));
                });

                setTimeout(() => {
                  const randomFailure = Math.random() < 0.3;
                  let hasFailures = false;

                  // Process each account
                  utilityAccounts.forEach((account) => {
                    const accountFailure = Math.random() < 0.3;
                    if (accountFailure) {
                      hasFailures = true;
                      setAccountImportStatus(prev => ({ ...prev, [account.id]: "failed" }));
                      setAccountLastImport(prev => ({ ...prev, [account.id]: "failed" }));
                    } else {
                      setAccountImportStatus(prev => ({ ...prev, [account.id]: "imported" }));
                      setAccountLastImport(prev => ({ ...prev, [account.id]: "Imported" }));
                      setTimeout(() => {
                        setAccountImportStatus(prev => ({ ...prev, [account.id]: "idle" }));
                        setAccountLastImport(prev => ({ ...prev, [account.id]: "1 min ago" }));
                      }, 1500);
                    }
                  });

                  // Set universal button status based on overall results
                  if (hasFailures) {
                    setImportStatus("failed");
                  } else {
                    setImportStatus("imported");
                    setTimeout(() => {
                      setImportStatus("idle");
                    }, 2000);
                  }
                }, 1500);
              }}
              disabled={importStatus === "importing"}
              className={cn(
                "flex h-9 items-center gap-2 px-3 rounded-lg border border-white shadow-[0_0_10px_rgba(0,0,0,0.2),0_0_0_1px_rgb(0,45,90)] transition-colors disabled:opacity-70",
                importStatus === "failed"
                  ? "bg-red-700 hover:bg-red-800"
                  : "bg-[#013564] hover:bg-[#012a4d]"
              )}
            >
              <span className="text-white font-medium text-base leading-[140%] tracking-[-0.32px]">
                {importStatus === "idle" && "Import"}
                {importStatus === "importing" && "Importing..."}
                {importStatus === "imported" && "Imported"}
                {importStatus === "failed" && "Import Failed"}
              </span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 h-12">
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.49968 1.3335H5.66264C5.54298 1.3335 5.48316 1.3335 5.43034 1.35171C5.38363 1.36783 5.34109 1.39412 5.30579 1.42869C5.26587 1.46778 5.23912 1.5213 5.18561 1.62832L2.38561 7.22831C2.25782 7.48389 2.19393 7.61167 2.20927 7.71555C2.22268 7.80625 2.27285 7.88743 2.34798 7.93998C2.43403 8.00016 2.5769 8.00016 2.86264 8.00016H6.99968L4.99968 14.6668L13.1284 6.23703C13.4027 5.95263 13.5398 5.81043 13.5478 5.68875C13.5548 5.58313 13.5112 5.48049 13.4303 5.41218C13.3371 5.3335 13.1396 5.3335 12.7445 5.3335H7.99968L9.49968 1.3335Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Provider
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.33267 2L4.33267 14M11.666 2L9.66599 14M13.666 5.33333H2.33268M12.9993 10.6667H1.66602" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Account
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath="url(#clip0_status)">
                        <path d="M8.00065 10.6668V8.00016M8.00065 5.3335H8.00732M14.6673 8.00016C14.6673 11.6821 11.6825 14.6668 8.00065 14.6668C4.31875 14.6668 1.33398 11.6821 1.33398 8.00016C1.33398 4.31826 4.31875 1.3335 8.00065 1.3335C11.6825 1.3335 14.6673 4.31826 14.6673 8.00016Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </g>
                      <defs>
                        <clipPath id="clip0_status">
                          <rect width="16" height="16" fill="white"/>
                        </clipPath>
                      </defs>
                    </svg>
                    Status
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 6.66683H2M10.6667 1.3335V4.00016M5.33333 1.3335V4.00016M5.2 14.6668H10.8C11.9201 14.6668 12.4802 14.6668 12.908 14.4488C13.2843 14.2571 13.5903 13.9511 13.782 13.5748C14 13.147 14 12.5869 14 11.4668V5.86683C14 4.74672 14 4.18667 13.782 3.75885C13.5903 3.38252 13.2843 3.07656 12.908 2.88482C12.4802 2.66683 11.9201 2.66683 10.8 2.66683H5.2C4.0799 2.66683 3.51984 2.66683 3.09202 2.88482C2.71569 3.07656 2.40973 3.38252 2.21799 3.75885C2 4.18667 2 4.74672 2 5.86683V11.4668C2 12.5869 2 13.147 2.21799 13.5748C2.40973 13.9511 2.71569 14.2571 3.09202 14.4488C3.51984 14.6668 4.0799 14.6668 5.2 14.6668Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Last Bill Date
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 10.6668C4 12.1396 5.19391 13.3335 6.66667 13.3335H9.33333C10.8061 13.3335 12 12.1396 12 10.6668C12 9.19407 10.8061 8.00016 9.33333 8.00016H6.66667C5.19391 8.00016 4 6.80626 4 5.3335C4 3.86074 5.19391 2.66683 6.66667 2.66683H9.33333C10.8061 2.66683 12 3.86074 12 5.3335M8 1.3335V14.6668" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Last Bill Amount
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15.1333 9L13.8004 7.66667L12.4666 9M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C10.2013 2 12.1257 3.18542 13.1697 4.95273M8 4.66667V8L10 9.33333" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Last Import
                  </span>
                </th>
                <th className="sticky right-0 px-2 py-3 text-center w-20">
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
                  <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                        {account.icon}
                      </div>
                      <span className="text-gray-900 font-normal text-base">
                        {account.provider}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                    <span className="text-gray-900 font-normal text-base">
                      {account.account}
                    </span>
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                    <StatusBadge status={account.status} />
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                    <span className="text-gray-900 font-normal text-base">
                      {account.lastBillDate}
                    </span>
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                    <span className="text-gray-900 font-normal text-base">
                      {account.lastBillAmount}
                    </span>
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                    {accountImportStatus[account.id] === "failed" ? (
                      <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_failed)">
                            <path d="M8.00065 5.3335V8.00016M8.00065 10.6668H8.00732M14.6673 8.00016C14.6673 11.6821 11.6825 14.6668 8.00065 14.6668C4.31875 14.6668 1.33398 11.6821 1.33398 8.00016C1.33398 4.31826 4.31875 1.3335 8.00065 1.3335C11.6825 1.3335 14.6673 4.31826 14.6673 8.00016Z" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </g>
                        </svg>
                        Import Failed
                      </span>
                    ) : (
                      <span className="text-gray-900 font-normal text-base">
                        {accountLastImport[account.id] || account.lastImport}
                      </span>
                    )}
                  </td>
                  <td
                    className="sticky right-0 px-2 py-3 flex items-center justify-center"
                    style={{
                      borderLeftWidth: "2px",
                      width: "80px",
                      border:
                        "1px none rgb(226, 232, 240) rgb(226, 232, 240) rgb(226, 232, 240) rgb(210, 209, 207)",
                      borderLeftColor: "transparent",
                    }}
                  >
                    <ActionButton
                      propertyId={account.id}
                      openMenuId={openUtilityMenuId}
                      setOpenMenuId={setOpenUtilityMenuId}
                      onEdit={() => {
                        setEditingUtilityAccount(account);
                        setUtilityModalMode("edit");
                        setIsEditUtilityModalOpen(true);
                      }}
                      onImport={() => {
                        setAccountImportStatus(prev => ({ ...prev, [account.id]: "importing" }));
                        setAccountLastImport(prev => ({ ...prev, [account.id]: "Importing..." }));
                        setTimeout(() => {
                          const randomFailure = Math.random() < 0.3;
                          if (randomFailure) {
                            setAccountImportStatus(prev => ({ ...prev, [account.id]: "failed" }));
                            setAccountLastImport(prev => ({ ...prev, [account.id]: "failed" }));
                          } else {
                            setAccountImportStatus(prev => ({ ...prev, [account.id]: "imported" }));
                            setAccountLastImport(prev => ({ ...prev, [account.id]: "Imported" }));
                            setTimeout(() => {
                              setAccountImportStatus(prev => ({ ...prev, [account.id]: "idle" }));
                              setAccountLastImport(prev => ({ ...prev, [account.id]: "1 min ago" }));
                            }, 1500);
                          }
                        }, 1500);
                      }}
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
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
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
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.49968 1.3335H5.66264C5.54298 1.3335 5.48316 1.3335 5.43034 1.35171C5.38363 1.36783 5.34109 1.39412 5.30579 1.42869C5.26587 1.46778 5.23912 1.5213 5.18561 1.62832L2.38561 7.22831C2.25782 7.48389 2.19393 7.61167 2.20927 7.71555C2.22268 7.80625 2.27285 7.88743 2.34798 7.93998C2.43403 8.00016 2.5769 8.00016 2.86264 8.00016H6.99968L4.99968 14.6668L13.1284 6.23703C13.4027 5.95263 13.5398 5.81043 13.5478 5.68875C13.5548 5.58313 13.5112 5.48049 13.4303 5.41218C13.3371 5.3335 13.1396 5.3335 12.7445 5.3335H7.99968L9.49968 1.3335Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Provider
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 6.66683H2M10.6667 1.3335V4.00016M5.33333 1.3335V4.00016M5.2 14.6668H10.8C11.9201 14.6668 12.4802 14.6668 12.908 14.4488C13.2843 14.2571 13.5903 13.9511 13.782 13.5748C14 13.147 14 12.5869 14 11.4668V5.86683C14 4.74672 14 4.18667 13.782 3.75885C13.5903 3.38252 13.2843 3.07656 12.908 2.88482C12.4802 2.66683 11.9201 2.66683 10.8 2.66683H5.2C4.0799 2.66683 3.51984 2.66683 3.09202 2.88482C2.71569 3.07656 2.40973 3.38252 2.21799 3.75885C2 4.18667 2 4.74672 2 5.86683V11.4668C2 12.5869 2 13.147 2.21799 13.5748C2.40973 13.9511 2.71569 14.2571 3.09202 14.4488C3.51984 14.6668 4.0799 14.6668 5.2 14.6668Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Date
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.66602 1.33317C3.66602 0.964981 3.36754 0.666504 2.99935 0.666504C2.63116 0.666504 2.33268 0.964981 2.33268 1.33317V2.33317H1.33268C0.964492 2.33317 0.666016 2.63165 0.666016 2.99984C0.666016 3.36803 0.964492 3.6665 1.33268 3.6665H2.33268V4.6665C2.33268 5.03469 2.63116 5.33317 2.99935 5.33317C3.36754 5.33317 3.66602 5.03469 3.66602 4.6665V3.6665H4.66602C5.03421 3.6665 5.33268 3.36803 5.33268 2.99984C5.33268 2.63165 5.03421 2.33317 4.66602 2.33317H3.66602V1.33317ZM3.66602 11.3332C3.66602 10.965 3.36754 10.6665 2.99935 10.6665C2.63116 10.6665 2.33268 10.965 2.33268 11.3332V12.3332H1.33268C0.964492 12.3332 0.666016 12.6316 0.666016 12.9998C0.666016 13.368 0.964492 13.6665 1.33268 13.6665H2.33268V14.6665C2.33268 15.0347 2.63116 15.3332 2.99935 15.3332C3.36754 15.3332 3.66602 15.0347 3.66602 14.6665V13.6665H4.66602C5.03421 13.6665 5.33268 13.368 5.33268 12.9998C5.33268 12.6316 5.03421 12.3332 4.66602 12.3332H3.66602V11.3332ZM9.28825 1.76052C9.18922 1.50306 8.94186 1.33317 8.66602 1.33317C8.39017 1.33317 8.14281 1.50306 8.04378 1.76052L6.88767 4.76643C6.6874 5.28712 6.62447 5.43717 6.53838 5.55823C6.45201 5.6797 6.34588 5.78583 6.22441 5.87221C6.10335 5.95829 5.9533 6.02122 5.4326 6.22149L2.4267 7.37761C2.16923 7.47663 1.99935 7.72399 1.99935 7.99984C1.99935 8.27569 2.16923 8.52304 2.4267 8.62207L5.43261 9.77819C5.9533 9.97845 6.10335 10.0414 6.22441 10.1275C6.34588 10.2138 6.45201 10.32 6.53838 10.4414C6.62447 10.5625 6.6874 10.7126 6.88767 11.2332L8.04379 14.2392C8.14281 14.4966 8.39017 14.6665 8.66602 14.6665C8.94186 14.6665 9.18922 14.4966 9.28825 14.2392L10.4444 11.2332C10.6446 10.7126 10.7076 10.5625 10.7936 10.4414C10.88 10.32 10.9862 10.2138 11.1076 10.1275C11.2287 10.0414 11.3787 9.97845 11.8994 9.77819L14.9053 8.62207C15.1628 8.52304 15.3327 8.27569 15.3327 7.99984C15.3327 7.72399 15.1628 7.47663 14.9053 7.37761L11.8994 6.22149C11.3787 6.02122 11.2287 5.95829 11.1076 5.87221C10.9861 5.78583 10.88 5.6797 10.7936 5.55823C10.7076 5.43717 10.6446 5.28712 10.4444 4.76643L9.28825 1.76052Z" fill="#037DFF"/>
                    </svg>
                    AI Usage Insight
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.33267 2L4.33267 14M11.666 2L9.66599 14M13.666 5.33333H2.33268M12.9993 10.6667H1.66602" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Change from Last Bill
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath="url(#clip0_status)">
                        <path d="M8.00065 10.6668V8.00016M8.00065 5.3335H8.00732M14.6673 8.00016C14.6673 11.6821 11.6825 14.6668 8.00065 14.6668C4.31875 14.6668 1.33398 11.6821 1.33398 8.00016C1.33398 4.31826 4.31875 1.3335 8.00065 1.3335C11.6825 1.3335 14.6673 4.31826 14.6673 8.00016Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </g>
                      <defs>
                        <clipPath id="clip0_status">
                          <rect width="16" height="16" fill="white"/>
                        </clipPath>
                      </defs>
                    </svg>
                    Status
                  </span>
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 10.6668C4 12.1396 5.19391 13.3335 6.66667 13.3335H9.33333C10.8061 13.3335 12 12.1396 12 10.6668C12 9.19407 10.8061 8.00016 9.33333 8.00016H6.66667C5.19391 8.00016 4 6.80626 4 5.3335C4 3.86074 5.19391 2.66683 6.66667 2.66683H9.33333C10.8061 2.66683 12 3.86074 12 5.3335M8 1.3335V14.6668" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Amount
                  </span>
                </th>
                <th className="sticky right-0 px-2 py-3 text-center w-20">
                  <span className="font-medium text-sm text-gray-700">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {bills
                .slice(
                  (billsCurrentPage - 1) * billsItemsPerPage,
                  billsCurrentPage * billsItemsPerPage,
                )
                .map((bill, index) => (
                  <tr
                    key={bill.id}
                    className={cn(
                      "hover:bg-gray-50 transition-colors h-12",
                      index === bills.slice((billsCurrentPage - 1) * billsItemsPerPage, billsCurrentPage * billsItemsPerPage).length - 1
                        ? "border-b-0"
                        : "border-b border-gray-200",
                    )}
                  >
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                          {bill.icon}
                        </div>
                        <span className="text-gray-900 font-normal text-base">
                          {bill.provider}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <span className="text-gray-900 font-normal text-base">
                        {bill.date}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <AIInsightBadge insight={bill.aiUsageInsight} />
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          bill.changeFromLastBill.startsWith("↑")
                            ? "text-red-600"
                            : "text-green-600",
                        )}
                      >
                        {bill.changeFromLastBill}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <BillStatusBadge status={bill.status} />
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <span className="text-gray-900 font-normal text-base">
                        {bill.amount}
                      </span>
                    </td>
                    <td
                      className="sticky right-0 px-2 py-3 flex items-center justify-center"
                      style={{
                        borderLeftWidth: "2px",
                        width: "80px",
                        border:
                          "1px none rgb(226, 232, 240) rgb(226, 232, 240) rgb(226, 232, 240) rgb(210, 209, 207)",
                        borderLeftColor: "transparent",
                      }}
                    >
                      <ActionButton
                        propertyId={bill.id}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        onView={() => {
                          navigate("/record-bill?readOnly=true");
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
                ref={billsDropdownButtonRef}
                onClick={() => setShowBillsPageSizeDropdown(!showBillsPageSizeDropdown)}
                className="flex items-center justify-center gap-2 h-10 px-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors text-gray-900 font-medium text-sm relative"
                style={{
                  borderColor: "rgb(218, 218, 218)",
                  borderWidth: "0.909091px",
                  boxShadow:
                    "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
                }}
              >
                <div className="text-gray-900 font-medium text-sm">
                  {billsItemsPerPage}
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
              disabled={billsCurrentPage === 1}
              onClick={() => setBillsCurrentPage(Math.max(1, billsCurrentPage - 1))}
              className={cn(
                "flex items-center justify-center gap-1.5 h-10 px-3 transition-colors",
                billsCurrentPage === 1
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
                  billsCurrentPage === 1 ? "rgb(163, 163, 163)" : "currentColor"
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
                  billsCurrentPage === 1 ? "text-gray-400" : "text-gray-700",
                )}
              >
                Previous
              </div>
            </button>
            {getBillsPaginationNumbers().map((page, idx) => {
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
                  onClick={() => setBillsCurrentPage(page as number)}
                  className={cn(
                    "flex items-center justify-center h-10 min-w-10 transition-colors",
                    billsCurrentPage === page
                      ? "hover:bg-gray-50"
                      : "hover:bg-gray-50",
                  )}
                  style={{
                    borderRightWidth: "0.909091px",
                    borderRightColor: "rgb(229, 229, 229)",
                    backgroundColor:
                      billsCurrentPage === page ? "white" : "rgba(0, 0, 0, 0)",
                  }}
                >
                  <div
                    className={cn(
                      "font-medium text-sm",
                      billsCurrentPage === page
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
              onClick={() => setBillsCurrentPage(billsCurrentPage + 1)}
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
                  billsCurrentPage === billsTotalPages
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

      {/* Dropdown Menu - Rendered via Portal at body level */}
      {showBillsPageSizeDropdown &&
        createPortal(
          <div
            ref={billsDropdownMenuRef}
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
              top: billsDropdownPos.top + "px",
              left: billsDropdownPos.left + "px",
              pointerEvents: "auto",
            }}
            onMouseLeave={() => setShowBillsPageSizeDropdown(false)}
          >
            {[10, 25, 50].map((size) => (
              <button
                key={size}
                onClick={() => {
                  setBillsItemsPerPage(size);
                  setBillsCurrentPage(1);
                  setShowBillsPageSizeDropdown(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 text-gray-700 font-medium text-sm"
              >
                {size}
              </button>
            ))}
          </div>,
          document.body,
        )}

      {/* Edit/Add Utility Account Modal */}
      <EditUtilityAccountModal
        open={isEditUtilityModalOpen}
        onOpenChange={(open) => {
          setIsEditUtilityModalOpen(open);
          if (!open) {
            setEditingUtilityAccount(null);
            setUtilityModalMode("edit");
          }
        }}
        mode={utilityModalMode}
        editData={editingUtilityAccount ? {
          provider: editingUtilityAccount.provider,
          accountNumber: editingUtilityAccount.account,
          status: editingUtilityAccount.status,
          username: "",
          password: "",
        } : null}
      />
    </div>
  );
};
