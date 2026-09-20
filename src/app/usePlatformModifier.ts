import { useEffect, useState } from 'react';

export type PlatformModifier = 'Cmd' | 'Ctrl';
export type AltLabel = '⌥' | 'Alt';
export type AltKeyName = 'AltGraph' | 'Alt';
export type CmdLabel = '⌘' | 'Ctrl';

function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
}

export function getPlatformModifier(): PlatformModifier {
  return isMacPlatform() ? 'Cmd' : 'Ctrl';
}

export function getAltLabel(): AltLabel {
  return isMacPlatform() ? '⌥' : 'Alt';
}

export function usePlatformModifier(): PlatformModifier {
  const [modifier, setModifier] = useState<PlatformModifier>('Ctrl');

  useEffect(() => {
    setModifier(getPlatformModifier());
  }, []);

  return modifier;
}

export function useAltLabel(): AltLabel {
  const [label, setLabel] = useState<AltLabel>('Alt');

  useEffect(() => {
    setLabel(getAltLabel());
  }, []);

  return label;
}

export function getCmdLabel(): CmdLabel {
  return isMacPlatform() ? '⌘' : 'Ctrl';
}

export function useCmdLabel(): CmdLabel {
  const [label, setLabel] = useState<CmdLabel>('Ctrl');

  useEffect(() => {
    setLabel(getCmdLabel());
  }, []);

  return label;
}

export function getAltKeyName(): AltKeyName {
  return isMacPlatform() ? 'AltGraph' : 'Alt';
}

export function useAltKeyName(): AltKeyName {
  const [name, setName] = useState<AltKeyName>('Alt');

  useEffect(() => {
    setName(getAltKeyName());
  }, []);

  return name;
}
