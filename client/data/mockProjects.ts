/**
 * Mock data for the Projects feature (frontend-only prototype).
 *
 * A Project is an umbrella layer above tasks/work-orders/FTOs that groups a
 * large, multi-task job at a property so budget, billing, change orders and
 * progress can be tracked in one place. All amounts are in cents, matching the
 * platform's money convention.
 *
 * NOTE: This is static demo data. No API calls — everything here is hand-built
 * so the UI can be reviewed before any backend exists.
 */

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";

export interface MockProjectTask {
  id: number;
  name: string;
  status: "not_started" | "in_progress" | "completed";
  priority: "low" | "normal" | "high" | "urgent";
  workOrders: number;
  ftos: number;
  spentCents: number;
  due: string;
  assignee: string;
}

export type ChangeOrderStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected";

export interface MockChangeOrder {
  id: number;
  number: string;
  description: string;
  reason: string;
  amountCents: number; // +/- adjustment to budget
  status: ChangeOrderStatus;
  createdOn: string;
  decidedOn: string | null;
}

export interface MockScheduleLine {
  id: number;
  description: string;
  scheduledValueCents: number; // budgeted value for this piece of work
  percentComplete: number;
  billedToDateCents: number;
}

export interface MockCashFlowEntry {
  id: number;
  date: string;
  direction: "inbound" | "outbound";
  kind: string; // Deposit | Progress Payment | Vendor Bill | Sub Payment
  description: string;
  party: string;
  amountCents: number;
}

/** A budget category, optionally broken into finer sub-budgets. */
export interface MockSubBudget {
  id: number;
  name: string;
  amountCents: number;
}
export interface MockBudgetCategory {
  id: number;
  name: string;
  amountCents: number; // if subBudgets exist, this is their sum
  spentCents: number; // tracked spend against this category
  subBudgets: MockSubBudget[];
}

export type MilestoneStatus = "not_started" | "in_progress" | "complete";
export interface MockMilestone {
  id: number;
  name: string;
  targetDate: string; // yyyy-mm-dd or a display string
  status: MilestoneStatus;
  budgetCategoryId: number | null; // optional link to a budget category
  taskIds?: number[]; // tasks that make up this milestone/section
}

export interface MockProject {
  id: number;
  name: string;
  description: string;
  propertyName: string;
  propertyAddress: string;
  status: ProjectStatus;
  originalBudgetCents: number;
  approvedChangeOrdersCents: number; // sum of approved COs (added to budget)
  spentCents: number; // outbound to vendors/subs for work performed
  depositsReceivedCents: number; // inbound deposits + progress payments
  billedToDateCents: number;
  outstandingInvoicesCents: number; // billed but not yet paid by client
  percentComplete: number;
  startDate: string;
  targetEndDate: string;
  managerName: string;
  managerInitials: string;
  taskCount: number;
  tasks: MockProjectTask[];
  changeOrders: MockChangeOrder[];
  schedule: MockScheduleLine[];
  cashFlow: MockCashFlowEntry[];
  budgetCategories?: MockBudgetCategory[];
  milestones?: MockMilestone[];
}

export const MILESTONE_STATUS_META: Record<
  MilestoneStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  not_started: { label: "Not Started", dot: "#9CA3AF", text: "#4B5563", bg: "#F3F4F6" },
  in_progress: { label: "In Progress", dot: "#2563EB", text: "#1D4ED8", bg: "#EFF6FF" },
  complete: { label: "Complete", dot: "#16A34A", text: "#15803D", bg: "#F0FDF4" },
};

/** Budget categories — explicit if set, otherwise derived from the schedule. */
export function getBudgetCategories(p: MockProject): MockBudgetCategory[] {
  if (p.budgetCategories && p.budgetCategories.length) return p.budgetCategories;
  return p.schedule.map((l, i) => ({
    id: i + 1,
    name: l.description,
    amountCents: l.scheduledValueCents,
    spentCents: Math.round((l.scheduledValueCents * l.percentComplete) / 100),
    subBudgets: [],
  }));
}

/** Milestones — explicit if set, otherwise derived from the project's tasks. */
export function getMilestones(p: MockProject): MockMilestone[] {
  if (p.milestones && p.milestones.length) return p.milestones;
  return p.tasks.map((t, i) => ({
    id: i + 1,
    name: t.name,
    targetDate: t.due,
    status:
      t.status === "completed" ? "complete" : t.status === "in_progress" ? "in_progress" : "not_started",
    budgetCategoryId: null,
    taskIds: [t.id],
  }));
}

/** Task completion rollup for a milestone (in-progress counts as half). */
export function milestoneTaskStats(
  p: MockProject,
  m: MockMilestone,
): { total: number; done: number; percent: number } {
  const ids = m.taskIds ?? [];
  const tasks = p.tasks.filter((t) => ids.includes(t.id));
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "completed").length;
  const inProg = tasks.filter((t) => t.status === "in_progress").length;
  const percent = total ? Math.round(((done + inProg * 0.5) / total) * 100) : 0;
  return { total, done, percent };
}

/** Which milestone (if any) a task currently belongs to. */
export function milestoneForTask(milestones: MockMilestone[], taskId: number): MockMilestone | undefined {
  return milestones.find((m) => (m.taskIds ?? []).includes(taskId));
}

export function currentBudgetCents(p: MockProject): number {
  return p.originalBudgetCents + p.approvedChangeOrdersCents;
}

export function netCashPositionCents(p: MockProject): number {
  return p.depositsReceivedCents - p.spentCents;
}

