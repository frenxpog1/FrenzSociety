import {
  zoomWorld,
  resetCamera,
  toggleLabels,
  toggleInteriors,
  focusBuilding,
  stopFollowing,
  cancelConstruction,
} from "./world.js";
export function openPanel(name) {
  const drawer = document.querySelector("#drawer");
  drawer.hidden = false;
  document
    .querySelectorAll("[data-content]")
    .forEach((el) => (el.hidden = el.dataset.content !== name));
  document.querySelectorAll("[data-panel]").forEach((el) => {
    el.classList.toggle("active", el.dataset.panel === name);
    el.setAttribute("aria-expanded", String(el.dataset.panel === name));
  });
  document.querySelector("#drawerTitle").textContent = {
    person: "Resident profile",
    building: "Building profile",
    residents: "Residents",
    town: "Town almanac",
    build: "Expand your town",
    journal: "Town journal",
    settings: "Settings",
  }[name];
  drawer.dataset.open = name;
  drawer.scrollTop = 0;
}
export function initUI(state) {
  const drawer = document.querySelector("#drawer");
  document.querySelectorAll("[data-panel]").forEach((button) =>
    button.addEventListener("click", () => {
      cancelConstruction();
      if (!drawer.hidden && drawer.dataset.open === button.dataset.panel)
        close();
      else openPanel(button.dataset.panel);
    }),
  );
  function close() {
    drawer.hidden = true;
    document.querySelectorAll("[data-panel]").forEach((el) => {
      el.classList.remove("active");
      el.setAttribute("aria-expanded", "false");
    });
  }
  document.querySelector("#closeDrawer").addEventListener("click", close);
  document
    .querySelector("#zoomIn")
    .addEventListener("click", () => zoomWorld(1.2));
  document
    .querySelector("#zoomOut")
    .addEventListener("click", () => zoomWorld(1 / 1.2));
  document.querySelector("#resetCamera").addEventListener("click", resetCamera);
  document
    .querySelector("#toggleLabels")
    .addEventListener("click", (e) =>
      e.currentTarget.setAttribute("aria-pressed", String(toggleLabels())),
    );
  document
    .querySelector("#toggleInteriors")
    .addEventListener("click", (e) =>
      e.currentTarget.setAttribute("aria-pressed", String(toggleInteriors())),
    );
  document.querySelectorAll("[data-visit]").forEach((button) =>
    button.addEventListener("click", () => {
      cancelConstruction();
      close();
      focusBuilding(button.dataset.visit);
    }),
  );
  document
    .querySelector("#stopFollowing")
    .addEventListener("click", stopFollowing);
  document
    .querySelector("#townPulse")
    .addEventListener("click", () => openPanel("journal"));
  document.addEventListener("keydown", (e) => {
    if (e.key === 'Escape') { cancelConstruction(); close(); stopFollowing(); }
    if (e.target.closest("input,select,textarea,button")) return;
    if (
      e.code === "Space" &&
      document.querySelector("#eventModal").hidden &&
      document.querySelector("#friendModal").hidden
    ) {
      e.preventDefault();
      document.querySelector("#toggleRun").click();
    }
    if (e.key === "Escape") {
      close();
      stopFollowing();
    }
  });
  const update = () =>
    (document.querySelector("#runStatus").textContent = state.running
      ? "Town is alive"
      : "Time is paused");
  new MutationObserver(update).observe(document.querySelector("#toggleRun"), {
    childList: true,
  });
  update();
}
