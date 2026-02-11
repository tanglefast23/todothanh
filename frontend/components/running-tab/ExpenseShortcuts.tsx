"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ShoppingCart,
  Fuel,
  Coffee,
  UtensilsCrossed,
  ParkingCircle,
  Cat,
  CupSoda,
  Wine,
  Syringe,
  Scissors,
  Package,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpenseShortcutsProps {
  onSelectExpense: (name: string) => void;
}

type ShortcutStep = "main" | "drinks" | "cats" | "cats-expense";

export function ExpenseShortcuts({ onSelectExpense }: ExpenseShortcutsProps) {
  const [step, setStep] = useState<ShortcutStep>("main");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const resetToMain = () => {
    setStep("main");
    setSelectedCat(null);
  };

  // Simple shortcuts - single tap
  const handleSimpleShortcut = (name: string) => {
    onSelectExpense(name);
  };

  // Drinks sub-options
  const handleDrinksSelect = (drinkType: string) => {
    onSelectExpense(drinkType);
    resetToMain();
  };

  // Cats - first select which cat
  const handleCatSelect = (cat: string) => {
    setSelectedCat(cat);
    setStep("cats-expense");
  };

  // Cats - then select expense type
  const handleCatExpenseSelect = (expenseType: string) => {
    if (selectedCat) {
      onSelectExpense(`${selectedCat} - ${expenseType}`);
    }
    resetToMain();
  };

  // Main shortcuts grid
  if (step === "main") {
    return (
      <div className="space-y-3">
        {/* Section label */}
        <div className="flex items-center justify-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium px-2">
            Quick Add
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Grid of shortcuts */}
        <div className="grid grid-cols-6 gap-2 sm:gap-3">
          <ShortcutTile
            onClick={() => handleSimpleShortcut("Groceries")}
            label="Groceries"
            icon={ShoppingCart}
            color="emerald"
          />
          <ShortcutTile
            onClick={() => handleSimpleShortcut("Gas")}
            label="Gas"
            icon={Fuel}
            color="amber"
          />
          <ShortcutTile
            onClick={() => setStep("drinks")}
            label="Drinks"
            icon={CupSoda}
            color="cyan"
            hasSubmenu
          />
          <ShortcutTile
            onClick={() => handleSimpleShortcut("Food")}
            label="Food"
            icon={UtensilsCrossed}
            color="rose"
          />
          <ShortcutTile
            onClick={() => handleSimpleShortcut("Parking")}
            label="Parking"
            icon={ParkingCircle}
            color="slate"
          />
          <ShortcutTile
            onClick={() => setStep("cats")}
            label="Cats"
            icon={Cat}
            color="violet"
            hasSubmenu
          />
        </div>
      </div>
    );
  }

  // Drinks sub-options - Full screen overlay
  if (step === "drinks") {
    return (
      <FullScreenOverlay title="Select drink type" onBack={resetToMain}>
        <LargeShortcutTile
          onClick={() => handleDrinksSelect("Bubble Tea")}
          label="Bubble Tea"
          sublabel="🧋"
          icon={CupSoda}
          color="amber"
        />
        <LargeShortcutTile
          onClick={() => handleDrinksSelect("Coffee")}
          label="Coffee"
          sublabel="☕"
          icon={Coffee}
          color="orange"
        />
        <LargeShortcutTile
          onClick={() => handleDrinksSelect("Many Drinks")}
          label="Many Drinks"
          sublabel="🍹🍸🍺"
          icon={Wine}
          color="pink"
        />
      </FullScreenOverlay>
    );
  }

  // Cats - select which cat - Full screen overlay
  if (step === "cats") {
    return (
      <FullScreenOverlay title="Which cat?" onBack={resetToMain}>
        <LargeShortcutTile
          onClick={() => handleCatSelect("Ivory")}
          label="Ivory"
          sublabel="white kitty"
          catImage="ivory"
          color="slate"
        />
        <LargeShortcutTile
          onClick={() => handleCatSelect("Tom")}
          label="Tom"
          sublabel="brown kitty"
          catImage="tom"
          color="amber"
        />
        <LargeShortcutTile
          onClick={() => handleCatSelect("Tom and Ivory")}
          label="Both Cats"
          sublabel="the dynamic duo"
          catImage="both"
          color="violet"
        />
      </FullScreenOverlay>
    );
  }

  // Cats - select expense type - Full screen overlay
  if (step === "cats-expense") {
    return (
      <FullScreenOverlay title={`${selectedCat} — expense type`} onBack={() => setStep("cats")}>
        <LargeShortcutTile
          onClick={() => handleCatExpenseSelect("Vet")}
          label="Vet Visit"
          sublabel="health & checkups"
          icon={Syringe}
          color="rose"
        />
        <LargeShortcutTile
          onClick={() => handleCatExpenseSelect("Grooming")}
          label="Grooming"
          sublabel="spa day"
          icon={Scissors}
          color="sky"
        />
        <LargeShortcutTile
          onClick={() => handleCatExpenseSelect("Other")}
          label="Other"
          sublabel="misc expenses"
          icon={Package}
          color="zinc"
        />
      </FullScreenOverlay>
    );
  }

  return null;
}

