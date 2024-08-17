import { ECHO_PROTOCOL } from './protocol/index.mjs'
import { dial } from './local.mjs'
import { respond } from './respond.mjs'

const multiaddr = await respond(ECHO_PROTOCOL)
console.log('--- multiaddr ---', multiaddr)

// const output = await dial(multiaddr, ECHO_PROTOCOL)
// console.log('--- output ---', output)