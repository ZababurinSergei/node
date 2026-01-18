// src/components/dht-manager/actions/index.ts
async function createActions(context) {
  return {
    loadDHTStats: loadDHTStats.bind(context),
    findPeer: findPeer.bind(context),
    findProviders: findProviders.bind(context),
    provideContent: provideContent.bind(context),
    getDHTBuckets: getDHTBuckets.bind(context),
    refreshDHTData: refreshDHTData.bind(context),
    handleDHTTabActivation: handleDHTTabActivation.bind(context),
    updateDHTDisplay: updateDHTDisplay.bind(context),
    filterDHTStats: filterDHTStats.bind(context),
    copyDHTAddresses: copyDHTAddresses.bind(context),
    switchDHTType: switchDHTType.bind(context),
    hideBuckets: hideBuckets.bind(context)
  };
}
function createEmptyDHTStats(type, status = "stopped") {
  return {
    type,
    peerCount: 0,
    routingTableSize: 0,
    queries: { total: 0, successful: 0, failed: 0, pending: 0 },
    records: { stored: 0, provided: 0, received: 0 },
    buckets: { total: 0, full: 0, depth: 0 },
    network: { closestPeers: [], knownPeers: 0 },
    status,
    lastActivity: null,
    metrics: { queryLatency: 0, successRate: 0, peersPerBucket: 0 },
    dataQuality: { score: 0, issues: [], lastValidated: null, status: "unknown" }
  };
}
async function loadDHTStats(data) {
  try {
    console.log("🔄 Loading DHT stats with data:", data);
    if (!data) {
      console.warn("⚠️ DHT stats data is undefined, using default structure");
      data = { stats: null };
    }
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found. Please start the node first.");
    }
    const response = await libp2pNode.postMessage({ type: "GET_DHT_STATS" });
    if (response.success && response.dhtStats) {
      await this.postMessage({
        type: "UPDATE_DISPLAY",
        data: {
          stats: {
            lan: response.dhtStats.lan || createEmptyDHTStats("lan"),
            amino: response.dhtStats.amino || createEmptyDHTStats("amino"),
            universe: response.dhtStats.universe || createEmptyDHTStats("universe"),
            summary: response.dhtStats.summary || {
              totalPeers: 0,
              totalQueries: 0,
              totalRecords: 0,
              activeDHTs: 0
            },
            lastUpdated: Date.now()
          }
        }
      });
      console.log("✅ DHT stats updated from libp2p-node");
    } else {
      throw new Error(response.error || "Failed to get DHT stats from libp2p-node");
    }
  } catch (error) {
    console.error(`❌ Не удалось загрузить статистику DHT: ${error}`, error);
    await this.postMessage({
      type: "UPDATE_DISPLAY",
      data: {
        stats: {
          lan: createEmptyDHTStats("lan", "error"),
          amino: createEmptyDHTStats("amino", "error"),
          universe: createEmptyDHTStats("universe", "error"),
          summary: { totalPeers: 0, totalQueries: 0, totalRecords: 0, activeDHTs: 0 },
          lastUpdated: Date.now()
        }
      }
    });
    this.addError({
      componentName: "DHTManager",
      source: "loadDHTStats",
      message: `Ошибка загрузки статистики DHT: ${error}`,
      details: error
    });
  }
}
async function findPeer(peerId, dhtType = "all") {
  if (!peerId || !peerId.trim()) {
    await this.showModal({
      title: "Ошибка",
      content: "Пожалуйста, введите Peer ID для поиска"
    });
    return { status: false, error: "Peer ID required" };
  }
  try {
    await this.showSkeleton();
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found. Please start the node first.");
    }
    const response = await libp2pNode.postMessage({
      type: "FIND_PEER",
      data: { peerId, dhtType }
    });
    if (response.success && response.result) {
      console.log("@@@@@@@@@@ renderPart @@@@@@@@@@ 1");
      await this.renderPart({
        partName: "renderAPIResponse",
        state: { responseData: response.result },
        selector: "#api-response-area"
      });
      const foundResults = response.result.results ? response.result.results.filter((r) => r.success).length : 0;
      if (foundResults > 0) {
        this.showNotification(`Найдено ${foundResults} результатов для пира ${peerId}`, "success");
      } else {
        this.showNotification(`Пир ${peerId} не найден в указанных DHT`, "warning");
      }
    } else {
      console.log("@@@@@@@@@@ renderPart @@@@@@@@@@ 2 mock результат");
      await this.renderPart({
        partName: "renderAPIResponse",
        state: {
          responseData: {
            status: true,
            results: [
              {
                success: Math.random() > 0.5,
                peerId,
                addresses: ["/ip4/127.0.0.1/tcp/4001/p2p/" + peerId],
                metadata: { foundIn: dhtType }
              }
            ]
          }
        },
        selector: "#api-response-area"
      });
      this.showNotification(`Поиск пира ${peerId} выполнен (mock данные)`, "info");
    }
    await this.hideSkeleton();
    return response.result || { status: false, error: "No result" };
  } catch (error) {
    await this.hideSkeleton();
    await this.showModal({
      title: "Ошибка поиска пира",
      content: `Не удалось выполнить поиск пира: ${error}`
    });
    this.addError({
      componentName: "DHTManager",
      source: "findPeer",
      message: `Ошибка поиска пира ${peerId}`,
      details: error
    });
    return { status: false, error: String(error) };
  }
}
async function findProviders(cid, dhtType = "all", maxProviders = 20) {
  if (!cid || !cid.trim()) {
    await this.showModal({
      title: "Ошибка",
      content: "Пожалуйста, введите CID для поиска провайдеров"
    });
    return { status: false, error: "CID required" };
  }
  try {
    await this.showSkeleton();
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found. Please start the node first.");
    }
    const response = await libp2pNode.postMessage({
      type: "FIND_PROVIDERS",
      data: { cid, dhtType, maxProviders }
    });
    if (response.success && response.result) {
      console.log("@@@@@@@@@@ renderPart @@@@@@@@@@ 3");
      await this.renderPart({
        partName: "renderAPIResponse",
        state: { responseData: response.result },
        selector: "#api-response-area"
      });
      this.showNotification(
        `Найдено ${response.result.totalProviders || 0} провайдеров для CID ${cid}`,
        "success"
      );
    } else {
      console.log("@@@@@@@@@@ renderPart @@@@@@@@@@ 4 mock");
      await this.renderPart({
        partName: "renderAPIResponse",
        state: {
          responseData: {
            status: true,
            totalProviders: Math.floor(Math.random() * maxProviders),
            providers: Array.from({ length: Math.min(5, maxProviders) }, (_, i) => ({
              peerId: `12D3KooWProvider${i}`,
              addresses: [`/ip4/192.168.${i}.1/tcp/4001/p2p/12D3KooWProvider${i}`]
            }))
          }
        },
        selector: "#api-response-area"
      });
      this.showNotification(`Поиск провайдеров для CID ${cid} выполнен (mock данные)`, "info");
    }
    await this.hideSkeleton();
    return response.result || { status: false, error: "No result" };
  } catch (error) {
    await this.hideSkeleton();
    await this.showModal({
      title: "Ошибка поиска провайдеров",
      content: `Не удалось найти провайдеров: ${error}`
    });
    this.addError({
      componentName: "DHTManager",
      source: "findProviders",
      message: `Ошибка поиска провайдеров для CID ${cid}`,
      details: error
    });
    return { status: false, error: String(error) };
  }
}
async function provideContent(cid, dhtType = "all") {
  if (!cid || !cid.trim()) {
    await this.showModal({
      title: "Ошибка",
      content: "Пожалуйста, введите CID для публикации"
    });
    return { status: false, error: "CID required" };
  }
  try {
    await this.showSkeleton();
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found. Please start the node first.");
    }
    const response = await libp2pNode.postMessage({
      type: "PROVIDE_CONTENT",
      data: { cid, dhtType }
    });
    if (response.success && response.result) {
      console.log("@@@@@@@@@@ renderPart @@@@@@@@@@ 6");
      await this.renderPart({
        partName: "renderAPIResponse",
        state: { responseData: response.result },
        selector: "#api-response-area"
      });
      const successful = response.result.results ? response.result.results.filter((r) => r.success).length : 0;
      this.showNotification(
        `Контент ${cid} опубликован в ${successful} DHT сетях`,
        "success"
      );
    } else {
      console.log("@@@@@@@@@@ renderPart @@@@@@@@@@ 7 mock");
      await this.renderPart({
        partName: "renderAPIResponse",
        state: {
          responseData: {
            status: true,
            results: [
              {
                success: true,
                dhtType,
                message: `Content ${cid} provided successfully (mock)`
              }
            ]
          }
        },
        selector: "#api-response-area"
      });
      this.showNotification(`Контент ${cid} опубликован (mock данные)`, "info");
    }
    await this.hideSkeleton();
    return response.result || { status: false, error: "No result" };
  } catch (error) {
    await this.hideSkeleton();
    await this.showModal({
      title: "Ошибка публикации контента",
      content: `Не удалось опубликовать контент: ${error}`
    });
    this.addError({
      componentName: "DHTManager",
      source: "provideContent",
      message: `Ошибка публикации контента ${cid}`,
      details: error
    });
    return { status: false, error: String(error) };
  }
}
async function getDHTBuckets(dhtType) {
  if (!["lan", "amino", "universe"].includes(dhtType)) {
    await this.showModal({
      title: "Ошибка",
      content: "Неверный тип DHT. Допустимые значения: lan, amino, universe"
    });
    return { status: false, error: "Invalid DHT type" };
  }
  try {
    await this.showSkeleton();
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found. Please start the node first.");
    }
    const response = await libp2pNode.postMessage({
      type: "GET_BUCKETS",
      data: { type: dhtType }
    });
    if (response.success) {
      const bucketInfo = response.buckets || {
        totalBuckets: 10,
        fullBuckets: 2,
        totalPeers: Math.floor(Math.random() * 100),
        averagePeersPerBucket: Math.floor(Math.random() * 10),
        buckets: Array.from({ length: 10 }, (_, i) => ({
          index: i,
          size: Math.floor(Math.random() * 5),
          capacity: 20,
          full: false,
          peers: []
        }))
      };
      console.log("@@@@@@@@@@ renderPart @@@@@@@@@@ 10");
      await this.renderPart({
        partName: "renderBucketInfo",
        state: {
          bucketInfo,
          dhtType
        },
        selector: "#api-response-area"
      });
      await this.updateElement({
        selector: "#bucketsContainer",
        value: "hidden",
        property: "className",
        action: "remove"
      });
      this.showNotification(
        `Информация о бакетах ${dhtType.toUpperCase()} DHT загружена`,
        "success"
      );
      return bucketInfo;
    }
    await this.hideSkeleton();
    return { status: false, error: "Failed to get bucket info" };
  } catch (error) {
    await this.hideSkeleton();
    console.error("Ошибка загрузки бакетов:", error);
    this.addError({
      componentName: "DHTManager",
      source: "getDHTBuckets",
      message: `Ошибка загрузки бакетов для ${dhtType} DHT`,
      details: error
    });
    return { status: false, error: String(error) };
  }
}
async function refreshDHTData() {
  try {
    await this.showSkeleton();
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found. Please start the node first.");
    }
    const response = await libp2pNode.postMessage({ type: "UPDATE_DISPLAY" });
    if (response.success) {
      await this.refreshData("all");
      this.showNotification("DHT статистика обновлена", "success");
    } else {
      throw new Error(response.error || "Не удалось обновить DHT статистику");
    }
    await this.hideSkeleton();
  } catch (error) {
    await this.hideSkeleton();
    this.showNotification("Ошибка обновления данных DHT", "error");
    this.addError({
      componentName: "DHTManager",
      source: "refreshDHTData",
      message: "Ошибка обновления данных DHT",
      details: error
    });
  }
}
async function updateDHTDisplay(data = null) {
  try {
    const response = await this.postMessage({
      type: "UPDATE_DISPLAY",
      data
    });
    if (!response.success) {
      console.error("❌ Error updating DHT display:", response.error);
    }
  } catch (error) {
    console.error("❌ Error updating DHT display:", error);
    this.addError({
      componentName: "DHTManager",
      source: "updateDHTDisplay",
      message: "Ошибка обновления отображения DHT",
      details: error
    });
  }
}
async function filterDHTStats(searchTerm) {
  try {
    if (!searchTerm) {
      await this.postMessage({ type: "UPDATE_DISPLAY" });
      return;
    }
    this.showNotification(`Фильтр по запросу: "${searchTerm}"`, "info");
  } catch (error) {
    console.error("Error filtering DHT stats:", error);
  }
}
async function copyDHTAddresses() {
  try {
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found. Please start the node first.");
    }
    const response = await libp2pNode.postMessage({ type: "GET_MULTIADDRS" });
    if (response.success && response.multiaddrs) {
      const addressesText = response.multiaddrs.join("\\n");
      await navigator.clipboard.writeText(addressesText);
      this.showNotification("Адреса DHT скопированы в буфер обмена", "success");
    } else {
      throw new Error("Не удалось получить адреса ноды из libp2p-node");
    }
  } catch (error) {
    console.error("Error copying DHT addresses:", error);
    this.showNotification("Ошибка копирования адресов DHT", "error");
  }
}
async function handleDHTTabActivation() {
  const response = await this.postMessage({ type: "GET_STATS" });
  if (response.success && response.stats) {
    const dhtStats = response.stats;
    const hasStats = dhtStats && Object.keys(dhtStats).length > 0;
    if (!hasStats) {
      await this.refreshData("all");
    }
  }
}
async function switchDHTType(dhtType) {
  try {
    const response = await this.postMessage({
      type: "SWITCH_TYPE",
      data: { type: dhtType }
    });
    if (response.success) {
      this.showNotification(`Показаны данные для: ${dhtType.toUpperCase()} DHT`, "info");
    }
  } catch (error) {
    console.error("Error switching DHT type:", error);
  }
}
async function hideBuckets() {
  await this.updateElement({
    selector: "#bucketsContainer",
    value: "hidden",
    property: "className",
    action: "add"
  });
}
export {
  createActions
};
//# sourceMappingURL=index.js.map
