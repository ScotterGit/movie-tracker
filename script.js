fetch('movies.json')
  .then(response => response.json())
  .then(movies => {
    const searchBar = document.getElementById("search-bar");
    const tableBody = document.querySelector("#movie-table tbody");
    const headers = document.querySelectorAll("th");
    const rowsSelect = document.getElementById("rows-select");
    const sortState = {};
    let currentData = [...movies];
    let currentPage = 1;
    let rowsPerPage = parseInt(rowsSelect.value);

    // Default sort by dateWatched descending
    currentData.sort((a, b) => new Date(b.dateWatched) - new Date(a.dateWatched));

    rowsSelect.addEventListener("change", () => {
      rowsPerPage = parseInt(rowsSelect.value);
      currentPage = 1;
      renderTable(currentData);
    });

    function renderTable(data) {
      const start = (currentPage - 1) * rowsPerPage;
      const end = start + rowsPerPage;
      const pageData = data.slice(start, end);

      tableBody.innerHTML = pageData.map(movie => `
        <tr>
          <td><a href="${movie.link}" target="_blank">${movie.title}</a></td>
          <td>${movie.genre}</td>
          <td>${movie.rating}</td>
          <td>${movie.platform}</td>
          <td>${movie.rewatch ? "Yes" : "No"}</td>
          <td>${movie.dateWatched}</td>
        </tr>
      `).join("");

      renderPagination(data.length);
    }

    function renderPagination(totalRows) {
      const totalPages = Math.ceil(totalRows / rowsPerPage);
      const paginationDiv = document.getElementById("pagination");

      paginationDiv.innerHTML = `
        <button ${currentPage === 1 ? "disabled" : ""} id="prev">Prev</button>
        Page ${currentPage} of ${totalPages}
        <button ${currentPage === totalPages ? "disabled" : ""} id="next">Next</button>
      `;

      document.getElementById("prev").onclick = () => {
        if (currentPage > 1) {
          currentPage--;
          renderTable(currentData);
        }
      };

      document.getElementById("next").onclick = () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderTable(currentData);
        }
      };
    }

    function sortBy(key) {
      const direction = sortState[key] === "asc" ? "desc" : "asc";
      sortState[key] = direction;

      const isDate = key === "dateWatched";
      const isNumeric = typeof currentData[0][key] === "number";

      currentData.sort((a, b) => {
        if (isDate) {
          return direction === "asc"
            ? new Date(a[key]) - new Date(b[key])
            : new Date(b[key]) - new Date(a[key]);
        } else if (isNumeric) {
          return direction === "asc" ? a[key] - b[key] : b[key] - a[key];
        } else {
          return direction === "asc"
            ? String(a[key]).localeCompare(String(b[key]))
            : String(b[key]).localeCompare(String(a[key]));
        }
      });

      updateArrows(key, direction);
      currentPage = 1;
      renderTable(currentData);
    }

    function updateArrows(activeKey, direction) {
      headers.forEach(th => {
        const key = th.getAttribute("data-key");
        const arrow = th.querySelector(".arrow");
        if (arrow) {
          arrow.textContent = key === activeKey
            ? (direction === "asc" ? "▲" : "▼")
            : "";
        }
      });
    }

    headers.forEach(th => {
      th.addEventListener("click", () => {
        const key = th.getAttribute("data-key");
        sortBy(key);
      });
    });

    searchBar.addEventListener("input", () => {
      const query = searchBar.value.toLowerCase();
      currentData = movies.filter(movie =>
        Object.values(movie).some(value =>
          Array.isArray(value)
            ? value.join(" ").toLowerCase().includes(query)
            : String(value).toLowerCase().includes(query)
        )
      );
      currentPage = 1;
      renderTable(currentData);
    });

    renderTable(currentData);
  });