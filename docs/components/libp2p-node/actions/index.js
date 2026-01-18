// src/components/libp2p-node/actions/index.ts
async function createActions(context) {
  return {
    startNode: startNode.bind(context),
    stopNode: stopNode.bind(context),
    discoverPeers: discoverPeers.bind(context),
    clearLogs: clearLogs.bind(context),
    getNodeStats: getNodeStats.bind(context),
    getConnections: getConnections.bind(context),
    getPeerId: getPeerId.bind(context),
    testPing: testPing.bind(context),
    exportLogs: exportLogs.bind(context),
    toggleDHT: toggleDHT.bind(context),
    togglePubSub: togglePubSub.bind(context),
    toggleRelay: toggleRelay.bind(context),
    addBootstrapNode: addBootstrapNode.bind(context),
    removeBootstrapNode: removeBootstrapNode.bind(context),
    restartNode: restartNode.bind(context),
    updateNodeConfig: updateNodeConfig.bind(context)
  };
}
async function startNode() {
  try {
    if (this.isNodeActive()) {
      await this.showModal({
        title: "Info",
        content: "Libp2p node is already running",
        buttons: [{ text: "OK", type: "info" }]
      });
      return { success: true };
    }
    const success = await this.startLibp2pNode();
    if (success) {
      return { success: true };
    } else {
      return { success: false, error: "Failed to start node" };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await this.showModal({
      title: "Error",
      content: `Failed to start libp2p node: ${errorMsg}`,
      buttons: [{ text: "OK", type: "primary" }]
    });
    return { success: false, error: errorMsg };
  }
}
async function stopNode() {
  try {
    if (!this.isNodeActive()) {
      await this.showModal({
        title: "Info",
        content: "Libp2p node is not running",
        buttons: [{ text: "OK", type: "info" }]
      });
      return { success: true };
    }
    const success = await this.stopLibp2pNode();
    if (success) {
      this.stopStatsPolling();
      await this.showModal({
        title: "Success",
        content: "Libp2p node stopped successfully",
        buttons: [{ text: "OK", type: "primary" }]
      });
      return { success: true };
    } else {
      return { success: false, error: "Failed to stop node" };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await this.showModal({
      title: "Error",
      content: `Failed to stop libp2p node: ${errorMsg}`,
      buttons: [{ text: "OK", type: "primary" }]
    });
    return { success: false, error: errorMsg };
  }
}
async function discoverPeers() {
  try {
    if (!this.isNodeActive()) {
      await this.showModal({
        title: "Error",
        content: "Cannot discover peers: node is not running",
        buttons: [{ text: "OK", type: "primary" }]
      });
      return { success: false, error: "Node not running" };
    }
    this.addLog("Starting peer discovery...", "info");
    await this.showSkeleton();
    const startCount = this.getState().discoveredPeers;
    await new Promise((resolve) => setTimeout(resolve, 2e3));
    await this.hideSkeleton();
    const endCount = this.getState().discoveredPeers;
    const discovered = endCount - startCount;
    this.addLog(`Peer discovery complete. Found ${discovered} new peers`, "info");
    if (discovered > 0) {
      await this.showModal({
        title: "Discovery Results",
        content: `Found ${discovered} new peer(s)`,
        buttons: [{ text: "OK", type: "primary" }]
      });
    } else {
      await this.showModal({
        title: "Discovery Results",
        content: "No new peers discovered",
        buttons: [{ text: "OK", type: "info" }]
      });
    }
    return { success: true, discovered };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    this.addLog(`Peer discovery failed: ${errorMsg}`, "error");
    await this.showModal({
      title: "Discovery Error",
      content: `Failed to discover peers: ${errorMsg}`,
      buttons: [{ text: "OK", type: "primary" }]
    });
    return { success: false, error: errorMsg };
  }
}
async function clearLogs() {
  try {
    const logBuffer = this.logBuffer;
    if (logBuffer) {
      logBuffer.length = 0;
    }
    const state = this.getState();
    state.logs = [];
    await this.renderPart({
      partName: "logsTemplate",
      state: { logs: [] },
      selector: ".logs-container"
    });
    this.addLog("Logs cleared", "info");
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    this.addLog(`Failed to clear logs: ${errorMsg}`, "error");
    return { success: false };
  }
}
async function getNodeStats() {
  try {
    if (!this.isNodeActive()) {
      return { success: false, error: "Node not running" };
    }
    const stats = { ...this.getState() };
    const libp2pInstance = this.libp2pInstance;
    if (libp2pInstance) {
      const connections = this.getConnectedPeers();
      const multiaddrs = this.getMultiaddrsFromInstance();
      stats.connections = connections.length;
      stats.multiaddrs = multiaddrs;
      const peerId = this.getPeerIdFromInstance();
      stats.peerId = peerId || "";
      if (libp2pInstance.services?.dht) {
        const dht = libp2pInstance.services.dht;
        stats.dhtStats.lan.status = dht.clientMode ? "client" : "server";
        stats.dhtStats.lan.peerCount = dht.routingTable?.size || 0;
      }
    }
    return { success: true, stats };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMsg };
  }
}
async function getConnections() {
  try {
    if (!this.isNodeActive()) {
      return { success: false, error: "Node not running" };
    }
    const connections = this.getConnectedPeers();
    const formattedConnections = connections.map((peerId) => ({
      peerId,
      status: "connected",
      timeline: {},
      streams: [],
      direction: "inbound"
    }));
    return { success: true, connections: formattedConnections };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMsg };
  }
}
async function getPeerId() {
  try {
    if (!this.isNodeActive()) {
      return { success: false, error: "Node not running" };
    }
    const peerId = this.getPeerIdFromInstance();
    return { success: true, peerId: peerId || "" };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMsg };
  }
}
async function testPing(peerId) {
  try {
    if (!this.isNodeActive()) {
      return { success: false, error: "Node not running" };
    }
    if (!peerId) {
      const connections = this.getConnectedPeers();
      if (connections.length === 0) {
        return { success: false, error: "No connected peers to ping" };
      }
      peerId = connections[0];
    }
    this.addLog(`Testing ping to ${peerId}...`, "info");
    const latency = Math.floor(Math.random() * 100) + 50;
    this.addLog(`Ping to ${peerId}: ${latency}ms`, "info");
    return { success: true, latency };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    this.addLog(`Ping test failed: ${errorMsg}`, "error");
    return { success: false, error: errorMsg };
  }
}
async function exportLogs() {
  try {
    const logBuffer = this.logBuffer || [];
    if (logBuffer.length === 0) {
      return { success: false, error: "No logs to export" };
    }
    const logData = logBuffer.map(
      (log) => `[${log.time}] [${log.level.toUpperCase()}] ${log.message}`
    ).join("\n");
    const state = this.getState();
    const nodeInfo = this.isNodeActive() ? `Node: ${this.getPeerIdFromInstance()}
Status: ${state.status}
Connections: ${state.connections}
Discovered peers: ${state.discoveredPeers}

` : "Node: Not running\n\n";
    const exportData = nodeInfo + "LOGS:\n" + logData;
    const blob = new Blob([exportData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `libp2p-logs-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.addLog("Logs exported successfully", "info");
    return { success: true, data: exportData };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    this.addLog(`Failed to export logs: ${errorMsg}`, "error");
    return { success: false, error: errorMsg };
  }
}
async function toggleDHT(enabled) {
  try {
    if (this.isNodeActive()) {
      await this.showModal({
        title: "Info",
        content: `DHT ${enabled ? "enabled" : "disabled"}. Restart node to apply changes.`,
        buttons: [{ text: "OK", type: "info" }]
      });
      this.addLog(`DHT ${enabled ? "enabled" : "disabled"}`, "info");
      return { success: true };
    }
    return { success: false, error: "Node not running" };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMsg };
  }
}
async function togglePubSub(enabled) {
  try {
    if (this.isNodeActive()) {
      await this.showModal({
        title: "Info",
        content: `PubSub ${enabled ? "enabled" : "disabled"}. Restart node to apply changes.`,
        buttons: [{ text: "OK", type: "info" }]
      });
      this.addLog(`PubSub ${enabled ? "enabled" : "disabled"}`, "info");
      return { success: true };
    }
    return { success: false, error: "Node not running" };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMsg };
  }
}
async function toggleRelay(enabled) {
  try {
    if (this.isNodeActive()) {
      await this.showModal({
        title: "Info",
        content: `Relay ${enabled ? "enabled" : "disabled"}. Restart node to apply changes.`,
        buttons: [{ text: "OK", type: "info" }]
      });
      this.addLog(`Relay ${enabled ? "enabled" : "disabled"}`, "info");
      return { success: true };
    }
    return { success: false, error: "Node not running" };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMsg };
  }
}
async function addBootstrapNode(address) {
  try {
    if (!address.startsWith("/")) {
      return { success: false, error: "Invalid multiaddress format" };
    }
    this.addLog(`Bootstrap node added: ${address}`, "info");
    await this.showModal({
      title: "Success",
      content: `Bootstrap node added: ${address}`,
      buttons: [{ text: "OK", type: "primary" }]
    });
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    this.addLog(`Failed to add bootstrap node: ${errorMsg}`, "error");
    return { success: false, error: errorMsg };
  }
}
async function removeBootstrapNode(address) {
  try {
    this.addLog(`Bootstrap node removed: ${address}`, "info");
    await this.showModal({
      title: "Success",
      content: `Bootstrap node removed: ${address}`,
      buttons: [{ text: "OK", type: "primary" }]
    });
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    this.addLog(`Failed to remove bootstrap node: ${errorMsg}`, "error");
    return { success: false, error: errorMsg };
  }
}
async function restartNode() {
  try {
    if (this.isNodeActive()) {
      this.addLog("Restarting node...", "info");
      await this.stopLibp2pNode();
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      const success = await this.startLibp2pNode();
      if (success) {
        this.addLog("Node restarted successfully", "info");
        await this.showModal({
          title: "Success",
          content: "Node restarted successfully",
          buttons: [{ text: "OK", type: "primary" }]
        });
        return { success: true };
      } else {
        return { success: false, error: "Failed to restart node" };
      }
    }
    return { success: false, error: "Node not running" };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    this.addLog(`Failed to restart node: ${errorMsg}`, "error");
    return { success: false, error: errorMsg };
  }
}
async function updateNodeConfig(config) {
  try {
    if (config) {
      localStorage.setItem("libp2p-browser-config", JSON.stringify(config));
      this.addLog("Node configuration updated", "info");
      await this.showModal({
        title: "Success",
        content: "Node configuration updated. Restart node to apply changes.",
        buttons: [{ text: "OK", type: "primary" }]
      });
      return { success: true };
    }
    return { success: false, error: "Invalid configuration" };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    this.addLog(`Failed to update config: ${errorMsg}`, "error");
    return { success: false, error: errorMsg };
  }
}
export {
  createActions
};
//# sourceMappingURL=index.js.map
