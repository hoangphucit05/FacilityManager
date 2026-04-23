const { setupTableControls } = window.AppTableControls || {};
const {
  K65_CLASS_OPTIONS,
  getRoomUpdates,
  setRoomUpdate,
  getRoomProfile,
  getRadioValueByName,
  setRadioValueByName,
  fillK65ClassSelects,
  getRoomAdditions,
  setRoomAdditions,
  addRoomRowToBuilding,
} = window.AppRoomHelpers || {};

if (!setupTableControls || !K65_CLASS_OPTIONS || !getRoomProfile) {
  throw new Error("Missing shared frontend helpers. Ensure shared scripts are loaded before main.js.");
}

const sampleClasses = K65_CLASS_OPTIONS;
const timeSlots = [
  "Ca 1 (07:00 - 09:30)",
  "Ca 2 (09:45 - 12:00)",
  "Ca 3 (13:00 - 15:30)",
  "Ca 4 (15:45 - 18:00)",
];

const detectFloor = (roomCode) => {
  const match = roomCode.match(/(\d)/);
  return match ? match[1] : "1";
};

const toRows = (roomCodes) =>
  roomCodes.map((code, index) => [
    code,
    detectFloor(code),
    sampleClasses[index % sampleClasses.length],
    timeSlots[index % timeSlots.length],
    "Đang sử dụng",
    `${45 + (index % 4) * 5}`,
  ]);

const roomCodeMap = {
  E3: ["P1E3", "P2E3", "P3E3"],
  E4: ["P1E4", "P2E4", "P3E4"],
  E5: ["P2E5", "P3E5"],
  E6: ["P1E6", "P2E6", "P3E6", "P4E6"],
  E8: ["P3E8", "P4E8", "P5E8", "P5E8B"],
  E9: ["P2E9-1", "P2E9-2", "P3E9-1", "P3E9-2", "P4E9"],
  GDDN: [
    "201DN",
    "202DN",
    "203DN",
    "204DN",
    "301DN",
    "303DN",
    "304DN",
    "401DN",
    "402DN",
    "403DN",
    "404DN",
    "501DN",
    "502DN",
    "503DN",
    "504DN",
  ],
  C2: [
    "P101C2",
    "P102C2",
    "P103C2",
    "P104C2",
    "P201C2",
    "P202C2",
    "P203C2",
    "P301C2",
    "P302C2",
    "P303C2",
    "P304C2",
    "P401C2",
    "P402C2",
    "P403C2",
    "P404C2",
    "P501C2",
    "P502C2",
    "P503C2",
    "P504C2",
  ],
};

const buildingRooms = {
  E1: [
    ["E1-101", "1", "CNTT", "Ca 1 (07:00 - 09:30)", "Đang sử dụng", "60"],
    ["E1-202", "2", "QTKD", "Ca 2 (09:45 - 12:00)", "Đang sử dụng", "55"],
  ],
  E7: [
    ["P102E7", "1", "CNTT", "Ca 1 (07:00 - 09:30)", "Đang sử dụng", "55"],
    ["P106E7", "1", "CNTT_N_1", "Ca 2 (09:45 - 12:00)", "Đang sử dụng", "50"],
    ["P111E7", "1", "KTTH", "Ca 3 (13:00 - 15:30)", "Đang sử dụng", "45"],
    ["P202E7", "2", "CNTT_N_2", "Ca 1 (07:00 - 09:30)", "Đang sử dụng", "55"],
    ["P203E7", "2", "KDQT", "Ca 2 (09:45 - 12:00)", "Đang sử dụng", "50"],
    ["P204E7", "2", "KTĐTVT", "Ca 3 (13:00 - 15:30)", "Đang sử dụng", "50"],
    ["P205E7", "2", "KTCĐT", "Ca 4 (15:45 - 18:00)", "Đang sử dụng", "45"],
    ["P206E7", "2", "QTKD", "Ca tối (18:30 - 20:30)", "Đang sử dụng", "45"],
  ],
  ...Object.fromEntries(Object.entries(roomCodeMap).map(([building, rooms]) => [building, toRows(rooms)])),
  CANTIN: [["CT-01", "1", "-", "-", "Trống", "80"]],
};

const fallbackRooms = [["NA-001", "1", "-", "-", "Trống", "40"]];

const isRoomCodeTakenInBuilding = (buildingCode, roomCode) => {
  const staticRows = buildingRooms[buildingCode] || [];
  if (staticRows.some((r) => r[0] === roomCode)) return true;
  const added = getRoomAdditions()[buildingCode] || [];
  return added.some((r) => r[0] === roomCode);
};

if (window.location.pathname.endsWith("/departments.html")) {
  const body = document.getElementById("roomTableBody");
  const departmentsTable = document.getElementById("departmentsTable");
  const departmentsTableHeadRow = document.getElementById("departmentsTableHeadRow");
  const departmentsSearchInput = document.getElementById("departmentsSearchInput");
  const departmentsPageSizeSelect = document.getElementById("departmentsPageSizeSelect");
  const buildingLabel = document.getElementById("selectedBuildingLabel");
  const addRoomTabLink = document.querySelector('a.tab[href*="room-add"]');
  const links = document.querySelectorAll(".building-link");
  let refreshDepartmentTable = () => {};

  const DEPT_TH_SINGLE = `
    <th>Mã phòng</th>
    <th>Tầng</th>
    <th>Lớp đang sử dụng</th>
    <th>Sức chứa</th>
    <th>Trạng thái</th>
    <th>Chức năng</th>
  `;
  const DEPT_TH_GLOBAL = `
    <th>Tòa nhà</th>
    <th>Mã phòng</th>
    <th>Tầng</th>
    <th>Lớp đang sử dụng</th>
    <th>Sức chứa</th>
    <th>Trạng thái</th>
    <th>Chức năng</th>
  `;

  const buildingLabelForCode = (code) => {
    if (code === "GDDN") return "Giảng đường Đa Năng";
    if (code === "CANTIN") return "Căn Tin";
    return `Tòa nhà ${code}`;
  };

  const setAddRoomLink = (buildingCode) => {
    if (addRoomTabLink) {
      addRoomTabLink.href = `../dashboard/room-add.html?building=${encodeURIComponent(buildingCode)}`;
    }
    try {
      sessionStorage.setItem("departmentsActiveBuilding", buildingCode);
    } catch (_) {}
  };

  const roomActionCells = (roomCode) => `
          <td>
            <div class="room-action-buttons user-action-buttons">
              <button class="icon-btn room-view-btn" type="button" data-room-code="${roomCode}" title="Xem chi tiết phòng">
                <img src="../../assets/icons/view_infor.svg" alt="Xem chi tiết" />
              </button>
              <button class="icon-btn room-update-btn" type="button" data-room-code="${roomCode}" title="Cập nhật phòng">
                <img src="../../assets/icons/update.svg" alt="Cập nhật phòng" />
              </button>
              <button class="icon-btn room-delete-btn" type="button" data-room-code="${roomCode}" title="Xóa phòng">
                <img src="../../assets/icons/delete.svg" alt="Xóa phòng" />
              </button>
            </div>
          </td>`;

  const buildDepartmentRoomTr = (room, buildingCode, { withBuildingColumn }) => {
    const profile = getRoomProfile(room[0]);
    const roomClass = profile.className || room[2];
    const roomFloor =
      profile.floor !== undefined && profile.floor !== null && String(profile.floor).trim() !== ""
        ? String(profile.floor).trim()
        : room[1];
    const roomCapacity = profile.capacity || room[5];
    const roomStatus = profile.status || room[4];
    const bCell = withBuildingColumn ? `<td>${buildingLabelForCode(buildingCode)}</td>` : "";
    return `
        <tr data-building="${buildingCode}">
          ${bCell}
          <td>${room[0]}</td>
          <td>${roomFloor}</td>
          <td>${roomClass}</td>
          <td>${roomCapacity}</td>
          <td>${roomStatus}</td>
          ${roomActionCells(room[0])}
        </tr>`;
  };

  const renderAllBuildingsForSearch = () => {
    if (!body || !departmentsTable) return;
    departmentsTable.setAttribute("data-dept-search-mode", "global");
    if (departmentsTableHeadRow) departmentsTableHeadRow.innerHTML = DEPT_TH_GLOBAL;
    const codes = new Set([...Object.keys(buildingRooms), ...Object.keys(getRoomAdditions() || {})]);
    const out = [];
    for (const code of Array.from(codes).sort()) {
      const base = buildingRooms[code] || [];
      const extra = getRoomAdditions()[code] || [];
      const baseCodes = new Set(base.map((r) => r[0]));
      const rows = [...base, ...extra.filter((r) => !baseCodes.has(r[0]))];
      for (const room of rows) {
        out.push(buildDepartmentRoomTr(room, code, { withBuildingColumn: true }));
      }
    }
    body.innerHTML = out.join("");
    if (buildingLabel) {
      buildingLabel.textContent = "Tìm trên tất cả tòa nhà";
    }
    const activeB = document.querySelector(".building-link.active")?.getAttribute("data-building");
    if (activeB) setAddRoomLink(activeB);
    else setAddRoomLink("E1");
    refreshDepartmentTable();
  };

  const renderRooms = (buildingCode, displayText) => {
    if (!body) return;
    if (departmentsTable) departmentsTable.setAttribute("data-dept-search-mode", "single");
    if (departmentsTableHeadRow) departmentsTableHeadRow.innerHTML = DEPT_TH_SINGLE;
    setAddRoomLink(buildingCode);
    const base = buildingRooms[buildingCode] || fallbackRooms;
    const extra = getRoomAdditions()[buildingCode] || [];
    const baseCodes = new Set(base.map((r) => r[0]));
    const rows = [...base, ...extra.filter((r) => !baseCodes.has(r[0]))];
    body.innerHTML = rows.map((room) => buildDepartmentRoomTr(room, buildingCode, { withBuildingColumn: false })).join("");

    if (buildingLabel) {
      buildingLabel.textContent = displayText;
    }
    refreshDepartmentTable();
  };

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      if (departmentsSearchInput) departmentsSearchInput.value = "";
      links.forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
      const code = link.dataset.building || "";
      renderRooms(code, link.textContent?.trim() || "Tòa nhà");
    });
  });

  departmentsSearchInput?.addEventListener("input", () => {
    const q = departmentsSearchInput.value.trim();
    if (q) {
      renderAllBuildingsForSearch();
    } else {
      const al = document.querySelector(".building-link.active");
      const code = al?.getAttribute("data-building") || "E1";
      const t = al?.textContent?.trim() || "Tòa nhà E1";
      renderRooms(code, t);
    }
  });

  refreshDepartmentTable = setupTableControls({
    tableBody: body,
    searchInput: departmentsSearchInput,
    pageSizeSelect: departmentsPageSizeSelect,
    getRowSearchText: (row) => {
      const mode = document.getElementById("departmentsTable")?.getAttribute("data-dept-search-mode");
      const cols = mode === "global" ? [3, 4] : [2, 3];
      return cols.map((i) => row.children[i]?.textContent?.trim() || "").join(" ");
    },
  });

  const activeLink = document.querySelector(".building-link.active");
  if (activeLink) {
    const code = activeLink.dataset.building || "";
    if (!departmentsSearchInput?.value.trim()) {
      renderRooms(code, activeLink.textContent?.trim() || "Tòa nhà");
    } else {
      renderAllBuildingsForSearch();
    }
  } else {
    setAddRoomLink("E1");
  }

  body?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const viewBtn = target.closest(".room-view-btn");
    const updateBtn = target.closest(".room-update-btn");
    const deleteBtn = target.closest(".room-delete-btn");
    const roomCode =
      viewBtn?.getAttribute("data-room-code") ||
      updateBtn?.getAttribute("data-room-code") ||
      deleteBtn?.getAttribute("data-room-code") ||
      "";
    if (!roomCode) return;
    if (viewBtn) {
      window.location.href = `../dashboard/room-detail.html?room=${encodeURIComponent(roomCode)}`;
      return;
    }
    if (updateBtn) {
      const tr = updateBtn.closest("tr");
      let b =
        tr?.getAttribute("data-building") ||
        document.querySelector(".building-link.active")?.getAttribute("data-building") ||
        "";
      if (!b) {
        try {
          b = sessionStorage.getItem("departmentsActiveBuilding") || "";
        } catch (_) {
          b = "";
        }
      }
      const q = new URLSearchParams({ room: roomCode });
      if (b) q.set("building", b);
      window.location.href = `../dashboard/room-edit.html?${q.toString()}`;
      return;
    }
    if (deleteBtn) {
      const row = deleteBtn.closest("tr");
      if (!row) return;
      const confirmed = window.confirm(`Bạn có chắc muốn xóa phòng ${roomCode} khỏi danh sách?`);
      if (!confirmed) return;
      row.remove();
      refreshDepartmentTable();
    }
  });
}

