// src/components/libp2p-node/template/index.ts
function defaultTemplate({ state = {} }) {
  const { title = "Libp2p Browser Node", status = "stopped", peerId = "", connections = 0, multiaddrs = [] } = state;
  const isRunning = status === "running";
  const isStopped = status === "stopped";
  const isLoading = status === "starting" || status === "stopping";
  return `
        <div class="card full-width libp2p-node">
           
 
            <div class="card-content">
                <div class="card-badge status-${status}">
                        <span class="node-status">${status.toUpperCase()}</span>
                    </div> 
                <div class="controls">
                    <button class="btn btn-success btn-start" 
                            data-action="start" 
                            ${isRunning || isLoading ? "disabled" : ""}>
                        <span class="btn-icon">▶️</span>
                        <span class="btn-text">${isLoading ? "Starting..." : "Start Node"}</span>
                    </button>
                    
                    <button class="btn btn-danger btn-stop" 
                            data-action="stop" 
                            ${isStopped || isLoading ? "disabled" : ""}>
                        <span class="btn-icon">⏹️</span>
                        <span class="btn-text">${isLoading ? "Stopping..." : "Stop Node"}</span>
                    </button>
                    
                    <button class="btn btn-secondary btn-refresh" 
                            data-action="refresh" 
                            ${isStopped ? "disabled" : ""}>
                        <span class="btn-icon">🔄</span>
                        <span class="btn-text">Refresh</span>
                    </button>
                    
                    <button class="btn btn-info btn-discover" 
                            data-action="discover" 
                            ${isStopped ? "disabled" : ""}>
                        <span class="btn-icon">🔍</span>
                        <span class="btn-text">Discover Peers</span>
                    </button>
                </div>
                
<!--                <div class="details-section" id="logsSection">-->
<!--                    <h4 class="details-title">Node Logs</h4>-->
<!--                    <div class="logs-container" id="logsContainer">-->
                        <!-- Logs will be rendered here -->
<!--                    </div>-->
<!--                    <div class="control"> -->
<!--                        <button class="btn btn-small btn-secondary" data-action="clear-logs">-->
<!--                            <span class="btn-icon">🗑️</span>-->
<!--                            <span class="btn-text">Clear Logs</span>-->
<!--                        </button>-->
<!--                        <div class="last-update">-->
<!--                            Last updated: <span class="update-time">${(/* @__PURE__ */ new Date()).toLocaleTimeString()}</span>-->
<!--                        </div>-->
<!--                    </div>-->
<!--                </div>-->
            </div>
        </div>
    `;
}
function renderLogsPart({ state = {} }) {
  const { logs = [] } = state;
  if (logs.length === 0) {
    return `
            <div class="empty-logs">
                <div class="empty-icon">📝</div>
                <p class="empty-text">No logs yet</p>
                <p class="empty-description">Start the node to see logs here</p>
            </div>
        `;
  }
  return `
        <div class="logs-list">
            ${logs.slice(0, 10).map((log) => `
                <div class="log-entry ${log.level}">
                    <span class="log-time">[${log.time || (/* @__PURE__ */ new Date()).toLocaleTimeString()}]</span>
                    <span class="log-level">${log.level?.toUpperCase() || "INFO"}</span>
                    <span class="log-message">${escapeHtml(log.message || "")}</span>
                </div>
            `).join("")}
        </div>
    `;
}
function renderMultiaddrsPart({ state = {} }) {
  const { multiaddrs = [] } = state;
  if (multiaddrs.length === 0) {
    return `
            <div class="empty-multiaddrs">
                <p class="empty-text">No addresses available</p>
            </div>
        `;
  }
  return `
        <div class="multiaddrs-list">
            ${multiaddrs.map((addr) => `
                <div class="multiaddr-item">
                    <code class="multiaddr-value">${escapeHtml(addr)}</code>
                </div>
            `).join("")}
        </div>
    `;
}
function renderConnectionsPart({ state = {} }) {
  const { connections = [], connectedPeers = 0 } = state;
  if (connectedPeers === 0) {
    return `
            <div class="empty-connections">
                <div class="empty-icon">🔌</div>
                <p class="empty-text">No connections</p>
                <p class="empty-description">Start the node and discover peers</p>
            </div>
        `;
  }
  return `
        <div class="connections-list">
            <div class="connections-header">
                <span>Total connected peers: ${connectedPeers}</span>
            </div>
            ${connections.slice(0, 5).map((conn) => `
                <div class="connection-item">
                    <span class="connection-peer">${shortenPeerId(conn.peerId || "")}</span>
                    <span class="connection-status ${conn.status || "unknown"}">${conn.status || "unknown"}</span>
                </div>
            `).join("")}
            ${connections.length > 5 ? `
                <div class="connections-more">
                    <span>... and ${connections.length - 5} more</span>
                </div>
            ` : ""}
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
export {
  defaultTemplate,
  renderConnectionsPart,
  renderLogsPart,
  renderMultiaddrsPart
};
//# sourceMappingURL=index.js.map
