let movies = [];
let currentPage = 1;
let itemsPerPage = 100;
let sortColumn = null;
let sortDirection = 'asc';

document.addEventListener('DOMContentLoaded', () => {
  fetch('movies.json')
    .then(res => res.json())
    .then(data => {
      movies = data;
      populateDropdowns(data);
      renderTable();
      setupFilters();
      setupSorting();
      setupReset();
      setupGlobalSearch();
      setupPageSize();
    })
    .catch(err => {
      console.error('Failed to load movies.json', err);
    });
});

function populateDropdowns(data) {
  const yearSet = new Set();
  const genreSet = new Set();
  const bearSet = new Set();
  const hubbySet = new Set();

  data.forEach(movie => {
    if (movie.year != null) yearSet.add(movie.year);
    if (Array.isArray(movie.genre)) movie.genre.forEach(g => { if (g != null) genreSet.add(g); });
    if (movie.bearHandsRating != null) bearSet.add(movie.bearHandsRating);
    if (movie.hubbyBearRating != null) hubbySet.add(movie.hubbyBearRating);
  });

  populateSelect('year-select', [...yearSet].sort((a, b) => {
    // numeric sort when possible
    const na = Number(a), nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return nb - na;
    return String(b).localeCompare(String(a));
  }));

  populateSelect('genre-select', [...genreSet].sort((a, b) => String(a).localeCompare(String(b))));

  populateSelect('bear-rating-select', [...bearSet].sort((a, b) => {
    const na = Number(a), nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return nb - na;
    return String(a).localeCompare(String(b));
  }));

  populateSelect('hubby-rating-select', [...hubbySet].sort((a, b) => {
    const na = Number(a), nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return nb - na;
    return String(a).localeCompare(String(b));
  }));
}

function populateSelect(id, values) {
  const select = document.getElementById(id);
  if (!select) return;
  // clear existing options but keep the default "All" at top
  select.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'All';
  select.appendChild(defaultOption);

  values.forEach(val => {
    const option = document.createElement('option');
    option.value = val;
    option.textContent = val;
    select.appendChild(option);
  });
}

