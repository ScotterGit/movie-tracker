fetch('movies.json')
  .then(response => response.json())
  .then(movies => {
    const tableBody = document.querySelector("#movie-table tbody");
    const headers = document.querySelectorAll("th");
    const rowsSelect = document.getElementById("rows-select");
    const genreSelect = document.getElementById("genre-select");
    const yearSelect = document.getElementById("year-select");
    const directorSelect = document.getElementById("director-select");
    const writerSelect = document.getElementById("writer-select");
    const bearMin = document.getElementById("bear-rating-min");
    const hubbyMin = document.getElementById("hubby-rating-min");
    const actorFilter = document.getElementById("actor-filter");
    const themeFilter = document.getElementById("theme-filter");
    const searchBar = document.getElementById("search-bar");

    const sortState = {};
    let currentData = [...movies];
    let currentPage = 1;
    let rowsPerPage = parseInt(rowsSelect.value);

    // Populate dropdowns
    function populateDropdown(select, values) {
      [...new Set(values)].sort().forEach(val => {
        const option = document.createElement("option");
        option.value = val;
        option.textContent = val;
        select.appendChild(option);
      });
    }

    populateDropdown(genreSelect, movies.flatMap(m => m.genre));
    populateDropdown(yearSelect, movies.map(m => m.year));
    populateDropdown(directorSelect, movies.flatMap(m => m.directors));
    populateDropdown(writerSelect, movies.flatMap(m => m.writers));

    // Default sort
    currentData.sort((a, b) => new Date(b.dateWatched) - new Date(a.dateWatched));

    // Event listeners
    [rowsSelect, genreSelect, yearSelect, directorSelect, writerSelect, bearMin, hubbyMin, actorFilter, themeFilter, searchBar].forEach(el => {
      el.addEventListener("input", applyFilters);
      el.addEventListener("change", applyFilters);
    });

    function applyFilters() {
      const genre = genreSelect.value.toLowerCase();
      const year = yearSelect.value;
      const director = directorSelect.value.toLowerCase();
      const writer = writerSelect.value.toLowerCase();
      const bearRating = parseFloat(bearMin.value);
      const hubbyRating = parseFloat(hubbyMin.value);
      const actorQuery = actorFilter.value.toLowerCase();
      const themeQuery = themeFilter.value.toLowerCase();
      const searchQuery = searchBar.value.toLowerCase();

      currentData = movies.filter(movie => {
        const matchGenre = genre ? movie.genre.some(g => g.toLowerCase() === genre) : true;
        const matchYear = year ? movie.year == year : true;
        const matchDirector = director ? movie.directors.some(d => d.toLowerCase() === director) : true;
        const matchWriter = writer ? movie.writers.some(w => w.toLowerCase() === writer) : true;
        const matchBear = !isNaN(bearRating) ? movie.bearHandsRating >= bearRating : true;
        const matchHubby = !isNaN(hubbyRating) ? movie.hubbyBearRating >= hubbyRating : true;
        const matchActor = actorQuery ? movie.actors.some(a => a.toLowerCase().includes(actorQuery)) : true;
        const matchTheme = themeQuery ? movie.themesKeywords.some(t => t.toLowerCase().includes(themeQuery)) : true;
        const matchSearch = searchQuery
          ? Object.values(movie).some(val => {
              if (Array.isArray(val)) return val.some(v => v.toLowerCase().includes(searchQuery));
              return String(val).toLowerCase().includes(searchQuery);
            })
          : true;

        return matchGenre && matchYear && matchDirector && matchWriter && matchBear && matchHubby && matchActor && matchTheme && matchSearch;
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
          <td>${movie.genre.join(", ")}</td>
          <td>${movie.bearHandsRating ?? ""}</td>
          <td>${movie.hubbyBearRating ?? ""}</td>
          <td>${movie.actors.join(", ")}</td>
          <td>${movie.directors.join(", ")}</td>
          <td>${movie.writers.join(", ")}</td>
          <td>${movie.dateWatched}</td>
          <td>${movie.themesKeywords.join(", ")}</td>
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