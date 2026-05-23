const themes = ["dark", "light", "terminal"];

function setTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem("theme", t);
}

function cycleTheme() {
  let current = localStorage.getItem("theme") || "dark";
  let next = themes[(themes.indexOf(current) + 1) % themes.length];
  setTheme(next);
}

window.addEventListener("load", () => {
  setTheme(localStorage.getItem("theme") || "dark");
});
