import { getEnabled } from "../registry.js";

export const meta = {
  id: "global-styles",
  name: "Global Styles",
  description: "Course-wide typography and color overrides.",
  fields: [
    { key: "fontFamily", label: "Typeface", type: "select", options: ["inherit", "Helvetica Neue", "Georgia", "Verdana", "Times New Roman"], default: "inherit" },
    { key: "baseFontSize", label: "Base font size (px)", type: "number", default: 16 },
    { key: "headingColor", label: "Heading color", type: "color", default: "#1c1e26" },
    { key: "bodyColor", label: "Body text color", type: "color", default: "#1c1e26" },
    { key: "primaryColor", label: "Primary/accent color", type: "color", default: "#6d5df6" },
    { key: "linkColor", label: "Link color", type: "color", default: "#6d5df6" },
  ],
};

export function apply(config) {
  if (!getEnabled("global-styles")) return { cleanups: [] };

  const cleanups = [];
  const sheet = document.createElement("style");
  sheet.dataset.rfPowerup = "global-styles";
  const vars = {
    "--rf-heading-color": config.headingColor,
    "--rf-body-color": config.bodyColor,
    "--rf-accent-color": config.primaryColor,
    "--rf-link-color": config.linkColor,
  };

  if (config.fontFamily && config.fontFamily !== "inherit") {
    vars["--font-family-theme"] = config.fontFamily;
  }

  sheet.textContent = [
    ":root, .course-content {",
    Object.entries(vars)
      .filter(([, v]) => v)
      .map(([k, v]) => k + ": " + v + ";")
      .join("\n"),
    "}",
    config.baseFontSize
      ? ":root, body, p, div, span { font-size: " + config.baseFontSize + "px; }"
      : "",
  ].join("\n");
  document.head.appendChild(sheet);
  cleanups.push(() => sheet.remove());

  return { cleanups };
}