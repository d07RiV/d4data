export default class BinaryReader {
  buffer: Buffer
  pos = 0
  base: Buffer

  constructor(buffer: Buffer) {
    this.buffer = buffer
    this.base = buffer
  }

  offset(pos: number) {
    const buf = new BinaryReader(this.base.subarray(pos))
    buf.base = this.base
    return buf
  }

  bool() {
    return this.buffer[this.pos++] !== 0
  }
  int8() {
    return this.buffer.readInt8(this.pos++)
  }
  uint8() {
    return this.buffer.readUInt8(this.pos++)
  }
  byte() {
    return this.buffer[this.pos++]
  }
  uint16() {
    const result = this.buffer.readUInt16LE(this.pos)
    this.pos += 2
    return result
  }
  int16() {
    const result = this.buffer.readInt16LE(this.pos)
    this.pos += 2
    return result
  }
  int32() {
    const result = this.buffer.readInt32LE(this.pos)
    this.pos += 4
    return result
  }
  uint32() {
    const result = this.buffer.readUInt32LE(this.pos)
    this.pos += 4
    return result
  }
  uint64() {
    const value1 = this.uint32()
    const value2 = this.uint32()
    return value1 + value2 * 2 ** 32
  }
  int64() {
    const value1 = this.uint32()
    const value2 = this.int32()
    return value1 + value2 * 2 ** 32
  }

  nullTerminatedString() {
    const index = this.buffer.indexOf(0, this.pos)
    const result = this.buffer.toString('utf8', this.pos, index)
    this.pos = index + 1
    return result
  }

  hex(length: number) {
    const result = this.buffer.toString('hex', this.pos, this.pos + length)
    this.pos += length
    return result
  }
  string(length: number) {
    const buf = this.buffer.subarray(this.pos, this.pos + length)
    const zero = buf.indexOf(0)
    const result = buf.toString('utf8', 0, zero < 0 ? length : zero)
    this.pos += length
    return result
  }
  bytes(length: number) {
    const result = this.buffer.subarray(this.pos, this.pos + length)
    this.pos += length
    return result
  }

  skip(count: number) {
    this.pos += count
  }

  align(count: number = 4) {
    const rem = this.pos % count
    if (rem) this.pos += count - rem
  }

  single() {
    const result = this.buffer.readFloatLE(this.pos)
    this.pos += 4
    return parseFloat(result.toPrecision(7))
  }
  double() {
    const result = this.buffer.readDoubleLE(this.pos)
    this.pos += 4
    return result
  }

  eof() {
    return this.pos >= this.buffer.length
  }
}
