// Vendor Index - Auto-generated
// External dependencies for the project
// Generated: 2026-01-18T16:47:32.590Z
// Project: /home/sergei/Рабочий стол/in-progress/libp2p-browser/packages/node
// Platform: browser

export * from '@chainsafe/libp2p-gossipsub';
export * from '@chainsafe/libp2p-noise';
export * from '@chainsafe/libp2p-yamux';
export * from '@libp2p/bootstrap';
export * from '@libp2p/circuit-relay-v2';
export * from '@libp2p/crypto';
export * from '@libp2p/dcutr';
export * from '@libp2p/floodsub';
export * from '@libp2p/http';
export * from '@libp2p/http-fetch';
export * from '@libp2p/http-ping';
export * from '@libp2p/identify';
export * from '@libp2p/interface';
export * from '@libp2p/interface-transport';
export * from '@libp2p/kad-dht';
export * from '@libp2p/logger';
export * from '@libp2p/peer-id';
export * from '@libp2p/peer-store';
export * from '@libp2p/ping';
export * from '@libp2p/pubsub-peer-discovery';
export * from '@libp2p/utils';
export * from '@libp2p/webrtc';
export * from '@libp2p/websockets';
export * from '@libp2p/webtransport';
export * from '@multiformats/multiaddr';
export * from '@multiformats/multiaddr-matcher';
export * from 'blockstore-core';
export * from 'datastore-core';
export * from 'datastore-idb';
export * from 'libp2p';
export * from 'protons-runtime';
export * from 'reflect-metadata';

export const VENDOR_INFO = {
  generatedAt: '2026-01-18T16:47:32.590Z',
  dependencies: ["@chainsafe/libp2p-gossipsub","@chainsafe/libp2p-noise","@chainsafe/libp2p-yamux","@libp2p/bootstrap","@libp2p/circuit-relay-v2","@libp2p/crypto","@libp2p/dcutr","@libp2p/floodsub","@libp2p/http","@libp2p/http-fetch","@libp2p/http-ping","@libp2p/identify","@libp2p/interface","@libp2p/interface-transport","@libp2p/kad-dht","@libp2p/logger","@libp2p/peer-id","@libp2p/peer-store","@libp2p/ping","@libp2p/pubsub-peer-discovery","@libp2p/utils","@libp2p/webrtc","@libp2p/websockets","@libp2p/webtransport","@multiformats/multiaddr","@multiformats/multiaddr-matcher","blockstore-core","datastore-core","datastore-idb","libp2p","protons-runtime","reflect-metadata"],
  totalDependencies: 32,
  buildType: 'vendor-bundle',
  platform: 'browser'
};

// Utility to check if a dependency is available
export function hasDependency(name) {
  return VENDOR_INFO.dependencies.includes(name);
}

// Vendor initialization status
export const VENDOR_STATUS = {
  initialized: true,
  timestamp: Date.now(),
  dependenciesLoaded: 32
};

// Vendor initialization
console.log('✅ Vendor index loaded with 32 dependencies:', VENDOR_INFO.dependencies);

// Export VENDOR_INFO as default for compatibility
export default {
  VENDOR_INFO,
  VENDOR_STATUS,
  hasDependency
};
