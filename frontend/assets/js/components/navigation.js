(function initSharedNavigation() {
  const roleAccessByPath = [
    { match: "users.html", roles: ["ADMIN"] },
    { match: "users-add.html", roles: ["ADMIN"] },
    { match: "departments.html", roles: ["ADMIN", "MANAGER", "STAFF"] },
    { match: "categories.html", roles: ["ADMIN", "MANAGER"] },
    { match: "assets.html", roles: ["ADMIN", "MANAGER", "STAFF"] },
    { match: "liquidation.html", roles: ["ADMIN", "MANAGER", "STAFF"] },
    { match: "statistics.html", roles: ["ADMIN", "MANAGER"] },
    { match: "contact.html", roles: ["ADMIN", "MANAGER", "STAFF", "STUDENT"] },
    { match: "contact-profile.html", roles: ["ADMIN", "MANAGER", "STAFF", "STUDENT"] },
    { match: "request-create.html", roles: ["STUDENT"] },
    { match: "request-sent.html", roles: ["STUDENT"] },
    { match: "request-drafts.html", roles: ["STUDENT"] },
    { match: "index.html", roles: ["ADMIN", "MANAGER", "STAFF", "STUDENT"] },
  ];

  const canAccessLink = (href, role) => {
    if (!href || !role) return true;
    const normalizedHref = href.toLowerCase();
    const matchedRule = roleAccessByPath.find((rule) => normalizedHref.includes(rule.match));
    if (!matchedRule) return true;
    return matchedRule.roles.includes(role);
  };

  const applyRoleMenu = () => {
    const role = String(window.AppAuth?.getCurrentUser?.()?.role || "").toUpperCase();
    if (!role) return;

    document.querySelectorAll(".sidebar .nav-item, .sidebar .nav-subitem").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const visible = canAccessLink(href, role);
      if (link instanceof HTMLElement) link.hidden = !visible;
    });

    document.querySelectorAll(".sidebar .nav-group").forEach((group) => {
      const links = Array.from(group.querySelectorAll(".nav-subitem"));
      const hasVisibleLink = links.some((link) => !link.hidden);
      if (group instanceof HTMLElement) group.hidden = !hasVisibleLink;
    });
  };

  const ensureStudentMenuItems = () => {
    const role = String(window.AppAuth?.getCurrentUser?.()?.role || "").toUpperCase();
    if (role !== "STUDENT") return;

    const nav = document.querySelector(".sidebar nav");
    if (!nav) return;

    const studentItems = [
      { href: "/frontend/pages/student/request-create.html", text: "Tạo yêu cầu xử lý" },
      { href: "/frontend/pages/student/request-sent.html", text: "Yêu cầu đã gửi" },
      { href: "/frontend/pages/student/request-drafts.html", text: "Yêu cầu đã lưu" },
    ];

    const logoutNode = nav.querySelector('[data-action="logout"]');
    studentItems.forEach((item) => {
      const existed = Array.from(nav.querySelectorAll(".nav-item, .nav-subitem")).some(
        (el) => (el.getAttribute("href") || "").includes(item.href),
      );
      if (existed) return;

      const link = document.createElement("a");
      link.className = "nav-item";
      link.href = item.href;
      link.textContent = item.text;
      if (logoutNode) nav.insertBefore(link, logoutNode);
      else nav.appendChild(link);
    });
  };

  const applyUserHeader = () => {
    const role = String(window.AppAuth?.getCurrentUser?.()?.role || "").toUpperCase();
    if (!role) return;

    const brand = document.getElementById("sidebarBrandText") || document.querySelector(".sidebar .brand");
    const welcome = document.getElementById("sidebarWelcomeText");
    const sidebarRole = document.getElementById("sidebarRoleText");
    const topbarRole = document.getElementById("topbarRoleText");

    if (role === "STUDENT") {
      if (brand) brand.textContent = "SINH VIEN";
      if (welcome) welcome.textContent = "Xin chào,";
      if (sidebarRole) sidebarRole.textContent = "Sinh viên";
      if (topbarRole) topbarRole.textContent = "Sinh viên";
      return;
    }

    if (role === "ADMIN") {
      if (brand) brand.textContent = "ADMIN";
      if (welcome) welcome.textContent = "Welcome,";
      if (sidebarRole) sidebarRole.textContent = "Administrator";
      if (topbarRole) topbarRole.textContent = "Administrator";
      return;
    }

    if (brand) brand.textContent = role;
    if (welcome) welcome.textContent = "Welcome,";
    if (sidebarRole) sidebarRole.textContent = role;
    if (topbarRole) topbarRole.textContent = role;
  };

  const initLogoutMenu = () => {
    const nav = document.querySelector(".sidebar nav");
    if (!nav) return;
    if (nav.querySelector('[data-action="logout"]')) return;

    const logoutBtn = document.createElement("button");
    logoutBtn.type = "button";
    logoutBtn.className = "nav-item nav-action-btn";
    logoutBtn.setAttribute("data-action", "logout");
    logoutBtn.textContent = "Đăng xuất";
    logoutBtn.style.width = "100%";
    logoutBtn.style.textAlign = "left";

    logoutBtn.addEventListener("click", () => {
      window.AppAuth?.clearCurrentUser?.();
      window.location.href = "/frontend/pages/auth/login.html";
    });

    nav.appendChild(logoutBtn);
  };

  applyUserHeader();
  ensureStudentMenuItems();
  applyRoleMenu();
  initLogoutMenu();

  document.querySelectorAll(".nav-group-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.closest(".nav-group");
      if (group) {
        group.classList.toggle("open");
      }
    });
  });

  document.querySelectorAll(".status-pill").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const isOn = toggle.classList.toggle("on");
      toggle.setAttribute("aria-pressed", isOn ? "true" : "false");
    });
  });
})();
