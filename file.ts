import * as fs from 'fs'
import BinaryReader from './reader.js'

export class SNOFile<Type> {
  private reader: BinaryReader
  private typeReader: new (reader: BinaryReader) => Type
  private _data?: Type

  type: number
  hash: number
  uid: number
  name: string

  constructor(
    reader: BinaryReader,
    typeReader: new (reader: BinaryReader) => Type,
    name: string
  ) {
    this.reader = reader
    this.typeReader = typeReader
    this.name = name

    if (reader.uint32() !== 0xdeadbeef) throw Error(`invalid signature`)
    this.type = reader.uint32()
    const unk = reader.int32()
    this.hash = reader.int32()
    this.uid = reader.int32()
  }

  get data(): Type {
    if (this._data === undefined) {
      const reader = new BinaryReader(this.reader.buffer.subarray(16))
      this._data = new this.typeReader(reader)
    }
    return this._data
  }
}

type SNOMap<Type> = { [key: number]: SNOFile<Type> }

const fileMaps: { [key: string]: SNOMap<any> } = {}

export function loadFile<Type>(
  type: new (reader: BinaryReader) => Type,
  fn: string
): SNOFile<Type> | null {
  const m = fn.match(/^(.*)\.\w+$/)
  if (!m) return null
  try {
    const data = fs.readFileSync(`./data/Base/meta/${type.name}/${fn}`)
    return new SNOFile<Type>(new BinaryReader(data), type, m[1])
  } catch (err) {
    return null
  }
}

export function fileMap<Type>(
  type: new (reader: BinaryReader) => Type
): SNOMap<Type> {
  if (fileMaps[type.name]) return fileMaps[type.name]
  const map = (fileMaps[type.name] = {} as SNOMap<Type>)
  for (const fn of fs.readdirSync(`./data/Base/meta/${type.name}`)) {
    const file = loadFile(type, fn)
    if (file) {
      map[file.uid] = file
    }
  }
  return map
}
