import { SNOFile, fileMap } from '../file.js'
import BinaryReader from '../reader.js'
import { PolymorphicBase } from './common.js'
import { polymorphicTypes } from './polymorphic.js'

export function readFixedArray<T>(
  reader: BinaryReader,
  count: number,
  func: (reader: BinaryReader) => T
): T[] {
  const result: T[] = []
  for (let i = 0; i < count; ++i) {
    result[i] = func(reader)
  }
  return result
}

export function readVariableArray<T>(
  reader: BinaryReader,
  func: (reader: BinaryReader) => T
): T[] {
  const ptr1 = reader.int32(),
    ptr2 = reader.int32(),
    offset = reader.int32(),
    size = reader.int32()
  if (offset < 0 || size < 0) return []
  const result = []
  const src = reader.offset(offset)
  while (src.pos < size) {
    result.push(func(src))
  }
  return result
}

export function readCString(reader: BinaryReader) {
  const ptr1 = reader.int32(),
    ptr2 = reader.int32(),
    offset = reader.int32(),
    size = reader.int32()
  if (offset <= 0 || size <= 0) return ''
  const src = reader.offset(offset)
  return src.string(size)
}

export function readPolymorphicArray<T extends PolymorphicBase>(
  reader: BinaryReader
): T[] {
  const ptr1 = reader.int32(),
    ptr2 = reader.int32(),
    offset = reader.int32(),
    size = reader.int32(),
    count = reader.int32(),
    pad = reader.int32()

  const src = reader.offset(offset)
  src.pos += count * 8
  const result: T[] = []
  while (src.pos < size) {
    const base = src.pos
    src.pos += 8
    const type = src.uint32()
    const func = polymorphicTypes[type]
    src.pos = base
    result.push(new func(src) as T)
  }
  return result
}

function _DT_BYTES(reader: BinaryReader) {
  const ptr1 = reader.int32(),
    ptr2 = reader.int32(),
    offset = reader.int32(),
    size = reader.int32()
  const src = reader.offset(offset)
  if (offset <= 0 || size <= 0) return src.bytes(0)
  return src.bytes(size)
}

export class StringFormula {
  value: string
  binaryFormula: Buffer

  constructor(reader: BinaryReader) {
    this.value = readCString(reader)
    this.binaryFormula = _DT_BYTES(reader)
  }
  toJSON() {
    return this.value
  }
  toString() {
    return this.value
  }
}

export class SNO<Type> {
  private typeReader: new (reader: BinaryReader) => Type
  private _file?: SNOFile<Type> | null

  id: number

  constructor(
    reader: BinaryReader,
    typeReader: new (reader: BinaryReader) => Type
  ) {
    this.typeReader = typeReader
    this.id = reader.int32()
  }

  toJSON() {
    return this.id
  }

  toString() {
    return this.id.toString()
  }

  get file() {
    if (this._file === undefined) {
      if (this.id === 0 || this.id === -1) {
        this._file = null
      } else {
        this._file = fileMap(this.typeReader)[this.id]
      }
    }
    return this._file
  }
}

export type Color = {
  r: number
  g: number
  b: number
  a: number
}

export function readColor(reader: BinaryReader): Color {
  return {
    r: reader.byte(),
    g: reader.byte(),
    b: reader.byte(),
    a: reader.byte()
  }
}

export function readColorValue(reader: BinaryReader): Color {
  return {
    r: reader.uint32(),
    g: reader.uint32(),
    b: reader.uint32(),
    a: reader.uint32()
  }
}

export type Optional<T> = {
  unk: number
  value: T
}

export function readOptional<T>(
  reader: BinaryReader,
  func: (reader: BinaryReader) => T
): Optional<T> {
  return {
    unk: reader.int32(),
    value: func(reader)
  }
}

export type Vector2D = {
  x: number
  y: number
}

export function readVector2D(reader: BinaryReader): Vector2D {
  return {
    x: reader.single(),
    y: reader.single()
  }
}

export type Vector3D = {
  x: number
  y: number
  z: number
}

export function readVector3D(reader: BinaryReader): Vector3D {
  return {
    x: reader.single(),
    y: reader.single(),
    z: reader.single()
  }
}

export type Vector4D = {
  x: number
  y: number
  z: number
  w: number
}

export function readVector4D(reader: BinaryReader): Vector4D {
  return {
    x: reader.single(),
    y: reader.single(),
    z: reader.single(),
    w: reader.single()
  }
}

export type Range<T> = {
  start: T
  end: T
}
