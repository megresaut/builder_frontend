import { Tab } from "./Tabs";
import type { Tab } from "./Tabs";
import {
  PortfolioIcon,
  PropertiesIcon,
  ScreeningIcon,
  BillsIcon,
  FieldTeamOrdersIcon,
  WorkOrdersIcon,
} from "@/components/icons";

export const DEFAULT_TABS: Tab[] = [
  {
    id: "portfolio",
    label: "Portfolio",
    iconLight: <PortfolioIcon width={20} height={20} />,
    iconDark: <PortfolioIcon width={20} height={20} />,
  },
  {
    id: "properties",
    label: "Properties",
    iconLight: <PropertiesIcon width={20} height={20} variant="light" />,
    iconDark: <PropertiesIcon width={20} height={20} variant="dark" />,
  },
  {
    id: "screening",
    label: "Screening",
    iconLight: <ScreeningIcon width={20} height={20} />,
    iconDark: <ScreeningIcon width={20} height={20} />,
  },
  {
    id: "bills",
    label: "Bills",
    iconLight: <BillsIcon width={20} height={20} variant="light" />,
    iconDark: <BillsIcon width={20} height={20} variant="dark" />,
  },
  {
    id: "field-team-orders",
    label: "Field Team Orders",
    iconLight: <FieldTeamOrdersIcon width={20} height={20} variant="light" />,
    iconDark: <FieldTeamOrdersIcon width={20} height={20} variant="dark" />,
  },
  {
    id: "work-orders",
    label: "Work Orders",
    iconLight: <WorkOrdersIcon width={20} height={20} variant="light" />,
    iconDark: <WorkOrdersIcon width={20} height={20} variant="dark" />,
  },
];
