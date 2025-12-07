import { useParams } from "react-router-dom";
import { PropertiesTemplate } from "@/layout/PropertiesTemplate";
import { Overview } from "./properties/Overview";
import { Units } from "./properties/Units";
import { Utilities } from "./properties/Utilities";
import { Maintenance } from "./properties/Maintenance";
import { Tasks } from "./properties/Tasks";
import { Vendors } from "./properties/Vendors";
import { Bills } from "./properties/Bills";
import { Notes } from "./properties/Notes";
import { Invoicing } from "./properties/Invoicing";

// Mock property data - in a real app, this would come from an API
const propertyData: Record<
  string,
  { address: string; type: string; units: number }
> = {
  "1": {
    address: "22 Indian Chase Dr, Greenwich, CT",
    type: "Concierge",
    units: 1,
  },
  "2": {
    address: "22 Indian Chase Dr, Greenwich, CT",
    type: "Rental",
    units: 1,
  },
  "3": {
    address: "22 Indian Chase Dr, Greenwich, CT",
    type: "Commercial",
    units: 1,
  },
  "4": {
    address: "22 Indian Chase Dr, Greenwich, CT",
    type: "OR",
    units: 1,
  },
  "5": {
    address: "22 Indian Chase Dr, Greenwich, CT",
    type: "HOA",
    units: 1,
  },
  "6": {
    address: "22 Indian Chase Dr, Greenwich, CT",
    type: "Concierge",
    units: 1,
  },
  "7": {
    address: "22 Indian Chase Dr, Greenwich, CT",
    type: "Concierge",
    units: 1,
  },
  "8": {
    address: "22 Indian Chase Dr, Greenwich, CT",
    type: "Concierge",
    units: 1,
  },
  "9": {
    address: "22 Indian Chase Dr, Greenwich, CT",
    type: "Concierge",
    units: 1,
  },
  "10": {
    address: "22 Indian Chase Dr, Greenwich, CT",
    type: "Concierge",
    units: 1,
  },
};

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
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.2558 18.9774C14.2023 18.3873 18.0123 16.2674 18.0123 10.7863C18.0123 5.79907 14.3616 2.47739 11.7365 0.951337C11.1531 0.612005 10.4716 1.05785 10.4716 1.7318V3.45485C10.4716 4.81406 9.90036 7.29495 8.31305 8.32709C7.50242 8.85399 6.62581 8.06505 6.52778 7.10361L6.44672 6.31372C6.35246 5.39564 5.41742 4.83857 4.68408 5.39847C3.3654 6.40232 1.98828 8.16496 1.98828 10.7854C1.98828 17.4881 6.97363 19.165 9.46583 19.165C9.61162 19.165 9.76369 19.1602 9.92204 19.1508C8.69102 19.0462 6.70122 18.2827 6.70122 15.8131C6.70122 13.8808 8.11039 12.5753 9.18117 11.9391C9.4696 11.7694 9.8061 11.9909 9.8061 12.3255V12.8817C9.8061 13.3058 9.97106 13.9704 10.3622 14.4247C10.8052 14.9393 11.4547 14.4002 11.5065 13.7234C11.5235 13.5104 11.7384 13.3746 11.9232 13.4821C12.5274 13.8356 13.2993 14.5896 13.2993 15.8131C13.2993 17.7435 12.2352 18.6315 11.2558 18.9774Z" fill="#BC423E"/>
        </svg>
      );
    case "ConEd":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.6593 1.77024C11.7052 1.40316 11.5036 1.04977 11.1642 0.902458C10.8249 0.755151 10.429 0.849194 10.1922 1.13339L2.751 10.0628C2.6224 10.2171 2.49215 10.3733 2.39732 10.5107C2.30763 10.6405 2.14387 10.8958 2.13881 11.2314C2.13302 11.6155 2.3042 11.981 2.60301 12.2224C2.86402 12.4334 3.16499 12.471 3.32217 12.4852C3.48835 12.5003 3.69176 12.5002 3.89258 12.5002L9.05509 12.5002L8.33884 18.2302C8.29295 18.5973 8.49456 18.9507 8.83391 19.098C9.17326 19.2453 9.56909 19.1512 9.80592 18.867L17.2471 9.93758C17.3757 9.78332 17.506 9.62707 17.6008 9.48977C17.6905 9.35991 17.8543 9.1046 17.8593 8.76906C17.8651 8.38491 17.6939 8.01945 17.3951 7.77798C17.1341 7.56705 16.8331 7.52941 16.676 7.51518C16.5098 7.50013 16.3064 7.50017 16.1055 7.50021L10.9431 7.50021L11.6593 1.77024Z" fill="#EBA524"/>
        </svg>
      );
    case "Greenwich Water":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.0005 19.165C7.85413 19.165 6.06437 18.4286 4.63119 16.956C3.198 15.4833 2.4811 13.6503 2.48047 11.457C2.48047 10.4856 2.6998 9.5143 3.13847 8.54297C3.57713 7.57163 4.12547 6.63947 4.78347 5.74647C5.44147 4.85347 6.1543 4.0153 6.92197 3.23197C7.68963 2.44864 8.40246 1.76714 9.06046 1.18747C9.1858 1.06214 9.33087 0.972211 9.49568 0.917691C9.6605 0.863171 9.82876 0.835598 10.0005 0.834971C10.1722 0.834345 10.3407 0.861918 10.5062 0.917691C10.6716 0.973465 10.8164 1.06339 10.9405 1.18747C11.5985 1.76714 12.3113 2.44864 13.079 3.23197C13.8466 4.0153 14.5595 4.85347 15.2175 5.74647C15.8755 6.63947 16.4238 7.57163 16.8625 8.54297C17.3011 9.5143 17.5205 10.4856 17.5205 11.457C17.5205 13.6503 16.8039 15.4833 15.3707 16.956C13.9375 18.4286 12.1474 19.165 10.0005 19.165ZM10.259 16.345C10.447 16.3293 10.6077 16.2547 10.7412 16.1212C10.8747 15.9878 10.9411 15.8273 10.9405 15.64C10.9405 15.4206 10.87 15.2445 10.729 15.1117C10.588 14.9788 10.4078 14.9199 10.1885 14.935C9.54613 14.982 8.86463 14.8059 8.14396 14.4067C7.4233 14.0075 6.96897 13.2828 6.78097 12.2325C6.74963 12.0601 6.66754 11.9191 6.53469 11.8095C6.40183 11.6998 6.24893 11.645 6.07597 11.645C5.85663 11.645 5.67647 11.7274 5.53547 11.8922C5.39447 12.057 5.34747 12.2488 5.39447 12.4675C5.6608 13.8931 6.28747 14.9115 7.27447 15.5225C8.26147 16.1335 9.2563 16.4076 10.259 16.345Z" fill="#2463EB"/>
        </svg>
      );
    case "Optium":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M12.9469 5.87503C13.2724 5.54959 13.8 5.54959 14.1254 5.87503C16.4035 8.15308 16.4035 11.8465 14.1254 14.1246C13.8 14.45 13.2724 14.45 12.9469 14.1246C12.6215 13.7992 12.6215 13.2715 12.9469 12.9461C14.5741 11.3189 14.5741 8.68072 12.9469 7.05354C12.6215 6.7281 12.6215 6.20046 12.9469 5.87503Z" fill="#059669"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M7.05437 5.875C7.37981 6.20043 7.37981 6.72807 7.05437 7.05351C5.42719 8.68069 5.42719 11.3189 7.05437 12.9461C7.37981 13.2715 7.37981 13.7991 7.05437 14.1246C6.72894 14.45 6.2013 14.45 5.87586 14.1246C3.5978 11.8465 3.5978 8.15306 5.87586 5.875C6.2013 5.54956 6.72894 5.54956 7.05437 5.875Z" fill="#059669"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M4.69735 3.518C5.02279 3.84344 5.02279 4.37108 4.69735 4.69651C1.76842 7.62545 1.76842 12.3742 4.69735 15.3031C5.02279 15.6286 5.02279 16.1562 4.69735 16.4816C4.37191 16.8071 3.84428 16.8071 3.51884 16.4816C-0.0609673 12.9018 -0.0609673 7.09781 3.51884 3.518C3.84428 3.19257 4.37191 3.19257 4.69735 3.518Z" fill="#059669"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M15.304 3.51804C15.6294 3.1926 16.157 3.1926 16.4825 3.51804C20.0623 7.09785 20.0623 12.9019 16.4825 16.4817C16.157 16.8071 15.6294 16.8071 15.304 16.4817C14.9785 16.1562 14.9785 15.6286 15.304 15.3032C18.2329 12.3742 18.2329 7.62549 15.304 4.69655C14.9785 4.37112 14.9785 3.84348 15.304 3.51804Z" fill="#059669"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M7.50065 9.99982C7.50065 8.6191 8.61994 7.49982 10.0007 7.49982C11.3814 7.49982 12.5007 8.6191 12.5007 9.99982C12.5007 11.3805 11.3814 12.4998 10.0007 12.4998C8.61994 12.4998 7.50065 11.3805 7.50065 9.99982Z" fill="#059669"/>
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

