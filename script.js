let movies = [];
let currentPage = 1;
let rowsPerPage = 100;
let currentSortKey = null;
let currentSortOrder = "asc";

document.addEventListener("DOMContentLoaded", () => {
  fetch("movies.json")
    .then(res => res.json())
    .then(data => {
      movies = data;
      populateFilters(data);
      applyFilters();
    });

  document.querySelectorAll("th").forEach(th => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      if (currentSortKey === key) {
        currentSortOrder = currentSortOrder === "asc" ? "desc" : "asc";
      } else {
        currentSortKey = key;
        currentSortOrder = "asc";
      }
      applyFilters();
    });
  });

  document.querySelectorAll("#controls input, #controls select").forEach(el => {
    el.addEventListener("input", () => {
      currentPage = 1;
      applyFilters();
    });
  });

  document.getElementById("reset-filters").addEventListener("click", () => {
    document.querySelectorAll("#controls input, #controls select").forEach(el => {
      el.value = "";
    });
    currentPage = 1;
    applyFilters();
  });

  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      applyFilters();
    }
  });

  document.getElementById("nextPage").addEventListener("click", () => {
    const totalPages = Math.ceil(filteredMovies.length / rowsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      applyFilters();
    }
  });

  document.getElementById("rows-select").addEventListener("change", e => {
    rowsPerPage = parseInt(e.target.value);
    currentPage = 1;
    applyFilters();
  });
});

function populateFilters(data) {
  const genreSet = new Set();
  const yearSet = new Set();
  const bearSet = new Set();
  const hubbySet = new Set();

  data.forEach(movie => {
    movie.genre.forEach(g => genreSet.add(g));
    yearSet.add(movie.year);
    bearSet.add(movie.bearHandsRating);
    hubbySet.add(movie.hubbyBearRating);
  });

  populateSelect("genre-select", genreSet);
  populateSelect("year-select", yearSet);
  populateSelect("bear-rating-select", bearSet);
  populateSelect("hubby-rating-select", hubbySet);
}

function populateSelect(id, values) {
  const select = document.getElementById(id);
  [...values].sort((a, b) => a - b).forEach(val => {
    const option = document.createElement("option");
    option.value = val;
    option.textContent = val;
    select.appendChild(option);
  });
}

let filteredMovies = [];

function applyFilters() {
  const genre = document.getElementById("genre-select").value;
  const year = document.getElementById("year-select").value;
  const director = document.getElementById("director-filter").value.toLowerCase();
  const writer = document.getElementById("writer-filter").value.toLowerCase();
  const bearRating = document.getElementById("bear-rating-select").value;
  const hubbyRating = document.getElementById("hubby-rating-select").value;
  const actorQuery = document.getElementById("actor-filter").value.toLowerCase();
  const themeQuery = document.getElementById("theme-filter").value.toLowerCase();
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;

  filteredMovies = movies.filter(movie => {
    return (
      (!genre || movie.genre.includes(genre)) &&
      (!year || movie.year == year) &&
      (!bearRating || movie.bearHandsRating == bearRating) &&
      (!hubbyRating || movie.hubbyBearRating == hubbyRating) &&
      (!director || movie.directors.some(d => d.toLowerCase().includes(director))) &&
      (!writer || movie.writers.some(w => w.toLowerCase().includes(writer))) &&
      (!actorQuery || movie.actors.some(a => a.toLowerCase().includes(actorQuery))) &&
      (!themeQuery || movie.themesKeywords.some(t => t.toLowerCase().includes(themeQuery))) &&
      (!startDate || new Date(movie.dateWatched) >= new Date(startDate)) &&
      (!endDate || new Date(movie.dateWatched) <= new Date(endDate))
    );
  });

  if (currentSortKey) {
    filteredMovies.sort((a, b) => {
      const valA = a[currentSortKey];
      const valB = b[currentSortKey];
      if (typeof valA === "string") {
        return currentSortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return currentSortOrder === "asc" ? valA - valB : valB - valA;
    });
  }

  renderTable();
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();

  const suffix =
    day >= 11 && day <= 13
      ? "th"
      : ["st", "nd", "rd"][((day % 10) - 1)] || "th";

  return `${year} ${month} ${day}${suffix}`;
}

function renderTable() {
  const tbody = document.querySelector("#movie-table tbody");
  tbody.innerHTML = "";

  const start = (currentPage - 1) * rowsPerPage;
  const pageMovies = filteredMovies.slice(start, start + rowsPerPage);

  pageMovies.forEach(movie => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${movie.title}</td>
      <td>${movie.year}</td>
      <td>${movie.genre.join(", ")}</td>
      <td>${movie.bearHandsRating}</td>
      <td>${movie.hubbyBearRating}</td>
      <td>${renderExpandableCell(movie.actors)}</td>
      <td>${renderExpandableCell(movie.directors)}</td>
      <td>${renderExpandableCell(movie.writers)}</td>
      <td>${formatDate(movie.dateWatched)}</td>
      <td>${renderExpandableCell(movie.themesKeywords)}</td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById("pageIndicator").textContent = `Page ${currentPage}`;
}

function renderExpandableCell(items) {
  if (!items || items.length === 0) return "";

  const preview = items.slice(0, 3).join(", ");
  const full = items.join(", ");
  const moreCount = items.length - 3;

  return `
    <div class="toggle-wrapper">
      <div class="preview">${preview}${moreCount > 0 ? ` <a href="#" onclick="toggleField(event, this)">+${moreCount} more</a>` : ""}</div>
      <div class="full" style="display:none;">${full} <a href="#" onclick="toggleField(event, this)">Show less</a></div>
    </div>
  `;
}

function toggleField(event, el) {
  event.preventDefault();
  const wrapper = el.closest(".toggle-wrapper");
  const preview = wrapper.querySelector(".preview");
  const full = wrapper.querySelector(".full");

  const isExpanding = preview.style.display !== "none";
  preview.style.display = isExpanding ? "none" : "inline";
  full.style.display = isExpanding ? "inline" : "none";
}