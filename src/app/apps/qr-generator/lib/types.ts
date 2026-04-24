/** Shared TypeScript types for the QR Generator app. */

export type QRType = "URL" | "TEXT" | "WIFI" | "EMAIL" | "VCARD";

export type PixelStyle =
  | "square" | "dot" | "rounded" | "diamond" | "star" | "classy" | "heart";

export type MarkerFrameStyle = "square" | "circle" | "rounded" | "extra-rounded";

export type MarkerInnerStyle =
  | "square" | "circle" | "rounded" | "diamond" | "star" | "heart";

export type FrameStyle =
  | "none" | "simple" | "rounded" | "bracket" | "banner-bottom" | "banner-top" | "polaroid";

export type GradientDirection = "diagonal" | "vertical" | "horizontal";

export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export interface WifiData {
  ssid: string;
  password: string;
  encryption: "WPA" | "WEP" | "nopass";
  hidden: boolean;
}

export interface EmailData {
  address: string;
  subject: string;
  body: string;
}

export interface VCardData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  organization: string;
  url: string;
}

export interface QRConfig {
  type: QRType;
  // Content
  url: string;
  text: string;
  wifi: WifiData;
  email: EmailData;
  vCard: VCardData;
  // Colours
  fgColor: string;
  bgColor: string;
  transparentBg: boolean;
  useGradient: boolean;
  gradientStart: string;
  gradientEnd: string;
  gradientDirection: GradientDirection;
  // Shapes
  pixelStyle: PixelStyle;
  markerStyle: MarkerFrameStyle;
  markerInnerShape: MarkerInnerStyle;
  markerBorderColor?: string;
  markerCenterColor?: string;
  // Logo
  logo?: string;
  logoSize: number;
  logoPadding: number;
  logoBackgroundColor?: string;
  // Frame
  frameStyle: FrameStyle;
  frameColor: string;
  frameText: string;
  frameTextColor: string;
  // Misc
  margin: number;
  ecLevel: ErrorCorrectionLevel;
}

export const DEFAULT_CONFIG: QRConfig = {
  type: "URL",
  url: "",
  text: "",
  wifi: { ssid: "", password: "", encryption: "WPA", hidden: false },
  email: { address: "", subject: "", body: "" },
  vCard: { firstName: "", lastName: "", phone: "", email: "", organization: "", url: "" },
  fgColor: "#ffffff",
  bgColor: "#0f172a",
  transparentBg: false,
  useGradient: true,
  gradientStart: "#22d3ee",
  gradientEnd: "#8b5cf6",
  gradientDirection: "diagonal",
  pixelStyle: "rounded",
  markerStyle: "circle",
  markerInnerShape: "circle",
  logoSize: 0.2,
  logoPadding: 0,
  frameStyle: "none",
  frameColor: "#22d3ee",
  frameText: "SCAN ME",
  frameTextColor: "#ffffff",
  margin: 2,
  ecLevel: "M",
};

/** Parse user natural-language input into a QRConfig patch */
export function parseIntent(input: string): Partial<QRConfig> & { summary: string } {
  const text = input.trim();
  const lower = text.toLowerCase();

  // URL
  if (/^(https?:\/\/[^\s]+|www\.[^\s]+)/i.test(text)) {
    return {
      type: "URL",
      url: text.startsWith("www.") ? `https://${text}` : text,
      summary: "Website URL",
    };
  }
  // Email
  if (/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/i.test(text)) {
    return { type: "EMAIL", email: { address: text, subject: "", body: "" }, summary: "Email Address" };
  }
  // WiFi
  if (lower.includes("wifi") || (lower.includes("ssid") && lower.includes("password"))) {
    const ssidM = text.match(/ssid[:\s]+"?([^"'\s]+)"?/i);
    const passM = text.match(/password[:\s]+"?([^"'\s]+)"?/i);
    const parts = text.split(" ");
    const wifiI = parts.findIndex((p) => p.toLowerCase().includes("wifi"));
    const ssid = ssidM ? ssidM[1] : (wifiI !== -1 && parts[wifiI + 1]) ? parts[wifiI + 1] : "MyNetwork";
    const passI = parts.findIndex((p) => /password|pass/i.test(p));
    const password = passM ? passM[1] : (passI !== -1 && parts[passI + 1]) ? parts[passI + 1] : "";
    return {
      type: "WIFI",
      wifi: { ssid, password, encryption: "WPA", hidden: false },
      summary: `WiFi: ${ssid}`,
    };
  }
  // vCard
  if (lower.includes("contact") || lower.includes("vcard")) {
    const phoneM = text.match(/(\+?[\d\-() ]{10,})/);
    const emailM = text.match(/[\w-.]+@([\w-]+\.)+[\w-]{2,4}/);
    const words = text.split(" ").filter((w) => !/contact|vcard|phone|email|number/i.test(w));
    return {
      type: "VCARD",
      vCard: {
        firstName: words[0] || "New",
        lastName: words[1] || "Contact",
        phone: phoneM ? phoneM[0].trim() : "",
        email: emailM ? emailM[0] : "",
        organization: "",
        url: "",
      },
      summary: "Contact Card",
    };
  }
  return { type: "TEXT", text, summary: "Plain text" };
}