// Premium color configurations with glassmorphism effect
const tileColors = {
  emerald: {
    bg: "bg-gradient-to-br from-emerald-500/15 to-emerald-600/5",
    border: "border-emerald-500/30 hover:border-emerald-400/60",
    icon: "text-emerald-500",
    glow: "group-hover:shadow-emerald-500/25",
    ring: "ring-emerald-500/20",
  },
  amber: {
    bg: "bg-gradient-to-br from-amber-500/15 to-amber-600/5",
    border: "border-amber-500/30 hover:border-amber-400/60",
    icon: "text-amber-500",
    glow: "group-hover:shadow-amber-500/25",
    ring: "ring-amber-500/20",
  },
  cyan: {
    bg: "bg-gradient-to-br from-cyan-500/15 to-cyan-600/5",
    border: "border-cyan-500/30 hover:border-cyan-400/60",
    icon: "text-cyan-500",
    glow: "group-hover:shadow-cyan-500/25",
    ring: "ring-cyan-500/20",
  },
  rose: {
    bg: "bg-gradient-to-br from-rose-500/15 to-rose-600/5",
    border: "border-rose-500/30 hover:border-rose-400/60",
    icon: "text-rose-500",
    glow: "group-hover:shadow-rose-500/25",
    ring: "ring-rose-500/20",
  },
  slate: {
    bg: "bg-gradient-to-br from-slate-500/15 to-slate-600/5",
    border: "border-slate-500/30 hover:border-slate-400/60",
    icon: "text-slate-400",
    glow: "group-hover:shadow-slate-500/25",
    ring: "ring-slate-500/20",
  },
  violet: {
    bg: "bg-gradient-to-br from-violet-500/15 to-violet-600/5",
    border: "border-violet-500/30 hover:border-violet-400/60",
    icon: "text-violet-500",
    glow: "group-hover:shadow-violet-500/25",
    ring: "ring-violet-500/20",
  },
  orange: {
    bg: "bg-gradient-to-br from-orange-500/15 to-orange-600/5",
    border: "border-orange-500/30 hover:border-orange-400/60",
    icon: "text-orange-500",
    glow: "group-hover:shadow-orange-500/25",
    ring: "ring-orange-500/20",
  },
  pink: {
    bg: "bg-gradient-to-br from-pink-500/15 to-pink-600/5",
    border: "border-pink-500/30 hover:border-pink-400/60",
    icon: "text-pink-500",
    glow: "group-hover:shadow-pink-500/25",
    ring: "ring-pink-500/20",
  },
  sky: {
    bg: "bg-gradient-to-br from-sky-500/15 to-sky-600/5",
    border: "border-sky-500/30 hover:border-sky-400/60",
    icon: "text-sky-500",
    glow: "group-hover:shadow-sky-500/25",
    ring: "ring-sky-500/20",
  },
  zinc: {
    bg: "bg-gradient-to-br from-zinc-500/15 to-zinc-600/5",
    border: "border-zinc-500/30 hover:border-zinc-400/60",
    icon: "text-zinc-400",
    glow: "group-hover:shadow-zinc-500/25",
    ring: "ring-zinc-500/20",
  },
};

// Full screen overlay for sub-menus
function FullScreenOverlay({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-2xl flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-semibold tracking-tight">{title}</span>
      </div>

      {/* Large tiles */}
      <div className="flex-1 flex flex-col gap-3 p-4">
        {children}
      </div>
    </div>
  );
}