export function formatUSD(cents: number): string {
  const dollars = cents / 100;
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatUSDPrecise(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  planning: { label: "Planning", dot: "#9CA3AF", text: "#4B5563", bg: "#F3F4F6" },
  active: { label: "Active", dot: "#2563EB", text: "#1D4ED8", bg: "#EFF6FF" },
  on_hold: { label: "On Hold", dot: "#D97706", text: "#B45309", bg: "#FFFBEB" },
  completed: { label: "Completed", dot: "#16A34A", text: "#15803D", bg: "#F0FDF4" },
};

export const CHANGE_ORDER_STATUS_META: Record<
  ChangeOrderStatus,
  { label: string; text: string; bg: string }
> = {
  draft: { label: "Draft", text: "#4B5563", bg: "#F3F4F6" },
  pending_approval: { label: "Pending Approval", text: "#B45309", bg: "#FFFBEB" },
  approved: { label: "Approved", text: "#15803D", bg: "#F0FDF4" },
  rejected: { label: "Rejected", text: "#B91C1C", bg: "#FEF2F2" },
};

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: 1,
    name: "Full Kitchen & Primary Bath Renovation",
    description:
      "Gut renovation of the kitchen and primary bathroom — cabinetry, stone, tile, plumbing and electrical rough-in, and finish carpentry.",
    propertyName: "(C) 544 Oenoke Ridge",
    propertyAddress: "544 Oenoke Ridge, New Canaan, CT 06840",
    status: "active",
    originalBudgetCents: 34000000,
    approvedChangeOrdersCents: 2600000,
    spentCents: 17850000,
    depositsReceivedCents: 20400000,
    billedToDateCents: 18300000,
    outstandingInvoicesCents: 4100000,
    percentComplete: 50,
    startDate: "2026-03-02",
    targetEndDate: "2026-09-30",
    managerName: "Carter Hughes",
    managerInitials: "CH",
    taskCount: 6,
    tasks: [
      { id: 101, name: "Demolition & haul-away", status: "completed", priority: "high", workOrders: 2, ftos: 1, spentCents: 2400000, due: "Mar 20, 2026", assignee: "CH" },
      { id: 102, name: "Plumbing rough-in", status: "completed", priority: "high", workOrders: 1, ftos: 0, spentCents: 3100000, due: "Apr 15, 2026", assignee: "CH" },
      { id: 103, name: "Electrical rough-in & panel upgrade", status: "in_progress", priority: "high", workOrders: 2, ftos: 0, spentCents: 4200000, due: "Jun 30, 2026", assignee: "CH" },
      { id: 104, name: "Custom cabinetry fabrication", status: "in_progress", priority: "normal", workOrders: 1, ftos: 0, spentCents: 5150000, due: "Jul 20, 2026", assignee: "CH" },
      { id: 105, name: "Stone & tile install", status: "not_started", priority: "normal", workOrders: 1, ftos: 0, spentCents: 3000000, due: "Aug 15, 2026", assignee: "CH" },
      { id: 106, name: "Finish carpentry & paint", status: "not_started", priority: "normal", workOrders: 1, ftos: 1, spentCents: 0, due: "Sep 20, 2026", assignee: "KS" },
    ],
    changeOrders: [
      { id: 9001, number: "CO-001", description: "Upgrade to quartzite countertops (from quartz)", reason: "Owner selection change", amountCents: 1400000, status: "approved", createdOn: "Apr 10, 2026", decidedOn: "Apr 14, 2026" },
      { id: 9002, number: "CO-002", description: "Add second dishwasher + panel-ready fronts", reason: "Owner request", amountCents: 1200000, status: "approved", createdOn: "May 02, 2026", decidedOn: "May 06, 2026" },
      { id: 9003, number: "CO-003", description: "Relocate range hood venting through roof", reason: "Field condition discovered at demo", amountCents: 600000, status: "pending_approval", createdOn: "Jun 18, 2026", decidedOn: null },
      { id: 9004, number: "CO-004", description: "Heated bathroom floor add-on", reason: "Owner request", amountCents: 450000, status: "draft", createdOn: "Jun 28, 2026", decidedOn: null },
    ],
    schedule: [
      { id: 1, description: "Demolition & site prep", scheduledValueCents: 2500000, percentComplete: 100, billedToDateCents: 2500000 },
      { id: 2, description: "Plumbing", scheduledValueCents: 4200000, percentComplete: 90, billedToDateCents: 3780000 },
      { id: 3, description: "Electrical", scheduledValueCents: 4800000, percentComplete: 70, billedToDateCents: 3360000 },
      { id: 4, description: "Cabinetry & millwork", scheduledValueCents: 9800000, percentComplete: 55, billedToDateCents: 5390000 },
      { id: 5, description: "Stone & tile", scheduledValueCents: 6300000, percentComplete: 20, billedToDateCents: 1260000 },
      { id: 6, description: "Finishes & paint", scheduledValueCents: 4400000, percentComplete: 5, billedToDateCents: 220000 },
      { id: 7, description: "Appliances", scheduledValueCents: 4600000, percentComplete: 40, billedToDateCents: 1840000 },
    ],
    cashFlow: [
      { id: 1, date: "Mar 03, 2026", direction: "inbound", kind: "Deposit", description: "Initial project deposit (30%)", party: "Owner", amountCents: 10200000 },
      { id: 2, date: "Mar 28, 2026", direction: "outbound", kind: "Vendor Bill", description: "Demolition & dumpster", party: "Greenwich Demo Co", amountCents: 2400000 },
      { id: 3, date: "Apr 30, 2026", direction: "inbound", kind: "Progress Payment", description: "Progress billing #1", party: "Owner", amountCents: 5100000 },
      { id: 4, date: "Apr 30, 2026", direction: "outbound", kind: "Sub Payment", description: "Plumbing rough-in", party: "Shoreline Plumbing", amountCents: 3100000 },
      { id: 5, date: "May 31, 2026", direction: "inbound", kind: "Progress Payment", description: "Progress billing #2", party: "Owner", amountCents: 5100000 },
      { id: 6, date: "May 31, 2026", direction: "outbound", kind: "Sub Payment", description: "Electrical rough-in", party: "Beacon Electric", amountCents: 4200000 },
      { id: 7, date: "Jun 20, 2026", direction: "outbound", kind: "Vendor Bill", description: "Cabinetry deposit", party: "Fairfield Custom Cabinets", amountCents: 5150000 },
    ],
    milestones: [
      { id: 1, name: "Demo & rough-ins complete", targetDate: "2026-06-30", status: "in_progress", budgetCategoryId: 3, taskIds: [101, 102, 103] },
      { id: 2, name: "Cabinetry & surfaces installed", targetDate: "2026-08-20", status: "not_started", budgetCategoryId: 4, taskIds: [104, 105] },
      { id: 3, name: "Finishes & punch list", targetDate: "2026-09-25", status: "not_started", budgetCategoryId: 6, taskIds: [106] },
    ],
    budgetCategories: [
      { id: 1, name: "Demolition & Site Prep", amountCents: 2500000, spentCents: 2500000, subBudgets: [
        { id: 11, name: "Demo labor", amountCents: 1600000 },
        { id: 12, name: "Dumpster & haul-away", amountCents: 900000 },
      ] },
      { id: 2, name: "Plumbing", amountCents: 4200000, spentCents: 3780000, subBudgets: [
        { id: 21, name: "Rough-in", amountCents: 2600000 },
        { id: 22, name: "Fixtures", amountCents: 1600000 },
      ] },
      { id: 3, name: "Electrical", amountCents: 4800000, spentCents: 3360000, subBudgets: [
        { id: 31, name: "Rough-in", amountCents: 3000000 },
        { id: 32, name: "Panel upgrade", amountCents: 1000000 },
        { id: 33, name: "Fixtures", amountCents: 800000 },
      ] },
      { id: 4, name: "Cabinetry & Millwork", amountCents: 9800000, spentCents: 5390000, subBudgets: [
        { id: 41, name: "Fabrication", amountCents: 7000000 },
        { id: 42, name: "Install", amountCents: 2800000 },
      ] },
      { id: 5, name: "Stone & Tile", amountCents: 6300000, spentCents: 1260000, subBudgets: [
        { id: 51, name: "Material", amountCents: 4000000 },
        { id: 52, name: "Install", amountCents: 2300000 },
      ] },
      { id: 6, name: "Finishes & Paint", amountCents: 4400000, spentCents: 220000, subBudgets: [
        { id: 61, name: "Paint", amountCents: 2400000 },
        { id: 62, name: "Trim", amountCents: 2000000 },
      ] },
      { id: 7, name: "Appliances", amountCents: 2000000, spentCents: 1340000, subBudgets: [] },
    ],
  },
  {
    id: 2,
    name: "Whole-Home A/V & Alarm Install",
    description:
      "Structured wiring, distributed audio/video, smart-home control, and a monitored alarm + camera system across the residence.",
    propertyName: "29 Hunting Ridge",
    propertyAddress: "29 Hunting Ridge, Greenwich, CT 06831",
    status: "active",
    originalBudgetCents: 12500000,
    approvedChangeOrdersCents: 850000,
    spentCents: 6100000,
    depositsReceivedCents: 7500000,
    billedToDateCents: 6900000,
    outstandingInvoicesCents: 1400000,
    percentComplete: 55,
    startDate: "2026-04-01",
    targetEndDate: "2026-08-15",
    managerName: "Carter Hughes",
    managerInitials: "CH",
    taskCount: 3,
    tasks: [
      { id: 201, name: "A/V & Alarm Project", status: "in_progress", priority: "normal", workOrders: 2, ftos: 0, spentCents: 3600000, due: "Jun 30, 2026", assignee: "CH" },
      { id: 202, name: "Camera & Alarm Takeover", status: "in_progress", priority: "normal", workOrders: 1, ftos: 1, spentCents: 1500000, due: "Jul 15, 2026", assignee: "CH" },
      { id: 203, name: "Outdoor WiFi", status: "not_started", priority: "normal", workOrders: 1, ftos: 0, spentCents: 1000000, due: "Jul 30, 2026", assignee: "CH" },
    ],
    changeOrders: [
      { id: 9101, number: "CO-001", description: "Add two outdoor speaker zones (pool + patio)", reason: "Owner request", amountCents: 550000, status: "approved", createdOn: "May 08, 2026", decidedOn: "May 10, 2026" },
      { id: 9102, number: "CO-002", description: "Upgrade to 4K PoE camera package", reason: "Owner request", amountCents: 300000, status: "approved", createdOn: "May 22, 2026", decidedOn: "May 24, 2026" },
      { id: 9103, number: "CO-003", description: "Additional AP for detached garage", reason: "Coverage gap found on-site", amountCents: 180000, status: "pending_approval", createdOn: "Jun 25, 2026", decidedOn: null },
    ],
    schedule: [
      { id: 1, description: "Structured wiring", scheduledValueCents: 3200000, percentComplete: 100, billedToDateCents: 3200000 },
      { id: 2, description: "Distributed A/V", scheduledValueCents: 4100000, percentComplete: 60, billedToDateCents: 2460000 },
      { id: 3, description: "Alarm & cameras", scheduledValueCents: 3400000, percentComplete: 35, billedToDateCents: 1190000 },
      { id: 4, description: "Network & WiFi", scheduledValueCents: 2650000, percentComplete: 10, billedToDateCents: 265000 },
    ],
    cashFlow: [
      { id: 1, date: "Apr 02, 2026", direction: "inbound", kind: "Deposit", description: "Project deposit (40%)", party: "Owner", amountCents: 5000000 },
      { id: 2, date: "Apr 30, 2026", direction: "outbound", kind: "Vendor Bill", description: "Structured wiring", party: "SoundWorks CT", amountCents: 3200000 },
      { id: 3, date: "May 31, 2026", direction: "inbound", kind: "Progress Payment", description: "Progress billing #1", party: "Owner", amountCents: 2500000 },
      { id: 4, date: "May 31, 2026", direction: "outbound", kind: "Sub Payment", description: "A/V equipment + labor", party: "SoundWorks CT", amountCents: 2900000 },
    ],
    milestones: [
      { id: 1, name: "Structured wiring complete", targetDate: "2026-04-30", status: "complete", budgetCategoryId: 1, taskIds: [] },
      { id: 2, name: "A/V systems installed", targetDate: "2026-06-30", status: "in_progress", budgetCategoryId: 2, taskIds: [201] },
      { id: 3, name: "Alarm & cameras live", targetDate: "2026-07-15", status: "in_progress", budgetCategoryId: 3, taskIds: [202] },
      { id: 4, name: "Network & WiFi tuned", targetDate: "2026-07-30", status: "not_started", budgetCategoryId: 4, taskIds: [203] },
    ],
    budgetCategories: [
      { id: 1, name: "Structured Wiring", amountCents: 3200000, spentCents: 3200000, subBudgets: [
        { id: 11, name: "Cabling", amountCents: 2000000 },
        { id: 12, name: "Terminations & panels", amountCents: 1200000 },
      ] },
      { id: 2, name: "Distributed A/V", amountCents: 4100000, spentCents: 1800000, subBudgets: [
        { id: 21, name: "Equipment", amountCents: 2800000 },
        { id: 22, name: "Labor", amountCents: 1300000 },
      ] },
      { id: 3, name: "Alarm & Cameras", amountCents: 3400000, spentCents: 900000, subBudgets: [
        { id: 31, name: "Devices", amountCents: 2200000 },
        { id: 32, name: "Install", amountCents: 1200000 },
      ] },
      { id: 4, name: "Network & WiFi", amountCents: 1800000, spentCents: 200000, subBudgets: [
        { id: 41, name: "Access points", amountCents: 1000000 },
        { id: 42, name: "Config & tuning", amountCents: 800000 },
      ] },
    ],
  },
  {
    id: 3,
    name: "Closet & Basement Renovation",
    description:
      "Finished basement build-out with a custom primary closet system, egress, and a media room.",
    propertyName: "(C) 136 Field Point Circle",
    propertyAddress: "136 Field Point Circle, Greenwich, CT 06830",
    status: "active",
    originalBudgetCents: 21000000,
    approvedChangeOrdersCents: 0,
    spentCents: 4300000,
    depositsReceivedCents: 6300000,
    billedToDateCents: 5000000,
    outstandingInvoicesCents: 0,
    percentComplete: 22,
    startDate: "2026-05-19",
    targetEndDate: "2026-11-15",
    managerName: "Carter Hughes",
    managerInitials: "CH",
    taskCount: 4,
    tasks: [
      { id: 301, name: "Framing & egress window", status: "in_progress", priority: "high", workOrders: 1, ftos: 0, spentCents: 2600000, due: "Jul 10, 2026", assignee: "CH" },
      { id: 302, name: "Custom closet system", status: "not_started", priority: "normal", workOrders: 1, ftos: 0, spentCents: 0, due: "Aug 30, 2026", assignee: "CH" },
      { id: 303, name: "Media room A/V", status: "not_started", priority: "normal", workOrders: 1, ftos: 0, spentCents: 0, due: "Sep 30, 2026", assignee: "CH" },
      { id: 304, name: "Flooring & trim", status: "in_progress", priority: "normal", workOrders: 1, ftos: 1, spentCents: 1700000, due: "Oct 15, 2026", assignee: "KS" },
    ],
    changeOrders: [
      { id: 9201, number: "CO-001", description: "Add wet bar rough-in", reason: "Owner request", amountCents: 900000, status: "draft", createdOn: "Jun 30, 2026", decidedOn: null },
    ],
    schedule: [
      { id: 1, description: "Framing & structural", scheduledValueCents: 5200000, percentComplete: 55, billedToDateCents: 2860000 },
      { id: 2, description: "MEP", scheduledValueCents: 4400000, percentComplete: 20, billedToDateCents: 880000 },
      { id: 3, description: "Closet system", scheduledValueCents: 3800000, percentComplete: 0, billedToDateCents: 0 },
      { id: 4, description: "Media room", scheduledValueCents: 3100000, percentComplete: 0, billedToDateCents: 0 },
      { id: 5, description: "Flooring & finishes", scheduledValueCents: 4500000, percentComplete: 28, billedToDateCents: 1260000 },
    ],
    cashFlow: [
      { id: 1, date: "May 20, 2026", direction: "inbound", kind: "Deposit", description: "Project deposit (30%)", party: "Owner", amountCents: 6300000 },
      { id: 2, date: "Jun 30, 2026", direction: "outbound", kind: "Vendor Bill", description: "Framing & egress", party: "Palmer Builders", amountCents: 2600000 },
      { id: 3, date: "Jun 30, 2026", direction: "outbound", kind: "Sub Payment", description: "Subfloor & underlayment", party: "Coastal Flooring", amountCents: 1700000 },
    ],
  },
  {
    id: 4,
    name: "Pool House & Spa Construction",
    description:
      "New-build pool house with kitchenette, full bath, and mechanical room for the new spa.",
    propertyName: "(C) 65 Winthrop Drive",
    propertyAddress: "65 Winthrop Drive, Riverside, CT 06878",
    status: "planning",
    originalBudgetCents: 62000000,
    approvedChangeOrdersCents: 0,
    spentCents: 0,
    depositsReceivedCents: 15500000,
    billedToDateCents: 15500000,
    outstandingInvoicesCents: 0,
    percentComplete: 3,
    startDate: "2026-07-15",
    targetEndDate: "2027-04-30",
    managerName: "Carter Hughes",
    managerInitials: "CH",
    taskCount: 2,
    tasks: [
      { id: 401, name: "Permitting & site survey", status: "in_progress", priority: "high", workOrders: 1, ftos: 0, spentCents: 0, due: "Aug 15, 2026", assignee: "CH" },
      { id: 402, name: "Excavation & foundation", status: "not_started", priority: "high", workOrders: 1, ftos: 0, spentCents: 0, due: "Sep 30, 2026", assignee: "CH" },
    ],
    changeOrders: [],
    schedule: [
      { id: 1, description: "Sitework & foundation", scheduledValueCents: 14000000, percentComplete: 5, billedToDateCents: 700000 },
      { id: 2, description: "Structure & envelope", scheduledValueCents: 20000000, percentComplete: 0, billedToDateCents: 0 },
      { id: 3, description: "MEP & spa mechanical", scheduledValueCents: 13000000, percentComplete: 0, billedToDateCents: 0 },
      { id: 4, description: "Interior finishes", scheduledValueCents: 15000000, percentComplete: 0, billedToDateCents: 0 },
    ],
    cashFlow: [
      { id: 1, date: "Jul 01, 2026", direction: "inbound", kind: "Deposit", description: "Mobilization deposit (25%)", party: "Owner", amountCents: 15500000 },
    ],
  },
  {
    id: 5,
    name: "Whole-Home HVAC Replacement",
    description:
      "Replace three aging AC systems and add a mini-split zone for the sunroom.",
    propertyName: "(C) 10 Harding Lane",
    propertyAddress: "10 Harding Lane, Westport, CT 06880",
    status: "on_hold",
    originalBudgetCents: 8900000,
    approvedChangeOrdersCents: 300000,
    spentCents: 5400000,
    depositsReceivedCents: 4450000,
    billedToDateCents: 5000000,
    outstandingInvoicesCents: 550000,
    percentComplete: 60,
    startDate: "2026-04-20",
    targetEndDate: "2026-07-31",
    managerName: "Kira Shah",
    managerInitials: "KS",
    taskCount: 3,
    tasks: [
      { id: 501, name: "Replace A/C System", status: "completed", priority: "high", workOrders: 1, ftos: 0, spentCents: 3200000, due: "May 31, 2026", assignee: "KS" },
      { id: 502, name: "Install New A/C System (sunroom mini-split)", status: "in_progress", priority: "normal", workOrders: 1, ftos: 0, spentCents: 2200000, due: "Jun 25, 2026", assignee: "KS" },
      { id: 503, name: "Ductwork inspection & sealing", status: "not_started", priority: "normal", workOrders: 1, ftos: 1, spentCents: 0, due: "Jul 20, 2026", assignee: "KS" },
    ],
    changeOrders: [
      { id: 9501, number: "CO-001", description: "Add smart thermostats (3 zones)", reason: "Owner request", amountCents: 300000, status: "approved", createdOn: "May 15, 2026", decidedOn: "May 16, 2026" },
      { id: 9502, number: "CO-002", description: "Replace corroded refrigerant lines", reason: "Field condition", amountCents: 480000, status: "rejected", createdOn: "Jun 01, 2026", decidedOn: "Jun 03, 2026" },
    ],
    schedule: [
      { id: 1, description: "Unit 1 replacement", scheduledValueCents: 3200000, percentComplete: 100, billedToDateCents: 3200000 },
      { id: 2, description: "Unit 2 replacement", scheduledValueCents: 3000000, percentComplete: 60, billedToDateCents: 1800000 },
      { id: 3, description: "Mini-split zone", scheduledValueCents: 2400000, percentComplete: 0, billedToDateCents: 0 },
      { id: 4, description: "Thermostats & controls", scheduledValueCents: 600000, percentComplete: 0, billedToDateCents: 0 },
    ],
    cashFlow: [
      { id: 1, date: "Apr 21, 2026", direction: "inbound", kind: "Deposit", description: "Project deposit (50%)", party: "Owner", amountCents: 4450000 },
      { id: 2, date: "May 31, 2026", direction: "outbound", kind: "Sub Payment", description: "Unit 1 replacement", party: "Comfort Air HVAC", amountCents: 3200000 },
      { id: 3, date: "Jun 20, 2026", direction: "outbound", kind: "Vendor Bill", description: "Unit 2 equipment", party: "Comfort Air HVAC", amountCents: 2200000 },
    ],
  },
  {
    id: 6,
    name: "Exterior Restoration & Repaint",
    description:
      "Cedar siding repair, full exterior repaint, and driveway repave.",
    propertyName: "96 Willow Avenue",
    propertyAddress: "96 Willow Avenue, Larchmont, NY 10538",
    status: "completed",
    originalBudgetCents: 15600000,
    approvedChangeOrdersCents: 1200000,
    spentCents: 15900000,
    depositsReceivedCents: 16800000,
    billedToDateCents: 16800000,
    outstandingInvoicesCents: 0,
    percentComplete: 100,
    startDate: "2026-02-10",
    targetEndDate: "2026-05-30",
    managerName: "Carter Hughes",
    managerInitials: "CH",
    taskCount: 3,
    tasks: [
      { id: 601, name: "Cedar siding repair", status: "completed", priority: "high", workOrders: 1, ftos: 1, spentCents: 4200000, due: "Mar 20, 2026", assignee: "CH" },
      { id: 602, name: "Full exterior repaint", status: "completed", priority: "normal", workOrders: 1, ftos: 0, spentCents: 6900000, due: "Apr 30, 2026", assignee: "CH" },
      { id: 603, name: "Replace Corroded Grill Gas Line & repave driveway", status: "completed", priority: "normal", workOrders: 2, ftos: 0, spentCents: 4800000, due: "May 25, 2026", assignee: "CH" },
    ],
    changeOrders: [
      { id: 9601, number: "CO-001", description: "Additional rot repair at rear dormers", reason: "Field condition found during prep", amountCents: 1200000, status: "approved", createdOn: "Mar 15, 2026", decidedOn: "Mar 17, 2026" },
    ],
    schedule: [
      { id: 1, description: "Siding repair", scheduledValueCents: 5400000, percentComplete: 100, billedToDateCents: 5400000 },
      { id: 2, description: "Prep & paint", scheduledValueCents: 6900000, percentComplete: 100, billedToDateCents: 6900000 },
      { id: 3, description: "Driveway repave", scheduledValueCents: 4500000, percentComplete: 100, billedToDateCents: 4500000 },
    ],
    cashFlow: [
      { id: 1, date: "Feb 11, 2026", direction: "inbound", kind: "Deposit", description: "Project deposit (35%)", party: "Owner", amountCents: 5460000 },
      { id: 2, date: "Mar 31, 2026", direction: "inbound", kind: "Progress Payment", description: "Progress billing #1", party: "Owner", amountCents: 5670000 },
      { id: 3, date: "May 30, 2026", direction: "inbound", kind: "Progress Payment", description: "Final billing", party: "Owner", amountCents: 5670000 },
      { id: 4, date: "May 30, 2026", direction: "outbound", kind: "Sub Payment", description: "Painting crew (final)", party: "Precision Painters", amountCents: 6900000 },
    ],
  },
  {
    id: 7,
    name: "Primary Suite Addition & Deck",
    description:
      "Two-story addition adding a primary suite over a new family room, plus a composite rear deck.",
    propertyName: "(C) 30 Lindsay Drive",
    propertyAddress: "30 Lindsay Drive, Greenwich, CT 06830",
    status: "active",
    originalBudgetCents: 18500000,
    approvedChangeOrdersCents: 450000,
    spentCents: 8600000,
    depositsReceivedCents: 9550000,
    billedToDateCents: 8600000,
    outstandingInvoicesCents: 1500000,
    percentComplete: 40,
    startDate: "2026-04-15",
    targetEndDate: "2026-12-15",
    managerName: "Carter Hughes",
    managerInitials: "CH",
    taskCount: 5,
    tasks: [
      { id: 701, name: "Excavation & foundation", status: "completed", priority: "high", workOrders: 2, ftos: 0, spentCents: 3400000, due: "May 30, 2026", assignee: "CH" },
      { id: 702, name: "Framing & envelope", status: "in_progress", priority: "high", workOrders: 1, ftos: 1, spentCents: 3400000, due: "Jul 31, 2026", assignee: "CH" },
      { id: 703, name: "MEP rough-in", status: "in_progress", priority: "normal", workOrders: 3, ftos: 0, spentCents: 1200000, due: "Sep 15, 2026", assignee: "CH" },
      { id: 704, name: "Interior finishes", status: "not_started", priority: "normal", workOrders: 1, ftos: 0, spentCents: 600000, due: "Nov 15, 2026", assignee: "KS" },
      { id: 705, name: "Deck build", status: "not_started", priority: "normal", workOrders: 1, ftos: 0, spentCents: 0, due: "Dec 01, 2026", assignee: "KS" },
    ],
    changeOrders: [
      { id: 9701, number: "CO-001", description: "Add two skylights in primary bath", reason: "Owner request", amountCents: 450000, status: "approved", createdOn: "May 20, 2026", decidedOn: "May 22, 2026" },
      { id: 9702, number: "CO-002", description: "Upgrade deck to composite + integrated lighting", reason: "Owner request", amountCents: 320000, status: "pending_approval", createdOn: "Jun 28, 2026", decidedOn: null },
    ],
    schedule: [
      { id: 1, description: "Foundation & framing", scheduledValueCents: 5200000, percentComplete: 92, billedToDateCents: 4784000 },
      { id: 2, description: "Envelope", scheduledValueCents: 3800000, percentComplete: 53, billedToDateCents: 2014000 },
      { id: 3, description: "MEP", scheduledValueCents: 3400000, percentComplete: 35, billedToDateCents: 1190000 },
      { id: 4, description: "Interior finishes", scheduledValueCents: 4100000, percentComplete: 15, billedToDateCents: 615000 },
      { id: 5, description: "Deck", scheduledValueCents: 2000000, percentComplete: 0, billedToDateCents: 0 },
    ],
    cashFlow: [
      { id: 1, date: "Apr 16, 2026", direction: "inbound", kind: "Deposit", description: "Project deposit (30%)", party: "Owner", amountCents: 5550000 },
      { id: 2, date: "May 31, 2026", direction: "inbound", kind: "Progress Payment", description: "Progress billing #1", party: "Owner", amountCents: 4000000 },
      { id: 3, date: "May 31, 2026", direction: "outbound", kind: "Sub Payment", description: "Excavation & foundation", party: "Palmer Builders", amountCents: 3400000 },
      { id: 4, date: "Jun 30, 2026", direction: "outbound", kind: "Vendor Bill", description: "Framing lumber & labor", party: "Palmer Builders", amountCents: 2800000 },
    ],
    budgetCategories: [
      { id: 1, name: "Foundation & Framing", amountCents: 5200000, spentCents: 4800000, subBudgets: [
        { id: 11, name: "Excavation", amountCents: 1800000 },
        { id: 12, name: "Foundation", amountCents: 1600000 },
        { id: 13, name: "Framing", amountCents: 1800000 },
      ] },
      { id: 2, name: "Envelope", amountCents: 3800000, spentCents: 2000000, subBudgets: [
        { id: 21, name: "Roofing", amountCents: 1600000 },
        { id: 22, name: "Windows & doors", amountCents: 1400000 },
        { id: 23, name: "Siding", amountCents: 800000 },
      ] },
      { id: 3, name: "MEP", amountCents: 3400000, spentCents: 1200000, subBudgets: [
        { id: 31, name: "Electrical", amountCents: 1400000 },
        { id: 32, name: "Plumbing", amountCents: 1200000 },
        { id: 33, name: "HVAC", amountCents: 800000 },
      ] },
      { id: 4, name: "Interior Finishes", amountCents: 4100000, spentCents: 600000, subBudgets: [
        { id: 41, name: "Drywall & paint", amountCents: 1800000 },
        { id: 42, name: "Flooring", amountCents: 1500000 },
        { id: 43, name: "Trim", amountCents: 800000 },
      ] },
      { id: 5, name: "Deck", amountCents: 2000000, spentCents: 0, subBudgets: [
        { id: 51, name: "Framing", amountCents: 1200000 },
        { id: 52, name: "Decking & rail", amountCents: 800000 },
      ] },
    ],
    milestones: [
      { id: 1, name: "Foundation complete", targetDate: "2026-05-30", status: "complete", budgetCategoryId: 1, taskIds: [701] },
      { id: 2, name: "Framing & dried-in", targetDate: "2026-07-31", status: "in_progress", budgetCategoryId: 2, taskIds: [702] },
      { id: 3, name: "MEP rough-in complete", targetDate: "2026-09-15", status: "in_progress", budgetCategoryId: 3, taskIds: [703] },
      { id: 4, name: "Interior finishes complete", targetDate: "2026-11-15", status: "not_started", budgetCategoryId: 4, taskIds: [704] },
      { id: 5, name: "Deck complete", targetDate: "2026-12-01", status: "not_started", budgetCategoryId: 5, taskIds: [705] },
    ],
  },
];

