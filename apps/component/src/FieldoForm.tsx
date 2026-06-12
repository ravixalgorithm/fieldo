import * as React from "react";
import { addPropertyControls, ControlType, RenderTarget } from "framer";
import { FormRenderer } from "@fieldo/renderer";
import { fetchFormMeta, SUPPORTED_SCHEMA_VERSION, type FormMeta } from "@fieldo/react";
import type { ThemeTokens } from "@fieldo/types";

const DEFAULT_API = "https://fieldo.io";

interface Props {
  formId: string;
  apiBaseUrl: string;
  useDashboardTheme: boolean;
  primaryColor: string;
  fontFamily: string;
  borderRadius: number;
  spacing: number;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  buttonTextColor: string;
  style?: React.CSSProperties;
}

/** Static placeholder shown on canvas before a formId is set or while meta loads. */
function Skeleton({ message }: { message: string }) {
  const bar = (w: string, h = 12): React.CSSProperties => ({
    width: w,
    height: h,
    borderRadius: 4,
    background: "rgba(0,0,0,.08)",
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: 4, width: "100%" }}>
      <div style={bar("40%")} />
      <div style={{ ...bar("100%", 38), borderRadius: 8 }} />
      <div style={bar("32%")} />
      <div style={{ ...bar("100%", 38), borderRadius: 8 }} />
      <div style={{ ...bar("28%", 38), borderRadius: 8, background: "rgba(0,0,0,.2)" }} />
      <div style={{ fontSize: 11, opacity: 0.5, fontFamily: "Inter, sans-serif" }}>{message}</div>
    </div>
  );
}

/**
 * Fieldo Form — render a published Fieldo form natively (no iframe).
 *
 * @framerSupportedLayoutWidth fill
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 560
 */
export default function FieldoForm(props: Props) {
  const {
    formId,
    apiBaseUrl = DEFAULT_API,
    useDashboardTheme = true,
    style,
  } = props;
  const isCanvas = RenderTarget.current() === RenderTarget.canvas;
  const [meta, setMeta] = React.useState<FormMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!formId) return;
    let cancelled = false;
    setMeta(null);
    setError(null);
    fetchFormMeta(formId, apiBaseUrl)
      .then((m) => !cancelled && setMeta(m))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, [formId, apiBaseUrl]);

  const themeOverride: ThemeTokens | undefined = useDashboardTheme
    ? undefined
    : {
        primaryColor: props.primaryColor,
        fontFamily: props.fontFamily || "inherit",
        borderRadius: `${props.borderRadius}px`,
        spacing: `${props.spacing}px`,
        backgroundColor: props.backgroundColor,
        textColor: props.textColor,
        borderColor: props.borderColor,
        buttonTextColor: props.buttonTextColor,
      };

  let body: React.ReactNode;
  if (!formId) {
    body = <Skeleton message="Set a Form ID in the properties panel" />;
  } else if (error) {
    body = isCanvas ? (
      <Skeleton message={`Couldn't load form: ${error}`} />
    ) : null; // never show errors to site visitors
  } else if (!meta) {
    body = isCanvas ? <Skeleton message="Loading form…" /> : null;
  } else {
    body = (
      <FormRenderer
        schema={meta.schema}
        formId={meta.formId}
        apiBaseUrl={apiBaseUrl}
        renderToken={meta.renderToken}
        embedSource="framer"
        mode={isCanvas ? "canvas" : "live"}
        theme={themeOverride}
      />
    );
  }

  return <div style={{ width: "100%", ...style }}>{body}</div>;
}

FieldoForm.displayName = "Fieldo Form";

addPropertyControls(FieldoForm, {
  formId: {
    type: ControlType.String,
    title: "Form ID",
    placeholder: "frm_…",
    defaultValue: "",
  },
  useDashboardTheme: {
    type: ControlType.Boolean,
    title: "Theme",
    enabledTitle: "Dashboard",
    disabledTitle: "Custom",
    defaultValue: true,
  },
  primaryColor: {
    type: ControlType.Color,
    title: "Primary",
    defaultValue: "#0f766e",
    hidden: (p: Props) => p.useDashboardTheme,
  },
  fontFamily: {
    type: ControlType.String,
    title: "Font",
    placeholder: "inherit",
    defaultValue: "",
    hidden: (p: Props) => p.useDashboardTheme,
  },
  borderRadius: {
    type: ControlType.Number,
    title: "Radius",
    defaultValue: 8,
    min: 0,
    max: 32,
    unit: "px",
    hidden: (p: Props) => p.useDashboardTheme,
  },
  spacing: {
    type: ControlType.Number,
    title: "Spacing",
    defaultValue: 16,
    min: 4,
    max: 48,
    unit: "px",
    hidden: (p: Props) => p.useDashboardTheme,
  },
  backgroundColor: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: "rgba(0,0,0,0)",
    hidden: (p: Props) => p.useDashboardTheme,
  },
  textColor: {
    type: ControlType.Color,
    title: "Text",
    defaultValue: "#111827",
    hidden: (p: Props) => p.useDashboardTheme,
  },
  borderColor: {
    type: ControlType.Color,
    title: "Border",
    defaultValue: "#d1d5db",
    hidden: (p: Props) => p.useDashboardTheme,
  },
  buttonTextColor: {
    type: ControlType.Color,
    title: "Button Text",
    defaultValue: "#ffffff",
    hidden: (p: Props) => p.useDashboardTheme,
  },
  apiBaseUrl: {
    type: ControlType.String,
    title: "API URL",
    description: "Advanced: self-hosted or staging Fieldo API origin",
    defaultValue: DEFAULT_API,
  },
});

// Schema version this build understands; sent as ?supportedSchema= on /meta.
export { SUPPORTED_SCHEMA_VERSION };
