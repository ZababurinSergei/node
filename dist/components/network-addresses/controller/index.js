// src/components/network-addresses/controller/index.ts
var controller = (context) => {
  let eventListeners = [];
  const addEventListener = (element, event, handler) => {
    element.addEventListener(event, handler);
    eventListeners.push({ element, event, handler });
  };
  const loadSavedTheme = () => {
    const savedTheme = localStorage.getItem("network-addresses-theme");
    if (savedTheme) {
      context.updateElement({
        selector: ".network-addresses",
        value: savedTheme,
        property: "dataset.theme"
      });
    }
  };
  return {
    async init() {
      loadSavedTheme();
      addEventListener(context.shadowRoot, "click", async (e) => {
        const target = e.target;
        if (target.closest(".btn-copy-all")) {
          e.preventDefault();
          await context._actions.copyAllAddresses();
          return;
        }
        if (target.closest(".btn-test-all")) {
          e.preventDefault();
          await context._actions.testAllConnections();
          return;
        }
        if (target.closest(".btn-sync")) {
          e.preventDefault();
          await context._actions.syncWithLibp2p();
          return;
        }
        if (target.closest(".btn-export")) {
          e.preventDefault();
          await context._actions.exportAddresses();
          return;
        }
        if (target.closest(".btn-add-custom")) {
          e.preventDefault();
          await context._actions.toggleAddForm();
          return;
        }
        if (target.closest(".reload-addresses-btn")) {
          e.preventDefault();
          await context._actions.loadAddresses();
          return;
        }
        if (target.closest(".retry-addresses-btn")) {
          e.preventDefault();
          await context._actions.loadAddresses();
          return;
        }
        if (target.closest(".theme-toggle-btn")) {
          e.preventDefault();
          await context._actions.toggleTheme();
          return;
        }
        const actionBtn = target.closest(".action-btn");
        if (actionBtn) {
          e.preventDefault();
          const address = actionBtn.getAttribute("data-address");
          const action = actionBtn.classList.contains("copy-btn") ? "copy" : actionBtn.classList.contains("test-btn") ? "test" : actionBtn.classList.contains("remove-btn") ? "remove" : null;
          if (address && action) {
            switch (action) {
              case "copy":
                await context._actions.copyAddress(address);
                break;
              case "test":
                await context._actions.testConnection(address);
                break;
              case "remove":
                await context._actions.removeAddress(address);
                break;
            }
          }
          return;
        }
        if (target.closest(".address-value")) {
          e.preventDefault();
          const addressElement = target.closest(".address-value");
          const address = addressElement?.textContent?.trim();
          if (address) {
            await context._actions.copyAddress(address);
          }
        }
      });
      addEventListener(context, "keydown", (e) => {
        const keyboardEvent = e;
        if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === "c") {
          e.preventDefault();
          context._actions.copyAllAddresses();
        }
        if (keyboardEvent.ctrlKey && keyboardEvent.key === "r") {
          e.preventDefault();
          context._actions.refreshAddresses();
        }
        if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === "s") {
          e.preventDefault();
          context._actions.syncWithLibp2p();
        }
        if (keyboardEvent.key === "Escape") {
          const activeModal = document.querySelector(".yato-modal-backdrop");
          if (activeModal) {
            activeModal.remove();
          }
        }
      });
      addEventListener(window, "network-addresses:refresh", () => {
        context._actions.refreshAddresses();
      });
      addEventListener(window, "network-addresses:sync", () => {
        context._actions.syncWithLibp2p();
      });
      addEventListener(window, "libp2p:multiaddrs-updated", async (e) => {
        const customEvent = e;
        if (customEvent.detail?.multiaddrs) {
          await context.postMessage({
            type: "UPDATE_ADDRESSES",
            data: {
              addresses: customEvent.detail.multiaddrs,
              source: "libp2p-event"
            }
          });
        }
      });
      addEventListener(document, "visibilitychange", () => {
        if (!document.hidden) {
          setTimeout(() => {
            context._actions.refreshAddresses();
          }, 1e3);
        }
      });
    },
    async destroy() {
      eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      eventListeners = [];
    }
  };
};
export {
  controller
};
//# sourceMappingURL=index.js.map
