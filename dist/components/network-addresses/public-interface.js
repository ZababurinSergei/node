// src/components/network-addresses/public-interface.ts
var NETWORK_ADDRESSES_CONSTANTS = {
  DEFAULT_REFRESH_INTERVAL: 3e4,
  MAX_ADDRESSES: 100,
  VALID_PROTOCOLS: ["/ip4/", "/ip6/", "/dns4/", "/dns6/", "/tcp/", "/ws/", "/wss/", "/p2p/"],
  ADDRESS_TYPES: {
    WS: "ws",
    TCP: "tcp",
    WEBRTC: "webrtc",
    IP4: "ip4",
    IP6: "ip6"
  }
};
function formatAddressForDisplay(address, maxLength = 80) {
  if (!address) return "";
  if (address.length > maxLength) {
    return address.substring(0, maxLength - 3) + "...";
  }
  return address;
}
function getAddressProtocol(address) {
  if (!address) return "unknown";
  const protocols = NETWORK_ADDRESSES_CONSTANTS.VALID_PROTOCOLS;
  for (const protocol of protocols) {
    if (address.includes(protocol)) {
      return protocol.replace(/^\//, "").replace(/\/$/, "");
    }
  }
  return "unknown";
}
function getProtocolIcon(address) {
  const protocol = getAddressProtocol(address);
  const icons = {
    ip4: "🌐",
    ip6: "🌍",
    tcp: "🔌",
    ws: "⚡",
    wss: "🔒",
    p2p: "👥",
    dns4: "📡",
    dns6: "📡",
    unknown: "❓"
  };
  const icon = icons[protocol];
  return icon || icons.unknown || "❓";
}
function createPublicInterface(instance) {
  return {
    updateAddresses: (addresses, source) => instance.updateAddresses(addresses, source),
    addAddress: (address) => instance.addAddress(address),
    removeAddress: (address) => instance.removeAddress(address),
    copyAddress: (address) => instance.copyAddress(address),
    refreshAddresses: () => instance.refreshAddresses(),
    exportAddresses: () => instance.exportAddresses(),
    syncWithLibp2pNode: (force = false) => instance.syncWithLibp2pNode(force),
    // ОБНОВЛЕНО: передача параметра force
    testConnection: (address) => instance.testConnection(address),
    validateAddress: (address) => instance.validateAddress(address),
    getState: () => instance.getState(),
    showModal: (options) => instance.showModal(options),
    updateElement: (options) => instance.updateElement(options),
    renderPart: (options) => instance.renderPart(options),
    fullRender: (state) => instance.fullRender(state),
    postMessage: (event) => instance.postMessage(event),
    _componentReady: () => instance._componentReady(),
    _componentAttributeChanged: (name, oldValue, newValue) => instance._componentAttributeChanged(name, oldValue, newValue),
    _componentDisconnected: () => instance._componentDisconnected()
  };
}
export {
  NETWORK_ADDRESSES_CONSTANTS,
  createPublicInterface,
  formatAddressForDisplay,
  getAddressProtocol,
  getProtocolIcon
};
//# sourceMappingURL=public-interface.js.map