if (window.location.pathname.endsWith("/users.html")) {
  const usersTableBody = document.querySelector("table tbody");
  const refreshUsersTable = setupTableControls({
    tableBody: usersTableBody,
    searchInput: document.getElementById("usersSearchInput"),
    pageSizeSelect: document.getElementById("usersPageSizeSelect"),
    searchColumnIndexes: [0, 2, 4],
  });

  usersTableBody?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const row = target.closest("tr");
    if (!row) return;

    const userKey = row.dataset.userKey || "";
    const viewBtn = target.closest(".user-view-btn");
    const updateBtn = target.closest(".user-update-btn");
    const deleteBtn = target.closest(".user-delete-btn");

    if (viewBtn) {
      window.location.href = `../profile/contact-profile.html?user=${encodeURIComponent(userKey || "tien-hop")}`;
      return;
    }

    if (updateBtn) {
      window.location.href = `../profile/users-add.html?edit=${encodeURIComponent(userKey || "")}`;
      return;
    }

    if (deleteBtn) {
      const userName = row.children[2]?.textContent?.trim() || "user này";
      const confirmed = window.confirm(`Bạn có chắc muốn xóa ${userName}?`);
      if (!confirmed) return;
      row.remove();
      refreshUsersTable();
    }
  });

  const pendingUpdateRaw = sessionStorage.getItem("pendingUserUpdate");
  if (pendingUpdateRaw && usersTableBody) {
    try {
      const pendingUpdate = JSON.parse(pendingUpdateRaw);
      const row = usersTableBody.querySelector(`tr[data-user-key="${pendingUpdate.userKey || ""}"]`);
      if (row) {
        const usernameCell = row.children[1];
        const fullnameCell = row.children[2];
        const roleCell = row.children[4];
        const avatarCell = row.children[5];
        if (usernameCell) usernameCell.textContent = pendingUpdate.username || "";
        if (fullnameCell) fullnameCell.textContent = pendingUpdate.fullname || "";
        if (roleCell) roleCell.textContent = pendingUpdate.role || "";
        const avatarImage = avatarCell?.querySelector("img");
        if (avatarImage && pendingUpdate.avatar) {
          avatarImage.src = pendingUpdate.avatar;
          avatarImage.alt = `avatar ${pendingUpdate.fullname || "user"}`;
        }
        refreshUsersTable();
      }
    } catch (_) {
      // Ignore invalid cached payload
    } finally {
      sessionStorage.removeItem("pendingUserUpdate");
    }
  }
}

if (window.location.pathname.endsWith("/users-add.html")) {
  const userFormPageTitle = document.getElementById("userFormPageTitle");
  const userFormTabLabel = document.getElementById("userFormTabLabel");
  const userFormSubmitBtn = document.getElementById("userFormSubmitBtn");
  const userUsernameInput = document.getElementById("userUsernameInput");
  const userPasswordInput = document.getElementById("userPasswordInput");
  const userFullnameInput = document.getElementById("userFullnameInput");
  const userAddressInput = document.getElementById("userAddressInput");
  const userPhoneInput = document.getElementById("userPhoneInput");
  const userRoleInput = document.getElementById("userRoleInput");
  const avatarImage = document.getElementById("avatarImage");
  const avatarPlaceholder = document.getElementById("avatarPlaceholder");

  const usersByKey = {
    "tien-hop": {
      username: "canbo",
      password: "******",
      fullname: "Trần Tiến Hợp",
      address: "Bình Định",
      phone: "1263751380",
      role: "Cán bộ quản lý tài sản",
      avatar: "../../assets/images/avatar_1.jpg",
    },
    "nhat-thanh": {
      username: "canbonhanvien",
      password: "******",
      fullname: "Đỗ Nhật Thanh",
      address: "An Giang",
      phone: "1263751380",
      role: "Cán bộ quản lý tài sản",
      avatar: "../../assets/images/avatar_2.jpg",
    },
    "hoang-phuc": {
      username: "ht",
      password: "******",
      fullname: "Võ Hoàng Phúc",
      address: "Sóc Trăng",
      phone: "1234459015",
      role: "Hiệu trưởng",
      avatar: "../../assets/images/avatar_3.jpg",
    },
    "huynh-hoa-phuc": {
      username: "nv",
      password: "******",
      fullname: "Trần Huỳnh Hòa Phúc",
      address: "Tiền Giang",
      phone: "1263751380",
      role: "Lao Công",
      avatar: "../../assets/images/avatar_4.jpg",
    },
  };

  const query = new URLSearchParams(window.location.search);
  const editKey = query.get("edit");
  const userInfo = editKey ? usersByKey[editKey] : null;
  const isEditMode = Boolean(userInfo);

  if (isEditMode) {
    if (userFormPageTitle) userFormPageTitle.textContent = "Cập nhật user";
    if (userFormTabLabel) userFormTabLabel.textContent = "Cập nhật user";
    if (userFormSubmitBtn) userFormSubmitBtn.textContent = "Cập nhật";
    if (userUsernameInput) userUsernameInput.value = userInfo.username;
    if (userPasswordInput) userPasswordInput.value = userInfo.password;
    if (userFullnameInput) userFullnameInput.value = userInfo.fullname;
    if (userAddressInput) userAddressInput.value = userInfo.address;
    if (userPhoneInput) userPhoneInput.value = userInfo.phone;
    if (userRoleInput) userRoleInput.value = userInfo.role;
    if (avatarImage && avatarPlaceholder) {
      avatarImage.src = userInfo.avatar;
      avatarImage.style.display = "block";
      avatarPlaceholder.style.display = "none";
    }
  }

  userFormSubmitBtn?.addEventListener("click", () => {
    if (!userUsernameInput || !userFullnameInput || !userRoleInput) return;

    if (isEditMode) {
      const payload = {
        userKey: editKey,
        username: userUsernameInput.value.trim(),
        fullname: userFullnameInput.value.trim(),
        role: userRoleInput.value.trim(),
        avatar: avatarImage?.src || "",
      };
      sessionStorage.setItem("pendingUserUpdate", JSON.stringify(payload));
      window.alert("Cập nhật user thành công!");
      if (window.history.length > 1) {
        window.history.back();
        return;
      }
      window.location.href = "../profile/users.html";
      return;
    }

    window.alert("Thêm user thành công!");
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = "../profile/users.html";
  });
}

