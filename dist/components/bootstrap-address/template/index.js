// src/components/bootstrap-address/template/index.ts
function defaultTemplate({ state = {} }) {
  return `
        <div class="card full-width bootstrap-address">
            <div class="card-header">
                <h3 class="card-title">
                    <span class="card-icon">📡</span>
                    Bootstrap Addresses
                </h3>
                <span class="card-badge">${state.totalAddresses || 0}</span>
            </div>
            <div class="card-content">
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Primary Address:</span>
                        <div class="address-container">
                            <span class="info-value" id="primaryAddress">${state.primaryAddress || "Loading..."}</span>
                            <button class="copy-btn" id="copyPrimaryBtn" title="Copy Primary Address">
                                Copy
                            </button>
                        </div>
                    </div>
                </div>

                <div id="secondaryAddresses">
                    ${renderSecondaryAddresses({ state, context: null })}
                </div>

                <div id="addAddressSection">
                    ${renderAddAddressForm({ state, context: null })}
                </div>

                <div class="form-actions mt-2">
                    <button class="btn btn-secondary btn-copy-all" title="Copy All Addresses">
                        <span class="btn-icon">📋</span>
                        <span class="btn-text">Copy All</span>
                    </button>
                    <button class="btn btn-info btn-refresh" ${state.isLoading ? "disabled" : ""}>
                        <span class="btn-icon">🔄</span>
                        <span class="btn-text">${state.isLoading ? "Refreshing..." : "Refresh"}</span>
                    </button>
                    <button class="btn btn-success btn-test" title="Test All Connections">
                        <span class="btn-icon">🧪</span>
                        <span class="btn-text">Test All</span>
                    </button>
                    <button class="btn btn-primary btn-add-custom">
                        <span class="btn-icon">➕</span>
                        <span class="btn-text">Add Custom</span>
                    </button>
                    <button class="btn btn-warning btn-sync" title="Sync with Libp2p Node">
                        <span class="btn-icon">🔄</span>
                        <span class="btn-text">Sync</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}
function renderSecondaryAddresses({ state = {} }) {
  const allAddresses = [
    ...state.secondaryAddresses,
    ...state.customAddresses
  ];
  if (allAddresses.length === 0) {
    return '<div class="text-center text-muted mt-2">No secondary or custom addresses configured</div>';
  }
  return `
        <div class="secondary-addresses mt-2">
            <h4 class="section-title">
                <span>Secondary Addresses:</span>
                <span class="badge">${allAddresses.length}</span>
            </h4>
            <div class="secondary-addresses-list">
                ${allAddresses.map((address, index) => `
                    <div class="info-item secondary-address-item">
                        <div class="address-header">
                            <span class="info-label">Address ${index + 1}:</span>
                            <div class="address-actions">
                                <button class="action-btn test-btn" data-address="${escapeHtml(address)}" title="Test Connection">
                                    <span class="action-icon">🧪</span>
                                </button>
                                <button class="action-btn copy-btn" data-address="${escapeHtml(address)}" title="Copy Address">
                                    <span class="action-icon">📋</span>
                                </button>
                                <button class="action-btn remove-btn" data-address="${escapeHtml(address)}" title="Remove Address">
                                    <span class="action-icon">❌</span>
                                </button>
                            </div>
                        </div>
                        <span class="info-value secondary-address">${escapeHtml(address)}</span>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}
function renderAddAddressForm({ state = {} }) {
  if (!state.showAddForm) {
    return "";
  }
  return `
        <div class="add-address-form mt-2">
            <h4 class="section-title">Add Custom Bootstrap Address</h4>
            <form id="addAddressForm" class="address-form">
                <div class="form-group">
                    <label for="newAddress" class="form-label">Multiaddress:</label>
                    <input 
                        type="text" 
                        id="newAddress" 
                        name="newAddress" 
                        class="form-input" 
                        placeholder="/ip4/127.0.0.1/tcp/6832/ws/p2p/..."
                        value="${escapeHtml(state.newAddress || "")}"
                        required
                    >
                    <div class="form-hint">
                        Format: /ip4/1.2.3.4/tcp/1234/ws/p2p/PeerId
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-success">
                        <span class="btn-icon">✅</span>
                        <span class="btn-text">Add Address</span>
                    </button>
                    <button type="button" class="btn btn-secondary btn-cancel-form">
                        <span class="btn-icon">✖</span>
                        <span class="btn-text">Cancel</span>
                    </button>
                </div>
            </form>
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
  renderAddAddressForm,
  renderSecondaryAddresses
};
//# sourceMappingURL=index.js.map