// Large shortcut tile for overlay
function LargeShortcutTile({
  label,
  sublabel,
  icon: Icon,
  catImage,
  onClick,
  color,
}: {
  label: string;
  sublabel?: string;
  icon?: LucideIcon;
  catImage?: "ivory" | "tom" | "both";
  onClick: () => void;
  color: keyof typeof tileColors;
}) {
  const colors = tileColors[color];

  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex-1 w-full rounded-3xl border-2 flex items-center gap-5 px-6",
        "transition-all duration-300 active:scale-[0.98]",
        "shadow-lg hover:shadow-xl",
        colors.bg,
        colors.border,
        colors.glow
      )}
    >
      {/* Icon or cat image */}
      <div className={cn(
        "w-20 h-20 rounded-2xl flex items-center justify-center",
        "bg-background/50 backdrop-blur-sm border border-white/10",
        "shadow-inner"
      )}>
        {catImage ? (
          catImage === "both" ? (
            <div className="flex -space-x-3">
              <img src="/ivory.PNG" alt="Ivory" className="w-10 h-12 rounded-lg object-contain drop-shadow-lg" />
              <img src="/tom.png" alt="Tom" className="w-10 h-12 rounded-lg object-contain drop-shadow-lg" />
            </div>
          ) : (
            <img
              src={catImage === "ivory" ? "/ivory.PNG" : "/tom.png"}
              alt={catImage === "ivory" ? "Ivory" : "Tom"}
              className="w-14 h-16 rounded-xl object-contain drop-shadow-lg"
            />
          )
        ) : Icon ? (
          <Icon className={cn("w-10 h-10", colors.icon)} />
        ) : null}
      </div>

      {/* Text content */}
      <div className="flex-1 text-left">
        <p className="text-xl font-bold tracking-tight">{label}</p>
        {sublabel && (
          <p className="text-sm text-muted-foreground/80 mt-0.5">{sublabel}</p>
        )}
      </div>

      {/* Arrow indicator */}
      <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-muted-foreground/70 group-hover:translate-x-1 transition-all" />
    </button>
  );
}

// Compact shortcut tile for main grid
function ShortcutTile({
  label,
  icon: Icon,
  catImage,
  onClick,
  color,
  hasSubmenu,
}: {
  label: string;
  icon?: LucideIcon;
  catImage?: "ivory" | "tom" | "both";
  onClick: () => void;
  color: keyof typeof tileColors;
  hasSubmenu?: boolean;
}) {
  const colors = tileColors[color];

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1",
        "transition-all duration-200 active:scale-90",
        "shadow-md hover:shadow-lg",
        colors.bg,
        colors.border,
        colors.glow
      )}
    >
      {/* Icon container with subtle inner glow */}
      <div className={cn(
        "w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center",
        "transition-transform duration-200 group-hover:scale-110"
      )}>
        {catImage ? (
          catImage === "both" ? (
            <div className="flex -space-x-1">
              <img src="/ivory.PNG" alt="Ivory" className="w-4 h-5 sm:w-5 sm:h-6 rounded object-contain" />
              <img src="/tom.png" alt="Tom" className="w-4 h-5 sm:w-5 sm:h-6 rounded object-contain" />
            </div>
          ) : (
            <img
              src={catImage === "ivory" ? "/ivory.PNG" : "/tom.png"}
              alt={catImage === "ivory" ? "Ivory" : "Tom"}
              className="w-6 h-7 sm:w-7 sm:h-8 rounded object-contain"
            />
          )
        ) : Icon ? (
          <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", colors.icon)} strokeWidth={2} />
        ) : null}
      </div>

      {/* Label */}
      <span className="text-[9px] sm:text-[10px] font-semibold text-foreground/70 leading-tight">
        {label}
      </span>

      {/* Submenu indicator - premium pill style */}
      {hasSubmenu && (
        <div className={cn(
          "absolute -top-1 -right-1 w-4 h-4 rounded-full",
          "bg-gradient-to-br from-white/90 to-white/70",
          "dark:from-white/20 dark:to-white/10",
          "border border-white/50 dark:border-white/20",
          "flex items-center justify-center",
          "shadow-sm"
        )}>
          <span className="text-[8px] font-bold text-slate-600 dark:text-white/80">+</span>
        </div>
      )}
    </button>
  );
}
