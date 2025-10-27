fetch('movies.json')
  .then(response => response.json())
  .then(movies => {
    const searchBar = document.getElementById("search-bar");
    const tableBody = document.querySelector("#movie-table tbody");
    let currentData = [...movies];

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

    function sortBy(key) {
      const isNumeric = typeof currentData[0][key] === "number";
      currentData.sort((a, b) => {
        if (isNumeric) return a[key] - b[key];
        return String(a[key]).localeCompare(String(b[key]));
      });
      renderTable(currentData);
    }

    document.querySelectorAll("th").forEach(th => {
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
      renderTable(currentData);
    });

    renderTable(currentData);
  });