// Minimal shim for the Framer runtime API used by FieldoForm.
// The real module is provided by Framer at runtime (marked external in build.mjs).
declare module "framer" {
  export const ControlType: Record<string, string>;
  export function addPropertyControls(component: unknown, controls: Record<string, unknown>): void;
  export const RenderTarget: {
    current(): string;
    canvas: string;
    export: string;
    thumbnail: string;
    preview: string;
  };
}