export function getMockProject(id: number): MockProject | undefined {
  return MOCK_PROJECTS.find((p) => p.id === id);
}

/* ------------------------------ create project ---------------------------- */

/** Properties a project can be created against (demo list). */
export const PROPERTY_OPTIONS: { name: string; address: string }[] = [
  { name: "(C) 544 Oenoke Ridge", address: "544 Oenoke Ridge, New Canaan, CT 06840" },
  { name: "29 Hunting Ridge", address: "29 Hunting Ridge, Greenwich, CT 06831" },
  { name: "(C) 136 Field Point Circle", address: "136 Field Point Circle, Greenwich, CT 06830" },
  { name: "(C) 65 Winthrop Drive", address: "65 Winthrop Drive, Riverside, CT 06878" },
  { name: "(C) 10 Harding Lane", address: "10 Harding Lane, Westport, CT 06880" },
  { name: "96 Willow Avenue", address: "96 Willow Avenue, Larchmont, NY 10538" },
  { name: "(C) Palm Ventures LLC", address: "19 West Elm Street, Greenwich, CT 06830" },
  { name: "13 Wyckham Hill Lane", address: "13 Wyckham Hill Lane, Greenwich, CT 06831" },
];

/** Project managers a project can be assigned to (demo list). */
export const MANAGER_OPTIONS: { name: string; initials: string }[] = [
  { name: "Carter Hughes", initials: "CH" },
  { name: "Kira Shah", initials: "KS" },
];

