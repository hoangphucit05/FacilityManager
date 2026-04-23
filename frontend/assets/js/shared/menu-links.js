const categoryMenuHashMap = {
  "Quản lý danh mục": "",
  "Máy móc, thiết bị": "may-moc-thiet-bi",
  "Công cụ, dụng cụ": "cong-cu-dung-cu",
  "Nguồn kinh phí": "nguon-kinh-phi",
  "Nhà cung cấp": "nha-cung-cap",
  Nước: "nuoc",
};

const withOptionalHash = (href, hash) => {
  const rawHref = (href || "").trim();
  if (!rawHref) return hash ? `#${hash}` : "#";
  const baseHref = rawHref.split("#")[0];
  return hash ? `${baseHref}#${hash}` : baseHref;
};

document.querySelectorAll('.nav-submenu a[href$="categories.html"]').forEach((link) => {
  const label = link.textContent?.trim() || "";
  const hash = categoryMenuHashMap[label];
  if (hash === undefined) return;
  const currentHref = link.getAttribute("href") || "";
  link.setAttribute("href", withOptionalHash(currentHref, hash));
});

const liquidationMenuHashMap = {
  "Điều chuyển tài sản": "dieu-chuyen",
  "Thanh lý tài sản": "thanh-ly",
};

document.querySelectorAll('.nav-submenu a[href$="liquidation.html"]').forEach((link) => {
  const label = link.textContent?.trim() || "";
  const hash = liquidationMenuHashMap[label];
  if (!hash) return;
  const currentHref = link.getAttribute("href") || "";
  link.setAttribute("href", withOptionalHash(currentHref, hash));
});

const assetsMenuHashMap = {
  "Quản lý tài sản": "",
  "Đánh giá tài sản": "danh-gia-tai-san",
  "Đánh giá lại tài sản": "danh-gia-lai-tai-san",
};

document.querySelectorAll('.nav-submenu a[href$="assets.html"]').forEach((link) => {
  const label = link.textContent?.trim() || "";
  const hash = assetsMenuHashMap[label];
  if (hash === undefined) return;
  const currentHref = link.getAttribute("href") || "";
  link.setAttribute("href", withOptionalHash(currentHref, hash));
});
