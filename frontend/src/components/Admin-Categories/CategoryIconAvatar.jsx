import {
  CameraAlt,
  Category,
  DevicesOther,
  Headphones,
  Keyboard,
  Laptop,
  Memory,
  Mouse,
  Print,
  Router,
  Smartphone,
  Speaker,
  SportsEsports,
  Storage,
  Tablet,
  Tv,
  Watch,
} from "@mui/icons-material";
import { Avatar, Box } from "@mui/material";

const GRADIENTS = [
  ["#667eea", "#764ba2"],
  ["#f093fb", "#f5576c"],
  ["#4facfe", "#00f2fe"],
  ["#43e97b", "#38f9d7"],
  ["#fa709a", "#fee140"],
  ["#a18cd1", "#fbc2eb"],
  ["#ff9a56", "#ff6a88"],
  ["#84fab0", "#8fd3f4"],
  ["#fccb90", "#d57eeb"],
  ["#e0c3fc", "#8ec5fc"],
];

const ICON_RULES = [
  { keys: ["laptop", "macbook", "notebook", "máy tính", "may tinh"], Icon: Laptop },
  { keys: ["phone", "iphone", "smartphone", "điện thoại", "dien thoai", "mobile"], Icon: Smartphone },
  { keys: ["tablet", "ipad"], Icon: Tablet },
  { keys: ["headphone", "tai nghe", "earphone", "audio"], Icon: Headphones },
  { keys: ["speaker", "loa", "sound"], Icon: Speaker },
  { keys: ["camera", "máy ảnh", "may anh"], Icon: CameraAlt },
  { keys: ["tv", "television", "màn hình", "man hinh", "monitor"], Icon: Tv },
  { keys: ["watch", "đồng hồ", "dong ho", "smartwatch"], Icon: Watch },
  { keys: ["game", "gaming", "console", "playstation", "xbox"], Icon: SportsEsports },
  { keys: ["ram", "memory", "linh kiện", "component"], Icon: Memory },
  { keys: ["keyboard", "bàn phím", "ban phim"], Icon: Keyboard },
  { keys: ["mouse", "chuột", "chuot"], Icon: Mouse },
  { keys: ["storage", "ssd", "hdd", "ổ cứng", "o cung"], Icon: Storage },
  { keys: ["router", "wifi", "network", "mạng"], Icon: Router },
  { keys: ["printer", "máy in", "may in"], Icon: Print },
];

const hashSeed = (value) => {
  const str = String(value ?? "");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export const getCategoryTheme = (category) => {
  const seed = hashSeed(category?.id ?? category?.name ?? category?.code);
  const [from, to] = GRADIENTS[seed % GRADIENTS.length];
  return {
    from,
    to,
    shadow: `0 4px 14px ${from}66`,
  };
};

export const getCategoryIconComponent = (category) => {
  const text = `${category?.name || ""} ${category?.code || ""}`.toLowerCase();
  const matched = ICON_RULES.find((rule) => rule.keys.some((key) => text.includes(key)));
  return matched?.Icon ?? DevicesOther;
};

const CategoryIconAvatar = ({ category, size = 44 }) => {
  const theme = getCategoryTheme(category);
  const iconUrl = category?.iconUrl || category?.image;
  const IconComponent = getCategoryIconComponent(category);

  if (iconUrl) {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: 2.5,
          p: "3px",
          background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
          boxShadow: theme.shadow,
          flexShrink: 0,
        }}
      >
        <Avatar
          src={iconUrl}
          alt={category?.name}
          variant="rounded"
          sx={{
            width: "100%",
            height: "100%",
            bgcolor: "#fff",
            "& img": { objectFit: "contain", p: 0.5 },
          }}
        >
          <IconComponent sx={{ fontSize: size * 0.45, color: theme.from }} />
        </Avatar>
      </Box>
    );
  }

  return (
    <Avatar
      variant="rounded"
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
        boxShadow: theme.shadow,
        color: "#fff",
        border: "2px solid rgba(255,255,255,0.35)",
      }}
    >
      <IconComponent sx={{ fontSize: size * 0.48, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }} />
    </Avatar>
  );
};

export default CategoryIconAvatar;