/** Standalone tasks not yet in a project — can be pulled in at create time. */
export const MOCK_UNASSIGNED_TASKS: (MockProjectTask & { property: string })[] = [
  { id: 7001, name: "Roof Leak Inspection", property: "(C) Palm Ventures LLC", status: "not_started", priority: "high", workOrders: 1, ftos: 1, spentCents: 0, due: "Jun 24, 2026", assignee: "CH" },
  { id: 7002, name: "AC Repair", property: "(C) 544 Oenoke Ridge", status: "not_started", priority: "urgent", workOrders: 0, ftos: 0, spentCents: 0, due: "No Due Date", assignee: "CH" },
  { id: 7003, name: "Living Room Shades", property: "(C) 30 Lindsay Drive", status: "not_started", priority: "normal", workOrders: 1, ftos: 0, spentCents: 0, due: "May 31, 2026", assignee: "CH" },
  { id: 7004, name: "Replace Mailbox", property: "23 Stoneboat Road", status: "not_started", priority: "normal", workOrders: 1, ftos: 0, spentCents: 0, due: "May 31, 2026", assignee: "CH" },
  { id: 7005, name: "Electrical Repair: Pool Panel", property: "13 Wyckham Hill Lane", status: "not_started", priority: "normal", workOrders: 1, ftos: 0, spentCents: 0, due: "Jun 30, 2026", assignee: "CH" },
  { id: 7006, name: "Camera & Alarm Takeover", property: "13 Wyckham Hill Lane", status: "not_started", priority: "normal", workOrders: 1, ftos: 0, spentCents: 0, due: "Jun 30, 2026", assignee: "CH" },
];

