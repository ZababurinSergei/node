// src/components/network-addresses/actions/index.ts
async function createActions(context) {
  return {
    loadAddresses: loadAddresses.bind(context),
    copyAllAddresses: copyAllAddresses.bind(context),
    refreshAddresses: refreshAddresses.bind(context),
    exportAddresses: exportAddresses.bind(context),
    syncWithLibp2p: syncWithLibp2p.bind(context),
    testAllConnections: testAllConnections.bind(context),
    addCustomAddress: addCustomAddress.bind(context),
    removeAddress: removeAddress.bind(context),
    copyAddress: copyAddress.bind(context),
    testConnection: testConnection.bind(context),
    toggleTheme: toggleTheme.bind(context),
    toggleAddForm: toggleAddForm.bind(context),
    handleFormSubmit: handleFormSubmit.bind(context)
  };
}
async function loadAddresses(source) {
  try {
    const dataSource = source || this.getAttribute("data-source") || "auto";
    await this.loadAddressesFromSource(dataSource);
  } catch (error) {
    console.error("Error loading addresses:", error);
    await this.showModal({
      title: "Error",
      content: `Failed to load addresses: ${error.message}`,
      buttons: [{ text: "OK", type: "primary" }]
    });
  }
}
async function copyAllAddresses() {
  const state = this.getState();
  const addresses = state.addresses || [];
  if (addresses.length === 0) {
    await this.showModal({
      title: "No Addresses",
      content: "There are no addresses to copy",
      buttons: [{ text: "OK", type: "primary" }]
    });
    return;
  }
  const addressesText = addresses.join("\n");
  try {
    await navigator.clipboard.writeText(addressesText);
    await this.showModal({
      title: "Copied",
      content: `All ${addresses.length} addresses copied to clipboard`,
      buttons: [{ text: "OK", type: "primary" }]
    });
  } catch (error) {
    await this.showModal({
      title: "Copy Failed",
      content: "Failed to copy addresses to clipboard",
      buttons: [{ text: "OK", type: "primary" }]
    });
  }
}
async function refreshAddresses() {
  await this.refreshAddresses();
}
async function exportAddresses() {
  await this.exportAddresses();
}
async function syncWithLibp2p(force = false) {
  await this.syncWithLibp2pNode(force);
}
async function testAllConnections() {
  const state = this.getState();
  const addresses = state.addresses || [];
  if (addresses.length === 0) {
    await this.showModal({
      title: "No Addresses",
      content: "There are no addresses to test",
      buttons: [{ text: "OK", type: "primary" }]
    });
    return [];
  }
  const results = [];
  let successful = 0;
  await this.showModal({
    title: "Testing Connections",
    content: `
            <div style="padding: 1rem 0;">
                <p>Testing ${addresses.length} connections...</p>
                <div class="test-progress" style="margin-top: 1rem;">
                    <div class="progress-bar" style="width: 0%; height: 4px; background: var(--primary); border-radius: 2px; transition: width 0.3s ease;"></div>
                </div>
                <div class="test-results" style="margin-top: 1rem; max-height: 200px; overflow-y: auto; font-size: 0.9em;"></div>
            </div>
        `,
    buttons: [
      {
        text: "Cancel",
        type: "secondary"
      }
    ],
    closeOnBackdropClick: false
  });
  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    const result = await this.testConnection(address);
    results.push(result);
    if (result.success) successful++;
    const progress = (i + 1) / addresses.length * 100;
    await this.updateElement({
      selector: ".progress-bar",
      value: `${progress}%`,
      property: "style.width"
    });
    await this.updateElement({
      selector: ".test-results",
      value: `
                <div style="padding: 0.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-family: monospace; font-size: 0.85em;">${address.substring(0, 50)}${address.length > 50 ? "..." : ""}</span>
                    <span style="color: ${result.success ? "var(--success)" : "var(--danger)"}; font-weight: 600;">
                        ${result.success ? "✅" : "❌"} ${result.latency ? `${result.latency}ms` : ""}
                    </span>
                </div>
            `,
      property: "innerHTML",
      action: "append"
    });
  }
  await this.showModal({
    title: "Test Results",
    content: `
            <div style="padding: 1rem 0;">
                <p><strong>Summary:</strong></p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                    <div style="background: rgba(34, 197, 94, 0.1); padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 2em; color: var(--success);">✅ ${successful}</div>
                        <div style="font-size: 0.9em; color: var(--text-secondary);">Successful</div>
                    </div>
                    <div style="background: rgba(239, 68, 68, 0.1); padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 2em; color: var(--danger);">❌ ${addresses.length - successful}</div>
                        <div style="font-size: 0.9em; color: var(--text-secondary);">Failed</div>
                    </div>
                </div>
                <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                    <p style="font-size: 0.9em; color: var(--text-secondary);">
                        Success rate: <strong>${Math.round(successful / addresses.length * 100)}%</strong>
                    </p>
                </div>
            </div>
        `,
    buttons: [{ text: "OK", type: "primary" }]
  });
  return results;
}
async function addCustomAddress(address) {
  return await this.addAddress(address);
}
async function removeAddress(address) {
  return await this.removeAddress(address);
}
async function copyAddress(address) {
  await this.copyAddress(address);
}
async function testConnection(address) {
  return await this.testConnection(address);
}
async function toggleTheme() {
  const currentTheme = this.getAttribute("data-theme") || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  await this.updateElement({
    selector: ".network-addresses",
    value: newTheme,
    property: "dataset.theme"
  });
  localStorage.setItem("network-addresses-theme", newTheme);
}
async function toggleAddForm() {
  const state = this.getState();
  const showAddForm = !state.showAddForm;
  console.log("Toggle add form:", showAddForm);
}
async function handleFormSubmit(formData) {
  const newAddress = formData.get("newAddress");
  if (newAddress && newAddress.trim()) {
    const success = await this.addAddress(newAddress.trim());
    if (success) {
      console.log("Address added successfully");
    }
  } else {
    await this.showModal({
      title: "Invalid Input",
      content: "Please enter a valid address",
      buttons: [{ text: "OK", type: "primary" }]
    });
  }
}
export {
  createActions
};
//# sourceMappingURL=index.js.map
