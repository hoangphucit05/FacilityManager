(function guardProtectedPages(window) {
  const body = document.body;
  if (!body) return;

  const requiredRolesAttr = body.getAttribute("data-required-roles");
  if (!requiredRolesAttr) return;

  const currentUser = window.AppAuth?.getCurrentUser?.();
  if (!currentUser) {
    window.location.href = "/frontend/pages/auth/login.html";
    return;
  }

  const requiredRoles = requiredRolesAttr
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

  const currentRole = String(currentUser.role || "").toUpperCase();
  if (requiredRoles.length > 0 && !requiredRoles.includes(currentRole)) {
    window.location.href = "/frontend/pages/auth/unauthorized.html";
    return;
  }

  const userNameEl = document.getElementById("currentUserName");
  if (userNameEl) {
    userNameEl.textContent = currentUser.fullName || currentUser.username;
  }
})(window);
