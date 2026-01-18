// src/components/node-identity/actions/index.ts
var controller = (context) => {
  let eventListeners = [];
  let refreshInterval = null;
  let uptimeInterval = null;
  const addEventListener = (element, event, handler) => {
    element.addEventListener(event, handler);
    eventListeners.push({ element, event, handler });
  };
  const setupAutoRefresh = () => {
    const autoRefresh = context.getAttribute("data-auto-refresh") === "true";
    if (!autoRefresh) return;
    const interval = parseInt(context.getAttribute("data-refresh-interval") || "30000", 10);
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    refreshInterval = window.setInterval(async () => {
      try {
        await context.refreshData("auto-refresh");
      } catch (error) {
        console.error("Error in auto refresh:", error);
      }
    }, interval);
  };
  const stopAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  };
  const setupUptimeCounter = () => {
    if (uptimeInterval) {
      clearInterval(uptimeInterval);
    }
    uptimeInterval = setInterval(async () => {
      try {
        const state = context.getState();
        if (state.uptime && typeof state.uptime === "string") {
          const uptime = state.uptime;
          let seconds = 0;
          const daysMatch = uptime.match(/(\d+)d/);
          if (daysMatch) {
            const days = parseInt(daysMatch[1] || "0");
            const hoursMatch = uptime.match(/(\d+)h/);
            const hours = hoursMatch ? parseInt(hoursMatch[1] || "0") : 0;
            seconds = days * 86400 + hours * 3600;
          } else {
            const hoursMatch = uptime.match(/(\d+)h/);
            if (hoursMatch) {
              const hours = parseInt(hoursMatch[1] || "0");
              const minutesMatch = uptime.match(/(\d+)m/);
              const minutes = minutesMatch ? parseInt(minutesMatch[1] || "0") : 0;
              seconds = hours * 3600 + minutes * 60;
            } else {
              const minutesMatch = uptime.match(/(\d+)m/);
              if (minutesMatch) {
                const minutes = parseInt(minutesMatch[1] || "0");
                const secsMatch = uptime.match(/(\d+)s/);
                const secs = secsMatch ? parseInt(secsMatch[1] || "0") : 0;
                seconds = minutes * 60 + secs;
              } else {
                const secsMatch = uptime.match(/(\d+)s/);
                if (secsMatch) {
                  seconds = parseInt(secsMatch[1] || "0");
                }
              }
            }
          }
          seconds++;
          if (seconds % 5 === 0) {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor(seconds % 86400 / 3600);
            const minutes = Math.floor(seconds % 3600 / 60);
            const secs = seconds % 60;
            let newUptime = "";
            if (days > 0) newUptime = `${days}d ${hours}h`;
            else if (hours > 0) newUptime = `${hours}h ${minutes}m`;
            else if (minutes > 0) newUptime = `${minutes}m ${secs}s`;
            else newUptime = `${secs}s`;
            await context.updateElement({
              selector: ".uptime",
              value: newUptime,
              property: "textContent"
            });
          }
        }
      } catch (error) {
        console.error("Error updating uptime:", error);
      }
    }, 1e3);
  };
  const stopUptimeCounter = () => {
    if (uptimeInterval) {
      clearInterval(uptimeInterval);
      uptimeInterval = null;
    }
  };
  const handleRefreshClick = async () => {
    await context.refreshData("manual");
  };
  const handleCopyPeerId = async () => {
    await context.copyPeerId();
  };
  const handleToggleDetails = async () => {
    const showDetailsAttr = context.getAttribute("data-show-details");
    const newValue = showDetailsAttr === "true" ? "false" : "true";
    context.setAttribute("data-show-details", newValue);
  };
  const setupKeyboardShortcuts = () => {
    addEventListener(document, "keydown", (e) => {
      const keyboardEvent = e;
      if (keyboardEvent.ctrlKey && keyboardEvent.key === "r" && !keyboardEvent.shiftKey) {
        e.preventDefault();
        handleRefreshClick();
      }
      if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === "c") {
        e.preventDefault();
        handleCopyPeerId();
      }
      if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === "d") {
        e.preventDefault();
        handleToggleDetails();
      }
      if (keyboardEvent.key === "Escape") {
        const modal = document.querySelector(".yato-modal-backdrop");
        if (modal) {
          modal.remove();
        }
      }
    });
  };
  const setupExternalEvents = () => {
    addEventListener(window, "libp2p:peerIdUpdated", (e) => {
      const customEvent = e;
      if (customEvent.detail?.peerId) {
        context.postMessage({
          type: "UPDATE_PEER_ID",
          data: { peerId: customEvent.detail.peerId }
        }).catch((error) => {
          console.error("Error updating peer ID from event:", error);
        });
      }
    });
    addEventListener(window, "libp2p:statusChanged", (e) => {
      const customEvent = e;
      if (customEvent.detail?.status) {
        context.postMessage({
          type: "UPDATE_STATUS",
          data: { status: customEvent.detail.status }
        }).catch((error) => {
          console.error("Error updating status from event:", error);
        });
      }
    });
    addEventListener(document, "visibilitychange", () => {
      if (document.hidden) {
        stopAutoRefresh();
        stopUptimeCounter();
      } else {
        setupAutoRefresh();
        setupUptimeCounter();
      }
    });
    addEventListener(window, "node-identity:refresh", () => {
      handleRefreshClick();
    });
    addEventListener(window, "node-identity:copy", () => {
      handleCopyPeerId();
    });
    addEventListener(window, "node-identity:toggle-details", () => {
      handleToggleDetails();
    });
    addEventListener(window, "online", () => {
      context.addLog("Network connection restored", "info");
    });
    addEventListener(window, "offline", () => {
      context.addLog("Network connection lost", "warn");
    });
  };
  const setupContextMenu = () => {
    addEventListener(context.shadowRoot, "contextmenu", (e) => {
      const target = e.target;
      if (target.classList.contains("peer-id") || target.closest(".identity-value-container")) {
        e.preventDefault();
        const menu = document.createElement("div");
        menu.className = "context-menu";
        menu.style.cssText = `
                    position: fixed;
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: var(--radius);
                    box-shadow: var(--shadow-lg);
                    z-index: 10000;
                    min-width: 200px;
                    padding: 8px 0;
                `;
        const copyItem = document.createElement("div");
        copyItem.className = "context-menu-item";
        copyItem.textContent = "Copy Peer ID";
        copyItem.style.cssText = `
                    padding: 8px 16px;
                    cursor: pointer;
                    transition: var(--transition);
                `;
        copyItem.onmouseover = () => {
          copyItem.style.background = "var(--surface-100)";
        };
        copyItem.onmouseout = () => {
          copyItem.style.background = "transparent";
        };
        copyItem.onclick = async () => {
          menu.remove();
          await handleCopyPeerId();
        };
        const refreshItem = document.createElement("div");
        refreshItem.className = "context-menu-item";
        refreshItem.textContent = "Refresh Data";
        refreshItem.style.cssText = `
                    padding: 8px 16px;
                    cursor: pointer;
                    transition: var(--transition);
                `;
        refreshItem.onmouseover = () => {
          refreshItem.style.background = "var(--surface-100)";
        };
        refreshItem.onmouseout = () => {
          refreshItem.style.background = "transparent";
        };
        refreshItem.onclick = async () => {
          menu.remove();
          await handleRefreshClick();
        };
        menu.appendChild(copyItem);
        menu.appendChild(refreshItem);
        const rect = target.getBoundingClientRect();
        menu.style.left = `${rect.left}px`;
        menu.style.top = `${rect.bottom + 5}px`;
        document.body.appendChild(menu);
        const closeMenu = (event) => {
          if (!menu.contains(event.target)) {
            menu.remove();
            document.removeEventListener("click", closeMenu);
          }
        };
        setTimeout(() => {
          document.addEventListener("click", closeMenu);
        }, 0);
      }
    });
  };
  return {
    async init() {
      addEventListener(context.shadowRoot, "click", async (e) => {
        const target = e.target;
        const button = target.closest("button[data-action]");
        if (!button) return;
        const action = button.getAttribute("data-action");
        switch (action) {
          case "refresh":
            await handleRefreshClick();
            break;
          case "copy-peer-id":
            await handleCopyPeerId();
            break;
          case "toggle-details":
            await handleToggleDetails();
            break;
        }
      });
      addEventListener(context.shadowRoot, "dblclick", (e) => {
        const target = e.target;
        if (target.closest(".card-header") || target.closest(".card-title")) {
          handleRefreshClick();
        }
      });
      setupAutoRefresh();
      setupUptimeCounter();
      setupKeyboardShortcuts();
      setupExternalEvents();
      setupContextMenu();
      await context.updateElement({
        selector: ".btn-copy",
        value: false,
        property: "disabled"
      });
      await context.updateElement({
        selector: ".btn-toggle-details",
        value: false,
        property: "disabled"
      });
    },
    async destroy() {
      stopAutoRefresh();
      stopUptimeCounter();
      eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      eventListeners = [];
      const contextMenu = document.querySelector(".context-menu");
      if (contextMenu) {
        contextMenu.remove();
      }
    }
  };
};
async function createActions(context) {
  return {
    refreshData: () => context.refreshData(),
    copyPeerId: () => context.copyPeerId(),
    toggleDetails: () => {
      const showDetailsAttr = context.getAttribute("data-show-details");
      const newValue = showDetailsAttr === "true" ? "false" : "true";
      context.setAttribute("data-show-details", newValue);
      return Promise.resolve();
    }
  };
}
export {
  controller,
  createActions
};
//# sourceMappingURL=index.js.map