export default function PropertyDetail() {
  const { propertyId, tab } = useParams<{
    propertyId: string;
    tab?: string;
  }>();

  const [openUtilityMenuId, setOpenUtilityMenuId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const property = propertyId ? propertyData[propertyId] : null;

  if (!property) {
    return (
      <PropertiesTemplate activeTab={tab || "Overview"}>
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500 text-lg">Property not found</p>
        </div>
      </PropertiesTemplate>
    );
  }

  const renderPageContent = () => {
    const currentTab = tab || "Overview";

    switch (currentTab) {
      case "Overview":
        return <Overview propertyAddress={property.address} propertyType={property.type} propertyUnits={property.units} />;
      case "Units":
        return <Units propertyAddress={property.address} propertyType={property.type} propertyUnits={property.units} />;
      case "Utilities":
        return <Utilities propertyAddress={property.address} propertyType={property.type} propertyUnits={property.units} />;
      case "Maintenance":
        return <Maintenance propertyAddress={property.address} propertyType={property.type} propertyUnits={property.units} />;
      case "Tasks":
        return <Tasks propertyAddress={property.address} propertyType={property.type} propertyUnits={property.units} />;
      case "Vendors":
        return <Vendors propertyAddress={property.address} propertyType={property.type} propertyUnits={property.units} />;
      case "Bills":
        return <Bills propertyAddress={property.address} propertyType={property.type} propertyUnits={property.units} />;
      case "Notes":
        return <Notes propertyAddress={property.address} propertyType={property.type} propertyUnits={property.units} />;
      case "Invoicing":
        return <Invoicing propertyAddress={property.address} propertyType={property.type} propertyUnits={property.units} />;
      default:
        return <Overview propertyAddress={property.address} propertyType={property.type} propertyUnits={property.units} />;
    }
  };

  return (
    <PropertiesTemplate 
      propertyAddress={property.address}
      propertyType={property.type}
      propertyUnits={property.units}
      activeTab={tab || "Overview"}
    >
      {renderTabContent()}
    </PropertiesTemplate>
  );
}
