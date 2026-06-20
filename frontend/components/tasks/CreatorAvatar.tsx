"use client";

import { cn } from "@/lib/utils";
import { PROFILE_PICTURES } from "@/lib/colors";

// Deterministic color palette — chosen by hashing the name, distinct from the
// positional palette used in AccountSelector / Header.
const CREATOR_AVATAR_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-rose-500",
];

interface CreatorAvatarProps {
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function CreatorAvatar({ name, className, size = "sm" }: CreatorAvatarProps) {
  // Check if there's a profile picture for this name
  // Try matching first name (lowercase, trimmed)
  const firstName = name.toLowerCase().trim().split(" ")[0];
  const profilePic = PROFILE_PICTURES[firstName];

  // Get initials (first letter of first two words, or first two letters)
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Consistent color based on name hash
  const colorIndex = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % CREATOR_AVATAR_COLORS.length;
  const bgColor = CREATOR_AVATAR_COLORS[colorIndex];

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };

  if (profilePic) {
    return (
      <img
        src={profilePic}
        alt={name}
        title={name}
        className={cn(
          "rounded-full object-cover flex-shrink-0",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-medium flex-shrink-0",
        bgColor,
        sizeClasses[size],
        className
      )}
      title={name}
    >
      {initials}
    </div>
  );
}