if (window.location.pathname.endsWith("/categories.html")) {
  const pageTitle = document.querySelector(".page-title");
  const listTab = document.getElementById("categoryTabList");
  const addTab = document.getElementById("categoryTabAdd");
  const extraTab = document.getElementById("categoryTabExtra");
  const listSection = document.getElementById("categoryListSection");
  const addSection = document.getElementById("categoryAddSection");
  const categoryForm = document.getElementById("categoryForm");
  const categoryTableHeadRow = document.getElementById("categoryTableHeadRow");
  const categoryTableBody = document.getElementById("categoryTableBody");
  const categoryNameLabel = document.querySelector('label[for="categoryNameInput"]');
  const categoryCodeLabel = document.querySelector('label[for="categoryCodeInput"]');
  const categoryNameInput = document.getElementById("categoryNameInput");
  const categoryCodeInput = document.getElementById("categoryCodeInput");
  const categoryCodeSelect = document.getElementById("categoryCodeSelect");
  const categoryNameError = document.getElementById("categoryNameError");
  const categoryResetBtn = document.getElementById("categoryResetBtn");
  const categoryMenuLinks = Array.from(document.querySelectorAll('.nav-submenu a[href*="categories.html"]'));
  let activeCategoryConfigKey = "default";
  let activeCategoryTab = "list";
  let refreshCategoryTable = () => {};

  const categoryConfigs = {
    default: {
      title: "Quản lý danh mục tài sản",
      listTabText: "Tất cả danh mục",
      addTabText: "Thêm danh mục",
      extraTabText: "",
      columns: ["ID", "Mã danh mục", "Tên danh mục", "Chức năng"],
      nameLabel: "Tên danh mục",
      codeLabel: "Mã danh mục",
      namePlaceholder: "Nhập tên danh mục",
      codePlaceholder: "Ví dụ: MM-TB",
      extraNameLabel: "",
      extraCodeLabel: "",
      extraNamePlaceholder: "",
      rows: [
        ["1", "MM-TB", "Máy móc, thiết bị", "Sửa/Xóa"],
        ["2", "CC-DC", "Công cụ, dụng cụ", "Sửa/Xóa"],
      ],
    },
    "may-moc-thiet-bi": {
      title: "Quản lý danh mục máy móc, thiết bị",
      listTabText: "Máy móc, thiết bị",
      addTabText: "Thêm Máy móc, thiết bị",
      extraTabText: "",
      columns: ["ID", "Mã", "Tên", "Chức năng"],
      nameLabel: "Tên",
      codeLabel: "Mã",
      namePlaceholder: "Nhập tên",
      codePlaceholder: "Ví dụ: MM-01",
      extraNameLabel: "",
      extraCodeLabel: "",
      extraNamePlaceholder: "",
      rows: [
        ["1", "MM-01", "Ghế", "Sửa/Xóa"],
        ["2", "MM-02", "Kệ góc", "Sửa/Xóa"],
        ["3", "MM-03", "Bảng Meci", "Sửa/Xóa"],
        ["4", "MM-04", "Bàn vi tính", "Sửa/Xóa"],
        ["5", "MM-05", "Bàn", "Sửa/Xóa"],
        ["6", "MM-06", "Tủ", "Sửa/Xóa"],
      ],
    },
    "cong-cu-dung-cu": {
      title: "Quản lý danh mục công cụ, dụng cụ",
      listTabText: "Công cụ, dụng cụ",
      addTabText: "Thêm Công cụ, dụng cụ",
      extraTabText: "",
      columns: ["ID", "Mã", "Tên", "Chức năng"],
      nameLabel: "Tên",
      codeLabel: "Mã",
      namePlaceholder: "Nhập tên",
      codePlaceholder: "Ví dụ: CC-01",
      extraNameLabel: "",
      extraCodeLabel: "",
      extraNamePlaceholder: "",
      rows: [
        ["1", "CC-01", "Kìm điện", "Sửa/Xóa"],
        ["2", "CC-02", "Cờ lê", "Sửa/Xóa"],
        ["3", "CC-03", "Mỏ lết", "Sửa/Xóa"],
      ],
    },
    "nguon-kinh-phi": {
      title: "Quản lý nguồn kinh phí",
      listTabText: "Nguồn kinh phí",
      addTabText: "Thêm nguồn kinh phí",
      extraTabText: "Bổ sung nguồn kinh phí",
      columns: ["ID", "Mã NKP", "Tên nguồn kinh phí", "Tổng ngân sách", "Tổng chi", "Tổng thanh lý", "Còn lại", "Chức năng"],
      nameLabel: "Tên nguồn kinh phí",
      codeLabel: "Mã nguồn kinh phí",
      namePlaceholder: "Vui lòng nhập tên nguồn kinh phí",
      codePlaceholder: "Vui lòng nhập mã nguồn kinh phí",
      extraNameLabel: "Thêm kinh phí",
      extraCodeLabel: "Loại kinh phí",
      extraNamePlaceholder: "Vui lòng nhập số tiền cần bổ sung",
      rows: [
        ["1", "", "Nhà trường", "500.000.000 đ", "386.409.000 đ", "237.100.000 đ", "113.591.000 đ", "Sửa/Xóa"],
        ["2", "DA", "Dự án", "400.000.000 đ", "269.870.000 đ", "120.000.000 đ", "130.130.000 đ", "Sửa/Xóa"],
      ],
    },
    "nha-cung-cap": {
      title: "Quản lý nhà cung cấp",
      listTabText: "Tất cả nhà cung cấp",
      addTabText: "Thêm nhà cung cấp mới",
      extraTabText: "",
      columns: ["ID", "Mã nhà cung cấp", "Tên nhà cung cấp", "Địa chỉ", "Email", "SDT", "Chức năng"],
      nameLabel: "Tên nhà cung cấp",
      codeLabel: "Mã nhà cung cấp",
      namePlaceholder: "Vui lòng nhập tên nhà cung cấp",
      codePlaceholder: "Vui lòng nhập mã nhà cung cấp",
      extraNameLabel: "",
      extraCodeLabel: "",
      extraNamePlaceholder: "",
      rows: [
        ["1", "", "Công ty MTV Quang Minh tại Quảng Nam", "Tam kỳ quảng Nam", "quangminh@gmail.com", "120202345", "Sửa/Xóa"],
        ["2", "", "Công ty TNHH Trần Tâm", "Hải Châu Đà Nẵng", "trantam@gmail.com", "126784774", "Sửa/Xóa"],
        ["3", "", "Công ty cung cấp máy tính Tam Kỳ", "117 Lê Lợi TP Tam Kỳ Quảng Nam", "maytinhtamky@gmail.com", "126784774", "Sửa/Xóa"],
        ["4", "", "Công ty TNHH Âm nhạc Tam kỳ", "Tam An Phú Ninh Quảng Nam", "amnhactamky@gmail.com", "1230012574", "Sửa/Xóa"],
      ],
    },
    nuoc: {
      title: "Quản lý nước",
      listTabText: "Nước",
      addTabText: "Thêm nước",
      extraTabText: "",
      columns: ["ID", "Mã nước", "Tên nước", "Chức năng"],
      nameLabel: "Tên nước",
      codeLabel: "Mã nước",
      namePlaceholder: "Vui lòng nhập tên nước",
      codePlaceholder: "Vui lòng nhập mã nước",
      extraNameLabel: "",
      extraCodeLabel: "",
      extraNamePlaceholder: "",
      rows: [
        ["1", "BL", "Ba Lan", "Sửa/Xóa"],
        ["2", "HL", "Hà Lan", "Sửa/Xóa"],
        ["3", "", "Hàn Quốc", "Sửa/Xóa"],
        ["4", "", "Nga", "Sửa/Xóa"],
        ["5", "", "Việt Nam", "Sửa/Xóa"],
      ],
    },
  };

  const switchCategoryTab = (tabName) => {
    if (!listTab || !addTab || !listSection || !addSection) return;
    activeCategoryTab = tabName;
    const isList = tabName === "list";
    const isAdd = tabName === "add";
    const isExtra = tabName === "extra";

    listSection.hidden = !isList;
    addSection.hidden = isList;
    listTab.classList.toggle("tab-active", isList);
    addTab.classList.toggle("tab-active", isAdd);
    extraTab?.classList.toggle("tab-active", isExtra);
    const pag = listSection.nextElementSibling;
    if (pag && pag.classList.contains("table-pagination")) {
      pag.hidden = !isList;
    }
  };

  const getNextCategoryId = () => {
    if (!categoryTableBody) return 1;
    const ids = Array.from(categoryTableBody.querySelectorAll("tr td:first-child"))
      .map((cell) => Number(cell.textContent?.trim()))
      .filter((value) => Number.isFinite(value));
    if (ids.length === 0) return 1;
    return Math.max(...ids) + 1;
  };

  const buildCategoryCodeFromName = (name) =>
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0]?.toUpperCase() || "")
      .join("-")
      .slice(0, 10);

  const resetCategoryForm = () => {
    if (!categoryNameInput || !categoryCodeInput || !categoryNameError || !categoryCodeSelect) return;
    categoryNameInput.value = "";
    categoryCodeInput.value = "";
    categoryCodeSelect.value = "";
    categoryNameError.textContent = "Hãy nhập danh mục của bạn !";
    categoryNameError.hidden = true;
  };

  const toMoneyNumber = (text) => Number((text || "").replace(/[^\d]/g, "")) || 0;
  const formatMoney = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;

  const escapeCategoryAttr = (v) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");

  /** Cột chức năng: cập nhật + xóa (ô vuông, icon; không có xem chi tiết) */
  const categoryActionButtonsHtml = (id, code) => {
    const a = escapeCategoryAttr(id);
    const b = escapeCategoryAttr(code);
    return `<td>
      <div class="category-icon-actions">
        <button class="category-icon-btn category-update-btn" type="button" data-category-id="${a}" data-category-code="${b}" title="Cập nhật">
          <img src="../../assets/icons/update.svg" alt="Cập nhật" />
        </button>
        <button class="category-icon-btn category-delete-btn" type="button" data-category-id="${a}" data-category-code="${b}" title="Xóa">
          <img src="../../assets/icons/delete.svg" alt="Xóa" />
        </button>
      </div>
    </td>`;
  };

  const renderCategoryRows = (rows) => {
    if (!categoryTableBody) return;
    categoryTableBody.innerHTML = rows
      .map((row) => {
        if (!row || row.length === 0) return "";
        const cells = [...row];
        cells.pop();
        const id = cells[0] ?? "";
        const code = cells[1] ?? "";
        const dataTds = cells.map((c) => `<td>${c}</td>`).join("");
        return `<tr>${dataTds}${categoryActionButtonsHtml(id, code)}</tr>`;
      })
      .join("");
  };

  const renderCategoryHead = (columns) => {
    if (!categoryTableHeadRow) return;
    categoryTableHeadRow.innerHTML = columns.map((columnName) => `<th>${columnName}</th>`).join("");
  };

  const CATEGORY_ROW_PATCHES_KEY = "categoryRowPatches";

  const mergeCategoryPatches = (configKey, baseRows) => {
    let table = null;
    try {
      const raw = sessionStorage.getItem(CATEGORY_ROW_PATCHES_KEY);
      if (!raw) return baseRows;
      const patches = JSON.parse(raw);
      table = patches[configKey];
    } catch {
      return baseRows;
    }
    if (!table || typeof table !== "object") return baseRows;
    return baseRows.map((row) => {
      const id = String(row[0] ?? "");
      const patch = table[id];
      if (patch && Array.isArray(patch) && patch.length) {
        return [...patch, "Sửa/Xóa"];
      }
      return row;
    });
  };

  const populateBudgetTypeSelect = () => {
    if (!categoryCodeSelect || !categoryTableBody) return;
    const options = Array.from(categoryTableBody.querySelectorAll("tr"))
      .map((row) => {
        const cells = row.querySelectorAll("td");
        const code = cells[1]?.textContent?.trim() || "";
        const name = cells[2]?.textContent?.trim() || "";
        const value = code || name;
        const label = code ? `${code} - ${name}` : name;
        return { value, label };
      })
      .filter((item) => item.value);

    categoryCodeSelect.innerHTML = `
      <option value="">-- Chọn loại kinh phí --</option>
      ${options.map((item) => `<option value="${item.value}">${item.label}</option>`).join("")}
    `;
  };

  const setActiveCategoryMenuItem = (viewKey) => {
    categoryMenuLinks.forEach((link) => link.classList.remove("active"));
    const matchedLink = categoryMenuLinks.find((link) => {
      const linkText = link.textContent?.trim() || "";
      const slug = categoryMenuHashMap[linkText];
      if (!viewKey && slug === "") return true;
      return slug === viewKey;
    });
    if (matchedLink) {
      matchedLink.classList.add("active");
    }
  };

  const applyCategoryView = () => {
    const viewKey = window.location.hash.replace("#", "").trim();
    const config = categoryConfigs[viewKey] || categoryConfigs.default;
    activeCategoryConfigKey = categoryConfigs[viewKey] ? viewKey : "default";
    if (pageTitle) pageTitle.textContent = config.title;
    if (listTab) listTab.textContent = config.listTabText;
    if (addTab) addTab.textContent = config.addTabText;
    if (extraTab) {
      const hasExtraTab = Boolean(config.extraTabText);
      extraTab.hidden = !hasExtraTab;
      extraTab.textContent = config.extraTabText || "";
    }
    if (categoryNameLabel) categoryNameLabel.textContent = config.nameLabel;
    if (categoryCodeLabel) categoryCodeLabel.textContent = config.codeLabel;
    if (categoryNameInput) categoryNameInput.placeholder = config.namePlaceholder;
    if (categoryCodeInput) categoryCodeInput.placeholder = config.codePlaceholder;
    if (categoryCodeInput) categoryCodeInput.hidden = false;
    if (categoryCodeSelect) categoryCodeSelect.hidden = true;
    renderCategoryHead(config.columns);
    renderCategoryRows(mergeCategoryPatches(activeCategoryConfigKey, config.rows));
    setActiveCategoryMenuItem(categoryConfigs[viewKey] ? viewKey : "");
    resetCategoryForm();
    switchCategoryTab("list");
    refreshCategoryTable();
  };

  const setupAddFormForCurrentTab = () => {
    const config = categoryConfigs[activeCategoryConfigKey] || categoryConfigs.default;
    const isBudgetView = activeCategoryConfigKey === "nguon-kinh-phi";
    const isExtra = activeCategoryTab === "extra";

    if (!categoryNameInput || !categoryCodeInput || !categoryCodeSelect || !categoryNameLabel || !categoryCodeLabel) return;

    if (isBudgetView && isExtra) {
      categoryNameLabel.textContent = config.extraNameLabel;
      categoryCodeLabel.textContent = config.extraCodeLabel;
      categoryNameInput.placeholder = config.extraNamePlaceholder;
      categoryCodeInput.hidden = true;
      categoryCodeSelect.hidden = false;
      populateBudgetTypeSelect();
      return;
    }

    categoryNameLabel.textContent = config.nameLabel;
    categoryCodeLabel.textContent = config.codeLabel;
    categoryNameInput.placeholder = config.namePlaceholder;
    categoryCodeInput.placeholder = config.codePlaceholder;
    categoryCodeInput.hidden = false;
    categoryCodeSelect.hidden = true;
  };

  listTab?.addEventListener("click", () => {
    switchCategoryTab("list");
  });
  addTab?.addEventListener("click", () => {
    switchCategoryTab("add");
    setupAddFormForCurrentTab();
  });
  extraTab?.addEventListener("click", () => {
    switchCategoryTab("extra");
    setupAddFormForCurrentTab();
  });

  categoryNameInput?.addEventListener("input", () => {
    if (!categoryCodeInput) return;
    const name = categoryNameInput.value;
    if (!categoryCodeInput.value.trim()) {
      categoryCodeInput.value = buildCategoryCodeFromName(name);
    }
    if (categoryNameError) {
      categoryNameError.hidden = name.trim().length > 0;
    }
  });

  categoryResetBtn?.addEventListener("click", () => resetCategoryForm());

  categoryTableBody?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const updateBtn = target.closest(".category-update-btn");
    const deleteBtn = target.closest(".category-delete-btn");
    const row = target.closest("tr");
    if (!row || (!updateBtn && !deleteBtn)) return;

    const cells = row.querySelectorAll("td");
    if (cells.length < 3) return;
    const name = cells[2]?.textContent?.trim() || "";
    const code = cells[1]?.textContent?.trim() || "";

    if (updateBtn) {
      const config = categoryConfigs[activeCategoryConfigKey] || categoryConfigs.default;
      const labels = (config.columns || []).slice(0, -1);
      const dataTds = Array.from(cells).slice(0, -1);
      const values = dataTds.map((td) => td.textContent?.trim() || "");
      try {
        sessionStorage.setItem(
          "categoryEditDraft",
          JSON.stringify({
            configKey: activeCategoryConfigKey,
            pageTitle: config.title,
            labels,
            values,
            returnHash: window.location.hash || "",
          })
        );
      } catch (_) {}
      window.location.href = "category-update.html";
      return;
    }
    if (deleteBtn) {
      if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${name}"?`)) return;
      row.remove();
      refreshCategoryTable();
    }
  });

  categoryForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!categoryTableBody || !categoryNameInput || !categoryCodeInput || !categoryNameError || !categoryCodeSelect) return;

    const categoryName = categoryNameInput.value.trim();
    const typedCode = categoryCodeInput.hidden ? categoryCodeSelect.value.trim() : categoryCodeInput.value.trim();
    const categoryCode = typedCode || buildCategoryCodeFromName(categoryName);

    if (!categoryName) {
      categoryNameError.hidden = false;
      categoryNameInput.focus();
      return;
    }

    categoryNameError.hidden = true;
    const newRow = document.createElement("tr");
    const isBudgetView = activeCategoryConfigKey === "nguon-kinh-phi";
    const isExtraBudgetTab = isBudgetView && activeCategoryTab === "extra";

    if (isExtraBudgetTab) {
      const addedBudget = toMoneyNumber(categoryName);
      if (addedBudget <= 0) {
        categoryNameError.hidden = false;
        categoryNameError.textContent = "Vui lòng nhập số tiền hợp lệ";
        categoryNameInput.focus();
        return;
      }
      categoryNameError.textContent = "Hãy nhập danh mục của bạn !";
      const targetRow = Array.from(categoryTableBody.querySelectorAll("tr")).find((row) => {
        const cells = row.querySelectorAll("td");
        const code = cells[1]?.textContent?.trim() || "";
        const name = cells[2]?.textContent?.trim() || "";
        return code === typedCode || (!code && name === typedCode);
      });
      if (!targetRow) return;
      const cells = targetRow.querySelectorAll("td");
      const currentTotal = toMoneyNumber(cells[3]?.textContent || "");
      const currentRemain = toMoneyNumber(cells[6]?.textContent || "");
      cells[3].textContent = formatMoney(currentTotal + addedBudget);
      cells[6].textContent = formatMoney(currentRemain + addedBudget);
      resetCategoryForm();
      switchCategoryTab("list");
      refreshCategoryTable();
      return;
    }

    const nextId = getNextCategoryId();
    const newCode = isBudgetView
      ? categoryCode || "NKP-MOI"
      : activeCategoryConfigKey === "nha-cung-cap"
        ? categoryCode || "NCC-MOI"
        : categoryCode || "DM-MOI";
    const actionTd = categoryActionButtonsHtml(String(nextId), newCode);
    newRow.innerHTML = isBudgetView
      ? `
      <td>${nextId}</td>
      <td>${newCode}</td>
      <td>${categoryName}</td>
      <td>0 đ</td>
      <td>0 đ</td>
      <td>0 đ</td>
      <td>0 đ</td>
      ${actionTd}
    `
      : activeCategoryConfigKey === "nha-cung-cap"
        ? `
      <td>${nextId}</td>
      <td>${newCode}</td>
      <td>${categoryName}</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      ${actionTd}
    `
        : `
      <td>${nextId}</td>
      <td>${newCode}</td>
      <td>${categoryName}</td>
      ${actionTd}
    `;
    categoryTableBody.appendChild(newRow);

    resetCategoryForm();
    switchCategoryTab("list");
    refreshCategoryTable();
  });

  refreshCategoryTable = setupTableControls({
    tableBody: categoryTableBody,
    searchInput: document.getElementById("categorySearchInput"),
    pageSizeSelect: document.getElementById("categoryPageSizeSelect"),
  });

  window.addEventListener("hashchange", applyCategoryView);
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      applyCategoryView();
    }
  });
  applyCategoryView();
}

