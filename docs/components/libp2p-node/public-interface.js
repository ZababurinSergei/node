// src/components/libp2p-node/public-interface.ts
function shortenPeerId(peerId) {
  if (!peerId) return "Unknown";
  if (peerId.length <= 20) return peerId;
  return peerId.substring(0, 10) + "..." + peerId.substring(peerId.length - 10);
}
function getPeerAvatar(peerId) {
  if (!peerId) return "👤";
  const emojis = ["😀", "😎", "🤖", "👾", "🎮", "💻", "📱", "🌐", "🚀", "⚡"];
  const hash = peerId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = Math.abs(hash) % emojis.length;
  return emojis[index] || "👤";
}
function getTrendClass(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return "neutral";
  return num > 50 ? "positive" : num < 30 ? "negative" : "neutral";
}
function getTrendArrow(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return "→";
  return num > 50 ? "↗" : num < 30 ? "↘" : "→";
}
var LIBP2P_NODE_CONSTANTS = {
  MAX_LOGS: 50,
  MAX_CONNECTIONS: 20,
  DEFAULT_DISCOVERY_INTERVAL: 3e4,
  DEFAULT_UPDATE_INTERVAL: 1e4,
  DEFAULT_DHT_UPDATE_INTERVAL: 15e3,
  MAX_CONNECTION_ATTEMPTS: 3,
  STATUS_COLORS: {
    stopped: "#dc3545",
    starting: "#ffc107",
    running: "#28a745",
    error: "#dc3545",
    stopping: "#ffc107"
  },
  LOG_LEVELS: {
    info: "#17a2b8",
    warn: "#ffc107",
    error: "#dc3545"
  }
};
function createPublicInterface(nodeInstance) {
  return {
    // Основные методы
    startLibp2pNode: () => nodeInstance.startLibp2pNode(),
    stopLibp2pNode: () => nodeInstance.stopLibp2pNode(),
    discoverPeers: () => nodeInstance.discoverPeers(),
    // Геттеры
    getLibp2pInstance: () => nodeInstance.libp2pInstance,
    getLogBuffer: () => nodeInstance.logBuffer,
    getPeerConnections: () => nodeInstance.peerConnections,
    getMaxLogs: () => nodeInstance.maxLogs,
    // Логирование
    addLogToBuffer: (message, level) => nodeInstance.addLog(message, level),
    clearLogs: () => nodeInstance.clearLogs(),
    // Пиры
    pingPeer: (peerId) => nodeInstance.pingPeer(peerId),
    disconnectPeer: (peerId) => nodeInstance.disconnectPeer(peerId),
    getDiscoveredPeers: () => Array.from(nodeInstance.discoveredPeers?.values() || []),
    getConnectedPeers: () => nodeInstance.getConnectedPeers ? nodeInstance.getConnectedPeers() : [],
    // Статистика
    isNodeActive: () => nodeInstance.libp2pInstance !== null,
    isNodeRunning: () => (nodeInstance.state?.status || "stopped") === "running",
    getStats: () => ({ ...nodeInstance.state }),
    updateStatsUI: () => nodeInstance.updateStatsUI(),
    getNodeStats: async () => {
      try {
        if (!nodeInstance.libp2pInstance) {
          return { success: false, error: "Node not running" };
        }
        return {
          success: true,
          stats: { ...nodeInstance.state }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    },
    getConnectionStats: async () => {
      try {
        if (!nodeInstance.libp2pInstance) {
          return { success: false, error: "Node not running" };
        }
        const connections = Array.from(nodeInstance.peerConnections?.values() || []);
        return { success: true, connections };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    },
    getPeerId: async () => {
      try {
        if (!nodeInstance.libp2pInstance) {
          return null;
        }
        return nodeInstance.libp2pInstance.peerId?.toString() || null;
      } catch {
        return null;
      }
    },
    getMultiaddrs: async () => {
      try {
        if (!nodeInstance.libp2pInstance) {
          return [];
        }
        return nodeInstance.libp2pInstance.getMultiaddrs?.()?.map((ma) => ma.toString()) || [];
      } catch {
        return [];
      }
    },
    getDHTStats: async () => {
      try {
        return nodeInstance.updateDHTStats("all");
      } catch {
        return null;
      }
    },
    updateDHTStats: (dhtType) => nodeInstance.updateDHTStats(dhtType),
    // Polling
    startStatsPolling: () => nodeInstance.startUpdateInterval(),
    stopStatsPolling: () => {
      if (nodeInstance.updateInterval) {
        clearInterval(nodeInstance.updateInterval);
        nodeInstance.updateInterval = null;
      }
    },
    startUpdateInterval: () => nodeInstance.startUpdateInterval(),
    startAutoDiscovery: () => nodeInstance.startAutoDiscovery(),
    stopAutoDiscovery: () => nodeInstance.stopAutoDiscovery(),
    startDHTUpdateInterval: () => nodeInstance.startDHTUpdateInterval(),
    stopDHTUpdateInterval: () => nodeInstance.stopDHTUpdateInterval(),
    // UI
    updateStatusUI: () => nodeInstance.updateStatusUI(),
    updateMultiaddrsUI: () => nodeInstance.updateMultiaddrsUI(),
    updateConnectionsUI: () => nodeInstance.updateConnectionsUI(),
    updateDHTUI: () => nodeInstance.updateDHTUI(),
    showSkeleton: () => nodeInstance.showSkeleton(),
    hideSkeleton: () => nodeInstance.hideSkeleton(),
    // Конфигурация
    getConfig: () => nodeInstance.getConfig(),
    applyConfig: (config) => nodeInstance.applyConfig(config),
    getUptime: () => nodeInstance.getUptime(),
    // Вспомогательные методы
    showModal: (options) => nodeInstance.showModal(options),
    updateElement: (options) => nodeInstance.updateElement(options),
    renderPart: (options) => nodeInstance.renderPart(options),
    fullRender: (state) => nodeInstance.fullRender(state),
    // Сообщения
    postMessage: (event) => nodeInstance.postMessage(event),
    // Жизненный цикл
    _componentReady: () => nodeInstance._componentReady(),
    _componentAttributeChanged: (name, oldValue, newValue) => nodeInstance._componentAttributeChanged(name, oldValue, newValue),
    _componentDisconnected: () => nodeInstance._componentDisconnected(),
    _componentAdopted: () => nodeInstance._componentAdopted()
  };
}
export {
  LIBP2P_NODE_CONSTANTS,
  createPublicInterface,
  getPeerAvatar,
  getTrendArrow,
  getTrendClass,
  shortenPeerId
};
//# sourceMappingURL=public-interface.js.map
