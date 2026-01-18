// src/components/peers-manager/controller/index.ts
var controller = (context) => {
  let eventListeners = [];
  const addEventListener = (element, event, handler, options = {}) => {
    element.addEventListener(event, handler, options);
    eventListeners.push({ element, event, handler, options });
  };
  return {
    async init() {
      try {
        addEventListener(context.shadowRoot, "click", (e) => {
          const target = e.target;
          const actionElement = target.closest("[data-action]");
          if (actionElement) {
            e.preventDefault();
            e.stopPropagation();
            const action = actionElement.getAttribute("data-action");
            const peerId2 = actionElement.getAttribute("data-peer-id");
            if (!action) return;
            switch (action) {
              case "refresh-peers":
                context.refreshPeers();
                break;
              case "get-all-peers":
                context._actions.loadAllPeers();
                break;
              case "get-blocked-peers":
                context.getBlockedPeers();
                break;
              case "get-ping-status":
                context.getPingStatus();
                break;
              case "disconnect-all-peers":
                context.disconnectAllPeers();
                break;
              case "clear-search":
                context.clearSearch();
                break;
              case "copy-peer-id":
                if (peerId2) {
                  navigator.clipboard.writeText(peerId2).then(() => {
                    console.log("Peer ID copied to clipboard");
                  });
                }
                break;
            }
          }
          const peerItem = target.closest(".peer-item");
          if (!peerItem) return;
          const peerId = peerItem.getAttribute("data-peer-id");
          if (!peerId) return;
          if (target.classList.contains("peer-btn-info")) {
            context.getSpecificPeerInfo(peerId);
          } else if (target.classList.contains("peer-btn-ping")) {
            context.pingSpecificPeer(peerId);
          } else if (target.classList.contains("peer-btn-disconnect")) {
            context.disconnectSpecificPeer(peerId);
          } else if (target.classList.contains("peer-btn-block")) {
            context._actions.blockPeer(peerId);
          } else if (target.classList.contains("peer-btn-unblock")) {
            context._actions.unblockPeer(peerId);
          } else if (target.classList.contains("peer-btn-auto-ping-start")) {
            context.startAutoPing(peerId);
          } else if (target.classList.contains("peer-btn-auto-ping-stop")) {
            context.stopAutoPing(peerId);
          }
        });
        addEventListener(context.shadowRoot, "input", (e) => {
          const target = e.target;
          if (target.id === "peer-search-input") {
            context.handleSearchInput(e);
          }
        });
        addEventListener(document, "keydown", (e) => {
          const keyboardEvent = e;
          if (keyboardEvent.ctrlKey && keyboardEvent.key === "r") {
            e.preventDefault();
            context.refreshPeers();
          }
          if (keyboardEvent.key === "Escape") {
            const searchInput = context.shadowRoot?.querySelector("#peer-search-input");
            if (searchInput && searchInput.value) {
              searchInput.value = "";
              context.clearSearch();
            }
          }
          if (keyboardEvent.key === "/" && !keyboardEvent.ctrlKey && !keyboardEvent.altKey) {
            e.preventDefault();
            const searchInput = context.shadowRoot?.querySelector("#peer-search-input");
            if (searchInput) {
              searchInput.focus();
            }
          }
        });
        addEventListener(document, "visibilitychange", () => {
          const autoRefresh2 = context.getAttribute("data-auto-refresh") === "true";
          if (autoRefresh2 && !document.hidden) {
            setTimeout(() => {
              context.refreshPeers();
            }, 1e3);
          }
        });
        addEventListener(window, "peers-updated", () => {
          context.refreshPeers();
        });
        addEventListener(window, "libp2p:peers-updated", async (e) => {
          const detail = e.detail;
          if (detail?.peers) {
            await context.postMessage({
              type: "UPDATE_FROM_LIBP2P",
              data: { peers: detail.peers }
            });
          }
        });
        const autoRefresh = context.getAttribute("data-auto-refresh") === "true";
        if (autoRefresh) {
          setTimeout(() => {
            context.refreshPeers();
          }, 2e3);
        }
      } catch (error) {
        console.error("Error initializing peers manager controller:", error);
        context.addError({
          componentName: "PeersManager",
          source: "controller.init",
          message: "Failed to initialize controller",
          details: error
        });
      }
    },
    async destroy() {
      eventListeners.forEach(({ element, event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
      eventListeners = [];
    },
    // Вспомогательные методы для тестирования
    getEventListeners() {
      return [...eventListeners];
    }
  };
};
export {
  controller
};
//# sourceMappingURL=index.js.map
