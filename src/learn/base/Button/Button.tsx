import type { AnchorHTMLAttributes, ButtonHTMLAttributes, Ref } from 'react';
import styles from '@/learn/base/Button/Button.module.css';

export type ButtonVariant = 'primary' | 'danger' | 'cta';

interface BaseProps {
  variant: ButtonVariant;
  borderless?: boolean;
  className?: string;
}

interface ButtonProps extends BaseProps, ButtonHTMLAttributes<HTMLButtonElement> {
  href?: undefined;
  ref?: Ref<HTMLButtonElement>;
}

interface LinkProps extends BaseProps, AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  ref?: Ref<HTMLAnchorElement>;
}

export type Props = ButtonProps | LinkProps;

function buildClassName(variant: ButtonVariant, borderless: boolean, className?: string) {
  return [styles.button, styles[variant], borderless ? styles.borderless : undefined, className]
    .filter(Boolean)
    .join(' ');
}

export function Button(props: Props) {
  const { variant, borderless = false, className, ...rest } = props;
  const resolvedClassName = buildClassName(variant, borderless, className);

  if (rest.href !== undefined) {
    const { ref, children, href, ...linkRest } = rest as LinkProps & {
      ref?: Ref<HTMLAnchorElement>;
    };
    return (
      <a href={href} {...linkRest} ref={ref} className={resolvedClassName}>
        {children}
      </a>
    );
  }

  const {
    ref,
    type = 'button',
    ...buttonRest
  } = rest as ButtonProps & {
    ref?: Ref<HTMLButtonElement>;
  };
  return <button {...buttonRest} ref={ref} type={type} className={resolvedClassName} />;
}