if (window.location.pathname.endsWith("/category-update.html")) {
  const root = document.getElementById("categoryEditFormRoot");
  const codeLabel = document.getElementById("categoryEditCodeLabel");
  const typeLabel = document.getElementById("categoryEditTypeLabel");
  const form = document.getElementById("categoryEditForm");
  const cancelBtn = document.getElementById("categoryEditCancelBtn");
  const raw = sessionStorage.getItem("categoryEditDraft");
  if (!raw || !root) {
    window.location.replace("categories.html");
  } else {
    let payload = null;
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
    if (!payload) {
      window.location.replace("categories.html");
    } else {
      const configKey = payload.configKey || "default";
      const labels = Array.isArray(payload.labels) ? payload.labels : [];
      const values = Array.isArray(payload.values) ? payload.values : [];
      const h = payload.returnHash || "";
      const codeDisplay =
        values[1] != null && String(values[1]).trim() !== ""
          ? String(values[1])
          : values[0] != null
            ? String(values[0])
            : "—";
      if (codeLabel) codeLabel.textContent = codeDisplay;
      if (typeLabel) typeLabel.textContent = payload.pageTitle || "—";

      const goBackToCategories = () => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = `categories.html${h}`;
        }
      };

      const n = Math.max(labels.length, values.length, 0);
      root.textContent = "";
      for (let i = 0; i < n; i += 1) {
        const wrap = document.createElement("div");
        wrap.className = "field";
        const lab = document.createElement("label");
        lab.htmlFor = `catEditField_${i}`;
        const labelText = labels[i] != null && labels[i] !== "" ? labels[i] : `Trường ${i + 1}`;
        lab.textContent = labelText;
        const inp = document.createElement("input");
        inp.type = "text";
        inp.id = `catEditField_${i}`;
        inp.name = `field_${i}`;
        inp.value = values[i] != null ? String(values[i]) : "";
        if (/^mã\b/i.test(labelText) || /^(Số|STT)\b/i.test(labelText)) {
          inp.readOnly = true;
        }
        wrap.appendChild(lab);
        wrap.appendChild(inp);
        root.appendChild(wrap);
      }
      cancelBtn?.addEventListener("click", goBackToCategories);
      form?.addEventListener("submit", (e) => {
        e.preventDefault();
        const newData = [];
        for (let i = 0; i < n; i += 1) {
          const el = document.getElementById(`catEditField_${i}`);
          newData.push(el ? el.value.trim() : "");
        }
        const rowId = String(values[0] ?? "");
        let patches = {};
        try {
          patches = JSON.parse(sessionStorage.getItem("categoryRowPatches") || "{}");
        } catch {
          patches = {};
        }
        if (!patches[configKey] || typeof patches[configKey] !== "object") {
          patches[configKey] = {};
        }
        patches[configKey][rowId] = newData;
        try {
          sessionStorage.setItem("categoryRowPatches", JSON.stringify(patches));
          sessionStorage.removeItem("categoryEditDraft");
        } catch (_) {}
        window.alert("Cập nhật danh mục thành công!");
        if (window.history.length > 1) {
          window.history.back();
          return;
        }
        window.location.href = `categories.html${h}`;
      });
    }
  }
}

