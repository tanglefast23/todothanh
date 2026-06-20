/**
 * Shared color palettes and profile picture mappings used across components.
 * Single source of truth to avoid duplication between AccountSelector and Header.
 */

export const AVATAR_COLORS = [
  { bg: "bg-violet-500", text: "text-white", ring: "ring-violet-400" },
  { bg: "bg-emerald-500", text: "text-white", ring: "ring-emerald-400" },
  { bg: "bg-amber-500", text: "text-white", ring: "ring-amber-400" },
  { bg: "bg-rose-500", text: "text-white", ring: "ring-rose-400" },
  { bg: "bg-cyan-500", text: "text-white", ring: "ring-cyan-400" },
  { bg: "bg-fuchsia-500", text: "text-white", ring: "ring-fuchsia-400" },
  { bg: "bg-lime-500", text: "text-white", ring: "ring-lime-400" },
  { bg: "bg-orange-500", text: "text-white", ring: "ring-orange-400" },
];

export const PROFILE_PICTURES: Record<string, string> = {
  joe: "/joe.png",
  cliff: "/cliff.png",
  foad: "/foad.png",
  ivy: "/ivy.png",
  leonard: "/leonard.png",
  thanh: "/thanh.png",
};

export function getProfilePicture(name: string | undefined | null): string | null {
  if (!name || typeof name !== "string") return null;
  return PROFILE_PICTURES[name.toLowerCase().trim()] || null;
}
