// src/components/network-addresses/template/index.ts
var DEFAULT_METRICS = {
  connectionQuality: 0,
  latency: 0,
  activeConnections: 0,
  discoveredPeers: 0,
  protocolDistribution: {},
  uptime: 0
};
function defaultTemplate({ state = {} }) {
  const formattedTime = state.lastUpdated ? new Date(state.lastUpdated).toLocaleTimeString() : "Never";
  return `
        <div class="card network-addresses" data-theme="dark">
            <div class="card-header">
                <h3 class="card-title">
                    <span class="card-icon">🌐</span>
                    Network Addresses
                </h3>
                <div class="header-controls">
                    <span class="card-badge">${state.totalAddresses || 0}</span>
                    <button class="btn btn-secondary theme-toggle-btn" title="Переключить тему">
                        <span class="theme-icon">🌓</span>
                    </button>
                </div>
            </div>
            <div class="card-content">
<!--                <div id="connectionInfo">-->
<!--                    ${renderConnectionInfo({ state, context: null })}-->
<!--                </div>-->

                <div class="addresses-container" id="addressesList">
                    ${renderAddressesList({ state, context: null })}
                </div>

<!--                <div id="statsSection">-->
<!--                    ${renderStatsTemplate({ state, context: null })}-->
<!--                </div>-->

<!--                <div id="networkMetrics">-->
<!--                    ${renderNetworkMetrics({ state, context: null })}-->
<!--                </div>-->

<!--                <div class="form-actions mt-2">-->
<!--                    <button class="btn btn-secondary btn-copy-all" title="Copy All Addresses">-->
<!--                        <span class="btn-icon">📋</span>-->
<!--                        <span class="btn-text">Copy All</span>-->
<!--                    </button>-->
<!--                    <button class="btn btn-info btn-refresh" ${state.isLoading ? "disabled" : ""}>-->
<!--                        <span class="btn-icon">🔄</span>-->
<!--                        <span class="btn-text">${state.isLoading ? "Refreshing..." : "Refresh"}</span>-->
<!--                     </button>-->
<!--                    <button class="btn btn-success btn-test-all" title="Test All Connections">-->
<!--                        <span class="btn-icon">🧪</span>-->
<!--                        <span class="btn-text">Test All</span>-->
<!--                    </button>-->
<!--                    <button class="btn btn-primary btn-add-custom">-->
<!--                        <span class="btn-icon">➕</span>-->
<!--                        <span class="btn-text">Add Custom</span>-->
<!--                    </button>-->
<!--                    <button class="btn btn-warning btn-sync" title="Sync with Libp2p Node">-->
<!--                        <span class="btn-icon">🔄</span>-->
<!--                        <span class="btn-text">Sync</span>-->
<!--                    </button>-->
<!--                    <button class="btn btn-secondary btn-export" title="Export Addresses">-->
<!--                        <span class="btn-icon">📤</span>-->
<!--                        <span class="btn-text">Export</span>-->
<!--                    </button>-->
<!--                    <button class="btn btn-success btn-force-sync" title="Force Sync with Libp2p">-->
<!--                        <span class="btn-icon">⚡</span>-->
<!--                        <span class="btn-text">Force Sync</span>-->
<!--                    </button>-->
<!--                </div>-->
<!---->
<!--                <div class="last-update mt-1">-->
<!--                    Last updated: <span class="update-time">${formattedTime}</span>-->
<!--                </div>-->
            </div>
        </div>
    `;
}
function renderAddressesList({ state = {} }) {
  const addresses = state.addresses || [];
  if (addresses.length === 0) {
    return renderEmptyState({ state, context: null });
  }
  return `
        <div class="info-grid">
            ${addresses.map((address, index) => `
                <div class="info-item address-item" data-address-index="${index}">
                    <span class="info-label">Address ${index + 1}:</span>
                    <div class="address-content">
                        <span class="info-value address-value" title="${escapeHtml(address)}">
                            ${escapeHtml(address)}
                        </span>
                        <div class="address-actions">
                            <button class="action-btn copy-btn" data-address="${escapeHtml(address)}" title="Copy Address">
                                📋
                            </button>
                            <button class="action-btn test-btn" data-address="${escapeHtml(address)}" title="Test Connection">
                                🧪
                            </button>
                            <button class="action-btn remove-btn" data-address="${escapeHtml(address)}" title="Remove Address">
                                ❌
                            </button>
                        </div>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}
