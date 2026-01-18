// src/components/bootstrap-address/public-interface.ts
var BOOTSTRAP_ADDRESS_CONSTANTS = {
  DEFAULT_REFRESH_INTERVAL: 2e4,
  MAX_ADDRESSES: 50,
  VALID_PROTOCOLS: ["/ip4/", "/ip6/", "/dns4/", "/dns6/", "/tcp/", "/ws/", "/wss/", "/p2p/"],
  STATUS_COLORS: {
    online: "#28a745",
    offline: "#dc3545",
    loading: "#ffc107",
    error: "#dc3545"
  },
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
function extractAddressProtocol(address) {
  if (!address) return "";
  const protocols = BOOTSTRAP_ADDRESS_CONSTANTS.VALID_PROTOCOLS;
  for (const protocol of protocols) {
    if (address.includes(protocol)) {
      return protocol.replace(/\//g, "");
    }
  }
  return "unknown";
}
function getProtocolIcon(address) {
  const protocol = extractAddressProtocol(address);
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
    addCustomAddress: (address) => instance.addCustomAddress(address),
    removeAddress: (address) => instance.removeAddress(address),
    testConnection: (address) => instance.testConnection(address),
    copyAddress: (address) => instance.copyAddress(address),
    refreshAddresses: () => instance.refreshAddresses(),
    syncWithLibp2pNode: () => instance.syncWithLibp2pNode(),
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
function validateMultiaddress(address) {
  if (typeof address !== "string" || address.trim().length === 0) {
    return false;
  }
  if (!address.startsWith("/")) {
    return false;
  }
  return BOOTSTRAP_ADDRESS_CONSTANTS.VALID_PROTOCOLS.some((protocol) => address.includes(protocol));
}
function parseMultiaddress(address) {
  if (!validateMultiaddress(address)) {
    return null;
  }
  try {
    const parts = address.split("/").filter((part) => part.trim() !== "");
    const result = {};
    for (let i = 0; i < parts.length; i += 2) {
      const protocol = parts[i];
      const value = parts[i + 1];
      if (protocol === "ip4" || protocol === "ip6") {
        result.protocol = protocol;
        result.value = value;
      } else if (protocol === "tcp" || protocol === "udp") {
        if (value) {
          result.port = parseInt(value, 10);
        }
        result.transport = protocol;
      } else if (protocol === "ws" || protocol === "wss") {
        result.transport = protocol;
      } else if (protocol === "p2p") {
        result.peerId = value;
      }
    }
    return result;
  } catch {
    return null;
  }
}
function compareAddresses(address1, address2) {
  return address1 === address2 || parseMultiaddress(address1)?.value === parseMultiaddress(address2)?.value;
}
export {
  BOOTSTRAP_ADDRESS_CONSTANTS,
  compareAddresses,
  createPublicInterface,
  extractAddressProtocol,
  formatAddressForDisplay,
  getProtocolIcon,
  parseMultiaddress,
  validateMultiaddress
};
//# sourceMappingURL=public-interface.js.map
