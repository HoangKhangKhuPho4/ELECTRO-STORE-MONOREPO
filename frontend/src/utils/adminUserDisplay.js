const normalizeRoleName = (name) => (name || "").replace(/^ROLE_/i, "").trim().toUpperCase();

export const getRoleNames = (user) => {
  if (!user) return [];
  if (Array.isArray(user.roles)) {
    return user.roles
      .map((r) => normalizeRoleName(typeof r === "string" ? r : r?.name))
      .filter(Boolean);
  }
  if (user.role?.name) {
    return [normalizeRoleName(user.role.name)];
  }
  return [];
};

/** Tên hiển thị: ưu tiên họ tên → username */
export const getDisplayName = (user) => {
  if (!user) return "Người dùng";
  const name = String(user.name || user.fullName || "").trim();
  if (name) return name;
  const username = String(user.username || "").trim();
  if (username) return username;
  return "Người dùng";
};

/** Chữ cái đầu trên avatar — lấy từ tên thật, không hardcode */
export const getAvatarInitial = (user) => {
  const display = getDisplayName(user);
  const letter = display.charAt(0).toUpperCase();
  return letter || "?";
};

const ROLE_META = {
  ADMIN: {
    label: "Quản trị viên",
    gradient: "linear-gradient(135deg, #ff9f1a 0%, #f97316 100%)",
  },
  SALES: {
    label: "Nhân viên Sales",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
  },
  WAREHOUSE: {
    label: "Nhân viên Kho",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  },
};

export const getPrimaryRoleInfo = (user) => {
  const roles = getRoleNames(user);
  const isAdmin = roles.includes("ADMIN");
  const isSales = roles.includes("SALES") && !isAdmin;
  const isWarehouse = roles.includes("WAREHOUSE") && !isAdmin;

  if (isAdmin) return ROLE_META.ADMIN;
  if (isSales) return ROLE_META.SALES;
  if (isWarehouse) return ROLE_META.WAREHOUSE;

  const firstRole = roles[0];
  if (firstRole) {
    return {
      label: firstRole.charAt(0) + firstRole.slice(1).toLowerCase(),
      gradient: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
    };
  }

  return {
    label: "Nhân viên",
    gradient: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
  };
};