function renderStatsTemplate({ state = {} }) {
  const stats = state.addressStats || { ws: 0, tcp: 0, webrtc: 0, ip4: 0, ip6: 0, dns: 0, quic: 0 };
  return `
        <div class="stats-grid mt-2">
            <div class="stat-item">
                <span class="stat-label">WS:</span>
                <span class="stat-value">${stats.ws}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">TCP:</span>
                <span class="stat-value">${stats.tcp}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">WebRTC:</span>
                <span class="stat-value">${stats.webrtc}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">IPv4:</span>
                <span class="stat-value">${stats.ip4}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">IPv6:</span>
                <span class="stat-value">${stats.ip6}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">DNS:</span>
                <span class="stat-value">${stats.dns}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">QUIC:</span>
                <span class="stat-value">${stats.quic}</span>
            </div>
        </div>
    `;
}
function renderNetworkMetrics({ state = {} }) {
  const metrics = { ...DEFAULT_METRICS, ...state.networkMetrics };
  return `
        <div class="network-metrics mt-2">
            <h4 class="metrics-title">Network Metrics</h4>
            <div class="metrics-grid">
                <div class="metric-item">
                    <span class="metric-label">Connection Quality:</span>
                    <span class="metric-value">${metrics.connectionQuality || 0}%</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Latency:</span>
                    <span class="metric-value">${metrics.latency || 0}ms</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Active Connections:</span>
                    <span class="metric-value">${metrics.activeConnections || 0}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Discovered Peers:</span>
                    <span class="metric-value">${metrics.discoveredPeers || 0}</span>
                </div>
            </div>
        </div>
    `;
}
function renderConnectionInfo({ state = {} }) {
  const connectionInfo = state.connectionInfo;
  if (!connectionInfo) {
    return "";
  }
  const lastSyncTime = connectionInfo.lastSyncTime ? new Date(connectionInfo.lastSyncTime).toLocaleTimeString() : "Never";
  const statusClass = connectionInfo.syncStatus === "success" ? "success" : connectionInfo.syncStatus === "error" ? "error" : connectionInfo.syncStatus === "syncing" ? "syncing" : "idle";
  const statusIcon = connectionInfo.syncStatus === "success" ? "✅" : connectionInfo.syncStatus === "error" ? "❌" : connectionInfo.syncStatus === "syncing" ? "🔄" : "⏳";
  return `
        <div class="connection-info">
            <h4 class="connection-title">Libp2p Connection</h4>
            <div class="connection-details">
                <div class="connection-item">
                    <span class="connection-label">Status:</span>
                    <span class="connection-value status-${statusClass}">
                        ${statusIcon} ${connectionInfo.libp2pNodeConnected ? "Connected" : "Disconnected"}
                    </span>
                </div>
                <div class="connection-item">
                    <span class="connection-label">Sync Status:</span>
                    <span class="connection-value sync-${connectionInfo.syncStatus}">
                        ${connectionInfo.syncStatus.toUpperCase()}
                    </span>
                </div>
                <div class="connection-item">
                    <span class="connection-label">Last Sync:</span>
                    <span class="connection-value">${lastSyncTime}</span>
                </div>
                ${connectionInfo.errorMessage ? `
                    <div class="connection-item">
                        <span class="connection-label">Error:</span>
                        <span class="connection-value error">${escapeHtml(connectionInfo.errorMessage)}</span>
                    </div>
                ` : ""}
                ${state.peerId ? `
                    <div class="connection-item">
                        <span class="connection-label">Peer ID:</span>
                        <code class="connection-value peer-id">${escapeHtml(shortenPeerId(state.peerId))}</code>
                    </div>
                ` : ""}
                ${state.nodeStatus ? `
                    <div class="connection-item">
                        <span class="connection-label">Node Status:</span>
                        <span class="connection-value node-status status-${state.nodeStatus}">
                            ${getNodeStatusIcon(state.nodeStatus)} ${state.nodeStatus.toUpperCase()}
                        </span>
                    </div>
                ` : ""}
            </div>
        </div>
    `;
}
function renderEmptyState({ state = {} }) {
  const showAdditionalInfo = state.isLoading || false;
  return `
        <div class="empty-state">
            <div class="empty-icon">🌐</div>
            <p class="empty-text">No network addresses</p>
            ${showAdditionalInfo ? '<p class="empty-subtext">Loading in progress...</p>' : ""}
            <p class="empty-description">Addresses will be loaded from the server</p>
            <button class="btn btn-secondary reload-addresses-btn">
                <span class="btn-icon">🔄</span>
                <span class="btn-text">Load Addresses</span>
            </button>
        </div>
    `;
}
function renderLoadingState({ state = {} }) {
  const loadingMessage = state.isLoading ? "Loading network addresses..." : "Processing...";
  return `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p class="loading-text">${loadingMessage}</p>
        </div>
    `;
}
function renderErrorState({ state = {} }) {
  const errorMessage = state.errorMessage || "Failed to load network addresses";
  return `
        <div class="error-state">
            <div class="error-icon">❌</div>
            <p class="error-text">Error loading</p>
            <p class="error-description">${escapeHtml(errorMessage)}</p>
            <button class="btn btn-secondary retry-addresses-btn">
                <span class="btn-icon">🔄</span>
                <span class="btn-text">Retry</span>
            </button>
        </div>
    `;
}
function escapeHtml(text) {
  if (typeof text !== "string") return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function shortenPeerId(peerId) {
  if (!peerId) return "Unknown";
  if (peerId.length <= 20) return peerId;
  return peerId.substring(0, 10) + "..." + peerId.substring(peerId.length - 10);
}
function getNodeStatusIcon(status) {
  const icons = {
    "online": "✅",
    "offline": "❌",
    "error": "⚠️",
    "loading": "🔄",
    "starting": "⏳",
    "stopping": "⏳",
    "stopped": "⏹️",
    "running": "▶️"
  };
  return icons[status.toLowerCase()] || "❓";
}
export {
  defaultTemplate,
  renderAddressesList,
  renderConnectionInfo,
  renderEmptyState,
  renderErrorState,
  renderLoadingState,
  renderNetworkMetrics,
  renderStatsTemplate
};
//# sourceMappingURL=index.js.map
