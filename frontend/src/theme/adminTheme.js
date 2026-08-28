import { createTheme } from "@mui/material/styles";

const typography = {
  fontFamily: '"Plus Jakarta Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontWeight: 800 },
  h2: { fontWeight: 800 },
  h3: { fontWeight: 800 },
  h4: { fontWeight: 800 },
  h5: { fontWeight: 800 },
  h6: { fontWeight: 800 },
  subtitle1: { fontWeight: 600 },
  subtitle2: { fontWeight: 700 },
  button: { textTransform: "none", fontWeight: 700 },
};

export const getAdminTheme = (mode = "light") =>
  createTheme({
    palette: {
      mode,
      primary: { main: "#ff9f1a" },
      ...(mode === "dark"
        ? {
            background: { default: "#0f172a", paper: "#1e293b" },
            text: { primary: "#f1f5f9", secondary: "#94a3b8" },
            divider: "rgba(148, 163, 184, 0.16)",
          }
        : {
            background: { default: "#f8f9fa", paper: "#ffffff" },
            text: { primary: "#1e293b", secondary: "#64748b" },
            divider: "rgba(15, 23, 42, 0.08)",
          }),
    },
    typography,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: "background-color 0.25s ease, color 0.25s ease",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
    },
  });
