import { previewRegistry } from './registry';

export function Preview({ variantId }: { variantId: string }) {
  const Component = previewRegistry[variantId];

  if (!Component) {
    throw new Error(`Unknown preview variant: ${variantId}`);
  }

  return (
    <div aria-hidden="true">
      <Component variantId={variantId} />
    </div>
  );
}
