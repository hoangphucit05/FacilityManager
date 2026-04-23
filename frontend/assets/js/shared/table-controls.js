(function exposeTableControls(window) {
  const setupTableControls = ({
    tableBody,
    searchInput,
    pageSizeSelect,
    searchColumnIndexes,
    getRowSearchText,
    customFilter,
  }) => {
    if (!tableBody) return () => {};
    const getRows = () => Array.from(tableBody.querySelectorAll("tr"));
    const tableElement = tableBody.closest("table");
    const tableWrapper = tableElement?.parentElement || tableBody.parentElement;

    const paginationContainer = document.createElement("div");
    paginationContainer.className = "table-pagination";
    const previousBtn = document.createElement("button");
    previousBtn.type = "button";
    previousBtn.className = "table-pagination-btn";
    previousBtn.textContent = "Previous";
    const pageLabel = document.createElement("span");
    pageLabel.className = "table-pagination-page";
    pageLabel.textContent = "1";
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "table-pagination-btn";
    nextBtn.textContent = "Next";
    paginationContainer.appendChild(previousBtn);
    paginationContainer.appendChild(pageLabel);
    paginationContainer.appendChild(nextBtn);
    tableWrapper?.insertAdjacentElement("afterend", paginationContainer);

    let currentPage = 1;
    let totalPages = 1;
    let lastMatchedRows = [];

    const apply = () => {
      const rows = getRows();
      const keyword = searchInput?.value.trim().toLowerCase() || "";
      const size = Number(pageSizeSelect?.value);
      const pageSize = Number.isFinite(size) && size > 0 ? size : rows.length;

      lastMatchedRows = rows.filter((row) => {
        let rowText = "";
        if (typeof getRowSearchText === "function") {
          const t = getRowSearchText(row);
          rowText = t != null ? String(t).toLowerCase() : "";
        } else if (Array.isArray(searchColumnIndexes) && searchColumnIndexes.length > 0) {
          rowText = searchColumnIndexes
            .map((index) => row.children[index]?.textContent?.trim() || "")
            .join(" ")
            .toLowerCase();
        } else {
          rowText = row.textContent?.toLowerCase() || "";
        }
        const matchesSearch = !keyword || rowText.includes(keyword);
        const matchesCustom = typeof customFilter === "function" ? customFilter(row) : true;
        return matchesSearch && matchesCustom;
      });

      totalPages = Math.max(1, Math.ceil(lastMatchedRows.length / pageSize));
      currentPage = Math.min(Math.max(1, currentPage), totalPages);
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      const visibleRows = new Set(lastMatchedRows.slice(start, end));

      rows.forEach((row) => {
        row.hidden = !visibleRows.has(row);
      });

      pageLabel.textContent = `${currentPage}`;
      previousBtn.disabled = currentPage <= 1;
      nextBtn.disabled = currentPage >= totalPages;
    };

    const resetToFirstPage = () => {
      currentPage = 1;
      apply();
    };

    pageSizeSelect?.addEventListener("change", resetToFirstPage);
    searchInput?.addEventListener("input", resetToFirstPage);
    previousBtn.addEventListener("click", () => {
      if (currentPage <= 1) return;
      currentPage -= 1;
      apply();
    });
    nextBtn.addEventListener("click", () => {
      if (currentPage >= totalPages) return;
      currentPage += 1;
      apply();
    });
    apply();

    return apply;
  };

  window.AppTableControls = {
    ...(window.AppTableControls || {}),
    setupTableControls,
  };
})(window);