function renderTable() {
  const tableBody = document.getElementById('table-body');
  tableBody.innerHTML = '';

  const filtered = applyFilters(movies);
  const sorted = applySorting(filtered);
  const paginated = paginate(sorted);

  paginated.forEach(movie => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(movie.title)}</td>
      <td>${escapeHtml(movie.year)}</td>
      <td>${escapeHtmlArray(movie.genre)}</td>
      <td>${escapeHtml(movie.bearHandsRating)}</td>
      <td>${escapeHtml(movie.hubbyBearRating)}</td>
      <td>${formatExpandable(movie.actors)}</td>
      <td>${escapeHtmlArray(movie.directors)}</td>
      <td>${escapeHtmlArray(movie.writers)}</td>
      <td>${formatExpandable(movie.production)}</td>
      <td>${escapeHtml(movie.dateWatched)}</td>
      <td>${escapeHtmlArray(movie.themesKeywords)}</td>
    `;
    tableBody.appendChild(row);
  });

  renderPagination(filtered.length);
}

function escapeHtml(val) {
  if (val == null) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlArray(arr) {
  if (!Array.isArray(arr)) return '';
  return arr.map(escapeHtml).join(', ');
}

function formatExpandable(list) {
  if (!list || list.length === 0) return '';
  const visible = list.slice(0, 3).map(escapeHtml).join(', ');
  const hidden = list.slice(3).map(escapeHtml).join(', ');
  if (list.length <= 3) return visible;
  return `
    ${visible}
    <span class="more-toggle" onclick="this.nextElementSibling.style.display='inline'; this.style.display='none';"> +more</span>
    <span class="hidden-items" style="display:none;">, ${hidden}</span>
  `;
}

function applyFilters(data) {
  const watchedAfter = document.getElementById('watched-after')?.value;
  const watchedBefore = document.getElementById('watched-before')?.value;

  return data.filter(movie => {
    return (
      match(movie.title, 'search-title') &&
      matchSelect(movie.year, 'year-select') &&
      matchSelectArray(movie.genre, 'genre-select') &&
      matchSelect(movie.bearHandsRating, 'bear-rating-select') &&
      matchSelect(movie.hubbyBearRating, 'hubby-rating-select') &&
      matchArray(movie.actors, 'search-actors') &&
      matchArray(movie.directors, 'search-directors') &&
      matchArray(movie.writers, 'search-writers') &&
      matchArray(movie.production, 'search-production') &&
      matchArray(movie.themesKeywords, 'search-themes') &&
      matchDateRange(movie.dateWatched, watchedAfter, watchedBefore)
    );
  });
}

function match(value, inputId) {
  const input = document.getElementById(inputId);
  if (!input || !input.value.trim()) return true;
  return String(value || '').toLowerCase().includes(input.value.trim().toLowerCase());
}

function matchArray(arr, inputId) {
  const input = document.getElementById(inputId);
  if (!input || !input.value.trim()) return true;
  if (!Array.isArray(arr)) return false;
  return arr.some(item => String(item || '').toLowerCase().includes(input.value.trim().toLowerCase()));
}

function matchSelect(value, selectId) {
  const select = document.getElementById(selectId);
  if (!select || !select.value) return true;
  return String(value) === select.value;
}

function matchSelectArray(arr, selectId) {
  const select = document.getElementById(selectId);
  if (!select || !select.value) return true;
  if (!Array.isArray(arr)) return false;
  return arr.includes(select.value);
}

function matchDateRange(dateStr, after, before) {
  if (!dateStr) return true;
  const date = new Date(dateStr);
  if (after) {
    const a = new Date(after);
    if (date < a) return false;
  }
  if (before) {
    const b = new Date(before);
    if (date > b) return false;
  }
  return true;
}

function applySorting(data) {
  if (!sortColumn) return data;
  return [...data].sort((a, b) => {
    const valA = a[sortColumn];
    const valB = b[sortColumn];
    const aVal = Array.isArray(valA) ? valA.join(', ') : (valA == null ? '' : String(valA));
    const bVal = Array.isArray(valB) ? valB.join(', ') : (valB == null ? '' : String(valB));
    // try numeric compare first
    const na = Number(aVal), nb = Number(bVal);
    if (!isNaN(na) && !isNaN(nb)) {
      return sortDirection === 'asc' ? na - nb : nb - na;
    }
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}

function setupSorting() {
  document.querySelectorAll('.header-row th').forEach(th => {
    th.addEventListener('click', () => {
      const column = th.getAttribute('data-sort');
      if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = column;
        sortDirection = 'asc';
      }
      renderTable();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function setupFilters() {
  document.querySelectorAll('.search-row input, .search-row select').forEach(el => {
    el.addEventListener('input', () => {
      currentPage = 1;
      renderTable();
    });
    el.addEventListener('change', () => {
      currentPage = 1;
      renderTable();
    });
  });
}

function setupReset() {
  const resetBtn = document.getElementById('reset-filters');
  if (!resetBtn) return;
  resetBtn.addEventListener('click', () => {
    document.querySelectorAll('.search-row input, .search-row select, #global-search').forEach(el => {
      el.value = '';
    });
    currentPage = 1;
    renderTable();
    document.getElementById('global-search')?.focus();
  });
}

function setupGlobalSearch() {
  const globalInput = document.getElementById('global-search');
  if (!globalInput) return;
  globalInput.addEventListener('input', () => {
    const query = globalInput.value.trim().toLowerCase();
    document.querySelectorAll('.search-row input').forEach(input => {
      input.value = query;
    });
    currentPage = 1;
    renderTable();
  });
}

function setupPageSize() {
  const selector = document.getElementById('page-size');
  if (!selector) return;
  selector.addEventListener('change', () => {
    itemsPerPage = parseInt(selector.value, 10) || 100;
    currentPage = 1;
    renderTable();
  });
}

function paginate(data) {
  const start = (currentPage - 1) * itemsPerPage;
  return data.slice(start, start + itemsPerPage);
}

function renderPagination(totalItems) {
  const pagination = document.getElementById('pagination');
  const pageDisplay = document.getElementById('page-display');
  if (!pagination || !pageDisplay) return;

  pagination.innerHTML = '';

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  if (currentPage > totalPages) currentPage = totalPages;

  pageDisplay.textContent = `Page ${currentPage} of ${totalPages}`;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = i === currentPage ? 'active' : '';
    btn.addEventListener('click', () => {
      currentPage = i;
      renderTable();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    pagination.appendChild(btn);
  }
}