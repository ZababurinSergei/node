// src/components/peers-manager/template/index.ts
function defaultTemplate({ state = {} }) {
  const { peers = [], searchQuery = "", totalPeers = 0, totalConnections = 0 } = state;
  return `
    <div class="peers-manager">
      <div class="card full-width">
        <div class="card-header">
          <h3 class="card-title">
            <span class="card-icon">👥</span>
            Connected Peers
          </h3>
          <span class="card-badge">${totalPeers}</span>
        </div>
        <div class="card-content">
          ${renderActionBar()}
          ${renderSearchSection(searchQuery)}
          <div class="peers-list" id="peersList">
            ${renderPeersList(peers)}
          </div>
          ${renderStatsSection(totalPeers, totalConnections)}
        </div>
      </div>
    </div>
  `;
}
function renderActionBar() {
  return `
    <div class="action-bar">
      <button class="btn btn-success" id="get-all-peers">
        <span>📋</span> Get Detailed Peers Info
      </button>
      <button class="btn btn-warning" id="get-blocked-peers">
        <span>🚫</span> Get Blocked Peers
      </button>
      <button class="btn btn-info" id="get-ping-status">
        <span>📊</span> Ping Status
      </button>
      <button class="btn btn-secondary" id="refresh-peers">
        <span>🔄</span> Refresh
      </button>
      <button class="btn btn-danger" id="disconnect-all-peers">
        <span>🚫</span> Disconnect All
      </button>
    </div>
  `;
}
function renderSearchSection(searchQuery = "") {
  return `
    <div class="search-section">
      <div class="search-container">
        <input 
          type="text" 
          id="peer-search-input" 
          class="search-input" 
          placeholder="Search peers by ID, address, or protocol..."
          value="${escapeHtml(searchQuery)}"
        >
        <button class="btn btn-secondary" id="clear-search">
          <span>🗑️</span> Clear
        </button>
      </div>
    </div>
  `;
}
function renderPeersList(peers = []) {
  if (peers.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">👥</div>
        <p class="empty-text">No peers connected</p>
        <p class="empty-description">Connect to peers to see them here</p>
      </div>
    `;
  }
  return `${peers.map((peer) => renderPeerItem(peer)).join("")}`;
}
function renderPeerItem(peer) {
  const isBlocked = peer.blocked || peer.permanentlyBlocked;
  const peerId = escapeHtml(peer.peerId);
  return `
    <div class="peer-item ${isBlocked ? "peer-blocked" : ""}" data-peer-id="${peerId}">
      <div class="peer-info">
        <div class="peer-id">${peerId}</div>
        <div class="peer-meta">
          <span class="meta-item">🔗 ${peer.connectionCount || 0} connections</span>
          <span class="meta-item">📊 ${peer.streamCount || 0} streams</span>
          ${peer.autoPing ? '<span class="meta-item ping-active">📡 Auto Ping</span>' : ""}
          ${isBlocked ? '<span class="meta-item blocked">🚫 Blocked</span>' : ""}
          ${peer.permanentlyBlocked ? '<span class="meta-item permanently-blocked">⛔ Permanent</span>' : ""}
        </div>
        ${renderConnectionDetails(peer.connections)}
      </div>
      <div class="peer-actions">
        <button class="peer-btn peer-btn-info peer-btn-info" onclick="this.getRootNode().host.getSpecificPeerInfo('${peerId}')">
          🔍 Info
        </button>
        <button class="peer-btn peer-btn-warning peer-btn-ping" onclick="this.getRootNode().host.pingSpecificPeer('${peerId}')">
          📡 Ping
        </button>
        ${peer.autoPing ? `
          <button class="peer-btn peer-btn-secondary peer-btn-auto-ping-stop" onclick="this.getRootNode().host.stopAutoPing('${peerId}')">
            ⏹️ Stop Ping
          </button>
        ` : `
          <button class="peer-btn peer-btn-success peer-btn-auto-ping-start" onclick="this.getRootNode().host.startAutoPing('${peerId}')">
            ▶️ Start Ping
          </button>
        `}
        <button class="peer-btn peer-btn-danger peer-btn-disconnect" onclick="this.getRootNode().host.disconnectSpecificPeer('${peerId}')">
          🚫 Disconnect
        </button>
        ${isBlocked ? `
          <button class="peer-btn peer-btn-warning peer-btn-unblock" onclick="this.getRootNode().host.unblockPeer('${peerId}')">
            ✅ Unblock
          </button>
        ` : `
          <button class="peer-btn peer-btn-danger peer-btn-block" onclick="this.getRootNode().host.blockPeer('${peerId}')">
            🚫 Block
          </button>
        `}
      </div>
    </div>
  `;
}
function renderConnectionDetails(connections = []) {
  if (!connections || connections.length === 0) {
    return "";
  }
  return `
    <div class="connection-details">
      ${connections.map((conn, index) => `
        <div class="connection-item">
          <span class="connection-id">Connection ${index + 1}</span>
          <span class="connection-status ${conn.status}">${conn.status}</span>
          <span class="connection-addr">${escapeHtml(conn.remoteAddr || "Unknown")}</span>
        </div>
      `).join("")}
    </div>
  `;
}
function renderStatsSection(totalPeers = 0, totalConnections = 0) {
  return `
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${totalPeers}</div>
          <div class="stat-label">Total Peers</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${totalConnections}</div>
          <div class="stat-label">Total Connections</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" id="activePeersCount">${totalPeers}</div>
          <div class="stat-label">Active Peers</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" id="blockedPeersCount">0</div>
          <div class="stat-label">Blocked Peers</div>
        </div>
      </div>
    </div>
  `;
}
function renderPeersListPart({ state = {} }) {
  return renderPeersList(state.peers);
}
function renderStatsPart({ state = {} }) {
  const { totalPeers = 0, totalConnections = 0, blockedPeersCount = 0 } = state;
  return `
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-value">${totalPeers}</div>
        <div class="stat-label">Total Peers</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${totalConnections}</div>
        <div class="stat-label">Total Connections</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${totalPeers}</div>
        <div class="stat-label">Active Peers</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${blockedPeersCount}</div>
        <div class="stat-label">Blocked Peers</div>
      </div>
    </div>
  `;
}
function renderSearchEmptyState({ state = {} }) {
  const { searchQuery = "" } = state;
  return `
    <div class="empty-state">
      <div class="empty-icon">🔍</div>
      <p class="empty-text">No peers found for "${escapeHtml(searchQuery)}"</p>
      <p class="empty-description">Try adjusting your search terms or discover new peers</p>
      <div class="empty-actions">
        <button class="empty-action" onclick="this.getRootNode().host.clearSearch()">
          Clear Search
        </button>
      </div>
    </div>
  `;
}
function renderSearchResults({ state = {} }) {
  const { searchResults = [], searchQuery = "" } = state;
  if (searchResults.length === 0) {
    return renderSearchEmptyState({ state });
  }
  return `
    <div class="search-results">
      <div class="search-header">
        <h4>Search Results for "${escapeHtml(searchQuery)}"</h4>
        <span class="results-count">${searchResults.length} peers found</span>
      </div>
      <div class="peers-list">
        ${searchResults.map((peer) => renderPeerItem(peer)).join("")}
      </div>
    </div>
  `;
}
function escapeHtml(text) {
  if (typeof text !== "string") return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
export {
  defaultTemplate,
  renderPeersListPart,
  renderSearchEmptyState,
  renderSearchResults,
  renderStatsPart
};
//# sourceMappingURL=index.js.map
