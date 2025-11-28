// src/design-system/Icon.tsx
import React, { forwardRef } from "react";
import { ICONS, IconName } from "./icons";

export type IconProps = {
  name: IconName;
  size?: number | string;
  className?: string;
  title?: string;
  ariaLabel?: string;
  strokeWidth?: number | string;
} & Omit<React.SVGProps<SVGSVGElement>, "ref" | "size">;

export const Icon = forwardRef<SVGSVGElement, IconProps>(({
  name,
  size = 24,
  className,
  title,
  ariaLabel,
  strokeWidth,
  ...rest
}, ref) => {
  const Comp = ICONS[name];
  // pass down strokeWidth via style if provided
  const style = { ...(rest.style || {}), width: size, height: size };
  return <Comp ref={ref} title={title} aria-label={ariaLabel} className={className} style={style} {...rest} />;
});

Icon.displayName = "Icon";
export default Icon;