(function initAuthScope(window) {
  const STORAGE_KEY = "app.currentUser";

  const USERS = [
    { username: "admin", password: "123456", role: "ADMIN", fullName: "System Admin" },
    { username: "manager", password: "123456", role: "MANAGER", fullName: "Asset Manager" },
    { username: "staff", password: "123456", role: "STAFF", fullName: "Staff User" },
    { username: "student", password: "123456", role: "STUDENT", fullName: "Student User" },
  ];

  function getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  function setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  function clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function login(username, password) {
    const user = USERS.find((item) => item.username === username && item.password === password);
    if (!user) return { ok: false, message: "Sai tên đăng nhập hoặc mật khẩu." };
    const safeUser = { username: user.username, role: user.role, fullName: user.fullName };
    setCurrentUser(safeUser);
    return { ok: true, user: safeUser };
  }

  function getDefaultHomeByRole(role) {
    if (role === "ADMIN") return "/frontend/index.html";
    if (role === "MANAGER") return "/frontend/index.html";
    if (role === "STAFF") return "/frontend/index.html";
    if (role === "STUDENT") return "/frontend/index.html";
    return "/frontend/pages/auth/login.html";
  }

  window.AppAuth = {
    login,
    getCurrentUser,
    clearCurrentUser,
    getDefaultHomeByRole,
  };
})(window);
