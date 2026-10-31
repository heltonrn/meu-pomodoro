type Swatch = { light: string; dark: string };

export const themeColors: {
  primary: Swatch;
  "primary-strong": Swatch;
  "primary-soft": Swatch;
  background: Swatch;
  surface: Swatch;
  foreground: Swatch;
  muted: Swatch;
  border: Swatch;
  success: Swatch;
  warning: Swatch;
  "warning-soft": Swatch;
  error: Swatch;
  "error-soft": Swatch;
  tomato: Swatch;
  "tomato-soft": Swatch;
};

declare const themeConfig: {
  themeColors: typeof themeColors;
};

export default themeConfig;
