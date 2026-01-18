// src/components/bootstrap-address/controller/index.ts
var controller = (context) => {
  let eventListeners = [];
  const addEventListener = (element, event, handler) => {
    element.addEventListener(event, handler);
    eventListeners.push({ element, event, handler });
  };
  return {
    async init() {
      addEventListener(context.shadowRoot, "click", async (e) => {
        const target = e.target;
        if (target.closest(".btn-copy-all")) {
          e.preventDefault();
          await context._actions.handleCopyAllAddresses();
          return;
        }
        if (target.closest(".btn-test")) {
          e.preventDefault();
          await context._actions.handleTestAllConnections();
          return;
        }
        if (target.closest(".btn-sync")) {
          e.preventDefault();
          await context._actions.handleSyncWithLibp2p();
          return;
        }
        if (target.closest(".btn-add-custom")) {
          e.preventDefault();
          await context._actions.handleToggleAddForm();
          return;
        }
        if (target.closest(".btn-cancel-form")) {
          e.preventDefault();
          await context._actions.handleToggleAddForm();
          return;
        }
        if (target.closest("#copyPrimaryBtn")) {
          e.preventDefault();
          await context._actions.handleCopyPrimaryAddress();
          return;
        }
        const actionBtn = target.closest(".action-btn");
        if (actionBtn) {
          e.preventDefault();
          const address = actionBtn.getAttribute("data-address");
          const action = actionBtn.classList.contains("copy-btn") ? "copy" : actionBtn.classList.contains("test-btn") ? "test" : actionBtn.classList.contains("remove-btn") ? "remove" : null;
          if (address && action) {
            await context._actions.handleSingleAddressAction(action, address);
          }
          return;
        }
        if (target.closest(".address-value") || target.closest(".secondary-address")) {
          e.preventDefault();
          const addressElement = target.closest(".address-value") || target.closest(".secondary-address");
          const address = addressElement?.textContent?.trim();
          if (address) {
            await context._actions.handleSingleAddressAction("copy", address);
          }
        }
      });
      addEventListener(context.shadowRoot, "submit", async (e) => {
        const target = e.target;
        if (target.id === "addAddressForm") {
          e.preventDefault();
          const formData = new FormData(target);
          await context._actions.handleFormSubmit(formData);
        }
      });
      addEventListener(context, "keydown", (e) => {
        const keyboardEvent = e;
        if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === "c") {
          e.preventDefault();
          context._actions.handleCopyAllAddresses();
        }
        if (keyboardEvent.ctrlKey && keyboardEvent.key === "r") {
          e.preventDefault();
          context._actions.handleRefreshAddresses();
        }
        if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === "s") {
          e.preventDefault();
          context._actions.handleSyncWithLibp2p();
        }
        if (keyboardEvent.key === "Escape") {
          const state = context.getState();
          if (state.showAddForm) {
            context._actions.handleToggleAddForm();
          }
        }
      });
      addEventListener(window, "bootstrap-address:refresh", () => {
        context._actions.handleRefreshAddresses();
      });
      addEventListener(window, "bootstrap-address:sync", () => {
        context._actions.handleSyncWithLibp2p();
      });
      addEventListener(window, "libp2p:multiaddrs-updated", async (e) => {
        const customEvent = e;
        if (customEvent.detail?.multiaddrs) {
          await context._actions.handleAddressUpdate(
            customEvent.detail.multiaddrs,
            "libp2p-event"
          );
        }
      });
      addEventListener(document, "visibilitychange", () => {
        if (!document.hidden) {
          setTimeout(() => {
            context._actions.handleRefreshAddresses();
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
