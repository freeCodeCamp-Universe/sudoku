import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import styles from './Button.module.css';

type ButtonVariant = 'default' | 'cta';
type HoverColor = 'blue' | 'yellow' | 'red';

interface CommonProps {
  variant?: ButtonVariant;
  hoverColor?: HoverColor;
  className?: string;
  children?: ReactNode;
  target_blank?: boolean;
}

interface NativeButtonProps extends CommonProps, ButtonHTMLAttributes<HTMLButtonElement> {
  href?: never;
  target_blank?: never;
}

interface InternalLinkProps extends CommonProps, Omit<LinkProps, 'to'> {
  href: string;
  target_blank?: false;
}

interface ExternalLinkProps
  extends CommonProps, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target'> {
  href: string;
  target_blank: true;
}

export type ButtonProps = NativeButtonProps | InternalLinkProps | ExternalLinkProps;

function omitButtonProps<T extends CommonProps>(props: T): Omit<T, keyof CommonProps> {
  const rest = { ...props } as Omit<T, keyof CommonProps> & Partial<CommonProps>;
  delete rest.variant;
  delete rest.hoverColor;
  delete rest.className;
  delete rest.children;
  delete rest.target_blank;
  return rest;
}

function classes(
  variant: ButtonVariant,
  hoverColor: HoverColor,
  className: string | undefined,
  isLink: boolean
): string {
  const names = [styles.btn, styles[variant]];

  if (variant === 'default') {
    names.push(styles[`hover${capitalize(hoverColor)}`]);
  }

  if (isLink) {
    names.push(styles.link);
  }

  if (className) {
    names.push(className);
  }

  return names.join(' ');
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function Button(props: ButtonProps) {
  const { variant = 'default', hoverColor = 'blue', className, children } = props;

  if ('href' in props && props.href !== undefined) {
    if (props.target_blank) {
      const { href, ...anchorProps } = omitButtonProps(props);

      return (
        <a
          {...anchorProps}
          href={href}
          target="_blank"
          rel={anchorProps.rel ?? 'noopener noreferrer'}
          className={classes(variant, hoverColor, className, true)}
        >
          {children}
        </a>
      );
    }

    const { href, ...linkProps } = omitButtonProps(props);

    return (
      <Link {...linkProps} to={href} className={classes(variant, hoverColor, className, true)}>
        {children}
      </Link>
    );
  }

  const { type = 'button', ...buttonProps } = omitButtonProps(props);

  return (
    <button {...buttonProps} type={type} className={classes(variant, hoverColor, className, false)}>
      {children}
    </button>
  );
}
