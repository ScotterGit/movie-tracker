fetch('movies.json')
  .then(response => response.json())
  .then(movies => {
    const searchBar = document.getElementById("search-bar");
    const tableBody = document.querySelector("#movie-table tbody");
    const headers = document.querySelectorAll("th");
    const sortState = {};
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

      updateArrows(key, direction);
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
      renderTable(currentData);
    });

    renderTable(currentData);
  });