/** Add a project to the in-memory demo store and return it (frontend-only). */
export function addMockProject(p: Omit<MockProject, "id">): MockProject {
  const id = Math.max(0, ...MOCK_PROJECTS.map((x) => x.id)) + 1;
  const created: MockProject = { ...p, id };
  MOCK_PROJECTS.unshift(created);
  return created;
}

/* ------------------------- work orders & field team ----------------------- */

export type WorkOrderStatus = "new" | "scheduled" | "in_progress" | "completed";
export type FTOStatus = "dispatched" | "in_progress" | "completed";

export interface MockWorkOrder {
  id: number;
  title: string;
  taskName: string;
  vendor: string;
  status: WorkOrderStatus;
  priority: MockProjectTask["priority"];
  estimateCents: number;
  billedCents: number;
  due: string;
}

export interface MockFieldTeamOrder {
  id: number;
  title: string;
  taskName: string;
  members: string;
  status: FTOStatus;
  hours: number;
  amountCents: number;
  due: string;
}

export const WORK_ORDER_STATUS_META: Record<
  WorkOrderStatus,
  { label: string; dot: string }
> = {
  new: { label: "New", dot: "#9CA3AF" },
  scheduled: { label: "Scheduled", dot: "#7C3AED" },
  in_progress: { label: "In Progress", dot: "#2563EB" },
  completed: { label: "Completed", dot: "#16A34A" },
};

