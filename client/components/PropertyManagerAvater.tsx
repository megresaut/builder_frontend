import React, { useState } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

interface PropertyManagerAvatarProps {
  name: string;
  isCreator: boolean;
}

export const PropertyManagerAvatar: React.FC<PropertyManagerAvatarProps> = ({
  name,
  isCreator,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Get initials from name
  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(name);

  // Desktop tooltip content
  const tooltipContent = (
    <div className="text-xs">
      <div className="font-medium">{name}</div>
      {isCreator && <div className="text-blue-300">Creator</div>}
    </div>
  );

  // Mobile popover content
  const popoverContent = (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium">{name}</div>
      {isCreator && (
        <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded w-fit">
          Creator
        </div>
      )}
    </div>
  );

  // Avatar circle
  const avatarCircle = (
    <div
      className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold cursor-pointer hover:bg-blue-600 transition-colors"
      title={name}
    >
      {initials}
    </div>
  );

  return (
    <div className="hidden lg:flex">
      {/* Desktop: Tooltip on hover */}
      <Tooltip>
        <TooltipTrigger asChild>{avatarCircle}</TooltipTrigger>
        <TooltipContent side="top" className="bg-gray-900 text-white border-0">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export const PropertyManagerAvatarMobile: React.FC<
  PropertyManagerAvatarProps
> = ({ name, isCreator }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(name);

  const avatarCircle = (
    <div
      className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold cursor-pointer"
      title={name}
    >
      {initials}
    </div>
  );

  const popoverContent = (
    <div className="flex flex-col gap-2 p-2">
      <div className="text-sm font-medium">{name}</div>
      {isCreator && (
        <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded w-fit">
          Creator
        </div>
      )}
    </div>
  );

  return (
    <div className="flex lg:hidden">
      {/* Mobile: Popover on click */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>{avatarCircle}</PopoverTrigger>
        <PopoverContent side="top" className="w-auto p-0 border-0 shadow-lg">
          {popoverContent}
        </PopoverContent>
      </Popover>
    </div>
  );
};

interface CombinedPropertyManagerAvatarProps extends PropertyManagerAvatarProps {}

export const PropertyManagerAvatarCombined: React.FC<
  CombinedPropertyManagerAvatarProps
> = (props) => {
  return (
    <div className="flex items-center gap-2">
      <PropertyManagerAvatar {...props} />
      <PropertyManagerAvatarMobile {...props} />
    </div>
  );
};
