export interface Theme {
  slug: string;
  name: string;
  description: string;
  palette: string[];
  fontFamily: string;
  css: {
    background: string;
    textColor: string;
    fontImports: string;
    bodyFontFamily: string;
  };
  preferredLayouts: string[];
  avoidLayouts: string[];
  layoutHints: string;
  mood: string[];
  formality: "low" | "medium-low" | "medium" | "medium-high" | "high";
  scheme: "light" | "dark" | "mixed";
}
