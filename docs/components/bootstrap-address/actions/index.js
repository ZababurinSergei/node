// src/components/bootstrap-address/actions/index.ts
async function createActions(context) {
  return {
    handleAddressUpdate: handleAddressUpdate.bind(context),
    handleCopyAllAddresses: handleCopyAllAddresses.bind(context),
    handleTestAllConnections: handleTestAllConnections.bind(context),
    handleSyncWithLibp2p: handleSyncWithLibp2p.bind(context),
    handleAddCustomAddress: handleAddCustomAddress.bind(context),
    handleToggleAddForm: handleToggleAddForm.bind(context),
    handleCopyPrimaryAddress: handleCopyPrimaryAddress.bind(context),
    handleRefreshAddresses: handleRefreshAddresses.bind(context),
    handleSingleAddressAction: handleSingleAddressAction.bind(context),
    handleFormSubmit: handleFormSubmit.bind(context),
    loadBootstrapAddresses: loadBootstrapAddresses.bind(context),
    fetchBootstrapAddresses: fetchBootstrapAddresses.bind(context),
    addBootstrapAddress: addBootstrapAddress.bind(context),
    removeBootstrapAddress: removeBootstrapAddress.bind(context),
    testBootstrapConnection: testBootstrapConnection.bind(context),
    validateAddress: validateAddress.bind(context),
    formatAddressForDisplay: formatAddressForDisplay.bind(context)
  };
}
async function loadBootstrapAddresses(data) {
  try {
    const addresses = data.addresses || [];
    await this.updateAddresses(addresses, "server");
  } catch (error) {
    console.error("Error loading bootstrap addresses:", error);
    await this.showModal({
      title: "Ошибка загрузки",
      content: `Не удалось загрузить bootstrap адреса: ${error.message}`,
      buttons: [{ text: "OK", type: "primary" }]
    });
  }
}
async function fetchBootstrapAddresses() {
  try {
    return [
      "/ip4/127.0.0.1/tcp/6832/ws/p2p/12D3KooWExample1",
      "/ip4/192.168.1.1/tcp/8080/ws/p2p/12D3KooWExample2",
      "/ip6/::1/tcp/9090/ws/p2p/12D3KooWExample3"
    ];
  } catch (error) {
    console.error("Error fetching bootstrap addresses:", error);
    throw error;
  }
}
async function addBootstrapAddress(address) {
  try {
    if (!validateAddress.call(this, address)) {
      return { success: false, error: "Invalid bootstrap address format" };
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true, data: { address } };
  } catch (error) {
    console.error("Error adding bootstrap address:", error);
    return { success: false, error: error.message };
  }
}
async function removeBootstrapAddress(address) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true, data: { address } };
  } catch (error) {
    console.error("Error removing bootstrap address:", error);
    return { success: false, error: error.message };
  }
}
async function testBootstrapConnection(address) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const success = Math.random() > 0.3;
    const latency = success ? Math.floor(Math.random() * 100) + 50 : void 0;
    return {
      success: true,
      data: {
        address,
        success,
        latency,
        // Теперь это number | undefined, что совместимо с AddressTestResult
        error: success ? void 0 : "Connection timeout"
      }
    };
  } catch (error) {
    console.error("Error testing bootstrap connection:", error);
    return { success: false, error: error.message };
  }
}
function validateAddress(address) {
  if (typeof address !== "string" || address.trim().length === 0) {
    return false;
  }
  const validProtocols = ["/ip4/", "/ip6/", "/dns4/", "/dns6/", "/tcp/", "/ws/", "/wss/", "/p2p/"];
  return validProtocols.some((protocol) => address.includes(protocol));
}
function formatAddressForDisplay(address) {
  if (!address) return "";
  if (address.length > 80) {
    return address.substring(0, 77) + "...";
  }
  return address;
}
async function handleAddressUpdate(newAddresses, source = "manual") {
  await this.updateAddresses(newAddresses, source);
}
async function handleCopyAllAddresses() {
  const state = this.getState();
  const allAddresses = [
    state.primaryAddress,
    ...state.secondaryAddresses,
    ...state.customAddresses
  ].filter((addr) => addr.trim() !== "");
  if (allAddresses.length === 0) {
    await this.showModal({
      title: "No Addresses",
      content: "There are no addresses to copy",
      buttons: [{ text: "OK", type: "primary" }]
    });
    return;
  }
  const addressesText = allAddresses.join("\n");
  try {
    await navigator.clipboard.writeText(addressesText);
    await this.showModal({
      title: "Copied",
      content: `All ${allAddresses.length} addresses copied to clipboard`,
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
async function handleTestAllConnections() {
  const state = this.getState();
  const allAddresses = [
    state.primaryAddress,
    ...state.secondaryAddresses,
    ...state.customAddresses
  ].filter((addr) => addr.trim() !== "");
  if (allAddresses.length === 0) {
    await this.showModal({
      title: "No Addresses",
      content: "There are no addresses to test",
      buttons: [{ text: "OK", type: "primary" }]
    });
    return [];
  }
  const modalResult = await this.showModal({
    title: "Testing Connections",
    content: `
            <div style="padding: 1rem 0;">
                <p>Testing ${allAddresses.length} connections...</p>
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
  if (modalResult === void 0) {
    return [];
  }
  const results = [];
  let successful = 0;
  for (let i = 0; i < allAddresses.length; i++) {
    const address = allAddresses[i];
    await new Promise((resolve) => setTimeout(resolve, 500));
    const success = Math.random() > 0.3;
    const latency = success ? Math.floor(Math.random() * 100) + 50 : void 0;
    if (success) successful++;
    results.push({
      address,
      success,
      latency: latency || 0,
      // Исправлено: всегда number, по умолчанию 0
      error: success ? void 0 : "Connection failed"
    });
    const progress = (i + 1) / allAddresses.length * 100;
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
                    <span style="color: ${success ? "var(--success)" : "var(--danger)"}; font-weight: 600;">
                        ${success ? "✅" : "❌"} ${latency ? `${latency}ms` : ""}
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
                        <div style="font-size: 2em; color: var(--danger);">❌ ${allAddresses.length - successful}</div>
                        <div style="font-size: 0.9em; color: var(--text-secondary);">Failed</div>
                    </div>
                </div>
                <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                    <p style="font-size: 0.9em; color: var(--text-secondary);">
                        Success rate: <strong>${Math.round(successful / allAddresses.length * 100)}%</strong>
                    </p>
                </div>
            </div>
        `,
    buttons: [{ text: "OK", type: "primary" }]
  });
  return results;
}
async function handleSyncWithLibp2p() {
  await this.syncWithLibp2pNode();
}
async function handleAddCustomAddress(address) {
  return await this.addCustomAddress(address);
}
async function handleToggleAddForm() {
  const state = this.getState();
  const newState = { ...state, showAddForm: !state.showAddForm };
  await this.renderPart({
    partName: "renderAddAddressForm",
    state: newState,
    selector: "#addAddressSection"
  });
}
async function handleCopyPrimaryAddress() {
  const state = this.getState();
  if (state.primaryAddress) {
    await this.copyAddress(state.primaryAddress);
  } else {
    await this.showModal({
      title: "No Primary Address",
      content: "Primary address is not available",
      buttons: [{ text: "OK", type: "primary" }]
    });
  }
}
async function handleRefreshAddresses() {
  await this.refreshAddresses();
}
async function handleSingleAddressAction(action, address) {
  switch (action) {
    case "copy":
      await this.copyAddress(address);
      break;
    case "test":
      await this.testConnection(address);
      break;
    case "remove":
      await this.removeAddress(address);
      break;
  }
}
async function handleFormSubmit(formData) {
  const newAddress = formData.get("newAddress");
  if (newAddress && newAddress.trim()) {
    const success = await this.addCustomAddress(newAddress.trim());
    if (success) {
      const state = this.getState();
      await this.renderPart({
        partName: "renderAddAddressForm",
        state: { ...state, showAddForm: false, newAddress: "" },
        selector: "#addAddressSection"
      });
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
