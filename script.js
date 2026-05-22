const toggle = document.querySelector("#themeToggle");

if(localStorage.getItem("theme") === "dark"){
  document.documentElement.classList.add("dark");
}

toggle.onclick = () => {
  document.documentElement.classList.toggle("dark");

  localStorage.setItem(
    "theme",
    document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  );
};
