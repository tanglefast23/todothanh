import {
  ShoppingCart,
  Store,
  Fuel,
  CircleParking,
  Car,
  Bike,
  Bus,
  Milestone,
  Droplets,
  Wrench,
  UtensilsCrossed,
  ChefHat,
  Cookie,
  Croissant,
  Coffee,
  CupSoda,
  Martini,
  Wine,
  GlassWater,
  IceCreamCone,
  Cake,
  Home,
  Zap,
  Wifi,
  Smartphone,
  Shirt,
  SprayCan,
  Pill,
  Stethoscope,
  Dumbbell,
  Cross,
  Scissors,
  Sparkles,
  PawPrint,
  Footprints,
  ShoppingBag,
  Gift,
  Monitor,
  Film,
  Gamepad2,
  Music,
  Tv,
  Mic,
  Plane,
  Hotel,
  BookOpen,
  GraduationCap,
  Banknote,
  ArrowRightLeft,
  Heart,
  Shield,
  Receipt,
  Baby,
} from "lucide-react";
import type { ComponentType } from "react";

export interface ExpenseIconConfig {
  Icon: ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

interface IconRule {
  keywords: string[];
  config: ExpenseIconConfig;
}

/**
 * Ordered matching rules — multi-word phrases MUST come before their
 * single-word substrings to avoid false positives (e.g. "bubble tea" before generic food).
 */
const ICON_RULES: IconRule[] = [
  // --- Transport & Vehicle ---
  { keywords: ["gas", "fuel", "petrol", "xăng"], config: { Icon: Fuel, color: "text-orange-600", bg: "bg-orange-500/15" } },
  { keywords: ["parking", "park"], config: { Icon: CircleParking, color: "text-blue-600", bg: "bg-blue-500/15" } },
  { keywords: ["car wash", "rửa xe"], config: { Icon: Droplets, color: "text-sky-600", bg: "bg-sky-500/15" } },
  { keywords: ["grab", "taxi", "uber"], config: { Icon: Car, color: "text-blue-600", bg: "bg-blue-500/15" } },
  { keywords: ["kia", "car", "xe hơi"], config: { Icon: Car, color: "text-slate-600", bg: "bg-slate-500/15" } },
  { keywords: ["motorbike", "bike", "xe máy"], config: { Icon: Bike, color: "text-slate-600", bg: "bg-slate-500/15" } },
  { keywords: ["bus"], config: { Icon: Bus, color: "text-indigo-600", bg: "bg-indigo-500/15" } },
  { keywords: ["toll", "phí"], config: { Icon: Milestone, color: "text-gray-600", bg: "bg-gray-500/15" } },
  { keywords: ["repair", "maintenance", "sửa"], config: { Icon: Wrench, color: "text-zinc-600", bg: "bg-zinc-500/15" } },

  // --- Food & Drink (order matters: specific phrases first) ---
  { keywords: ["groceries", "grocery", "supermarket", "siêu thị"], config: { Icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-500/15" } },
  { keywords: ["market", "chợ"], config: { Icon: Store, color: "text-emerald-600", bg: "bg-emerald-500/15" } },
  { keywords: ["restaurant", "nhà hàng"], config: { Icon: ChefHat, color: "text-amber-600", bg: "bg-amber-500/15" } },
  { keywords: ["snack", "snacks"], config: { Icon: Cookie, color: "text-orange-600", bg: "bg-orange-500/15" } },
  { keywords: ["bread", "bakery", "bánh mì"], config: { Icon: Croissant, color: "text-amber-600", bg: "bg-amber-500/15" } },
  { keywords: ["coffee", "café", "cafe", "cà phê"], config: { Icon: Coffee, color: "text-cyan-600", bg: "bg-cyan-500/15" } },
  { keywords: ["bubble tea", "boba", "trà sữa"], config: { Icon: CupSoda, color: "text-purple-600", bg: "bg-purple-500/15" } },
  { keywords: ["many drinks"], config: { Icon: Martini, color: "text-rose-600", bg: "bg-rose-500/15" } },
  { keywords: ["drinks", "cocktail", "alcohol", "bia", "beer", "rượu"], config: { Icon: Wine, color: "text-rose-600", bg: "bg-rose-500/15" } },
  { keywords: ["ice cream", "kem"], config: { Icon: IceCreamCone, color: "text-pink-600", bg: "bg-pink-500/15" } },
  { keywords: ["dessert", "cake", "bánh ngọt"], config: { Icon: Cake, color: "text-pink-600", bg: "bg-pink-500/15" } },
  { keywords: ["water", "nước uống"], config: { Icon: GlassWater, color: "text-cyan-600", bg: "bg-cyan-500/15" } },
  { keywords: ["food", "lunch", "dinner", "breakfast", "meal", "cơm", "ăn"], config: { Icon: UtensilsCrossed, color: "text-amber-600", bg: "bg-amber-500/15" } },

  // --- Home & Utilities ---
  { keywords: ["rent", "thuê nhà"], config: { Icon: Home, color: "text-blue-600", bg: "bg-blue-500/15" } },
  { keywords: ["electricity", "điện"], config: { Icon: Zap, color: "text-yellow-600", bg: "bg-yellow-500/15" } },
  { keywords: ["internet", "wifi"], config: { Icon: Wifi, color: "text-indigo-600", bg: "bg-indigo-500/15" } },
  { keywords: ["phone", "mobile", "điện thoại"], config: { Icon: Smartphone, color: "text-slate-600", bg: "bg-slate-500/15" } },
  { keywords: ["laundry", "giặt"], config: { Icon: Shirt, color: "text-violet-600", bg: "bg-violet-500/15" } },
  { keywords: ["cleaning", "dọn"], config: { Icon: SprayCan, color: "text-teal-600", bg: "bg-teal-500/15" } },

  // --- Health & Wellness ---
  { keywords: ["medicine", "thuốc", "pharmacy"], config: { Icon: Pill, color: "text-red-600", bg: "bg-red-500/15" } },
  { keywords: ["doctor", "hospital", "bệnh viện"], config: { Icon: Stethoscope, color: "text-pink-600", bg: "bg-pink-500/15" } },
  { keywords: ["vet"], config: { Icon: Stethoscope, color: "text-pink-600", bg: "bg-pink-500/15" } },
  { keywords: ["gym", "fitness", "tập"], config: { Icon: Dumbbell, color: "text-indigo-600", bg: "bg-indigo-500/15" } },
  { keywords: ["dentist", "nha sĩ", "răng"], config: { Icon: Cross, color: "text-teal-600", bg: "bg-teal-500/15" } },
  { keywords: ["haircut", "tóc", "salon"], config: { Icon: Scissors, color: "text-violet-600", bg: "bg-violet-500/15" } },
  { keywords: ["spa"], config: { Icon: Sparkles, color: "text-pink-600", bg: "bg-pink-500/15" } },

  // --- Pets ---
  { keywords: ["grooming", "groom"], config: { Icon: Scissors, color: "text-violet-600", bg: "bg-violet-500/15" } },
  { keywords: ["pet food", "thức ăn"], config: { Icon: PawPrint, color: "text-amber-600", bg: "bg-amber-500/15" } },

  // --- Shopping ---
  { keywords: ["clothes", "quần áo", "áo"], config: { Icon: Shirt, color: "text-purple-600", bg: "bg-purple-500/15" } },
  { keywords: ["shoes", "giày", "dép"], config: { Icon: Footprints, color: "text-amber-600", bg: "bg-amber-500/15" } },
  { keywords: ["shopee", "lazada", "tiki", "online"], config: { Icon: ShoppingBag, color: "text-orange-600", bg: "bg-orange-500/15" } },
  { keywords: ["gift", "quà", "present"], config: { Icon: Gift, color: "text-pink-600", bg: "bg-pink-500/15" } },
  { keywords: ["cosmetics", "makeup", "mỹ phẩm"], config: { Icon: Sparkles, color: "text-rose-600", bg: "bg-rose-500/15" } },
  { keywords: ["electronics", "điện tử"], config: { Icon: Monitor, color: "text-blue-600", bg: "bg-blue-500/15" } },

  // --- Entertainment ---
  { keywords: ["movie", "phim", "cinema"], config: { Icon: Film, color: "text-indigo-600", bg: "bg-indigo-500/15" } },
  { keywords: ["game", "games"], config: { Icon: Gamepad2, color: "text-purple-600", bg: "bg-purple-500/15" } },
  { keywords: ["music", "nhạc"], config: { Icon: Music, color: "text-pink-600", bg: "bg-pink-500/15" } },
  { keywords: ["netflix", "subscription"], config: { Icon: Tv, color: "text-indigo-600", bg: "bg-indigo-500/15" } },
  { keywords: ["karaoke"], config: { Icon: Mic, color: "text-rose-600", bg: "bg-rose-500/15" } },
  { keywords: ["travel", "du lịch"], config: { Icon: Plane, color: "text-sky-600", bg: "bg-sky-500/15" } },
  { keywords: ["hotel", "khách sạn"], config: { Icon: Hotel, color: "text-amber-600", bg: "bg-amber-500/15" } },

  // --- Education ---
  { keywords: ["book", "sách"], config: { Icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-500/15" } },
  { keywords: ["school", "trường", "tuition", "học phí"], config: { Icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-500/15" } },

  // --- Financial ---
  { keywords: ["top up", "nạp"], config: { Icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-500/15" } },
  { keywords: ["transfer", "chuyển"], config: { Icon: ArrowRightLeft, color: "text-blue-600", bg: "bg-blue-500/15" } },
  { keywords: ["tip", "tips"], config: { Icon: Heart, color: "text-pink-600", bg: "bg-pink-500/15" } },
  { keywords: ["insurance", "bảo hiểm"], config: { Icon: Shield, color: "text-blue-600", bg: "bg-blue-500/15" } },
  { keywords: ["tax", "thuế"], config: { Icon: Receipt, color: "text-zinc-600", bg: "bg-zinc-500/15" } },

  // --- Life Events ---
  { keywords: ["birthday", "sinh nhật"], config: { Icon: Cake, color: "text-pink-600", bg: "bg-pink-500/15" } },
  { keywords: ["wedding", "cưới"], config: { Icon: Heart, color: "text-rose-600", bg: "bg-rose-500/15" } },
  { keywords: ["baby", "em bé", "diaper", "tã"], config: { Icon: Baby, color: "text-pink-600", bg: "bg-pink-500/15" } },
];

const DEFAULT_ICON: ExpenseIconConfig = {
  Icon: Receipt,
  color: "text-zinc-600",
  bg: "bg-zinc-500/15",
};

/** Returns a Lucide icon + color/bg classes for any expense name. */
export function getExpenseIcon(name: string): ExpenseIconConfig {
  const n = name.toLowerCase();

  for (const rule of ICON_RULES) {
    if (rule.keywords.some((kw) => n.includes(kw))) {
      return rule.config;
    }
  }

  return DEFAULT_ICON;
}

/** Detects cat-related expenses and returns which cat image(s) to show. */
export function getExpenseCatImage(name: string): "ivory" | "tom" | "both" | null {
  const n = name.toLowerCase();

  if (n.includes("tom and ivory") || n.includes("both")) return "both";
  if (n.includes("ivory")) return "ivory";
  if (n.includes("tom")) return "tom";

  return null;
}
