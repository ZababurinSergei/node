// src/components/dht-manager/template/index.ts
function defaultTemplate({ state = {}, context }) {
  return `
        <div class="card full-width">
            <div class="card-header">
                <h3 class="card-title">
                    <span class="card-icon">🌐</span>
                    Distributed Hash Table (DHT)
                </h3>
            </div>
            <div class="card-content">
                <div class="action-bar">
                    <button class="btn btn-success" data-dht-action="refresh-stats">
                        <span>📊</span> Refresh DHT Stats
                    </button>
                    <div class="btn-group">
                        <button class="btn-secondary dht-type-btn ${state.activeDHTType === "all" ? "btn-primary" : ""}" 
                                id="dhtBtn-all" data-dht-type="all" data-dht-action="switch-type">
                            All DHTs
                        </button>
                        <button class="btn-secondary dht-type-btn ${state.activeDHTType === "lan" ? "btn-primary" : ""}" 
                                id="dhtBtn-lan" data-dht-type="lan" data-dht-action="switch-type">
                            LAN
                        </button>
                        <button class="btn-secondary dht-type-btn ${state.activeDHTType === "amino" ? "btn-primary" : ""}" 
                                id="dhtBtn-amino" data-dht-type="amino" data-dht-action="switch-type">
                            Amino
                        </button>
                        <button class="btn-secondary dht-type-btn ${state.activeDHTType === "universe" ? "btn-primary" : ""}" 
                                id="dhtBtn-universe" data-dht-type="universe" data-dht-action="switch-type">
                            Universe
                        </button>
                    </div>
                    <button class="btn btn-info" data-dht-action="find-peer">
                        <span>🔍</span> Find Peer
                    </button>
                    <button class="btn btn-warning" data-dht-action="find-providers">
                        <span>📦</span> Find Providers
                    </button>
                    <button class="btn btn-primary" data-dht-action="provide-content">
                        <span>📤</span> Provide Content
                    </button>
                    <button class="btn btn-secondary" data-dht-action="copy-addresses">
                        <span>📋</span> Copy Addresses
                    </button>
                </div>

                <div class="dht-stats" id="dhtStatsContainer">
                    ${renderDHTStats({ state, context })}
                </div>

                <div class="buckets-container hidden" id="bucketsContainer">
                    <!-- Buckets info will be rendered here -->
                </div>

                <div class="api-response-area mt-2" id="api-response-area">
                    <!-- API responses will be rendered here -->
                </div>
            </div>
        </div>
    `;
}
function renderDHTStats({ state = {} }) {
  const { dhtStats, activeDHTType } = state;
  let instancesToShow = [];
  if (activeDHTType === "all") {
    instancesToShow = ["lan", "amino", "universe"];
  } else {
    instancesToShow = [activeDHTType];
  }
  return `
        ${instancesToShow.map((type) => renderDHTInstance(type, dhtStats?.[type])).join("")}
        
        <div class="dht-instance full-width">
            <div class="dht-header">
                <div class="dht-name">📊 DHT Summary</div>
                <div class="dht-status ${dhtStats?.summary?.activeDHTs > 0 ? "status-running" : "status-stopped"}">${dhtStats?.summary?.activeDHTs > 0 ? "Active" : "Inactive"}</div>
            </div>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${dhtStats?.summary?.totalPeers || 0}</div>
                    <div class="stat-label">Total Peers</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${dhtStats?.summary?.totalQueries || 0}</div>
                    <div class="stat-label">Total Queries</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${dhtStats?.summary?.totalRecords || 0}</div>
                    <div class="stat-label">Total Records</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${dhtStats?.summary?.activeDHTs || 0}</div>
                    <div class="stat-label">Active DHTs</div>
                </div>
            </div>
<!--            <div class="text-center text-muted mt-1">-->
<!--                Last updated: ${dhtStats?.lastUpdated ? new Date(dhtStats.lastUpdated).toLocaleTimeString() : "Never"}-->
<!--            </div>-->
        </div>
    `;
}
function renderBucketInfo({ state = {} }) {
  const { dhtType, bucketInfo } = state;
  if (!bucketInfo) {
    return '<div class="text-center text-muted">No bucket information available</div>';
  }
  return `
        <div class="buckets-section">
            <div class="buckets-header">
                <h4>📊 ${dhtType.toUpperCase()} DHT Routing Table Buckets</h4>
                <button class="btn btn-secondary" data-dht-action="hide-buckets">
                    ✕ Hide
                </button>
            </div>
            
            <div class="info-grid mb-2">
                <div class="info-item">
                    <span class="info-label">Total Buckets:</span>
                    <span class="info-value">${bucketInfo.totalBuckets || 0}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Full Buckets:</span>
                    <span class="info-value">${bucketInfo.fullBuckets || 0}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Total Peers:</span>
                    <span class="info-value">${bucketInfo.totalPeers || 0}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Avg Peers/Bucket:</span>
                    <span class="info-value">${bucketInfo.averagePeersPerBucket ? bucketInfo.averagePeersPerBucket.toFixed(1) : 0}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Routing Table Depth:</span>
                    <span class="info-value">${bucketInfo.routingTableDepth || 0}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Success Rate:</span>
                    <span class="info-value">${bucketInfo.metrics?.successRate || "0%"}</span>
                </div>
            </div>

            <div class="buckets-list">
                ${bucketInfo.buckets && bucketInfo.buckets.length > 0 ? bucketInfo.buckets.map((bucket) => `
                    <div class="bucket ${bucket.full ? "bucket-full" : bucket.size === 0 ? "bucket-empty" : ""}">
                        <div class="bucket-header">
                            <span class="bucket-index">Bucket #${bucket.index}</span>
                            <span class="bucket-size">${bucket.size}/${bucket.capacity} peers</span>
                        </div>
                        ${bucket.size > 0 ? `
                            <div class="bucket-peers">
                                ${bucket.peers ? bucket.peers.slice(0, 3).join(", ") : "No peers"}${bucket.peers && bucket.peers.length > 3 ? "..." : ""}
                            </div>
                        ` : '<div class="bucket-empty-message">Empty</div>'}
                    </div>
                `).join("") : '<div class="text-center text-muted">No bucket data available</div>'}
            </div>
        </div>
    `;
}
function renderAPIResponse({ state = {} }) {
  const { responseData } = state;
  if (!responseData) {
    return '<div class="text-center text-muted">No response data</div>';
  }
  const formatResponse = (data) => {
    if (typeof data === "object") {
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  };
  const isSuccess = responseData.status !== false;
  return `
        <div class="api-response-container ${isSuccess ? "api-response-success" : "api-response-error"}">
            <div class="api-response-header">
                <h5>${isSuccess ? "✅ Success" : "❌ Error"}</h5>
                <span class="response-timestamp">${(/* @__PURE__ */ new Date()).toLocaleTimeString()}</span>
            </div>
            <div class="api-response-content">
                <pre>${formatResponse(responseData)}</pre>
            </div>
        </div>
    `;
}
function renderDHTInstance(type, stats) {
  if (!stats) {
    return `
            <div class="dht-instance">
                <div class="dht-header">
                    <div class="dht-name">
                        <span>${type.toUpperCase()} DHT</span>
                    </div>
                    <div class="dht-status status-stopped">Stopped</div>
                </div>
                <div class="text-center text-muted p-2">
                    DHT instance not available
                </div>
            </div>
        `;
  }
  const statusClass = `status-${stats.status || "stopped"}`;
  const statusText = stats.status === "running" ? "Running" : stats.status === "stopped" ? "Stopped" : stats.status === "error" ? "Stopped" : "Stopped";
  const successRate = stats.metrics && stats.metrics.successRate !== void 0 ? typeof stats.metrics.successRate === "number" ? `${stats.metrics.successRate.toFixed(1)}%` : stats.metrics.successRate === 0 ? "0%" : `${stats.metrics.successRate}%` : "0%";
  const queryLatency = stats.metrics && stats.metrics.queryLatency ? typeof stats.metrics.queryLatency === "number" ? stats.metrics.queryLatency + "ms" : stats.metrics.queryLatency === 0 ? "0ms" : stats.metrics.queryLatency : "0ms";
  const bucketsInfo = stats.buckets ? `${stats.buckets.full || 0}/${stats.buckets.total || 0} full` : "0/0 full";
  return `
        <div class="dht-instance">
            <div class="dht-header">
                <div class="dht-name">
                    <span>${type.toUpperCase()} DHT</span>
                </div>
                <div class="dht-status ${statusClass}">${statusText}</div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${stats.peerCount || 0}</div>
                    <div class="stat-label">Peers</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.routingTableSize || 0}</div>
                    <div class="stat-label">Routing Table</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.queries ? stats.queries.successful : 0}</div>
                    <div class="stat-label">successful</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.records ? stats.records.stored : 0}</div>
                    <div class="stat-label">Stored</div>
                </div>
            </div>
            
            <div class="info-grid mt-1">
                <div class="info-item">
                    <span class="info-label">Success Rate:</span>
                    <span class="info-value">${successRate}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Query Latency:</span>
                    <span class="info-value">${queryLatency}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Buckets:</span>
                    <span class="info-value">${bucketsInfo}</span>
                </div>
            </div>
            
            <div class="form-actions mt-1">
                <button class="btn btn-secondary" data-dht-action="get-buckets" data-dht-type="${type}">
                    View Buckets
                </button>
            </div>
        </div>
    `;
}
export {
  defaultTemplate,
  renderAPIResponse,
  renderBucketInfo,
  renderDHTStats
};
//# sourceMappingURL=index.js.map
