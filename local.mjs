import { createNode } from './node.mjs'
import { pipe } from 'it-pipe'

const local = await createNode()

export async function dial (ma, protocol, data) {
  const stream = await local.dialProtocol(ma, protocol)

 return  await pipe(
    async function * () {
      // the stream input must be bytes
      yield new TextEncoder().encode('hello world')
    },
    stream,
    async (source) => {
      let string = ''
      const decoder = new TextDecoder()

      for await (const buf of source) {
        // buf is a `Uint8ArrayList` so we must turn it into a `Uint8Array`
        // before decoding it
        string += decoder.decode(buf.subarray())
      }

      return string
    }
  )
}