import type { SVGAttributes } from 'react';

type IconProps = SVGAttributes<SVGSVGElement>;

function Icon({ viewBox = '0 0 16 16', children, ...props }: IconProps) {
  return (
    <svg {...props} viewBox={viewBox} fill="currentColor" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14m3.354-8.646-3.5 3.5a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 8.793l3.146-3.147a.5.5 0 0 1 .708.708" />
    </Icon>
  );
}

export function CircleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14m0-1A6 6 0 1 1 8 2a6 6 0 0 1 0 12" />
    </Icon>
  );
}

export function XCircleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
    </Icon>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 4.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1M5 4.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1h-8a.5.5 0 0 1-.5-.5m-2.5 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1M5 8.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1h-8a.5.5 0 0 1-.5-.5m-2.5 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1M5 12.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1h-8a.5.5 0 0 1-.5-.5" />
    </Icon>
  );
}

export function KeyboardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 3.5A1.5 1.5 0 0 0 .5 5v6A1.5 1.5 0 0 0 2 12.5h12a1.5 1.5 0 0 0 1.5-1.5V5A1.5 1.5 0 0 0 14 3.5zM2 4.5h12a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5V5a.5.5 0 0 1 .5-.5M3 6h1v1H3zm2 0h1v1H5zm2 0h1v1H7zm2 0h1v1H9zm2 0h1v1h-1zM3 8h1v1H3zm2 0h1v1H5zm2 0h1v1H7zm2 0h1v1H9zm2 0h1v1h-1zM3 10h7v1H3z" />
    </Icon>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.405 1.05a1 1 0 0 0-1.81 0l-.218.53a1 1 0 0 1-1.17.58l-.55-.13a1 1 0 0 0-1.28 1.28l.13.55a1 1 0 0 1-.58 1.17l-.53.218a1 1 0 0 0 0 1.81l.53.218a1 1 0 0 1 .58 1.17l-.13.55a1 1 0 0 0 1.28 1.28l.55-.13a1 1 0 0 1 1.17.58l.218.53a1 1 0 0 0 1.81 0l.218-.53a1 1 0 0 1 1.17-.58l.55.13a1 1 0 0 0 1.28-1.28l-.13-.55a1 1 0 0 1 .58-1.17l.53-.218a1 1 0 0 0 0-1.81l-.53-.218a1 1 0 0 1-.58-1.17l.13-.55a1 1 0 0 0-1.28-1.28l-.55.13a1 1 0 0 1-1.17-.58zM8.5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
    </Icon>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
    </Icon>
  );
}

export function FccLogoIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 24 24" {...props}>
      <path d="M4 4h16v16H4z" opacity=".15" />
      <path d="M7 8h10v2H7zm0 3h7v2H7zm0 3h10v2H7z" />
    </Icon>
  );
}
