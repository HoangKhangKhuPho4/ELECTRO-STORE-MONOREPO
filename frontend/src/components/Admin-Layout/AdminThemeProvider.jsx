import { CssBaseline, ThemeProvider } from "@mui/material";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectTheme } from "../../redux/appSlice";
import { getAdminTheme } from "../../theme/adminTheme";

const AdminThemeProvider = ({ children }) => {
  const mode = useSelector(selectTheme);
  const theme = useMemo(() => getAdminTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default AdminThemeProvider;