if (window.location.pathname.endsWith("/assets.html")) {
  const assetPageTitle = document.getElementById("assetPageTitle");
  const assetTabs = document.getElementById("assetTabs");
  const assetTabList = document.getElementById("assetTabList");
  const assetTabDetail = document.getElementById("assetTabDetail");
  const assetTabTransfer = document.getElementById("assetTabTransfer");
  const assetListSection = document.getElementById("assetListSection");
  const assetDetailSection = document.getElementById("assetDetailSection");
  const assetTransferSection = document.getElementById("assetTransferSection");
  const assetRatingSection = document.getElementById("assetRatingSection");
  const assetReRatingSection = document.getElementById("assetReRatingSection");
  const reRatingTableSection = document.getElementById("reRatingTableSection");
  const reRatingFormSection = document.getElementById("reRatingFormSection");
  const reRatingTabAllAssets = document.getElementById("reRatingTabAllAssets");
  const reRatingTabRatedAssets = document.getElementById("reRatingTabRatedAssets");
  const reRatingTableBody = document.getElementById("reRatingTableBody");
  const reRatingHistorySection = document.getElementById("reRatingHistorySection");
  const reRatingHistoryTitle = document.getElementById("reRatingHistoryTitle");
  const reRatingHistoryList = document.getElementById("reRatingHistoryList");
  const assetRatingTableBody = document.getElementById("assetRatingTableBody");
  const reRateSaveBtn = document.getElementById("reRateSaveBtn");
  const reRateCancelBtn = document.getElementById("reRateCancelBtn");
  const reInfoName = document.getElementById("reInfoName");
  const reInfoUnit = document.getElementById("reInfoUnit");
  const reInfoQuantity = document.getElementById("reInfoQuantity");
  const reInfoPrice = document.getElementById("reInfoPrice");
  const reInfoDuration = document.getElementById("reInfoDuration");
  const reRateReviewer = document.getElementById("reRateReviewer");
  const reRateStars = document.getElementById("reRateStars");
  const reRateDate = document.getElementById("reRateDate");
  const reRateNote = document.getElementById("reRateNote");
  const assetTableBody = document.getElementById("assetTableBody");
  const assetDetailForm = document.getElementById("assetDetailForm");
  const assetMenuLinks = Array.from(document.querySelectorAll('.nav-submenu a[href*="assets.html"]'));
  const ASSET_RATING_HISTORY_KEY = "assetRatingHistory";
  let activeReRatingTab = "all";
  let selectedReRatingCard = "";
  let selectedHistoryCard = "";

  const getAssetRatingHistory = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(ASSET_RATING_HISTORY_KEY) || "{}");
      return raw && typeof raw === "object" ? raw : {};
    } catch (_) {
      return {};
    }
  };

  const setAssetRatingHistory = (history) => {
    try {
      localStorage.setItem(ASSET_RATING_HISTORY_KEY, JSON.stringify(history));
    } catch (_) {}
  };

  let assetRatingHistory = getAssetRatingHistory();
  const reRatingBaseRows = Array.from(reRatingTableBody?.querySelectorAll("tr") || []).map((row) => ({
    card: row.dataset.card || "",
    name: row.dataset.name || "",
    unit: row.dataset.unit || "",
    quantity: row.dataset.quantity || "",
    price: row.dataset.price || "",
    duration: row.dataset.duration || "",
    building: row.children[3]?.textContent?.trim() || "",
    className: row.children[4]?.textContent?.trim() || "",
  }));

  const formatStars = (stars) => "★".repeat(stars) + "☆".repeat(Math.max(0, 5 - stars));
  const formatDateTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("vi-VN");
  };

  const latestRatingForCard = (card) => {
    const list = assetRatingHistory[String(card)] || [];
    return list.length ? list[list.length - 1] : null;
  };

  const renderAssetRatingRows = () => {
    if (!assetRatingTableBody) return;
    const unrated = reRatingBaseRows.filter((item) => (assetRatingHistory[item.card] || []).length === 0);
    assetRatingTableBody.innerHTML = unrated
      .map(
        (item) =>
          `<tr data-card="${item.card}" data-name="${item.name}" data-unit="${item.unit}" data-quantity="${item.quantity}" data-price="${item.price}" data-duration="${item.duration}">
            <td>${item.card}</td>
            <td>${item.name}</td>
            <td>${item.building}</td>
            <td>${item.className}</td>
            <td>
              <span>Chưa đánh giá</span>
              <button class="btn btn-primary asset-rate-now-btn" type="button" style="margin-left:8px;padding:4px 8px">Đánh giá ngay</button>
            </td>
          </tr>`
      )
      .join("");
  };

  const renderReRatingRows = () => {
    if (!reRatingTableBody) return;
    const rows = reRatingBaseRows.filter((item) => {
      const count = (assetRatingHistory[item.card] || []).length;
      return activeReRatingTab === "all" ? true : count > 0;
    });
    reRatingTableBody.innerHTML = rows
      .map((item, idx) => {
        const latest = latestRatingForCard(item.card);
        const actionLabel = activeReRatingTab === "all" ? "Đánh giá lại" : "Xem lịch sử";
        const latestInfo = latest
          ? `<div style="font-size:12px;color:#5b6f84;margin-top:4px">${formatStars(Number(latest.stars || 0))} • ${formatDateTime(latest.ratedAt)}</div>`
          : "";
        return `<tr data-card="${item.card}" data-name="${item.name}" data-unit="${item.unit}" data-quantity="${item.quantity}" data-price="${item.price}" data-duration="${item.duration}">
          <td>${idx + 1}</td>
          <td>${item.card}</td>
          <td>${item.name}</td>
          <td>${item.building}</td>
          <td>${item.className}</td>
          <td><button class="btn btn-primary asset-rerating-btn" type="button" style="padding:4px 8px">${actionLabel}</button>${latestInfo}</td>
        </tr>`;
      })
      .join("");
    renderAssetRatingRows();
  };

  const renderHistoryPanel = (card) => {
    if (!reRatingHistorySection || !reRatingHistoryList || !reRatingHistoryTitle) return;
    const rows = reRatingBaseRows.find((r) => r.card === card);
    const history = assetRatingHistory[String(card)] || [];
    if (!rows || history.length === 0) {
      reRatingHistorySection.hidden = true;
      reRatingHistoryList.innerHTML = "";
      return;
    }
    reRatingHistorySection.hidden = false;
    reRatingHistoryTitle.textContent = `Lịch sử đánh giá - ${rows.name} (${rows.card})`;
    reRatingHistoryList.innerHTML = history
      .map(
        (item, idx) => `<div style="border:1px solid #dce6f1;border-radius:8px;padding:10px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;gap:8px">
          <strong>Lần ${idx + 1} - ${formatDateTime(item.ratedAt)}</strong>
          <button class="btn btn-success rating-delete-btn" type="button" data-card="${card}" data-rate-id="${item.id}" style="padding:4px 8px">Xóa</button>
        </div>
        <div>${formatStars(Number(item.stars || 0))}</div>
        <div>Người đánh giá: ${item.reviewer || "-"}</div>
        <div>${item.content || ""}</div>
      </div>`
      )
      .join("");
  };

  const openReRatingFormByCard = (card) => {
    const row = reRatingBaseRows.find((item) => String(item.card) === String(card));
    if (!row) return;
    if (reInfoName) reInfoName.value = row.name || "";
    if (reInfoUnit) reInfoUnit.value = row.unit || "";
    if (reInfoQuantity) reInfoQuantity.value = row.quantity || "";
    if (reInfoPrice) reInfoPrice.value = row.price || "";
    if (reInfoDuration) reInfoDuration.value = row.duration || "";
    selectedReRatingCard = String(row.card);
    selectedHistoryCard = selectedReRatingCard;

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    if (reRateDate) reRateDate.value = `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    if (reRateReviewer) reRateReviewer.value = "";
    if (reRateStars) reRateStars.value = "";
    if (reRateNote) reRateNote.value = "";

    if (reRatingTableSection) reRatingTableSection.hidden = true;
    if (reRatingFormSection) reRatingFormSection.hidden = false;
    if (reRatingHistorySection) reRatingHistorySection.hidden = true;
  };

  const fieldMap = {
    assetNameInput: "assetName",
    assetProviderInput: "provider",
    assetCountryInput: "country",
    assetCardInput: "cardNumber",
    assetDepartmentInput: "department",
    assetClassInput: "classroom",
    assetTypeInput: "assetType",
    assetCategoryInput: "itemCategory",
    assetManufactureYearInput: "manufactureYear",
    assetUnitPriceInput: "unitPrice",
    assetQuantityInput: "quantity",
    assetOriginalPriceInput: "originalPrice",
    assetFundInput: "fundSource",
    assetUsageTimeInput: "usageTime",
    assetPurchaseDateInput: "purchaseDate",
    assetUsageYearInput: "usageYear",
    assetNoteInput: "note",
    assetBuyerInput: "buyer",
  };

  const switchAssetTab = (tabName) => {
    const isList = tabName === "list";
    const isDetail = tabName === "detail";
    const isTransfer = tabName === "transfer";
    if (assetListSection) assetListSection.hidden = !isList;
    if (assetDetailSection) assetDetailSection.hidden = !isDetail;
    if (assetTransferSection) assetTransferSection.hidden = !isTransfer;
    if (assetRatingSection) assetRatingSection.hidden = true;
    if (assetReRatingSection) assetReRatingSection.hidden = true;
    assetTabList?.classList.toggle("tab-active", isList);
    assetTabDetail?.classList.toggle("tab-active", isDetail);
    assetTabTransfer?.classList.toggle("tab-active", isTransfer);
  };

  const setActiveAssetMenuItem = (modeKey) => {
    assetMenuLinks.forEach((link) => link.classList.remove("active"));
    const found = assetMenuLinks.find((link) => assetsMenuHashMap[link.textContent?.trim() || ""] === modeKey);
    if (found) found.classList.add("active");
  };

  const applyAssetMode = () => {
    const modeKey = window.location.hash.replace("#", "").trim();
    const isRatingMode = modeKey === "danh-gia-tai-san";
    const isReRatingMode = modeKey === "danh-gia-lai-tai-san";
    if (isRatingMode || isReRatingMode) {
      if (assetPageTitle) assetPageTitle.textContent = isReRatingMode ? "Đánh giá lại tài sản" : "Đánh giá tài sản";
      if (assetTabs) assetTabs.hidden = true;
      if (assetListSection) assetListSection.hidden = true;
      if (assetDetailSection) assetDetailSection.hidden = true;
      if (assetTransferSection) assetTransferSection.hidden = true;
      if (assetRatingSection) assetRatingSection.hidden = !isRatingMode;
      if (assetReRatingSection) assetReRatingSection.hidden = !isReRatingMode;
      if (reRatingTableSection) reRatingTableSection.hidden = false;
      if (reRatingFormSection) reRatingFormSection.hidden = true;
      reRatingTabAllAssets?.classList.add("tab-active");
      reRatingTabRatedAssets?.classList.remove("tab-active");
      assetTabList?.classList.remove("tab-active");
      assetTabDetail?.classList.remove("tab-active");
      assetTabTransfer?.classList.remove("tab-active");
      setActiveAssetMenuItem(modeKey);
      return;
    }
    if (assetPageTitle) assetPageTitle.textContent = "Quản lý tài sản";
    if (assetTabs) assetTabs.hidden = false;
    setActiveAssetMenuItem("");
    switchAssetTab("list");
  };

  const fillAssetDetailForm = (row) => {
    if (!row) return;
    Object.entries(fieldMap).forEach(([fieldId, dataKey]) => {
      const input = document.getElementById(fieldId);
      if (!input) return;
      const value = row.dataset[dataKey] || "";
      input.value = value;
    });
  };

  const ASSET_SELECTED_KEY = "assetSelectedPayload";
  const toAssetPayloadFromRow = (row) => {
    const payload = {};
    Object.values(fieldMap).forEach((dataKey) => {
      payload[dataKey] = row.dataset[dataKey] || "";
    });
    return payload;
  };

  const goToAssetPage = (pageName, row) => {
    if (!row) return;
    try {
      sessionStorage.setItem(ASSET_SELECTED_KEY, JSON.stringify(toAssetPayloadFromRow(row)));
    } catch (_) {}
    window.location.href = pageName;
  };

  const fillAssetTransferForm = (row) => {
    if (!row) return;
    const mappings = [
      ["transferCardInput", row.dataset.cardNumber || ""],
      ["transferCategoryInput", row.dataset.itemCategory || ""],
      ["transferNameInput", row.dataset.assetName || ""],
      ["transferTypeInput", row.dataset.assetType || ""],
      ["transferBuildingInput", row.dataset.building || ""],
      ["transferGiverInput", row.dataset.buyer || ""],
      ["transferClassInput", row.dataset.classroom || ""],
    ];
    mappings.forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (input) input.value = value;
    });
  };

  assetTabList?.addEventListener("click", () => switchAssetTab("list"));
  assetTabDetail?.addEventListener("click", () => {
    assetDetailForm?.reset();
    switchAssetTab("detail");
  });
  assetTabTransfer?.addEventListener("click", () => switchAssetTab("transfer"));

  assetDetailForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    window.alert("Thêm tài sản thành công!");
    assetDetailForm.reset();
    switchAssetTab("list");
  });

  assetTableBody?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const viewBtn = target.closest(".asset-view-btn");
    if (!viewBtn) return;
    const row = target.closest("tr");
    goToAssetPage("asset-view.html", row);
  });

  assetTableBody?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const updateBtn = target.closest(".asset-update-btn");
    if (!updateBtn) return;
    const row = target.closest("tr");
    goToAssetPage("asset-update.html", row);
  });

  assetTableBody?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const transferBtn = target.closest(".asset-transfer-btn");
    if (!transferBtn) return;
    const row = transferBtn.closest("tr");
    if (!row) return;
    fillAssetTransferForm(row);
    switchAssetTab("transfer");
  });

  window.addEventListener("hashchange", applyAssetMode);

  let refreshReRatingTable = () => {};
  const switchReRatingTab = (tabName) => {
    activeReRatingTab = tabName;
    if (reRatingTableSection) reRatingTableSection.hidden = false;
    if (reRatingFormSection) reRatingFormSection.hidden = true;
    reRatingTabAllAssets?.classList.toggle("tab-active", tabName === "all");
    reRatingTabRatedAssets?.classList.toggle("tab-active", tabName === "rated");
    selectedHistoryCard = "";
    if (reRatingHistorySection) reRatingHistorySection.hidden = true;
    renderReRatingRows();
    refreshReRatingTable();
  };

  reRatingTabAllAssets?.addEventListener("click", () => switchReRatingTab("all"));
  reRatingTabRatedAssets?.addEventListener("click", () => switchReRatingTab("rated"));

  reRatingTableBody?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const rerateBtn = target.closest(".asset-rerating-btn");
    if (!rerateBtn) return;
    const row = rerateBtn.closest("tr");
    if (!row) return;

    selectedReRatingCard = row.dataset.card || "";
    selectedHistoryCard = selectedReRatingCard;

    if (activeReRatingTab === "rated") {
      renderHistoryPanel(selectedHistoryCard);
      return;
    }
    openReRatingFormByCard(selectedReRatingCard);
  });

  assetRatingTableBody?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const rateBtn = target.closest(".asset-rate-now-btn");
    if (!rateBtn) return;
    const row = rateBtn.closest("tr");
    const card = row?.getAttribute("data-card") || "";
    if (!card) return;
    window.location.hash = "danh-gia-lai-tai-san";
    applyAssetMode();
    switchReRatingTab("all");
    openReRatingFormByCard(card);
  });

  reRateCancelBtn?.addEventListener("click", () => {
    if (reRatingTableSection) reRatingTableSection.hidden = false;
    if (reRatingFormSection) reRatingFormSection.hidden = true;
  });

  reRateSaveBtn?.addEventListener("click", () => {
    if (!selectedReRatingCard) {
      window.alert("Vui lòng chọn tài sản cần đánh giá lại.");
      return;
    }
    const reviewer = reRateReviewer?.value.trim() || "";
    const stars = Number(reRateStars?.value || 0);
    const ratedAt = reRateDate?.value || "";
    const content = reRateNote?.value.trim() || "";
    if (!reviewer || !stars || !ratedAt || !content) {
      window.alert("Vui lòng nhập đầy đủ người đánh giá, số sao, thời gian và nội dung đánh giá.");
      return;
    }
    const key = String(selectedReRatingCard);
    if (!Array.isArray(assetRatingHistory[key])) assetRatingHistory[key] = [];
    assetRatingHistory[key].push({
      id: `rate_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      reviewer,
      stars,
      ratedAt,
      content,
    });
    setAssetRatingHistory(assetRatingHistory);
    renderReRatingRows();
    refreshReRatingTable();
    renderHistoryPanel(key);
    window.alert("Đã lưu đánh giá lại tài sản.");
    selectedReRatingCard = "";
    switchReRatingTab("rated");
  });

  reRatingHistoryList?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const delBtn = target.closest(".rating-delete-btn");
    if (!delBtn) return;
    const card = delBtn.getAttribute("data-card") || "";
    const rateId = delBtn.getAttribute("data-rate-id") || "";
    if (!card || !rateId) return;
    const list = Array.isArray(assetRatingHistory[card]) ? assetRatingHistory[card] : [];
    assetRatingHistory[card] = list.filter((item) => item.id !== rateId);
    if (assetRatingHistory[card].length === 0) delete assetRatingHistory[card];
    setAssetRatingHistory(assetRatingHistory);
    renderReRatingRows();
    refreshReRatingTable();
    renderHistoryPanel(card);
  });

  setupTableControls({
    tableBody: assetTableBody,
    searchInput: document.getElementById("assetListSearchInput"),
    pageSizeSelect: document.getElementById("assetListPageSizeSelect"),
  });
  renderAssetRatingRows();
  setupTableControls({
    tableBody: assetRatingTableBody,
    searchInput: document.getElementById("assetRatingSearchInput"),
    pageSizeSelect: document.getElementById("assetRatingPageSizeSelect"),
  });
  renderReRatingRows();
  refreshReRatingTable = setupTableControls({
    tableBody: reRatingTableBody,
    searchInput: document.getElementById("assetReRatingSearchInput"),
    pageSizeSelect: document.getElementById("assetReRatingPageSizeSelect"),
  });
  renderReRatingRows();

  applyAssetMode();
}

