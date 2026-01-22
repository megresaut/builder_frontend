import React from "react";
import SectionCard from "@/components/SectionCard";
import { PeopleSubsection } from "@/components/PeopleSubsection";
import type { Person } from "@/components/PeopleSubsection";

interface InspectionAssigneesProps {
  fieldTeam: Person[];
  variant?: "default" | "gray" | "white";
}

/**
 * InspectionAssignees
 *
 * Displays the field team assigned to an inspection.
 * Simplified version of PeopleCard without tabs or multiple subsections.
 */
export const InspectionAssignees: React.FC<InspectionAssigneesProps> = ({
  fieldTeam,
  variant = "default",
}) => {
  return (
    <SectionCard variant={variant} title="Field Team Assignees">
      <div className="flex flex-col w-full">
        <div className="h-px bg-[#e5e5e5] w-full mb-3" />
        <PeopleSubsection
          label=""
          mode="rows"
          people={fieldTeam}
          showDivider={false}
          showRoleLabel={true}
          showPhone={false}
          density="default"
          type="assignee"
        />
      </div>
    </SectionCard>
  );
};

export default InspectionAssignees;
