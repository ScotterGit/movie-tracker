fetch('movies.json')
  .then(response => response.json())
  .then(movies => {
    const searchBar = document.getElementById("search-bar");
    const genreSelect = document.getElementById("genre-select");
    const tableBody = document.querySelector("#movie-table tbody");
    const headers = document.querySelectorAll("th");
    const rowsSelect = document.getElementById("rows-select");
    const sortState = {};
    let currentData = [...movies];
    let currentPage = 1;
    let rowsPerPage = parseInt(rowsSelect.value);
    let activeGenre = "";

    // Default sort by dateWatched descending
    currentData.sort((a, b) => new Date(b.dateWatched) - new Date(a.dateWatched));

    // Populate genre dropdown
    const allGenres = [...new Set(movies.flatMap(movie => movie.genre))].sort();
    allGenres.forEach(genre => {
      const option = document.createElement("option");
      option.value = genre;
      option.textContent = genre;
      genreSelect.appendChild(option);
    });

    rowsSelect.addEventListener("change", () => {
      rowsPerPage = parseInt(rowsSelect.value);
      currentPage = 1;
      renderTable(currentData);
    });

    genreSelect.addEventListener("change", () => {
      activeGenre = genreSelect.value.toLowerCase();
      applyFilters();
    });

    searchBar.addEventListener("input", () => {
      applyFilters();
    });

    function applyFilters() {
      const query = searchBar.value.toLowerCase();

      currentData = movies.filter(movie => {
        const matchesGenre = activeGenre
          ? Array.isArray(movie.genre) && movie.genre.some(g => g.toLowerCase() === activeGenre)
          : true;

        const matchesSearch = Object.values(movie).some(value => {
          if (Array.isArray(value)) {
            return value.some(item => item.toLowerCase().includes(query));
          }
          return String(value).toLowerCase().includes(query);
        });

        return matchesGenre && matchesSearch;
      });

      currentPage = 1;
      renderTable(currentData);
    }

    function renderTable(data) {
      const start = (currentPage - 1) * rowsPerPage;
      const end = start + rowsPerPage;
      const pageData = data.slice(start, end);

      tableBody.innerHTML = pageData.map(movie => `
        <tr>
          <td>${movie.title}</td>
          <td>${movie.year}</td>
          <td>${Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre || ""}</td>
          <td>${movie.bearHandsRating ?? ""}</td>
          <td>${movie.hubbyBearRating ?? ""}</td>
          <td>${Array.isArray(movie.actors) ? movie.actors.join(", ") : movie.actors || ""}</td>
          <td>${Array.isArray(movie.directors) ? movie.directors.join(", ") : movie.directors || ""}</td>
          <td>${Array.isArray(movie.writers) ? movie.writers.join(", ") : movie.writers || ""}</td>
          <td>${movie.dateWatched}</td>
          <td>${Array.isArray(movie.themesKeywords) ? movie.themesKeywords.join(", ") : movie.themesKeywords || ""}</td>
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

      currentData.sort((a, b) => {
        const aVal = Array.isArray(a[key]) ? a[key][0] ?? "" : a[key] ?? "";
        const bVal = Array.isArray(b[key]) ? b[key][0] ?? "" : b[key] ?? "";

        if (key === "dateWatched") {
          return direction === "asc"
            ? new Date(aVal) - new Date(bVal)
            : new Date(bVal) - new Date(aVal);
        }

        const aNum = Number(aVal);
        const bNum = Number(bVal);
        const isNumeric = !isNaN(aNum) && !isNaN(bNum);

        if (isNumeric) {
          return direction === "asc" ? aNum - bNum : bNum - aNum;
        }

        return direction === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
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

    renderTable(currentData);
  });