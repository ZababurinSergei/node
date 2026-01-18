export function defaultTemplate({ state = {} }: { state: any; context?: any }): string {
    const statusClass = `status-${state.nodeStatus || 'loading'}`;
    return `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">
                    <span class="card-icon">🆔</span>
                    <span class="node-name">${state.nodeName || 'Node Identity'}</span>
                </h3>
                <span class="card-badge">${state.nodeStatus === 'online' ? 'Active' : 'Inactive'}</span>
            </div>
            
            <div class="card-content">
                <div class="identity-main">
                    <div class="identity-item">
                        <span class="identity-label">Peer ID:</span>
                        <div class="identity-value-container">
                            <code class="identity-value peer-id">${state.peerId || 'Loading...'}</code>
                            <button class="btn btn-small btn-copy" data-action="copy-peer-id" title="Copy Peer ID">
                                📋
                            </button>
                        </div>
                    </div>
                    
                    <div class="identity-item">
                        <span class="identity-label">Node Status:</span>
                        <span class="identity-value" id="nodeStatusContainer">
                            <span class="status-indicator ${statusClass}"></span>
                            <span class="node-status">${state.nodeStatus || 'loading'}</span>
                        </span>
                    </div>
                    
                    <div class="identity-item">
                        <span class="identity-label">Uptime:</span>
                        <span class="identity-value uptime">${state.uptime || '0s'}</span>
                    </div>

                    <div class="identity-item">
                        <span class="identity-label">Connected Peers:</span>
                        <span class="identity-value connected-peers">${state.connectedPeers || 0}</span>
                    </div>

                    <div class="identity-item">
                        <span class="identity-label">Network Address:</span>
                        <span class="identity-value network-address">${state.networkAddress || 'Unknown'}</span>
                    </div>
                </div>
                
                <div class="details-section" style="display: none;">
                    <h4 class="details-title">System Details</h4>
                    <div class="details-grid">
                        ${detailsTemplate({ state })}
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function detailsTemplate({ state = {} }: { state: any }): string {
    return `
        <div class="detail-item">
            <span class="detail-label">Process ID:</span>
            <span class="detail-value process-id">${state.processId || 'Unknown'}</span>
        </div>
        
        <div class="detail-item">
            <span class="detail-label">Node Port:</span>
            <span class="detail-value node-port">${state.nodePort || 'Unknown'}</span>
        </div>
        
        <div class="detail-item">
            <span class="detail-label">Platform:</span>
            <span class="detail-value platform">${state.platform || 'Unknown'}</span>
        </div>
        
        <div class="detail-item">
            <span class="detail-label">Architecture:</span>
            <span class="detail-value arch">${state.arch || 'Unknown'}</span>
        </div>
        
        <div class="detail-item">
            <span class="detail-label">Node.js Version:</span>
            <span class="detail-value node-version">${state.nodeVersion || 'Unknown'}</span>
        </div>

        <div class="detail-item">
            <span class="detail-label">Memory Usage:</span>
            <span class="detail-value memory-usage">${state.memoryUsage || '0 MB'}</span>
        </div>

        <div class="detail-item">
            <span class="detail-label">CPU Usage:</span>
            <span class="detail-value cpu-usage">${state.cpuUsage || '0%'}</span>
        </div>

        <div class="detail-item">
            <span class="detail-label">Protocol Version:</span>
            <span class="detail-value protocol-version">${state.protocolVersion || '1.0.0'}</span>
        </div>
    `;
}