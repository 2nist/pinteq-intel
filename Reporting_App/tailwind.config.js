/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: {
          DEFAULT: "var(--border)",
          border: "var(--border)",
        },
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        muted: "var(--text-muted)",
        "muted-foreground": "var(--muted-foreground)",
        input: "var(--input)",
        base: "var(--bg-base)",
        panel: "var(--bg-panel)",
        elevated: "var(--bg-elevated)",
        slate: "var(--border-slate)",
        subtle: "var(--border-subtle)",
        main: "var(--text-main)",
        saffron: "var(--accent-saffron)",
        "saffron-strong": "var(--accent-saffron-strong)",

        "status-success-text":   "var(--status-success-text)",
        "status-success-border": "var(--status-success-border)",
        "status-success-bg":     "var(--status-success-bg)",

        "status-warning-text":   "var(--status-warning-text)",
        "status-warning-border": "var(--status-warning-border)",
        "status-warning-bg":     "var(--status-warning-bg)",

        "status-error-text":   "var(--status-error-text)",
        "status-error-border": "var(--status-error-border)",
        "status-error-bg":     "var(--status-error-bg)",

        "status-info-text":   "var(--status-info-text)",
        "status-info-border": "var(--status-info-border)",
        "status-info-bg":     "var(--status-info-bg)",

        "status-neutral-text":   "var(--status-neutral-text)",
        "status-neutral-border": "var(--status-neutral-border)",
        "status-neutral-bg":     "var(--status-neutral-bg)",

        // Reporting-specific action colors
        "color-b4":          "var(--color-b4)",
        "color-timeline":    "var(--color-timeline)",
        "color-phone":       "var(--color-phone)",
        "color-graph":       "var(--color-graph)",
        "color-gap":         "var(--color-gap)",
        "color-prosecution": "var(--color-prosecution)",
      }
    },
  },
  plugins: [],
}
