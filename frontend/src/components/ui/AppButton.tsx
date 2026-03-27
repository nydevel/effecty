import { Button as AntButton } from 'antd';
import type { ButtonProps } from 'antd';

export type AppButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps extends Omit<ButtonProps, 'size'> {
  size?: ButtonProps['size'] | AppButtonSize;
}

function toAppSize(size: AppButtonProps['size']): AppButtonSize {
  if (size === 'small' || size === 'sm') return 'sm';
  if (size === 'large' || size === 'lg') return 'lg';
  return 'md';
}

function toAntSize(size: AppButtonSize): ButtonProps['size'] {
  if (size === 'sm') return 'small';
  if (size === 'lg') return 'large';
  return 'middle';
}

export default function AppButton({ className, size, ...props }: AppButtonProps) {
  const appSize = toAppSize(size);
  const classes = ['ui-btn', `ui-btn--${appSize}`, className].filter(Boolean).join(' ');

  return <AntButton {...props} size={toAntSize(appSize)} className={classes} />;
}
