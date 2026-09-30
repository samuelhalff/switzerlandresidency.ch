export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://switzerlandresidency.ch").replace(/\/+$/, "");
export const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === "true";
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
export const FORMSPARK_ID = process.env.NEXT_PUBLIC_FORMSPARK_ID || "";
export const WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP || "").replace(/[^\d]/g, "");
export const CONTACT_EMAIL = "contact@switzerlandresidency.ch";
export const SITE_NAME = "Switzerland Residency";
export const ARK_URL = "https://ark-fid.ch";

export const whatsappUrl = WHATSAPP ? `https://wa.me/${WHATSAPP}` : "";
