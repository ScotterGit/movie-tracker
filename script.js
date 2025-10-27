fetch('movies.json')
  .then(response => response.json())
  .then(movies => {
    const searchBar = document.getElementById("search-bar");
    const tableBody = document.querySelector("#movie-table tbody");
    const sortState = {}; // Tracks sort direction per column
    let currentData = [...movies]; // Holds filtered/sorted data

    // Renders the table rows
    function renderTable(data) {
      tableBody.innerHTML = data.map(movie => `
        <tr>
          <td><a href="${movie.link}" target="_blank">${movie.title}</a></td>
          <td>${movie.genre}</td>
          <td>${movie.rating}</td>
          <td>${movie.platform}</td>
          <td>${movie.rewatch ? "Yes" : "No"}</td>
        </tr>
      `).join("");
    }

    // Sorts by a given key and toggles direction
    function sortBy(key) {
      const direction = sortState[key] === "asc" ? "desc" : "asc";
      sortState[key] = direction;

      const isNumeric = typeof currentData[0][key] === "number";
      currentData.sort((a, b) => {
        if (isNumeric) {
          return direction === "asc" ? a[key] - b[key] : b[key] - a[key];
        } else {
          return direction === "asc"
            ? String(a[key]).localeCompare(String(b[key]))
            : String(b[key]).localeCompare(String(a[key]));
        }
      });

      renderTable(currentData);
    }

    // Adds click listeners to each header
    document.querySelectorAll("th").forEach(th => {
      th.addEventListener("click", () => {
        const key = th.getAttribute("data-key");
        sortBy(key);
      });
    });

    // Filters data based on search input
    searchBar.addEventListener("input", () => {
      const query = searchBar.value.toLowerCase();
      currentData = movies.filter(movie =>
        Object.values(movie).some(value =>
          Array.isArray(value)
            ? value.join(" ").toLowerCase().includes(query)
            : String(value).toLowerCase().includes(query)
        )
      );
      renderTable(currentData);
    });

    // Initial render
    renderTable(currentData);
  });