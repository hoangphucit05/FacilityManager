(function initStudentRequests(window) {
  const DRAFT_KEY = "student.requests.drafts";
  const SENT_KEY = "student.requests.sent";
  const HOME_PATH = "/frontend/index.html";

  const readList = (key) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  };

  const writeList = (key, list) => {
    localStorage.setItem(key, JSON.stringify(list));
  };

  const goBackOrHome = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = HOME_PATH;
  };

  const buildPayload = (attachment) => {
    const title = String(document.getElementById("studentRequestTitle")?.value || "").trim();
    const note = String(document.getElementById("studentRequestNote")?.value || "").trim();
    const managerGroup = String(document.getElementById("studentManagerGroup")?.value || "").trim();
    const status = String(document.getElementById("studentStatus")?.value || "").trim();
    const managerName = String(document.getElementById("studentManagerName")?.value || "").trim();
    return {
      id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title,
      note,
      managerGroup,
      status,
      managerName,
      attachment: attachment || null,
      createdAt: new Date().toISOString(),
    };
  };

  const goTo = (path) => {
    window.location.href = path;
  };

  const initBackButton = () => {
    const backBtn = document.getElementById("studentBackBtn");
    backBtn?.addEventListener("click", goBackOrHome);
  };

  const initCreatePage = () => {
    const saveBtn = document.getElementById("studentSaveDraftBtn");
    const sendBtn = document.getElementById("studentSendNowBtn");
    const noteField = document.getElementById("studentRequestNote");
    const noteCount = document.getElementById("studentNoteCount");
    const attachmentInput = document.getElementById("studentAttachmentInput");
    const uploadPlaceholder = document.getElementById("studentUploadPlaceholder");
    const uploadPreviewImage = document.getElementById("studentUploadPreviewImage");
    const uploadFileName = document.getElementById("studentUploadFileName");
    let currentAttachment = null;

    if (noteField && noteCount) {
      const syncCount = () => {
        noteCount.textContent = `${noteField.value.length}/250`;
      };
      noteField.addEventListener("input", syncCount);
      syncCount();
    }

    attachmentInput?.addEventListener("change", () => {
      const file = attachmentInput.files?.[0];
      if (!file) return;

      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const reader = new FileReader();
      reader.onload = () => {
        currentAttachment = {
          kind: isImage ? "image" : isVideo ? "video" : "file",
          name: file.name,
          dataUrl: typeof reader.result === "string" ? reader.result : "",
        };

        if (uploadPlaceholder) uploadPlaceholder.hidden = true;
        if (uploadFileName) {
          uploadFileName.textContent = `Đã chọn: ${file.name}`;
          uploadFileName.hidden = false;
        }
        if (uploadPreviewImage) {
          if (isImage && currentAttachment.dataUrl) {
            uploadPreviewImage.src = currentAttachment.dataUrl;
            uploadPreviewImage.hidden = false;
          } else {
            uploadPreviewImage.hidden = true;
          }
        }
      };
      reader.readAsDataURL(file);
    });

    saveBtn?.addEventListener("click", () => {
      const payload = buildPayload(currentAttachment);
      if (!payload.title && !payload.note) {
        window.alert("Nhập tiêu đề hoặc ghi chú trước khi lưu tạm.");
        return;
      }
      const drafts = readList(DRAFT_KEY);
      drafts.unshift(payload);
      writeList(DRAFT_KEY, drafts);
      goTo("/frontend/pages/student/request-drafts.html");
    });

    sendBtn?.addEventListener("click", () => {
      const payload = buildPayload(currentAttachment);
      if (!payload.title || !payload.note) {
        window.alert("Vui lòng nhập tiêu đề và ghi chú trước khi gửi.");
        return;
      }
      const sent = readList(SENT_KEY);
      sent.unshift(payload);
      writeList(SENT_KEY, sent);
      goBackOrHome();
    });
  };

  const renderList = (listId, key, emptyText) => {
    const listEl = document.getElementById(listId);
    const emptyEl = document.getElementById("studentEmptyState");
    if (!listEl || !emptyEl) return;

    const list = readList(key);
    if (list.length === 0) {
      emptyEl.hidden = false;
      listEl.hidden = true;
      return;
    }

    emptyEl.hidden = true;
    listEl.hidden = false;
    listEl.innerHTML = list
      .map((item) => {
        const time = new Date(item.createdAt).toLocaleString("vi-VN");
        return `<article class="student-card">
          <h3 class="student-item-title">${item.title || "(Không tiêu đề)"}</h3>
          <p class="student-item-meta">Nhóm quản lý: ${item.managerGroup || "-"}</p>
          <p class="student-item-meta">Trạng thái: ${item.status || "-"}</p>
          <p class="student-item-meta">Thời gian: ${time}</p>
          <p>${item.note || ""}</p>
        </article>`;
      })
      .join("");

    const emptyTextEl = emptyEl.querySelector("[data-empty-text]");
    if (emptyTextEl) emptyTextEl.textContent = emptyText;
  };

  const page = document.body.getAttribute("data-student-page");
  if (page === "create-request") {
    initBackButton();
    initCreatePage();
  }
  if (page === "sent-requests") {
    initBackButton();
    renderList("studentRequestList", SENT_KEY, "Danh sách yêu cầu rỗng");
  }
  if (page === "draft-requests") {
    initBackButton();
    renderList("studentRequestList", DRAFT_KEY, "Không có yêu cầu nào được lưu tạm");
  }
})(window);