export const FTO_STATUS_META: Record<FTOStatus, { label: string; dot: string }> = {
  dispatched: { label: "Dispatched", dot: "#7C3AED" },
  in_progress: { label: "In Progress", dot: "#2563EB" },
  completed: { label: "Completed", dot: "#16A34A" },
};

const VENDOR_POOL = [
  "Shoreline Plumbing",
  "Beacon Electric",
  "Fairfield Custom Cabinets",
  "SoundWorks CT",
  "Comfort Air HVAC",
  "Precision Painters",
  "Palmer Builders",
  "Coastal Flooring",
  "Greenwich Demo Co",
];

const FIELD_TEAM_POOL = ["Carlos M.", "Devon R.", "Priya K.", "Sam T."];

function woStatusFromTask(
  status: MockProjectTask["status"],
  idx: number,
): WorkOrderStatus {
  if (status === "completed") return "completed";
  if (status === "in_progress") return idx === 0 ? "in_progress" : "scheduled";
  return idx === 0 ? "scheduled" : "new";
}

function ftoStatusFromTask(status: MockProjectTask["status"]): FTOStatus {
  if (status === "completed") return "completed";
  if (status === "in_progress") return "in_progress";
  return "dispatched";
}

/** Expand each task's work-order count into concrete WO records for the demo. */
export function deriveWorkOrders(project: MockProject): MockWorkOrder[] {
  const out: MockWorkOrder[] = [];
  let seq = 0;
  project.tasks.forEach((task) => {
    for (let i = 0; i < task.workOrders; i++) {
      const share = task.workOrders > 0 ? task.spentCents / task.workOrders : 0;
      const status = woStatusFromTask(task.status, i);
      out.push({
        id: project.id * 1000 + ++seq,
        title: task.workOrders > 1 ? `${task.name} (${i + 1})` : task.name,
        taskName: task.name,
        vendor: VENDOR_POOL[(task.id + i) % VENDOR_POOL.length],
        status,
        priority: task.priority,
        estimateCents: Math.round(share * 1.05),
        billedCents: status === "completed" ? Math.round(share) : Math.round(share * 0.5),
        due: task.due,
      });
    }
  });
  return out;
}

/** Expand each task's FTO count into concrete field-team-order records. */
export function deriveFieldTeamOrders(project: MockProject): MockFieldTeamOrder[] {
  const out: MockFieldTeamOrder[] = [];
  let seq = 0;
  project.tasks.forEach((task) => {
    for (let i = 0; i < task.ftos; i++) {
      const hours = 6 + ((task.id + i) % 5) * 2;
      out.push({
        id: project.id * 2000 + ++seq,
        title: `${task.name} — field work`,
        taskName: task.name,
        members: FIELD_TEAM_POOL[(task.id + i) % FIELD_TEAM_POOL.length],
        status: ftoStatusFromTask(task.status),
        hours,
        amountCents: hours * 8500,
        due: task.due,
      });
    }
  });
  return out;
}
