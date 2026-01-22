import React from "react";
import PersonAvatars from "@/components/PersonAvatars";
import type { PersonAvatarsPerson } from "@/components/PersonAvatars";

interface PersonAvatarTagProps {
  person: PersonAvatarsPerson;
  size?: "sm" | "md" | "lg";
  type?: "assignee" | "collaborator";
  className?: string;
}

/**
 * PersonAvatarTag
 *
 * A reusable template for displaying a person avatar with an interactive hover tooltip.
 * Shows the person's name, title, email, and phone number on hover.
 *
 * @example
 * <PersonAvatarTag
 *   person={{
 *     name: "Jerry Sanchez",
 *     initials: "JS",
 *     email: "jerry.sanchez@example.com",
 *     phone: "(555) 123-4567",
 *     title: "Field Manager"
 *   }}
 *   size="sm"
 * />
 */
export const PersonAvatarTag: React.FC<PersonAvatarTagProps> = ({
  person,
  size = "md",
  type = "assignee",
  className,
}) => {
  return (
    <PersonAvatars
      people={[person]}
      size={size}
      type={type}
      className={className}
    />
  );
};

export default PersonAvatarTag;
