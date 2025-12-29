import { Tab } from "./Tabs";
import React from "react";
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
    iconLight: React.createElement(PortfolioIcon, { width: 20, height: 20 }),
    iconDark: React.createElement(PortfolioIcon, { width: 20, height: 20 }),
  },
  {
    id: "properties",
    label: "Properties",
    iconLight: React.createElement(PropertiesIcon, {
      width: 20,
      height: 20,
      variant: "light",
    }),
    iconDark: React.createElement(PropertiesIcon, {
      width: 20,
      height: 20,
      variant: "dark",
    }),
  },
  {
    id: "screening",
    label: "Screening",
    iconLight: React.createElement(ScreeningIcon, { width: 20, height: 20 }),
    iconDark: React.createElement(ScreeningIcon, { width: 20, height: 20 }),
  },
  {
    id: "bills",
    label: "Bills",
    iconLight: React.createElement(BillsIcon, {
      width: 20,
      height: 20,
      variant: "light",
    }),
    iconDark: React.createElement(BillsIcon, {
      width: 20,
      height: 20,
      variant: "dark",
    }),
  },
  {
    id: "field-team-orders",
    label: "Field Team Orders",
    iconLight: React.createElement(FieldTeamOrdersIcon, {
      width: 20,
      height: 20,
      variant: "light",
    }),
    iconDark: React.createElement(FieldTeamOrdersIcon, {
      width: 20,
      height: 20,
      variant: "dark",
    }),
  },
  {
    id: "work-orders",
    label: "Work Orders",
    iconLight: React.createElement(WorkOrdersIcon, { width: 20, height: 20 }),
    iconDark: React.createElement(WorkOrdersIcon, { width: 20, height: 20 }),
  },
];
