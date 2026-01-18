// src/components/dht-manager/controller/index.ts
var controller = async (context) => {
  let eventListeners = [];
  const addEventListener = (element, event, handler, options = {}) => {
    element.addEventListener(event, handler, options);
    eventListeners.push({ element, event, handler, options });
  };
  const getActions = () => {
    return {
      refreshDHTData: async () => {
        return await context.postMessage({ type: "REFRESH_STATS" });
      },
      getDHTBuckets: async (dhtType) => {
        return await context.postMessage({
          type: "GET_BUCKETS",
          data: { type: dhtType }
        });
      },
      findPeer: async (peerId, dhtType) => {
        return await context.postMessage({
          type: "FIND_PEER",
          data: { peerId, dhtType }
        });
      },
      findProviders: async (cid, dhtType, maxProviders) => {
        return await context.postMessage({
          type: "FIND_PROVIDERS",
          data: { cid, dhtType, maxProviders }
        });
      },
      provideContent: async (cid, dhtType) => {
        return await context.postMessage({
          type: "PROVIDE_CONTENT",
          data: { cid, dhtType }
        });
      },
      copyDHTAddresses: async () => {
        try {
          const response = await fetch("/system/node-info");
          const data = await response.json();
          if (data.status && data.addresses) {
            const addressesText = data.addresses.join("\\n");
            await navigator.clipboard.writeText(addressesText);
            showNotification("Адреса DHT скопированы в буфер обмена", "success");
          }
        } catch (error) {
          console.error("Error copying DHT addresses:", error);
          showNotification("Ошибка копирования адресов DHT", "error");
        }
      },
      switchDHTType: async (dhtType) => {
        return await context.postMessage({
          type: "SWITCH_TYPE",
          data: { type: dhtType }
        });
      },
      hideBuckets: async () => {
        await context.updateElement({
          selector: "#bucketsContainer",
          value: "hidden",
          property: "className",
          action: "add"
        });
      },
      updateDHTDisplay: async (data) => {
        return await context.postMessage({
          type: "UPDATE_DISPLAY",
          data
        });
      },
      filterDHTStats: async (searchTerm) => {
        showNotification(`Фильтр по запросу: "${searchTerm}"`, "info");
      }
    };
  };
  const showNotification = (message, type = "info") => {
    window.dispatchEvent(new CustomEvent("show-notification", {
      detail: {
        message,
        type
      }
    }));
  };
  const setupDHTListeners = (dhtType, dhtInstance) => {
    if (!dhtInstance?.routingTable) {
      console.log(`DHT ${dhtType} routingTable не доступен`);
      return;
    }
    const routingTable = dhtInstance.routingTable;
    let timerId = null;
    routingTable.addEventListener("peer:add", (event) => {
      console.log(`----- 🎯 [${dhtType}] peer:add`, event.detail);
      if (timerId) {
        clearTimeout(timerId);
      }
      timerId = setTimeout(() => {
        context.refreshData(dhtType).catch((e) => {
          console.error(`Error refreshing ${dhtType} DHT:`, e);
        });
      }, 2e3);
    });
    routingTable.addEventListener("peer:remove", (event) => {
      console.log(`🎯 [${dhtType}] peer:remove`, event.detail);
      context.refreshData(dhtType).catch((e) => {
        console.error(`Error refreshing ${dhtType} DHT:`, e);
      });
    });
    routingTable.addEventListener("peer:removed", (event) => {
      console.log(`+++++++🎯 [${dhtType}] peer:removed`, event.detail);
      context.refreshData(dhtType).catch((e) => {
        console.error(`Error refreshing ${dhtType} DHT:`, e);
      });
    });
  };
  const setupAllDHTListeners = (libp2p2) => {
    const dhtTypes = {
      "amino": "aminoDHT",
      "lan": "lanDHT",
      "universe": "universeDHT"
    };
    for (const [dhtType, serviceName] of Object.entries(dhtTypes)) {
      if (libp2p2?.services?.[serviceName]) {
        try {
          setupDHTListeners(dhtType, libp2p2.services[serviceName]);
        } catch (error) {
          console.error(`❌ Ошибка настройки слушателей для ${dhtType} DHT:`, error);
        }
      } else {
        console.log(`ℹ️ ${dhtType} DHT не доступен в libp2p сервисах`);
      }
    }
  };
  const handleDHTButtonClick = async (e) => {
    const target = e.target;
    const button = target.closest("[data-dht-action]");
    if (!button) return;
    const action = button.getAttribute("data-dht-action");
    const dhtType = button.getAttribute("data-dht-type");
    try {
      console.log(`Выполнение действия DHT: ${action} для типа: ${dhtType}`);
      const actions = getActions();
      switch (action) {
        case "refresh-stats":
          await actions.refreshDHTData();
          break;
        case "get-buckets":
          if (dhtType) {
            await actions.getDHTBuckets(dhtType);
          }
          break;
        case "find-peer":
          await showFindPeerForm(actions);
          break;
        case "find-providers":
          await showFindProvidersForm(actions);
          break;
        case "provide-content":
          await showProvideContentForm(actions);
          break;
        case "copy-addresses":
          await actions.copyDHTAddresses();
          break;
        case "switch-type":
          if (dhtType) {
            await actions.switchDHTType(dhtType);
          }
          break;
        case "hide-buckets":
          await actions.hideBuckets();
          break;
        default:
          console.warn(`Неизвестное действие DHT: ${action}`);
      }
    } catch (error) {
      console.error(`Ошибка выполнения действия DHT ${action}:`, error);
      await context.showModal({
        title: "Ошибка DHT",
        content: `Не удалось выполнить действие: ${error}`,
        buttons: [{ text: "Закрыть", type: "primary" }]
      });
    }
  };
  const showFindPeerForm = async (actions) => {
    const modalContent = `
      <div style="padding: 1rem 0;">
          <div class="form-group">
              <label class="form-label">Peer ID:</label>
              <input type="text" id="findPeerId" class="form-input" placeholder="Введите Peer ID...">
          </div>
          <div class="form-group">
              <label class="form-label">Тип DHT:</label>
              <select id="findPeerDHTType" class="form-input">
                  <option value="all">Все DHT</option>
                  <option value="lan">LAN</option>
                  <option value="amino">Amino</option>
                  <option value="universe">Universe</option>
              </select>
          </div>
      </div>
    `;
    await context.showModal({
      title: "🔍 Поиск пира в DHT",
      content: modalContent,
      buttons: [
        {
          text: "Отмена",
          type: "secondary",
          action: () => console.log("Поиск пира отменен")
        },
        {
          text: "Найти",
          type: "primary",
          action: async () => {
            const peerIdInput = document.getElementById("findPeerId");
            const dhtTypeSelect = document.getElementById("findPeerDHTType");
            const peerId = peerIdInput?.value?.trim() || "";
            const dhtType = dhtTypeSelect?.value || "all";
            if (!peerId) {
              await context.showModal({
                title: "Ошибка",
                content: "<p>Пожалуйста, введите Peer ID</p>",
                buttons: [{ text: "OK", type: "primary" }]
              });
              return;
            }
            await actions.findPeer(peerId, dhtType);
          }
        }
      ]
    });
  };
  const showFindProvidersForm = async (actions) => {
    const modalContent = `
      <div style="padding: 1rem 0;">
          <div class="form-group">
              <label class="form-label">Content ID (CID):</label>
              <input type="text" id="findProvidersCid" class="form-input" placeholder="Введите CID...">
          </div>
          <div class="form-group">
              <label class="form-label">Тип DHT:</label>
              <select id="findProvidersDHTType" class="form-input">
                  <option value="all">Все DHT</option>
                  <option value="lan">LAN</option>
                  <option value="amino">Amino</option>
                  <option value="universe">Universe</option>
              </select>
          </div>
          <div class="form-group">
              <label class="form-label">Максимум провайдеров:</label>
              <input type="number" id="findProvidersMax" class="form-input" value="20" min="1" max="100">
          </div>
      </div>
    `;
    await context.showModal({
      title: "📦 Поиск провайдеров контента",
      content: modalContent,
      buttons: [
        {
          text: "Отмена",
          type: "secondary",
          action: () => console.log("Поиск провайдеров отменен")
        },
        {
          text: "Найти",
          type: "primary",
          action: async () => {
            const cidInput = document.getElementById("findProvidersCid");
            const dhtTypeSelect = document.getElementById("findProvidersDHTType");
            const maxProvidersInput = document.getElementById("findProvidersMax");
            const cid = cidInput?.value?.trim() || "";
            const dhtType = dhtTypeSelect?.value || "all";
            const maxProviders = maxProvidersInput?.value ? parseInt(maxProvidersInput.value) : 20;
            if (!cid) {
              await context.showModal({
                title: "Ошибка",
                content: "<p>Пожалуйста, введите CID</p>",
                buttons: [{ text: "OK", type: "primary" }]
              });
              return;
            }
            await actions.findProviders(cid, dhtType, maxProviders);
          }
        }
      ]
    });
  };
  const showProvideContentForm = async (actions) => {
    const modalContent = `
      <div style="padding: 1rem 0;">
          <div class="form-group">
              <label class="form-label">Content ID (CID):</label>
              <input type="text" id="provideContentCid" class="form-input" placeholder="Введите CID...">
          </div>
          <div class="form-group">
              <label class="form-label">Тип DHT:</label>
              <select id="provideContentDHTType" class="form-input">
                  <option value="all">Все DHT</option>
                  <option value="lan">LAN</option>
                  <option value="amino">Amino</option>
                  <option value="universe">Universe</option>
              </select>
          </div>
          <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.3);">
              <strong>💡 Информация:</strong> Эта операция опубликует информацию о том, что вы предоставляете указанный контент.
          </div>
      </div>
    `;
    await context.showModal({
      title: "📤 Публикация контента в DHT",
      content: modalContent,
      buttons: [
        {
          text: "Отмена",
          type: "secondary",
          action: () => console.log("Публикация контента отменена")
        },
        {
          text: "Опубликовать",
          type: "primary",
          action: async () => {
            const cidInput = document.getElementById("provideContentCid");
            const dhtTypeSelect = document.getElementById("provideContentDHTType");
            const cid = cidInput?.value?.trim() || "";
            const dhtType = dhtTypeSelect?.value || "all";
            if (!cid) {
              await context.showModal({
                title: "Ошибка",
                content: "<p>Пожалуйста, введите CID</p>",
                buttons: [{ text: "OK", type: "primary" }]
              });
              return;
            }
            await actions.provideContent(cid, dhtType);
          }
        }
      ]
    });
  };
  const handleDHTSearch = async (e) => {
    const target = e.target;
    if (target.id === "dhtSearchInput") {
      const searchTerm = target.value.toLowerCase().trim();
      const actions = getActions();
      await actions.filterDHTStats(searchTerm);
    }
  };
  const handleSectionToggle = (e) => {
    const target = e.target;
    const toggle = target.closest("[data-section-toggle]");
    if (!toggle) return;
    const sectionId = toggle.getAttribute("data-section-toggle");
    if (!sectionId) return;
    const section = context.shadowRoot?.getElementById(sectionId);
    if (!section) return;
    const isHidden = section.classList.contains("hidden");
    if (isHidden) {
      section.classList.remove("hidden");
      toggle.textContent = "📕 Скрыть";
    } else {
      section.classList.add("hidden");
      toggle.textContent = "📖 Показать";
    }
  };
  const libp2p = await context.getComponentAsync("libp2p-node", "libp2p-node-1");
  return {
    /**
     * Инициализирует контроллер DHT Manager
     */
    async init() {
      try {
        if (libp2p?.libp2pInstance?.libp2p) {
          setupAllDHTListeners(libp2p.libp2pInstance.libp2p);
        }
        addEventListener(context.shadowRoot, "click", handleDHTButtonClick);
        addEventListener(context.shadowRoot, "input", handleDHTSearch);
        addEventListener(context.shadowRoot, "click", handleSectionToggle);
        addEventListener(document, "TAB_CHANGED", async (e) => {
          const customEvent = e;
          if (customEvent.detail?.tabId === "dht") {
            const actions = getActions();
            setTimeout(async () => {
              await actions.refreshDHTData();
            }, 100);
          }
        });
      } catch (error) {
        console.error("❌ Ошибка инициализации контроллера DHT Manager:", error);
        throw error;
      }
    },
    /**
     * Уничтожает контроллер и очищает ресурсы
     */
    async destroy() {
      try {
        eventListeners.forEach(({ element, event, handler, options }) => {
          element.removeEventListener(event, handler, options);
        });
        eventListeners = [];
      } catch (error) {
        console.error("Ошибка уничтожения контроллера DHT Manager:", error);
      }
    },
    /**
     * Принудительно обновляет данные DHT
     */
    async forceRefresh() {
      try {
        const actions = getActions();
        await actions.refreshDHTData();
        console.log("Принудительное обновление DHT данных выполнено");
      } catch (error) {
        console.error("Ошибка принудительного обновления DHT:", error);
        throw error;
      }
    },
    /**
     * Получает текущее состояние контроллера
     */
    async getState() {
      const response = await context.postMessage({ type: "GET_STATS" });
      if (response.success) {
        return {
          activeDHTType: response.state?.activeDHTType || "all",
          eventListenersCount: eventListeners.length
        };
      }
      return {
        activeDHTType: "all",
        eventListenersCount: eventListeners.length
      };
    }
  };
};
export {
  controller
};
//# sourceMappingURL=index.js.map
