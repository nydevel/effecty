import type { CSSProperties } from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';

export interface AppIconProps extends Omit<LucideProps, 'ref'> {
  spin?: boolean;
}

interface RenderIconOptions extends AppIconProps {
  icon: LucideIcon;
}

export function renderAppIcon({
  icon: Icon,
  spin = false,
  className,
  size = 16,
  strokeWidth = 2,
  style,
  ...rest
}: RenderIconOptions) {
  const classes = ['ui-action-icon', spin ? 'ui-action-icon-spin' : '', className]
    .filter(Boolean)
    .join(' ');

  const mergedStyle: CSSProperties = {
    ...(style ?? {}),
  };

  return (
    <Icon
      className={classes}
      size={size}
      strokeWidth={strokeWidth}
      style={mergedStyle}
      {...rest}
    />
  );
}