if (window.location.pathname.endsWith("/asset-view.html") || window.location.pathname.endsWith("/asset-update.html")) {
  const ASSET_SELECTED_KEY = "assetSelectedPayload";
  const payloadRaw = sessionStorage.getItem(ASSET_SELECTED_KEY);
  let payload = null;
  try {
    payload = payloadRaw ? JSON.parse(payloadRaw) : null;
  } catch {
    payload = null;
  }
  if (!payload) {
    window.location.replace("assets.html");
  } else {
    const fieldMap = {
      assetNameInput: "assetName",
      assetProviderInput: "provider",
      assetCountryInput: "country",
      assetCardInput: "cardNumber",
      assetDepartmentInput: "department",
      assetClassInput: "classroom",
      assetTypeInput: "assetType",
      assetCategoryInput: "itemCategory",
      assetManufactureYearInput: "manufactureYear",
      assetUnitPriceInput: "unitPrice",
      assetQuantityInput: "quantity",
      assetOriginalPriceInput: "originalPrice",
      assetFundInput: "fundSource",
      assetUsageTimeInput: "usageTime",
      assetPurchaseDateInput: "purchaseDate",
      assetUsageYearInput: "usageYear",
      assetNoteInput: "note",
      assetBuyerInput: "buyer",
    };

    Object.entries(fieldMap).forEach(([fieldId, dataKey]) => {
      const input = document.getElementById(fieldId);
      if (!input) return;
      input.value = payload[dataKey] || "";
    });

    const isView = window.location.pathname.endsWith("/asset-view.html");
    const form = document.getElementById("assetViewForm") || document.getElementById("assetUpdateForm");
    const backBtn = document.getElementById("assetViewBackBtn") || document.getElementById("assetUpdateBackBtn");

    if (isView && form) {
      const fields = form.querySelectorAll("input, select, textarea");
      fields.forEach((field) => {
        if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
          field.readOnly = true;
        } else if (field instanceof HTMLSelectElement) {
          field.disabled = true;
        }
      });
    }

    backBtn?.addEventListener("click", () => {
      window.location.href = "assets.html";
    });

    const updateForm = document.getElementById("assetUpdateForm");
    updateForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      window.alert("Cập nhật tài sản thành công!");
      window.location.href = "assets.html";
    });
  }
}

