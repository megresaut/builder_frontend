import { useLocation } from "react-router-dom";
import { MOCK_TASKS } from "@/data/tasks";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export const useBreadcrumbs = (): BreadcrumbItem[] => {
  const location = useLocation();

  const getBreadcrumbItems = () => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const items: BreadcrumbItem[] = [];

    if (path === "/fto") {
      items.push({ label: "Home" });
    } else if (path.includes("/fto/submission")) {
      items.push({ label: "Home", href: "/fto" });
      items.push({ label: "Submission Summary" });
    } else if (path.includes("/vendors/") && !path.endsWith("/vendors")) {
      const match = path.match(/\/vendors\/(\d+)/);
      if (match) {
        const vendorId = match[1];
        const vendorData: Record<string, string> = {
          "1": "Dolce Heating & Plumbing",
          "2": "David Smith",
          "3": "David Smith",
          "4": "David Smith",
          "5": "David Smith",
          "6": "David Smith",
          "7": "David Smith",
          "8": "David Smith",
          "9": "David Smith",
          "10": "David Smith",
        };
        items.push({ label: "Vendors", href: "/vendors" });
        items.push({ label: vendorData[vendorId] || `Vendor ${vendorId}` });
      }
    } else if (path === "/utilities/view-bill") {
      items.push({ label: "Utilities", href: "/utilities" });
      items.push({ label: "View Bill" });
    } else if (path === "/record-bill" || path.includes("/bills/record")) {
      items.push({ label: "Bills", href: "/bills" });
      items.push({ label: "Record Bill" });
    } else if (path.includes("/tasks/")) {
      const match = path.match(/\/tasks\/(\d+)(?:\/(\w+))?(?:\/(\d+))?/);
      if (match) {
        const taskId = match[1];
        const tab = match[2];
        const workOrderId = match[3];
        items.push({ label: "Tasks", href: "/all-tasks" });

        // Try to get task name from navigation state first, then MOCK_TASKS, then fall back to hardcoded mapping
        const navigationState = location.state as any;
        let taskName = navigationState?.task?.title || navigationState?.taskData?.title;

        if (!taskName) {
          // Try to find in MOCK_TASKS
          const mockTask = MOCK_TASKS.find((t) => String(t.id) === taskId);
          taskName = mockTask?.title;
        }

        if (!taskName) {
          const taskData: Record<string, string> = {
            "1": "Edgerton - Quote",
            "2": "Downtown Renovation",
            "3": "HVAC Installation",
            "4": "Electrical Rewiring",
            "5": "Plumbing Repairs",
            "6": "Roof Inspection",
            "7": "Window Replacement",
            "8": "Door Repairs",
            "9": "Painting Project",
            "10": "Foundation Work",
          };
          taskName = taskData[taskId];
        }

        items.push({
          label: taskName || `Task ${taskId}`,
          href: `/tasks/${taskId}/summary`
        });

        if (tab && tab !== "summary") {
          const tabLabels: Record<string, string> = {
            workorders: "Work Orders",
            fieldteam: "Field Team Orders",
          };
          const tabHrefs: Record<string, string> = {
            workorders: `/tasks/${taskId}/workorders`,
            fieldteam: `/tasks/${taskId}/fieldteam`,
          };
          items.push({
            label: tabLabels[tab] || tab,
            href: tabHrefs[tab]
          });

          if (workOrderId && tab === "workorders") {
            const workOrderData: Record<string, string> = {
              "1": "Doors Need To Be Repaired",
              "2": "Doors Need To Be Repaired",
              "3": "Doors Need To Be Repaired",
              "4": "Doors Need To Be Repaired",
              "5": "Doors Need To Be Repaired",
              "6": "Doors Need To Be Repaired",
              "7": "Doors Need To Be Repaired",
              "8": "Doors Need To Be Repaired",
              "9": "Doors Need To Be Repaired",
              "10": "Doors Need To Be Repaired",
            };
            items.push({
              label: workOrderData[workOrderId] || `Work Order ${workOrderId}`,
            });
          }
        }
      }
    } else if (path.includes("/property/")) {
      const match = path.match(/\/property\/(\d+)(?:\/(\w+))?/);
      if (match) {
        const propertyId = match[1];
        const tab = match[2];
        items.push({ label: "Properties", href: "/all-properties" });

        const propertyAddresses: Record<string, string> = {
          "1": "22 Indian Chase Dr, Greenwich, CT",
          "2": "22 Indian Chase Dr, Greenwich, CT",
          "3": "22 Indian Chase Dr, Greenwich, CT",
          "4": "22 Indian Chase Dr, Greenwich, CT",
          "5": "22 Indian Chase Dr, Greenwich, CT",
          "6": "22 Indian Chase Dr, Greenwich, CT",
          "7": "22 Indian Chase Dr, Greenwich, CT",
          "8": "22 Indian Chase Dr, Greenwich, CT",
          "9": "22 Indian Chase Dr, Greenwich, CT",
          "10": "22 Indian Chase Dr, Greenwich, CT",
        };

        items.push({ label: propertyAddresses[propertyId] || "Property" });

        if (tab && tab !== "Overview") {
          items.push({ label: tab });

          if (tab === "Units") {
            const unitId = searchParams.get("unit");
            if (unitId) {
              const unitLabels: Record<string, string> = {
                "1": "Unit 1A",
                "2": "Unit 1B",
                "3": "Unit 2A",
                "4": "Unit 2B",
                "5": "Unit 3A",
              };
              items.push({ label: unitLabels[unitId] || `Unit ${unitId}` });
            }
          }
        }
      }
    } else if (path === "/all-properties") {
      items.push({ label: "All Properties" });
    } else if (path === "/all-tasks") {
      items.push({ label: "All Tasks" });
    } else if (path === "/utilities") {
      items.push({ label: "Utilities" });
    } else if (path === "/bills") {
      items.push({ label: "Bills" });
    } else if (path === "/field-team-orders") {
      items.push({ label: "Field Team Orders" });
    } else if (path === "/work-orders") {
      items.push({ label: "Work Orders" });
    } else if (path === "/recurring-tasks") {
      items.push({ label: "Recurring Tasks" });
    } else if (path === "/vendors") {
      items.push({ label: "Vendors" });
    } else if (path === "/record-bill") {
      items.push({ label: "Bills", href: "/bills" });
      items.push({ label: "Record Bill" });
    } else if (path === "/maintenance-work-orders") {
      items.push({ label: "Maintenance Work Orders" });
    }

    return items;
  };

  return getBreadcrumbItems();
};
