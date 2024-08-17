import { createNode } from './node.mjs'
import { pipe } from 'it-pipe'

export async function respond (protocol) {
  const remote = await createNode()

  await remote.handle(protocol, ({ stream }) => {
    // pipe the stream output back to the stream input
    pipe(stream,
      (source) => {
        console.log('=== source ===', source)
        return source
      },
      stream)
  })

  return remote.getMultiaddrs()
}


