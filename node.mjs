import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { tcp } from '@libp2p/tcp'
import { pipe } from 'it-pipe'
import { createLibp2p } from 'libp2p'

export async function createNode () {
  return await createLibp2p({
    addresses: {
      listen: [
        '/ip4/0.0.0.0/tcp/0'
      ]
    },
    connectionEncryption: [
      noise()
    ],
    streamMuxers: [
      yamux()
    ],
    transports: [
      tcp()
    ]
  })
}