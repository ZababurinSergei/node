// src/scroll/index.mjs
var ScrollManager = class {
  constructor() {
    this.scrollTimeout = null;
    this.isScrolling = false;
    this.debounceDelay = 200;
    this.init();
  }
  init() {
    document.addEventListener("scroll", () => {
      this.handleScrollStart();
    }, { passive: false });
    this.checkScrollNecessity();
  }
  handleScrollStart() {
    if (!this.isScrolling) {
      this.isScrolling = true;
      document.documentElement.classList.add("scrolling");
    }
    this.clearTimeout();
    this.scrollTimeout = setTimeout(() => {
      this.handleScrollEnd();
    }, this.debounceDelay);
  }
  handleScrollEnd() {
    this.isScrolling = false;
    document.documentElement.classList.remove("scrolling");
  }
  clearTimeout() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
  }
  checkScrollNecessity() {
    const hasScrollbar = document.documentElement.scrollHeight > window.innerHeight;
    if (!hasScrollbar) {
      document.documentElement.style.setProperty("--scrollbar-visibility", "hidden");
      document.documentElement.style.setProperty("--scrollbar-opacity", "0");
    }
  }
  // Метод для принудительного показа/скрытия
  showScrollbar() {
    document.documentElement.classList.add("scrolling");
  }
  hideScrollbar() {
    document.documentElement.classList.remove("scrolling");
  }
  // Обновить настройки
  updateSettings(delay = 1500) {
    this.debounceDelay = delay;
  }
};
export {
  ScrollManager
};
//# sourceMappingURL=index.js.map
