import React from "react";
import { Filled, Duotone, Rounded, Motion, IconKey } from "@/design-system/icons/variants";

export type IconVariant = "filled" | "duotone" | "rounded" | "motion";

export type IconName = IconKey | Lowercase<IconKey>;

type IconProps = {
    name: IconName;
    variant?: IconVariant;
    className?: string;
    title?: string;
    "aria-label"?: string;
};

const normalizeName = (n: IconName): IconKey => {
    const s = String(n);
    const capital = s.charAt(0).toUpperCase() + s.slice(1);
    // @ts-ignore
    return capital;
};

const ICON_VARIANT_MAP: Record<IconVariant, any> = {
    filled: Filled,
    duotone: Duotone,
    rounded: Rounded,
    motion: Motion,
};

const Icon: React.FC<IconProps> = ({ name, variant = "filled", className, title, ...props }) => {
    const key = normalizeName(name) as IconKey;
    const family = ICON_VARIANT_MAP[variant] || ICON_VARIANT_MAP.filled;
    const Cmp = (family as any)[key] ?? (Filled as any)[key] ?? null;
    if (!Cmp) return null;
    return <Cmp className={className} title={title} {...props} />;
};

export default Icon;
