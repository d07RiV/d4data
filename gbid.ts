import { fileMap } from './file.js'
import { hashNameLower } from './hash.js'
import GameBalance from './types/GameBalance.js'
import { GBIDHeader } from './types/polymorphic.js'

type GBIDEntry = {
  tHeader: GBIDHeader
}

const gbid: { [key: number]: GBIDEntry } = {}

for (const file of Object.values(fileMap(GameBalance))) {
  for (const data of file.data.ptData) {
    for (const entry of (data as any).tEntries) {
      if (!entry.tHeader) continue
      const name = entry.tHeader.szName
      gbid[hashNameLower(name)] = entry
    }
  }
}

export default gbid