if (window.location.pathname.endsWith("/liquidation.html")) {
  const liquidationPageTitle = document.getElementById("liquidationPageTitle");
  const liquidationMenuLinks = Array.from(document.querySelectorAll('.nav-submenu a[href*="liquidation.html"]'));
  const transferTabAllAssets = document.getElementById("transferTabAllAssets");
  const transferTabHistory = document.getElementById("transferTabHistory");
  const transferAllAssetsSection = document.getElementById("transferAllAssetsSection");
  const transferHistorySection = document.getElementById("transferHistorySection");
  const transferAllAssetsHeadRow = document.getElementById("transferAllAssetsHeadRow");
  const transferAllAssetsBody = document.getElementById("transferAllAssetsBody");
  const transferHistoryHeadRow = document.getElementById("transferHistoryHeadRow");
  const transferHistoryBody = document.getElementById("transferHistoryBody");
  const transferHistorySearchInput = document.getElementById("transferHistorySearchInput");
  const transferHistoryPageSizeSelect = document.getElementById("transferHistoryPageSizeSelect");
  const transferHistoryToolbar = document.getElementById("transferHistoryToolbar");
  const transferHistoryFooter = document.getElementById("transferHistoryFooter");
  const liquidationDetailSection = document.getElementById("liquidationDetailSection");
  const liquidationDetailTitle = document.getElementById("liquidationDetailTitle");
  const liqCardInput = document.getElementById("liqCardInput");
  const liqDateLabel = document.getElementById("liqDateLabel");
  const liqNameInput = document.getElementById("liqNameInput");
  const liqUnitInput = document.getElementById("liqUnitInput");
  const liqUnitLabel = document.getElementById("liqUnitLabel");
  const liqUserInput = document.getElementById("liqUserInput");
  const liqUserLabel = document.getElementById("liqUserLabel");
  const liqQuantityInput = document.getElementById("liqQuantityInput");
  const liqReasonInput = document.getElementById("liqReasonInput");
  const liqImageInput = document.getElementById("liqImageInput");
  const liqImageHint = document.getElementById("liqImageHint");
  const liqReasonLabel = document.getElementById("liqReasonLabel");
  const liqSubmitBtn = document.getElementById("liqSubmitBtn");
  let currentLiquidationMode = "dieu-chuyen";
  let refreshTransferHistoryTable = () => {};

  const transferModeConfig = {
    title: "Điều chuyển tài sản",
    tab1: "Tất cả tài sản",
    tab2: "Danh sách tài sản điều chuyển",
    allAssetsColumns: ["ID", "Số thẻ", "Tên", "Khoa", "Lớp", "Chức năng"],
    allAssetsRows: [
      ["1", "023", "Tivi LCD Sony 46 in", "KT", "CT13KT01", '<button class="icon-btn transfer-truck-btn" type="button" title="Điều chuyển"><img src="../../assets/icons/dieu_chuyen_1.svg" alt="Điều chuyển" /></button>'],
      ["2", "022", "Đàn Organ Yamaha E443", "TL-GD", "CT13TLGD01", '<button class="icon-btn transfer-truck-btn" type="button" title="Điều chuyển"><img src="../../assets/icons/dieu_chuyen_1.svg" alt="Điều chuyển" /></button>'],
      ["3", "021", "Ghitar classice", "TL-GD", "CT13TLGD01", '<button class="icon-btn transfer-truck-btn" type="button" title="Điều chuyển"><img src="../../assets/icons/dieu_chuyen_1.svg" alt="Điều chuyển" /></button>'],
      ["4", "020", "Cồng chiêng ( bộ )", "NV-CTXH", "CT13CTXH01", '<button class="icon-btn transfer-truck-btn" type="button" title="Điều chuyển"><img src="../../assets/icons/dieu_chuyen_1.svg" alt="Điều chuyển" /></button>'],
      ["5", "019", "Máy vi tính CMS", "NV-CTXH", "CT13CTXH01", '<button class="icon-btn transfer-truck-btn" type="button" title="Điều chuyển"><img src="../../assets/icons/dieu_chuyen_1.svg" alt="Điều chuyển" /></button>'],
      ["6", "018", "Máy vi tính Acer", "NV-CTXH", "CT13CTXH01", '<button class="icon-btn transfer-truck-btn" type="button" title="Điều chuyển"><img src="../../assets/icons/dieu_chuyen_1.svg" alt="Điều chuyển" /></button>'],
      ["7", "017", "Bảng chống lóa", "NN", "CT13TA02", '<button class="icon-btn transfer-truck-btn" type="button" title="Điều chuyển"><img src="../../assets/icons/dieu_chuyen_1.svg" alt="Điều chuyển" /></button>'],
      ["8", "016", "Bảng mecal", "NN", "CT13TA01", '<button class="icon-btn transfer-truck-btn" type="button" title="Điều chuyển"><img src="../../assets/icons/dieu_chuyen_1.svg" alt="Điều chuyển" /></button>'],
    ],
    historyColumns: ["ID", "Số thẻ", "Tên", "Đơn vị giao", "Đơn vị nhận", "Người giao", "Người nhận", "Ngày giao"],
    historyRows: [
      ["1", "023", "Tivi LCD Sony 46 in", "", "Khoa Kinh tế", "Trần Tiến Hợp", "Đỗ Nhật Thanh", "21/11/2016"],
      ["2", "023", "Tivi LCD Sony 46 in", "Khoa Kinh tế", "Khoa Công Nghệ Thông Tin", "Đỗ Nhật Thanh", "Võ Hoàng Phúc", "25/11/2016"],
      ["3", "002", "Bàn giáo viên", "Khoa Công Nghệ Thông Tin", "Khoa Lý-Hóa-Sinh", "Võ Hoàng Phúc", "Trần Huỳnh Hòa Phúc", "15/11/2016"],
      ["4", "001", "Bàn họp", "", "Khoa Công Nghệ Thông Tin", "Trần Huỳnh Hòa Phúc", "Trần Tiến Hợp", "15/11/2016"],
    ],
    showToolbar: true,
    footerText: "Hiển thị 1 của 1 trang",
  };

  const liquidationModeConfig = {
    title: "Thanh lý tài sản",
    tab1: "Tất cả tài sản",
    tab2: "Danh sách tài sản thanh lý",
    allAssetsColumns: ["ID", "Số thẻ", "Tên", "Khoa", "Lớp", "Chức năng"],
    allAssetsRows: [
      ["1", "023", "Tivi LCD Sony 46 in", "KT", "CT13KT01", '<button class="icon-btn liquidation-view-btn" type="button" title="Thanh lý"><img src="../../assets/icons/sales.svg" alt="Thanh lý" /></button>'],
      ["2", "022", "Đàn Organ Yamaha E443", "TL-GD", "CT13TLGD01", '<button class="icon-btn liquidation-view-btn" type="button" title="Thanh lý"><img src="../../assets/icons/sales.svg" alt="Thanh lý" /></button>'],
      ["3", "021", "Ghitar classice", "TL-GD", "CT13TLGD01", '<button class="icon-btn liquidation-view-btn" type="button" title="Thanh lý"><img src="../../assets/icons/sales.svg" alt="Thanh lý" /></button>'],
      ["4", "020", "Cồng chiêng ( bộ )", "NV-CTXH", "CT13CTXH01", '<button class="icon-btn liquidation-view-btn" type="button" title="Thanh lý"><img src="../../assets/icons/sales.svg" alt="Thanh lý" /></button>'],
      ["5", "019", "Máy vi tính CMS", "NV-CTXH", "CT13CTXH01", '<button class="icon-btn liquidation-view-btn" type="button" title="Thanh lý"><img src="../../assets/icons/sales.svg" alt="Thanh lý" /></button>'],
      ["6", "018", "Máy vi tính Acer", "NV-CTXH", "CT13CTXH01", '<button class="icon-btn liquidation-view-btn" type="button" title="Thanh lý"><img src="../../assets/icons/sales.svg" alt="Thanh lý" /></button>'],
      ["7", "017", "Bảng chống lóa", "NN", "CT13TA02", '<button class="icon-btn liquidation-view-btn" type="button" title="Thanh lý"><img src="../../assets/icons/sales.svg" alt="Thanh lý" /></button>'],
      ["8", "016", "Bảng mecal", "NN", "CT13TA01", '<button class="icon-btn liquidation-view-btn" type="button" title="Thanh lý"><img src="../../assets/icons/sales.svg" alt="Thanh lý" /></button>'],
    ],
    historyColumns: ["ID", "Số thẻ", "Tên", "Đơn vị", "Số lượng", "Người thanh lý", "Lý do", "Ảnh minh họa", "Ngày thanh lý"],
    historyRows: [
      ["1", "023", "Tivi LCD Sony 46 in", "Khoa Kinh tế", "8", "Trần Tiến Hợp", "lý do nè", "Không có hình", "21/11/2016"],
      ["2", "013", "Tủ sắt 2 cánh", "Khoa Nghệ thuật", "1", "Đỗ Nhật Thanh", "Tủ bị hư hỏng", "Không có hình", "21/11/2016"],
      ["3", "020", "Cồng chiêng ( bộ )", "Khoa Ngữ văn và Công tác xã hội", "3", "Võ Hoàng Phúc", "Sản phẩm bị lỗi", "Không có hình", "21/11/2016"],
      ["4", "019", "Máy vi tính CMS", "Khoa Ngữ văn và Công tác xã hội", "6", "Trần Huỳnh Hòa Phúc", "Sản phẩm bị lỗi", "Không có hình", "21/11/2016"],
    ],
    showToolbar: false,
    footerText: "",
  };

  const renderColumns = (headRow, columns) => {
    if (!headRow) return;
    headRow.innerHTML = columns.map((column) => `<th>${column}</th>`).join("");
  };

  const renderRows = (body, rows) => {
    if (!body) return;
    body.innerHTML = rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("");
  };

  const applyLiquidationMode = () => {
    const mode = window.location.hash.replace("#", "").trim() === "thanh-ly" ? "thanh-ly" : "dieu-chuyen";
    currentLiquidationMode = mode;
    const config = mode === "thanh-ly" ? liquidationModeConfig : transferModeConfig;
    liquidationMenuLinks.forEach((link) => link.classList.remove("active"));
    const targetLabel = mode === "thanh-ly" ? "Thanh lý tài sản" : "Điều chuyển tài sản";
    const matchedLink = liquidationMenuLinks.find((link) => (link.textContent?.trim() || "") === targetLabel);
    if (matchedLink) matchedLink.classList.add("active");
    if (liquidationPageTitle) liquidationPageTitle.textContent = config.title;
    if (transferTabAllAssets) transferTabAllAssets.textContent = config.tab1;
    if (transferTabHistory) transferTabHistory.textContent = config.tab2;
    renderColumns(transferAllAssetsHeadRow, config.allAssetsColumns);
    renderRows(transferAllAssetsBody, config.allAssetsRows);
    renderColumns(transferHistoryHeadRow, config.historyColumns);
    renderRows(transferHistoryBody, config.historyRows);
    refreshTransferHistoryTable();
    if (transferHistoryToolbar) transferHistoryToolbar.hidden = !config.showToolbar;
    if (transferHistoryFooter) {
      transferHistoryFooter.hidden = !config.footerText;
      transferHistoryFooter.textContent = config.footerText;
    }
    if (liquidationDetailSection) liquidationDetailSection.hidden = true;
  };

  const switchTransferTab = (tabName) => {
    const isAllAssets = tabName === "all-assets";
    const isHistory = tabName === "history";
    if (transferAllAssetsSection) transferAllAssetsSection.hidden = !isAllAssets;
    if (transferHistorySection) transferHistorySection.hidden = !isHistory;
    if (liquidationDetailSection) liquidationDetailSection.hidden = true;
    transferTabAllAssets?.classList.toggle("tab-active", isAllAssets);
    transferTabHistory?.classList.toggle("tab-active", isHistory);
  };

  const departmentMap = {
    KT: "Khoa Kinh tế",
    "TL-GD": "Khoa Nghệ thuật",
    "NV-CTXH": "Khoa Ngữ văn và Công tác xã hội",
    NN: "Khoa Ngoại ngữ",
    NT: "Khoa Nội trú",
  };

  transferTabAllAssets?.addEventListener("click", () => switchTransferTab("all-assets"));
  transferTabHistory?.addEventListener("click", () => switchTransferTab("history"));
  liqImageInput?.addEventListener("change", () => {
    const files = Array.from(liqImageInput.files || []);
    if (!liqImageHint) return;
    if (files.length === 0) {
      liqImageHint.textContent = "Bấm để chọn ảnh minh họa";
      return;
    }
    liqImageHint.textContent = files.map((f) => f.name).join(", ");
  });

  transferAllAssetsBody?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const triggerBtn = target.closest(".liquidation-view-btn, .transfer-truck-btn");
    if (!triggerBtn) return;
    const row = triggerBtn.closest("tr");
    if (!row) return;
    const cells = row.querySelectorAll("td");
    const card = cells[1]?.textContent?.trim() || "";
    const assetName = cells[2]?.textContent?.trim() || "";
    const deptCode = cells[3]?.textContent?.trim() || "";
    const defaultPeople = ["Trần Tiến Hợp", "Đỗ Nhật Thanh", "Võ Hoàng Phúc", "Trần Huỳnh Hòa Phúc"];
    const picker = Number(card) % defaultPeople.length;

    if (liqCardInput) liqCardInput.value = card;
    if (liqNameInput) liqNameInput.value = assetName;
    if (liqUnitInput) liqUnitInput.value = departmentMap[deptCode] || deptCode;
    if (liqUserInput) liqUserInput.value = defaultPeople[picker];
    if (liqQuantityInput) liqQuantityInput.value = "";
    if (liqReasonInput) liqReasonInput.value = "";

    const isTransferMode = currentLiquidationMode === "dieu-chuyen";
    if (liquidationDetailTitle) liquidationDetailTitle.textContent = isTransferMode ? "Thông tin điều chuyển" : "Thông tin thanh lý";
    if (liqDateLabel) liqDateLabel.textContent = isTransferMode ? "Ngày điều chuyển" : "Ngày thanh lý";
    if (liqReasonLabel) liqReasonLabel.textContent = isTransferMode ? "Ghi chú điều chuyển" : "Lý do thanh lý";
    if (liqReasonInput) liqReasonInput.placeholder = isTransferMode ? "Nhập ghi chú điều chuyển" : "Nhập lý do thanh lý";
    if (liqUnitLabel) liqUnitLabel.textContent = isTransferMode ? "Đơn vị nhận" : "Đơn vị";
    if (liqUserLabel) liqUserLabel.textContent = isTransferMode ? "Người nhận" : "Người thanh lý";
    if (liqSubmitBtn) liqSubmitBtn.textContent = isTransferMode ? "Điều chuyển" : "Thanh lý";

    if (transferAllAssetsSection) transferAllAssetsSection.hidden = true;
    if (transferHistorySection) transferHistorySection.hidden = true;
    if (liquidationDetailSection) liquidationDetailSection.hidden = false;
    transferTabAllAssets?.classList.remove("tab-active");
    transferTabHistory?.classList.remove("tab-active");
  });

  window.addEventListener("hashchange", applyLiquidationMode);
  applyLiquidationMode();
  switchTransferTab("all-assets");

  refreshTransferHistoryTable = setupTableControls({
    tableBody: transferHistoryBody,
    searchInput: transferHistorySearchInput,
    pageSizeSelect: transferHistoryPageSizeSelect,
  });
}

