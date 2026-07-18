import LanguageIcon from "@mui/icons-material/Language";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Button, Menu, MenuItem } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import "./LanguageSwitcher.css";

const LANGUAGES = [
  { code: "vi", labelKey: "language.vi" },
  { code: "en", labelKey: "language.en" },
];

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const currentLang = i18n.language?.startsWith("en") ? "en" : "vi";
  const currentLabel = t(`language.${currentLang}`);

  const handleChange = (code) => {
    i18n.changeLanguage(code);
    setAnchorEl(null);
  };

  return (
    <div className="language-switcher">
      <Button
        className="language-switcher__btn"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label={t("language.switch")}
        aria-haspopup="true"
        aria-expanded={open}
        startIcon={<LanguageIcon sx={{ fontSize: 18 }} />}
        endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 16 }} />}
      >
        <span className="language-switcher__label">{currentLabel}</span>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { minWidth: 160, mt: 0.5, borderRadius: 2 },
          },
        }}
      >
        {LANGUAGES.map(({ code, labelKey }) => (
          <MenuItem
            key={code}
            selected={currentLang === code}
            onClick={() => handleChange(code)}
            sx={{
              fontSize: 14,
              fontWeight: currentLang === code ? 700 : 500,
              color: currentLang === code ? "#f28900" : "#333",
            }}
          >
            {t(labelKey)}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

export default LanguageSwitcher;
