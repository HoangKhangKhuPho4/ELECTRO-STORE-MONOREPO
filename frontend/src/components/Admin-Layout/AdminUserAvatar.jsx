import { Avatar } from "@mui/material";
import { getAvatarInitial, getPrimaryRoleInfo } from "../../utils/adminUserDisplay";

const AdminUserAvatar = ({ user, size = 36, sx = {} }) => {
  const roleInfo = getPrimaryRoleInfo(user);
  const initial = getAvatarInitial(user);

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        background: roleInfo.gradient,
        color: "#fff",
        fontWeight: 800,
        fontSize: size <= 36 ? "0.95rem" : "1.15rem",
        ...sx,
      }}
    >
      {initial}
    </Avatar>
  );
};

export default AdminUserAvatar;
