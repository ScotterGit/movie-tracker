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
    const bearRatingSelect = document.getElementById("bear-rating-select");
    const hubbyRatingSelect = document.getElementById("hubby-rating-select");
    const actorFilter = document.getElementById("actor-filter");
    const themeFilter = document.getElementById("theme-filter");
    const searchBar = document.getElementById("search-bar");
    const resetButton = document.getElementById("reset-filters");
    const startDateInput = document.getElementById("start-date");
    const endDateInput = document.getElementById("end-date");

    const sortState = {};
    let currentData = [...movies];
    let currentPage = 1;
    let rowsPerPage = parseInt(rowsSelect.value);

[
  genreSelect,
  yearSelect,
  directorSelect,
  writerSelect,
  bearRatingSelect,
  hubbyRatingSelect,
  actorFilter,
  themeFilter,
  searchBar,
  rowsSelect,
  startDateInput,
  endDateInput
].forEach(el => {
  el.addEventListener("input", applyFilters);
  el.addEventListener("change", applyFilters);
});

function formatDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) return ""; // fallback for invalid dates

  const options = { year: "numeric", month: "short", day: "numeric" };
  const parts = date.toLocaleDateString("en-US", options).split(" ");
  const [month, day, year] = parts;

  // Add ordinal suffix to day
  const dayNum = parseInt(day);
  const suffix = (n) => {
    if (n >= 11 && n <= 13) return "th";
    switch (n % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  return `${year}, ${month} ${dayNum}${suffix(dayNum)}`;
}

    function populateDropdown(select, values) {
      const currentValue = select.value;
      select.innerHTML = '<option value="">All</option>';
      [...new Set(values)].sort().forEach(val => {
        const option = document.createElement("option");
        option.value = val;
        option.textContent = val;
        select.appendChild(option);
      });
      select.value = currentValue;
    }

    function updateDropdowns(data) {
      populateDropdown(genreSelect, data.flatMap(m => m.genre));
      populateDropdown(yearSelect, data.map(m => m.year));
      populateDropdown(directorSelect, data.flatMap(m => m.directors));
      populateDropdown(writerSelect, data.flatMap(m => m.writers));
      populateDropdown(bearRatingSelect, data.map(m => m.bearHandsRating).filter(r => r != null));
      populateDropdown(hubbyRatingSelect, data.map(m => m.hubbyBearRating).filter(r => r != null));
    }

    function applyFilters() {
      const genre = genreSelect.value.toLowerCase();
      const year = yearSelect.value;
      const director = directorSelect.value.toLowerCase();
      const writer = writerSelect.value.toLowerCase();
      const bearRating = parseInt(bearRatingSelect.value);
      const hubbyRating = parseInt(hubbyRatingSelect.value);
      const actorQuery = actorFilter.value.toLowerCase();
      const themeQuery = themeFilter.value.toLowerCase();
      const searchQuery = searchBar.value.toLowerCase();
      const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
      const endDate = endDateInput.value ? new Date(endDateInput.value) : null;

      currentData = movies.filter(movie => {
        const matchGenre = genre ? movie.genre.some(g => g.toLowerCase() === genre) : true;
        const matchYear = year ? movie.year == year : true;
        const matchDirector = director ? movie.directors.some(d => d.toLowerCase() === director) : true;
        const matchWriter = writer ? movie.writers.some(w => w.toLowerCase() === writer) : true;
        const matchBear = bearRating ? movie.bearHandsRating === bearRating : true;
        const matchHubby = hubbyRating ? movie.hubbyBearRating === hubbyRating : true;
        const matchActor = actorQuery ? movie.actors.some(a => a.toLowerCase().includes(actorQuery)) : true;
        const matchTheme = themeQuery ? movie.themesKeywords.some(t => t.toLowerCase().includes(themeQuery)) : true;
        const matchDate = (() => {
          if (!startDate && !endDate) return true;
          const watchedDate = new Date(movie.dateWatched);
          if (startDate && watchedDate < startDate) return false;
          if (endDate && watchedDate > endDate) return false;
          return true;
        })();
        const matchSearch = searchQuery
          ? Object.values(movie).some(val => {
              if (Array.isArray(val)) return val.some(v => v.toLowerCase().includes(searchQuery));
              return String(val).toLowerCase().includes(searchQuery);
            })
          : true;

        return matchGenre && matchYear && matchDirector && matchWriter && matchBear && matchHubby && matchActor && matchTheme && matchSearch &&matchDate;
      });

      updateDropdowns(currentData);
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
          <td>
            <span class="actor-preview">
              ${movie.actors.slice(0, 3).join(", ")}
              ${movie.actors.length > 3 ? `<span class="expand-link"> +${movie.actors.length - 3} more</span>` : ""}
            </span>
            <span class="actor-full" style="display:none;">
              ${movie.actors.join(", ")}
              <span class="collapse-link"> Show less</span>
            </span>
          </td>
          <td>${movie.directors.join(", ")}</td>
          <td>${movie.writers.join(", ")}</td>
          <td>${formatDate(movie.dateWatched)}</td>
          <td>${movie.themesKeywords.join(", ")}</td>
        </tr>
      `).join("");

      renderPagination(data.length);
    }

    function toggleActor(el) {
      const td = el.closest("td");
      const preview = td.querySelector(".actor-preview");
      const full = td.querySelector(".actor-full");

      const isExpanding = preview.style.display !== "none";
      preview.style.display = isExpanding ? "none" : "block";
      full.style.display = isExpanding ? "block" : "none";
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

    resetButton.addEventListener("click", () => {
      genreSelect.value = "";
      yearSelect.value = "";
      directorSelect.value = "";
      writerSelect.value = "";
      bearRatingSelect.value = "";
      hubbyRatingSelect.value = "";
      actorFilter.value = "";
      themeFilter.value = "";
      searchBar.value = "";
      startDateInput.value = "";
      endDateInput.value = "";

      Object.keys(sortState).forEach(key => delete sortState[key]);
      currentPage = 1;
      currentData = [...movies];

      updateDropdowns(movies);
      renderTable(currentData);
      updateArrows("", "");
      window.scrollTo({ top: 0, behavior: "smooth" });
      searchBar.focus();
    });

    updateDropdowns(movies);
    renderTable(currentData);
  });

  document.addEventListener("click", function(e) {
  if (e.target.classList.contains("expand-link") || e.target.classList.contains("collapse-link")) {
    const td = e.target.closest("td");
    const preview = td.querySelector(".actor-preview");
    const full = td.querySelector(".actor-full");

    const isExpanding = e.target.classList.contains("expand-link");
    preview.style.display = isExpanding ? "none" : "block";
    full.style.display = isExpanding ? "block" : "none";
  }
});
