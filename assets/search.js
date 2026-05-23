const searchInput = document.getElementById("search");
const posts = document.querySelectorAll(".card");

searchInput?.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();

  posts.forEach(p => {
    const text = p.innerText.toLowerCase();
    p.style.display = text.includes(q) ? "block" : "none";
  });
});
