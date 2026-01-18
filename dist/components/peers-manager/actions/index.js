// src/components/peers-manager/actions/index.ts
async function createActions(context) {
  return {
    loadAllPeers: loadAllPeers.bind(context),
    getPeerInfo: getPeerInfo.bind(context),
    pingPeer: pingPeer.bind(context),
    disconnectPeer: disconnectPeer.bind(context),
    blockPeer: blockPeer.bind(context),
    unblockPeer: unblockPeer.bind(context),
    loadBlockedPeers: loadBlockedPeers.bind(context),
    disconnectAllPeers: disconnectAllPeers.bind(context),
    updatePingStatus: updatePingStatus.bind(context),
    startAutoPing: startAutoPing.bind(context),
    stopAutoPing: stopAutoPing.bind(context),
    cleanup: cleanup.bind(context)
  };
}
async function getConfirmationFromModal(context, config) {
  return new Promise((resolve) => {
    let confirmed = false;
    context.showModal({
      ...config,
      buttons: config.buttons.map((btn) => ({
        ...btn,
        action: () => {
          if (btn.type === "danger" || btn.type === "primary") {
            confirmed = true;
          }
          resolve(confirmed);
        }
      }))
    });
  });
}
async function loadAllPeers() {
  try {
    await this.showSkeleton();
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found. Please start the node first.");
    }
    const response = await libp2pNode.postMessage({ type: "GET_CONNECTED_PEERS" });
    if (response.success && response.peers) {
      await this.postMessage({
        type: "UPDATE_FROM_LIBP2P",
        data: { peers: response.peers }
      });
      this.showNotification(`Loaded ${response.peers.length} peers from libp2p-node`, "success");
    } else {
      throw new Error(response.error || "Failed to get peers from libp2p-node");
    }
  } catch (error) {
    console.error("Error loading all peers:", error);
    await this.showModal({
      title: "Error",
      content: `Failed to load peers: ${error.message}`,
      buttons: [{ text: "Close", type: "primary" }]
    });
  } finally {
    await this.hideSkeleton();
  }
}
async function getPeerInfo(peerId) {
  try {
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found");
    }
    const response = await libp2pNode.postMessage({
      type: "GET_PEER_INFO",
      data: { peerId }
    });
    if (response.success && response.peer) {
      const peerInfo = response.peer;
      await this.showModal({
        title: "Peer Information",
        content: `
        <div style="font-family: monospace; font-size: 0.9em;">
          <div><strong>Peer ID:</strong> ${peerInfo.peerId}</div>
          <div><strong>Connections:</strong> ${peerInfo.connectionCount || 0}</div>
          <div><strong>Streams:</strong> ${peerInfo.streamCount || 0}</div>
          <div><strong>Blocked:</strong> ${peerInfo.blocked ? "Yes" : "No"}</div>
          <div><strong>Auto Ping:</strong> ${peerInfo.autoPing ? "Enabled" : "Disabled"}</div>
          ${peerInfo.connections && peerInfo.connections.length > 0 ? `
          <div><strong>Addresses:</strong></div>
          <ul>
            ${peerInfo.connections.map(
          (conn) => `<li>${conn.remoteAddr} (${conn.status})</li>`
        ).join("")}
          </ul>
          ` : ""}
        </div>
      `,
        buttons: [{ text: "Close", type: "primary" }]
      });
    } else {
      const state = this.state;
      const peer = state.peers.find((p) => p.peerId === peerId);
      if (peer) {
        await this.showModal({
          title: "Peer Information",
          content: `
          <div style="font-family: monospace; font-size: 0.9em;">
            <div><strong>Peer ID:</strong> ${peer.peerId}</div>
            <div><strong>Connections:</strong> ${peer.connectionCount || 0}</div>
            <div><strong>Streams:</strong> ${peer.streamCount || 0}</div>
            <div><strong>Blocked:</strong> ${peer.blocked ? "Yes" : "No"}</div>
            <div><strong>Auto Ping:</strong> ${peer.autoPing ? "Enabled" : "Disabled"}</div>
            ${peer.connections && peer.connections.length > 0 ? `
            <div><strong>Addresses:</strong></div>
            <ul>
              ${peer.connections.map(
            (conn) => `<li>${conn.remoteAddr} (${conn.status})</li>`
          ).join("")}
            </ul>
            ` : ""}
          </div>
        `,
          buttons: [{ text: "Close", type: "primary" }]
        });
      } else {
        throw new Error("Peer not found");
      }
    }
  } catch (error) {
    console.error(`Error getting peer info for ${peerId}:`, error);
    await this.showModal({
      title: "Error",
      content: `Failed to get peer information: ${error.message}`,
      buttons: [{ text: "Close", type: "primary" }]
    });
  }
}
async function pingPeer(peerId) {
  try {
    await this.updateElement({
      selector: `[data-peer-id="${peerId}"] .ping-status`,
      value: "Pinging...",
      property: "textContent"
    });
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found");
    }
    const response = await libp2pNode.postMessage({
      type: "PING_PEER",
      data: { peerId }
    });
    if (response.success && response.latency) {
      const latency = response.latency;
      await this.updateElement({
        selector: `[data-peer-id="${peerId}"] .ping-status`,
        value: `${latency}ms`,
        property: "textContent"
      });
      let pingClass = "ping-poor";
      if (latency < 100) pingClass = "ping-good";
      else if (latency < 300) pingClass = "ping-medium";
      await this.updateElement({
        selector: `[data-peer-id="${peerId}"] .ping-indicator`,
        value: pingClass,
        property: "className",
        action: "set"
      });
      this.showNotification(`Ping to ${peerId}: ${latency}ms`, "success");
      return { success: true, latency };
    } else {
      const latency = Math.floor(Math.random() * 200) + 50;
      await this.updateElement({
        selector: `[data-peer-id="${peerId}"] .ping-status`,
        value: `${latency}ms (simulated)`,
        property: "textContent"
      });
      let pingClass = "ping-poor";
      if (latency < 100) pingClass = "ping-good";
      else if (latency < 300) pingClass = "ping-medium";
      await this.updateElement({
        selector: `[data-peer-id="${peerId}"] .ping-indicator`,
        value: pingClass,
        property: "className",
        action: "set"
      });
      this.showNotification(`Ping to ${peerId}: ${latency}ms (simulated)`, "info");
      return { success: true, latency };
    }
  } catch (error) {
    console.error(`Error pinging peer ${peerId}:`, error);
    await this.updateElement({
      selector: `[data-peer-id="${peerId}"] .ping-status`,
      value: "Error",
      property: "textContent"
    });
    return { success: false, error: error.message };
  }
}
async function disconnectPeer(peerId) {
  try {
    const confirmed = await getConfirmationFromModal(this, {
      title: "Confirm Disconnect",
      content: `
        <div style="text-align: center; padding: 10px;">
          <div style="font-size: 3em; color: #f56565;">⚠️</div>
          <div style="margin: 15px 0;">
            Are you sure you want to disconnect this peer?
          </div>
          <div style="font-family: monospace; background: #fed7d7; padding: 10px; border-radius: 4px; font-size: 0.9em;">
            ${peerId}
          </div>
        </div>
      `,
      buttons: [
        { text: "Cancel", type: "secondary" },
        { text: "Disconnect", type: "danger" }
      ]
    });
    if (!confirmed) {
      return { success: false };
    }
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found");
    }
    const response = await libp2pNode.postMessage({
      type: "DISCONNECT_PEER",
      data: { peerId }
    });
    if (!response.success) {
      throw new Error(response.error || "Failed to disconnect peer");
    }
    const state = this.state;
    state.peers = state.peers.filter((peer) => peer.peerId !== peerId);
    state.totalPeers = state.peers.length;
    await this.updateStatsDisplay();
    await this.updatePeersList();
    this.showNotification(`Peer ${peerId} disconnected`, "success");
    return { success: true };
  } catch (error) {
    console.error(`Error disconnecting peer ${peerId}:`, error);
    await this.showModal({
      title: "Error",
      content: `Failed to disconnect peer: ${error.message}`,
      buttons: [{ text: "Close", type: "primary" }]
    });
    return { success: false };
  }
}
async function blockPeer(peerId) {
  try {
    const confirmed = await getConfirmationFromModal(this, {
      title: "Block Peer",
      content: `
        <div style="text-align: center; padding: 10px;">
          <div style="font-size: 3em; color: #f56565;">🚫</div>
          <div style="margin: 15px 0;">
            Block this peer?
          </div>
          <div style="font-family: monospace; background: #fed7d7; padding: 10px; border-radius: 4px; font-size: 0.9em;">
            ${peerId}
          </div>
        </div>
      `,
      buttons: [
        { text: "Cancel", type: "secondary" },
        { text: "Block", type: "danger" }
      ]
    });
    if (!confirmed) return { success: false };
    const state = this.state;
    const peerIndex = state.peers.findIndex((peer) => peer.peerId === peerId);
    if (peerIndex !== -1) {
      state.peers[peerIndex].blocked = true;
      await this.updateElement({
        selector: `[data-peer-id="${peerId}"]`,
        value: "peer-blocked",
        property: "className",
        action: "add"
      });
      await this.updateStatsDisplay();
    }
    try {
      const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
      if (libp2pNode) {
        await libp2pNode.postMessage({
          type: "BLOCK_PEER",
          data: { peerId }
        });
      }
    } catch (error) {
      console.log("libp2p-node does not support blocking, using local blocking only");
    }
    this.showNotification(`Peer ${peerId} blocked`, "success");
    return { success: true };
  } catch (error) {
    console.error(`Error blocking peer ${peerId}:`, error);
    await this.showModal({
      title: "Error",
      content: `Failed to block peer: ${error.message}`,
      buttons: [{ text: "Close", type: "primary" }]
    });
    return { success: false };
  }
}
async function unblockPeer(peerId) {
  try {
    const state = this.state;
    const peerIndex = state.peers.findIndex((peer) => peer.peerId === peerId);
    if (peerIndex !== -1) {
      state.peers[peerIndex].blocked = false;
      await this.updateElement({
        selector: `[data-peer-id="${peerId}"]`,
        value: "peer-blocked",
        property: "className",
        action: "remove"
      });
      await this.updateStatsDisplay();
    }
    try {
      const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
      if (libp2pNode) {
        await libp2pNode.postMessage({
          type: "UNBLOCK_PEER",
          data: { peerId }
        });
      }
    } catch (error) {
      console.log("libp2p-node does not support unblocking, using local unblocking only");
    }
    this.showNotification(`Peer ${peerId} unblocked`, "success");
    return { success: true };
  } catch (error) {
    console.error(`Error unblocking peer ${peerId}:`, error);
    await this.showModal({
      title: "Error",
      content: `Failed to unblock peer: ${error.message}`,
      buttons: [{ text: "Close", type: "primary" }]
    });
    return { success: false };
  }
}
async function loadBlockedPeers() {
  try {
    const state = this.state;
    const blockedPeers = state.peers.filter((peer) => peer.blocked);
    await this.showModal({
      title: "Blocked Peers",
      content: `
        <div style="max-height: 400px; overflow-y: auto;">
          ${blockedPeers.length > 0 ? blockedPeers.map((peer) => `
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 10px; background: #fff5f5;">
                <div style="font-family: monospace; font-weight: bold; margin-bottom: 5px;">${peer.peerId}</div>
                <div style="color: #718096; font-size: 0.9em;">
                  <div>Blocked: Permanent</div>
                </div>
              </div>
            `).join("") : '<div style="text-align: center; padding: 20px; color: #718096;">No blocked peers</div>'}
        </div>
      `,
      buttons: [{ text: "Close", type: "primary" }]
    });
  } catch (error) {
    console.error("Error loading blocked peers:", error);
    await this.showModal({
      title: "Error",
      content: `Failed to load blocked peers: ${error.message}`,
      buttons: [{ text: "Close", type: "primary" }]
    });
  }
}
async function disconnectAllPeers() {
  try {
    const state = this.state;
    const confirmed = await getConfirmationFromModal(this, {
      title: "Disconnect All Peers",
      content: `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 4em; color: #f56565;">⚠️</div>
          <div style="margin: 20px 0; font-size: 1.2em; font-weight: bold;">
            ARE YOU SURE?
          </div>
          <div style="background: #fed7d7; padding: 15px; border-radius: 8px; margin: 15px 0;">
            This will disconnect <strong>${state.totalPeers} peers</strong><br>
            and close <strong>${state.totalConnections} connections</strong>
          </div>
        </div>
      `,
      buttons: [
        { text: "Cancel", type: "secondary" },
        { text: "DISCONNECT ALL", type: "danger" }
      ]
    });
    if (!confirmed) return { success: false };
    await this.showSkeleton();
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (libp2pNode) {
      for (const peer of state.peers) {
        try {
          await libp2pNode.postMessage({
            type: "DISCONNECT_PEER",
            data: { peerId: peer.peerId }
          });
        } catch (error) {
          console.error(`Error disconnecting peer ${peer.peerId}:`, error);
        }
      }
    }
    state.peers = [];
    state.totalPeers = 0;
    state.totalConnections = 0;
    await this.updateStatsDisplay();
    await this.updatePeersList();
    this.showNotification("All peers disconnected", "success");
    return { success: true };
  } catch (error) {
    console.error("Error disconnecting all peers:", error);
    await this.showModal({
      title: "Error",
      content: `Failed to disconnect all peers: ${error.message}`,
      buttons: [{ text: "Close", type: "primary" }]
    });
    return { success: false };
  }
}
async function updatePingStatus() {
  try {
    const state = this.state;
    const peersWithAutoPing = state.peers.filter((peer) => peer.autoPing);
    await this.showModal({
      title: "Auto Ping Status",
      content: `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 3em; color: #48bb78;">📡</div>
          <div style="margin: 15px 0;">
            <div style="font-size: 1.1em; margin-bottom: 10px;">
              Auto ping: <strong>${peersWithAutoPing.length > 0 ? "ENABLED" : "DISABLED"}</strong>
            </div>
            <div style="background: #f0fff4; padding: 15px; border-radius: 8px;">
              <div>Peers with auto ping: <strong>${peersWithAutoPing.length}</strong></div>
              <div>Total peers: <strong>${state.totalPeers}</strong></div>
            </div>
          </div>
        </div>
      `,
      buttons: [{ text: "Close", type: "primary" }]
    });
  } catch (error) {
    console.error("Error updating ping status:", error);
    await this.showModal({
      title: "Error",
      content: `Failed to update ping status: ${error.message}`,
      buttons: [{ text: "Close", type: "primary" }]
    });
  }
}
async function startAutoPing(peerId) {
  try {
    await this.updateElement({
      selector: `[data-peer-id="${peerId}"] .peer-btn-success`,
      value: "Starting...",
      property: "textContent"
    });
    const state = this.state;
    const peerIndex = state.peers.findIndex((peer) => peer.peerId === peerId);
    if (peerIndex !== -1) {
      state.peers[peerIndex].autoPing = true;
      await this.updatePeersList();
    }
    try {
      const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
      if (libp2pNode) {
        await libp2pNode.postMessage({
          type: "START_AUTO_PING",
          data: { peerId }
        });
      }
    } catch (error) {
      console.log("libp2p-node does not support auto-ping, using local auto-ping only");
    }
    this.showNotification(`Auto ping started for peer ${peerId}`, "success");
    return { success: true };
  } catch (error) {
    console.error(`Error starting auto ping for peer ${peerId}:`, error);
    await this.updateElement({
      selector: `[data-peer-id="${peerId}"] .peer-btn-success`,
      value: "▶️ Start Ping",
      property: "textContent"
    });
    await this.showModal({
      title: "Error",
      content: `Failed to start auto ping: ${error.message}`,
      buttons: [{ text: "Close", type: "primary" }]
    });
    return { success: false };
  }
}
async function stopAutoPing(peerId) {
  try {
    await this.updateElement({
      selector: `[data-peer-id="${peerId}"] .peer-btn-secondary`,
      value: "Stopping...",
      property: "textContent"
    });
    const state = this.state;
    const peerIndex = state.peers.findIndex((peer) => peer.peerId === peerId);
    if (peerIndex !== -1) {
      state.peers[peerIndex].autoPing = false;
      await this.updatePeersList();
    }
    try {
      const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
      if (libp2pNode) {
        await libp2pNode.postMessage({
          type: "STOP_AUTO_PING",
          data: { peerId }
        });
      }
    } catch (error) {
      console.log("libp2p-node does not support auto-ping, using local auto-ping only");
    }
    this.showNotification(`Auto ping stopped for peer ${peerId}`, "success");
    return { success: true };
  } catch (error) {
    console.error(`Error stopping auto ping for peer ${peerId}:`, error);
    await this.updateElement({
      selector: `[data-peer-id="${peerId}"] .peer-btn-secondary`,
      value: "⏹️ Stop Ping",
      property: "textContent"
    });
    await this.showModal({
      title: "Error",
      content: `Failed to stop auto ping: ${error.message}`,
      buttons: [{ text: "Close", type: "primary" }]
    });
    return { success: false };
  }
}
async function cleanup() {
  try {
    const state = this.state;
    state.peers = [];
    state.totalPeers = 0;
    state.totalConnections = 0;
  } catch (error) {
    console.error("Error cleaning up:", error);
  }
}
export {
  createActions
};
//# sourceMappingURL=index.js.map
