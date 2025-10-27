fetch('movies.json')
  .then(response => response.json())
  .then(movies => {
    const searchBar = document.getElementById("search-bar");
    const resultsDiv = document.getElementById("results");

    function renderResults(filtered) {
      resultsDiv.innerHTML = filtered.map(movie => `
        <div class="movie-card">
          <h3><a href="${movie.link}" target="_blank">${movie.title}</a></h3>
          <p><strong>Genre:</strong> ${movie.genre}</p>
          <p><strong>Rating:</strong> ${movie.rating}</p>
          <p>${movie.review}</p>
          <p><strong>Tags:</strong> ${movie.tags.join(", ")}</p>
        </div>
      `).join("");
    }

    searchBar.addEventListener("input", () => {
      const query = searchBar.value.toLowerCase();
      const filtered = movies.filter(movie =>
        Object.values(movie).some(value =>
          Array.isArray(value)
            ? value.join(" ").toLowerCase().includes(query)
            : String(value).toLowerCase().includes(query)
        )
      );
      renderResults(filtered);
    });

    renderResults(movies); // initial render
  });