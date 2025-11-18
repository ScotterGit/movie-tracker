let movies = [];
let currentPage = 1;
const itemsPerPage = 10;
let sortColumn = null;
let sortDirection = 'asc';

document.addEventListener('DOMContentLoaded', () => {
  fetch('movies.json')
    .then(res => res.json())
    .then(data => {
      movies = data;
      renderTable();
      setupFilters();
      setupSorting();
      setupReset();
      setupGlobalSearch();
    });
});

function renderTable() {
  const tableBody = document.getElementById('table-body');
  tableBody.innerHTML = '';

  const filtered = applyFilters(movies);
  const sorted = applySorting(filtered);
  const paginated = paginate(sorted);

  paginated.forEach(movie => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${movie.title}</td>
      <td>${movie.year}</td>
      <td>${movie.genre.join(', ')}</td>
      <td>${movie.bearHandsRating}</td>
      <td>${movie.hubbyBearRating}</td>
      <td>${formatExpandable(movie.actors)}</td>
      <td>${movie.directors.join(', ')}</td>
      <td>${movie.writers.join(', ')}</td>
      <td>${formatExpandable(movie.production)}</td>
      <td>${movie.dateWatched}</td>
      <td>${movie.themesKeywords.join(', ')}</td>
    `;
    tableBody.appendChild(row);
  });

  renderPagination(filtered.length);
}

function formatExpandable(list) {
  if (!list || list.length === 0) return '';
  const visible = list.slice(0, 3).join(', ');
  const hidden = list.slice(3).join(', ');
  if (list.length <= 3) return visible;
  return `
    ${visible}
    <span class="more-toggle" onclick="this.nextElementSibling.style.display='inline'; this.style.display='none';"> +more</span>
    <span class="hidden-items" style="display:none;">, ${hidden}</span>
  `;
}

function applyFilters(data) {
  return data.filter(movie => {
    return (
      match(movie.title, 'search-title') &&
      match(movie.year, 'search-year') &&
      matchArray(movie.genre, 'search-genre') &&
      match(movie.bearHandsRating, 'search-bear') &&
      match(movie.hubbyBearRating, 'search-hubby') &&
      matchArray(movie.actors, 'search-actors') &&
      matchArray(movie.directors, 'search-directors') &&
      matchArray(movie.writers, 'search-writers') &&
      matchArray(movie.production, 'search-production') &&
      match(movie.dateWatched, 'search-date') &&
      matchArray(movie.themesKeywords, 'search-themes')
    );
  });
}

function match(value, inputId) {
  const input = document.getElementById(inputId);
  if (!input || !input.value.trim()) return true;
  return String(value).toLowerCase().includes(input.value.trim().toLowerCase());
}

function matchArray(arr, inputId) {
  const input = document.getElementById(inputId);
  if (!input || !input.value.trim()) return true;
  return arr.some(item => item.toLowerCase().includes(input.value.trim().toLowerCase()));
}

function applySorting(data) {
  if (!sortColumn) return data;
  return [...data].sort((a, b) => {
    const valA = a[sortColumn];
    const valB = b[sortColumn];
    const aVal = Array.isArray(valA) ? valA.join(', ') : valA;
    const bVal = Array.isArray(valB) ? valB.join(', ') : valB;
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
  document.querySelectorAll('.search-row input').forEach(input => {
    input.addEventListener('input', () => {
      currentPage = 1;
      renderTable();
    });
  });
}

function setupReset() {
  document.getElementById('reset-filters').addEventListener('click', () => {
    document.querySelectorAll('.search-row input, #global-search').forEach(input => input.value = '');
    currentPage = 1;
    renderTable();
    document.getElementById('global-search').focus();
  });
}

function setupGlobalSearch() {
  const globalInput = document.getElementById('global-search');
  globalInput.addEventListener('input', () => {
    const query = globalInput.value.trim().toLowerCase();
    document.querySelectorAll('.search-row input').forEach(input => {
      input.value = query;
    });
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
  pagination.innerHTML = '';
  const totalPages = Math.ceil(totalItems / itemsPerPage);
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