if (window.location.pathname.endsWith("/statistics.html")) {
  const statisticsTableBody = document.getElementById("statisticsTableBody");
  const statisticsSearchInput = document.getElementById("statisticsSearchInput");
  const statisticsPageSizeSelect = document.getElementById("statisticsPageSizeSelect");
  const statisticsBuildingFilter = document.getElementById("statisticsBuildingFilter");
  const statisticsClassFilter = document.getElementById("statisticsClassFilter");
  const statisticsFundingFilter = document.getElementById("statisticsFundingFilter");
  const statisticsStatusFilter = document.getElementById("statisticsStatusFilter");

  const filterConfigs = [
    { element: statisticsBuildingFilter, columnIndex: 4 },
    { element: statisticsClassFilter, columnIndex: 5 },
    { element: statisticsFundingFilter, columnIndex: 7 },
    { element: statisticsStatusFilter, columnIndex: 8 },
  ];

  const getRows = () => Array.from(statisticsTableBody?.querySelectorAll("tr") || []);

  const populateFilterOptions = () => {
    const rows = getRows();
    filterConfigs.forEach(({ element, columnIndex }) => {
      if (!element) return;
      const values = Array.from(
        new Set(
          rows
            .map((row) => row.children[columnIndex]?.textContent?.trim() || "")
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, "vi"));

      element.innerHTML = `<option value="All">All</option>${values.map((value) => `<option value="${value}">${value}</option>`).join("")}`;
    });
  };

  const applyStatisticsFilter = setupTableControls({
    tableBody: statisticsTableBody,
    searchInput: statisticsSearchInput,
    pageSizeSelect: statisticsPageSizeSelect,
    customFilter: (row) =>
      filterConfigs.every(({ element, columnIndex }) => {
        if (!element) return true;
        const selectedValue = element.value;
        if (!selectedValue || selectedValue === "All") return true;
        const cellValue = row.children[columnIndex]?.textContent?.trim() || "";
        return cellValue === selectedValue;
      }),
  });

  filterConfigs.forEach(({ element }) => {
    element?.addEventListener("change", applyStatisticsFilter);
  });
  populateFilterOptions();
  applyStatisticsFilter();
}

if (window.location.pathname.endsWith("/room-detail.html")) {
  const params = new URLSearchParams(window.location.search);
  const roomCode = params.get("room") || "NA-001";
  const profile = getRoomProfile(roomCode);
  const roomCodeLabel = document.getElementById("roomCodeLabel");
  if (roomCodeLabel) roomCodeLabel.textContent = roomCode;
  const mappings = [
    ["roomTeacher", profile.teacher],
    ["roomClass", profile.classStudying || profile.className],
    ["roomDesks", profile.desks],
    ["roomChairs", profile.chairs],
    ["roomSpeakers", profile.speakers],
    ["roomAirConditioner", profile.airConditioner],
    ["roomMicrophone", profile.microphone],
    ["roomGlassDoor", profile.glassDoor],
    ["roomCeilingFan", profile.ceilingFan],
    ["roomCurtain", profile.curtain],
  ];
  mappings.forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

if (window.location.pathname.endsWith("/room-edit.html")) {
  const form = document.getElementById("roomEditForm");
  const params = new URLSearchParams(window.location.search);
  const roomCode = params.get("room") || "NA-001";
  const profile = getRoomProfile(roomCode);
  const buildingParam = params.get("building") || profile.buildingCode || "";
  const roomCodeLabel = document.getElementById("roomEditCodeLabel");
  if (roomCodeLabel) roomCodeLabel.textContent = roomCode;
  const roomCodeReadonly = document.getElementById("roomCodeReadonly");
  if (roomCodeReadonly) roomCodeReadonly.value = roomCode;
  if (buildingParam) {
    const buildingHint = document.getElementById("roomEditBuildingHint");
    const roomEditBuildingLabel = document.getElementById("roomEditBuildingLabel");
    if (buildingHint) buildingHint.hidden = false;
    if (roomEditBuildingLabel) roomEditBuildingLabel.textContent = `Tòa nhà ${buildingParam}`;
  }
  if (form) {
    fillK65ClassSelects(form);
    form.addEventListener("input", () => form.classList.remove("submitted"));
    form.addEventListener("change", () => form.classList.remove("submitted"));
  }
  const ensureK65OrLegacy = (id, v) => {
    const s = document.getElementById(id);
    if (!s || v == null || v === "") return;
    if ([...s.options].some((o) => o.value === v)) {
      s.value = v;
      return;
    }
    s.insertAdjacentHTML("beforeend", `<option value="${v}">${v}</option>`);
    s.value = v;
  };
  const mappings = [
    ["roomFloorInput", profile.floor],
    ["roomClassUsingInput", profile.className],
    ["roomClassInput", profile.classStudying || profile.className],
    ["roomTeacherInput", profile.teacher],
    ["roomDesksInput", profile.desks],
    ["roomChairsInput", profile.chairs],
    ["roomSpeakersInput", profile.speakers],
    ["roomAirConditionerInput", profile.airConditioner],
    ["roomMicrophoneInput", profile.microphone],
    ["roomCeilingFanInput", profile.ceilingFan],
    ["roomCapacityInput", profile.capacity],
  ];
  mappings.forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value != null ? String(value) : "";
  });
  ensureK65OrLegacy("roomClassUsingInput", profile.className);
  ensureK65OrLegacy("roomClassInput", profile.classStudying || profile.className);
  setRadioValueByName("roomStatus", profile.status);
  setRadioValueByName("roomGlassDoor", profile.glassDoor);
  setRadioValueByName("roomCurtain", profile.curtain);

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add("submitted");
      form.reportValidity();
      return;
    }
    let b = buildingParam;
    if (!b) {
      try {
        b = sessionStorage.getItem("departmentsActiveBuilding") || "";
      } catch (_) {
        b = "";
      }
    }
    const className = document.getElementById("roomClassUsingInput")?.value.trim() || "";
    const status = getRadioValueByName("roomStatus");
    const floor = document.getElementById("roomFloorInput")?.value.trim() || "";
    const capacity = document.getElementById("roomCapacityInput")?.value.trim() || "";
    setRoomUpdate(roomCode, {
      buildingCode: b,
      className,
      classStudying: document.getElementById("roomClassInput")?.value.trim() || "",
      floor,
      teacher: document.getElementById("roomTeacherInput")?.value.trim() || "",
      desks: document.getElementById("roomDesksInput")?.value.trim() || "",
      chairs: document.getElementById("roomChairsInput")?.value.trim() || "",
      speakers: document.getElementById("roomSpeakersInput")?.value.trim() || "",
      airConditioner: document.getElementById("roomAirConditionerInput")?.value.trim() || "",
      microphone: document.getElementById("roomMicrophoneInput")?.value.trim() || "",
      glassDoor: getRadioValueByName("roomGlassDoor"),
      ceilingFan: document.getElementById("roomCeilingFanInput")?.value.trim() || "",
      curtain: getRadioValueByName("roomCurtain"),
      status,
      capacity,
    });
    if (b) {
      const inAdded = (getRoomAdditions()[b] || []).some((r) => r[0] === roomCode);
      if (inAdded) {
        addRoomRowToBuilding(b, [roomCode, floor, className, "-", status, capacity]);
      }
    }
    window.alert("Cập nhật phòng thành công!");
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = "../dashboard/departments.html";
  });
}

if (window.location.pathname.endsWith("/room-add.html")) {
  const form = document.getElementById("roomAddForm");
  const params = new URLSearchParams(window.location.search);
  let building = params.get("building");
  if (!building) {
    try {
      building = sessionStorage.getItem("departmentsActiveBuilding");
    } catch (_) {
      building = null;
    }
  }
  if (!building) building = "E1";
  try {
    sessionStorage.setItem("departmentsActiveBuilding", building);
  } catch (_) {}
  const hidden = document.getElementById("roomTargetBuilding");
  if (hidden) hidden.value = building;
  const addLbl = document.getElementById("roomAddBuildingLabel");
  if (addLbl) addLbl.textContent = `Tòa nhà ${building}`;
  if (form) {
    fillK65ClassSelects(form);
    form.addEventListener("input", () => form.classList.remove("submitted"));
    form.addEventListener("change", () => form.classList.remove("submitted"));
  }
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add("submitted");
      form.reportValidity();
      return;
    }
    const roomCode = document.getElementById("roomCodeInput")?.value.trim() || "";
    const className = document.getElementById("roomClassUsingInput")?.value.trim() || "";
    const classStudying = document.getElementById("roomClassInput")?.value.trim() || "";
    const floor = document.getElementById("roomFloorInput")?.value.trim() || "";
    const capacity = document.getElementById("roomCapacityInput")?.value.trim() || "";
    const status = getRadioValueByName("roomStatus");
    if (isRoomCodeTakenInBuilding(building, roomCode)) {
      window.alert("Mã phòng này đã có trong tòa đã chọn. Vui lòng nhập mã khác.");
      return;
    }
    setRoomUpdate(roomCode, {
      buildingCode: building,
      className,
      classStudying,
      floor,
      capacity,
      status,
      teacher: document.getElementById("roomTeacherInput")?.value.trim() || "",
      desks: document.getElementById("roomDesksInput")?.value.trim() || "",
      chairs: document.getElementById("roomChairsInput")?.value.trim() || "",
      speakers: document.getElementById("roomSpeakersInput")?.value.trim() || "",
      airConditioner: document.getElementById("roomAirConditionerInput")?.value.trim() || "",
      microphone: document.getElementById("roomMicrophoneInput")?.value.trim() || "",
      glassDoor: getRadioValueByName("roomGlassDoor"),
      ceilingFan: document.getElementById("roomCeilingFanInput")?.value.trim() || "",
      curtain: getRadioValueByName("roomCurtain"),
    });
    addRoomRowToBuilding(building, [roomCode, floor, className, "-", status, capacity]);
    window.alert("Thêm phòng thành công!");
    window.location.href = "../dashboard/departments.html";
  });
}

if (window.location.pathname.endsWith("/contact-profile.html")) {
  const profileName = document.getElementById("profileName");
  const profileRole = document.getElementById("profileRole");
  const profilePhone = document.getElementById("profilePhone");
  const profileEmail = document.getElementById("profileEmail");
  const profileAddress = document.getElementById("profileAddress");
  const profileAvatarImage = document.getElementById("profileAvatarImage");
  const backToPreviousPageBtn = document.getElementById("backToPreviousPageBtn");

  const contactProfiles = {
    "tien-hop": {
      name: "Trần Tiến Hợp",
      role: "Cán bộ quản lý tài sản",
      phone: "1263751380",
      email: "trantienhop@hotmail.com",
      address: "Bình Định",
      avatar: "../../assets/images/avatar_1.jpg",
    },
    "nhat-thanh": {
      name: "Đỗ Nhật Thanh",
      role: "Cán bộ quản lý tài sản",
      phone: "1263751380",
      email: "donhatthanh@hotmail.com",
      address: "An Giang",
      avatar: "../../assets/images/avatar_2.jpg",
    },
    "hoang-phuc": {
      name: "Võ Hoàng Phúc",
      role: "Cán bộ quản lý tài sản",
      phone: "1234459015",
      email: "vohoangphuc@hotmail.com",
      address: "Sóc Trăng",
      avatar: "../../assets/images/avatar_3.jpg",
    },
    "huynh-hoa-phuc": {
      name: "Trần Huỳnh Hòa Phúc",
      role: "Cán bộ quản lý tài sản",
      phone: "1263751380",
      email: "tranhuynhhoaphuc@hotmail.com",
      address: "Tiền Giang",
      avatar: "../../assets/images/avatar_4.jpg",
    },
  };

  const params = new URLSearchParams(window.location.search);
  const userKey = params.get("user") || "tien-hop";
  const profile = contactProfiles[userKey] || contactProfiles["tien-hop"];

  if (profileName) profileName.textContent = profile.name.toUpperCase();
  if (profileRole) profileRole.textContent = profile.role;
  if (profilePhone) profilePhone.textContent = profile.phone;
  if (profileEmail) profileEmail.textContent = profile.email;
  if (profileAddress) profileAddress.textContent = profile.address;
  if (profileAvatarImage) profileAvatarImage.src = profile.avatar;

  backToPreviousPageBtn?.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = "../profile/users.html";
  });
}
