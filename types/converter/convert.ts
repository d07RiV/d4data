import * as fs from 'fs'
import { TypeDefinition, DataType, basicTypes } from './basic.js'

type FieldDefinition = {
  offset: number
  name: string
  type: DataType
}

class ClassDefinition implements TypeDefinition {
  fieldType: () => string
  readFunc: () => string
  getSize = () => this.size

  id: string
  name: string
  size: number = 0
  fields: FieldDefinition[] = []
  inheritedFields: FieldDefinition[] = []
  parent?: ClassDefinition

  usedIn = new Set<string>()

  constructor(id: string, name: string) {
    this.id = id
    this.name = name
    this.fieldType = () => this.name
    this.readFunc = () => `new ${this.name}(reader)`
  }

  isEmptyClass() {
    if (!this.parent) return false
    return this.size === this.parent.size && !this.fields.length
  }

  *usedTypes(): Generator<DataType> {
    if (this.parent) {
      yield { type: this.parent }
    }
    for (const f of this.fields) {
      let type: DataType | undefined = f.type
      while (type) {
        yield type
        if (type.type.isSNO) break
        type = type.child
      }
    }
  }

  inheritsFrom(from: ClassDefinition) {
    let type: ClassDefinition = this
    while (type.parent) {
      type = type.parent
      if (type === from) return true
    }
    return false
  }

  createDefinition(prefix: string = ''): string[] {
    const out: string[] = []
    out.push(
      `${prefix}class ${this.name}${
        this.parent ? ` extends ${this.parent.name}` : ''
      } {`
    )
    out.push(`  static sizeOf = 0x${this.size.toString(16).padStart(2, '0')}`)
    for (const f of this.fields) {
      out.push(`  ${f.name}: ${f.type.type.fieldType(f.type)}`)
    }
    if (this.fields.length) out.push('')
    out.push('  constructor(reader: BinaryReader) {')
    let offset = 0
    if (this.parent) {
      out.push(`    super(reader)`)
      offset = this.parent.size
    }
    for (const f of this.fields) {
      if (f.offset > offset) {
        out.push(`    reader.pos += ${f.offset - offset}`)
        offset = f.offset
      } else if (f.offset < offset) {
        throw Error(`field overlap in ${this.name}.${f.name}`)
      }
      out.push(
        `    this.${f.name} = ${f.type.type.readFunc(f.type)} // 0x${f.offset
          .toString(16)
          .padStart(2, '0')}`
      )
      offset += f.type.type.getSize(f.type)
    }
    if (this.size > offset) {
      out.push(`    reader.pos += ${this.size - offset}`)
    }
    out.push('  }')
    out.push('}')
    out.push('')
    return out
  }
}

function isClass(type: TypeDefinition): type is ClassDefinition {
  return type instanceof ClassDefinition
}

function snoDefinition(sno: string) {
  switch (sno) {
    case 'UI':
      return 'UIDialogDefinition'
    case 'Anim':
      return 'AnimationDefinition'
    case 'Anim2D':
      return 'Animation2DDefinition'
    default:
      return `${sno}Definition`
  }
}

const parseList = [] as {
  fn: string
  type: ClassDefinition
}[]
const typeMap = { ...basicTypes }
const classList: ClassDefinition[] = []

for (const fn of fs.readdirSync(`./definitions`)) {
  const m = fn.match(/^(?:!(\w*)\.)?([0-9a-f]*)\.yml$/)
  if (!m) continue

  const name = m[1] || `t${m[2]}`
  const typeDef = new ClassDefinition(m[2], name)

  parseList.push({
    fn,
    type: typeDef
  })
  classList.push(typeDef)

  typeMap[`t${m[2]}`] = typeDef
  if (m[1]) typeMap[m[1]] = typeDef
}

for (const { fn, type } of parseList) {
  const lines = fs
    .readFileSync(`./definitions/${fn}`, 'utf8')
    .split('\n')
    .map((ln) => ln.trim())

  for (const line of lines) {
    if (!line.length) continue
    const pm = line.match(/^# Inherits: (?:(\w+) \([0-9a-f]+\)|([0-9a-f]+)$)/)
    if (pm) {
      const pname = pm[1] ?? `t${pm[2]}`
      const parent = typeMap[pname]
      if (!parent || !isClass(parent)) {
        throw Error(`unknown base type ${pname} in ${fn}`)
      }
      if (type.parent) {
        // can't check anything
      } else {
        type.parent = parent
      }
    } else if (line.includes('# Inherits')) {
      throw Error(`unknown inheritance ${line} [${fn}]`)
    }
    if (line[0] === '#') continue
    const m = line.match(/^0x([0-9a-f]+): (\w+|null or eof) # (.*)$/)
    if (!m) throw Error(`invalid field ${line} [${fn}]`)
    const offset = parseInt(m[1], 16)
    if (m[2] === 'null or eof') {
      type.size = offset
    } else {
      const m2 = m[3].match(/^(\w+)/)
      if (!m2) throw Error(`invalid field ${line} [${fn}]`)

      const field: FieldDefinition = {
        offset,
        name: m[2],
        type: {
          type: basicTypes.DT_INT
        }
      }
      if (m2[1] === 'unknown') {
        const m3 = m[3].match(/^unknown 0x([0-9a-f]+)/)
        if (!m3) continue
        field.type.type = typeMap[`t${m3[1]}`]
        if (!field.type.type) throw Error(`unknown type ${m3[1]} [${fn}]`)
      } else {
        field.type.type = typeMap[m2[1]]
        if (!field.type.type) throw Error(`unknown type ${m2[1]} [${fn}]`)
      }

      if (field.type.type.isTemplate) {
        const m3 = m[3].match(/=> (?:(\w+)|unknown 0x([0-9a-f]+))$/)
        if (m3) {
          const name = m3[1] || `t${m3[2]}`
          field.type.child = {
            type: typeMap[name]
          }
          if (
            field.type.type === basicTypes.DT_POLYMORPHIC_VARIABLEARRAY &&
            !isClass(field.type.child.type)
          ) {
            field.type.child.type = typeMap.PolymorphicBase
          }
          if (!field.type.child.type)
            throw Error(`unknown type ${name} [${fn}]`)
        } else {
          field.type.child = {
            type: basicTypes.DT_INT
          }
        }
      }
      if (field.type.type.hasLength) {
        const m3 = m[3].match(/\[(\d+) array size\]/)
        if (!m3) throw Error(`no array size specified in ${line} [${fn}]`)
        field.type.length = parseInt(m3[1])
      }
      if (field.type.child) {
        if (field.type.child.type.isTemplate) {
          field.type.child.child = { type: basicTypes.DT_INT }
        }
        if (field.type.child.type.hasLength) {
          throw Error(`unknown subarray length in ${line} [${fn}]`)
        }
      }
      if (field.type.type.isSNO || field.type.child?.type.isSNO) {
        const m3 = m[3].match(/\{group 0x[0-9a-f]+ "(\w+)"\}/)
        const dst = field.type.type.isSNO
          ? field.type
          : (field.type.child as DataType)
        const name = m3 && snoDefinition(m3[1])
        const type = name && typeMap[name]
        if (!type) {
          dst.type = basicTypes.DT_INT
        } else {
          dst.child = {
            type: typeMap[name]
          }
        }
      }
      type.fields.push(field)
    }
  }
}

function sameDataType(a: DataType, b: DataType) {
  if (a.type !== b.type) return false
  if (a.length !== b.length) return false
  if (a.child || b.child) {
    if (!a.child || !b.child) return false
    if (!sameDataType(a.child, b.child)) return false
  }
  return true
}

function sameField(a: FieldDefinition, b: FieldDefinition) {
  return (
    a.name === b.name && a.offset === b.offset && sameDataType(a.type, b.type)
  )
}

for (const type of classList) {
  if (!type.parent) continue
  const fields = [...type.parent.inheritedFields, ...type.parent.fields]
  for (const field of fields) {
    const index = type.fields.findIndex((f) => sameField(f, field))
    if (index >= 0) {
      type.fields.splice(index, 1)
    }
    type.inheritedFields.push(field)
  }
  type.inheritedFields.sort((a, b) => a.offset - b.offset)
  type.fields.sort((a, b) => a.offset - b.offset)
}

const snoTypes: ClassDefinition[] = []

function registerType(type: ClassDefinition, name: string) {
  if (type.usedIn.has(name)) return
  type.usedIn.add(name)
  for (const sub of type.usedTypes()) {
    if (isClass(sub.type)) {
      registerType(sub.type, name)
    }
  }
}

for (const sno of fs.readdirSync(`./data/Base/meta`)) {
  if (sno === '.gitkeep') continue
  const type = typeMap[snoDefinition(sno)]
  if (!type || !isClass(type)) throw Error(`no definition found for ${sno}`)

  snoTypes.push(type)
  const prev = typeMap[sno]
  if (prev) {
    if (isClass(prev)) {
      prev.name = `${prev.name}_${prev.id}`
    } else {
      throw Error(`${sno} conflicts with basic type`)
    }
  }
  type.name = sno

  registerType(type, sno)
}

const polymorphic: ClassDefinition[] = []
const PolymorphicBase = typeMap.PolymorphicBase as ClassDefinition
for (const type of classList) {
  if (type.inheritsFrom(PolymorphicBase)) {
    polymorphic.push(type)
  }
}
for (const poly of polymorphic) {
  registerType(poly, 'polymorphic')
}

function createFile(
  types: ClassDefinition[],
  isCommon: boolean,
  defaultExport?: ClassDefinition,
  imports?: ClassDefinition[]
): string[] {
  const commonImports = new Set<string>()
  const classImports = new Set<string>(imports?.map((type) => type.name))
  const snoImports = new Set<string>()
  const typeOrder: ClassDefinition[] = []
  const processed = new Set<ClassDefinition>()

  const processType = (type: ClassDefinition) => {
    if (processed.has(type)) return
    processed.add(type)
    for (const sub of type.usedTypes()) {
      if (sub.type.commonImports) {
        for (const t of sub.type.commonImports) commonImports.add(t)
      }
      if (sub.type.isSNO && sub.child && isClass(sub.child.type)) {
        snoImports.add(sub.child.type.name)
      }
      if (isClass(sub.type)) {
        if (isCommon || sub.type.usedIn.size === 1) {
          processType(sub.type)
        } else {
          if (sub.type.name === 'TriggerConditions') debugger
          classImports.add(sub.type.name)
        }
      }
    }
    typeOrder.push(type)
  }
  for (const type of types) {
    processType(type)
  }
  for (const type of typeOrder) {
    snoImports.delete(type.name)
  }

  const lines: string[] = []
  lines.push(`import BinaryReader from '../reader.js'`)
  const createImports = (types: string[], file: string) => {
    let line = `import {`
    types = types.map(
      (type, index) => ` ${type}${index === types.length - 1 ? '' : ','}`
    )
    for (const type of types) {
      if (line.length + type.length > 100) {
        lines.push(line)
        line = ' '
      }
      line += type
    }
    line += ` } from '${file}'`
    lines.push(line)
  }
  if (commonImports.size) {
    createImports([...commonImports], './basic.js')
  }
  if (classImports.size) {
    createImports([...classImports], './common.js')
  }
  for (const sno of snoImports) {
    lines.push(`import ${sno} from './${sno}.js'`)
  }
  lines.push('')
  for (const type of typeOrder) {
    const prefix = type !== defaultExport ? 'export ' : 'export default '
    lines.push(...type.createDefinition(prefix))
  }
  return lines
}

const commonTypes = new Set<ClassDefinition>()
for (const type of classList) {
  if (type.usedIn.size > 1) {
    commonTypes.add(type)
  }
}

const commonLines = createFile([...commonTypes], true)
fs.writeFileSync('./types/common.ts', commonLines.join('\n'))

const polyCommon = [],
  polySingle = []
for (const type of polymorphic) {
  if (type.usedIn.size === 1) {
    polySingle.push(type)
  } else {
    polyCommon.push(type)
  }
}
const polyLines = createFile(polySingle, false, undefined, polyCommon)
polyLines.push(
  `export const polymorphicTypes: { [key: number]: new (reader: BinaryReader) => any } = {`
)
for (const type of polymorphic) {
  polyLines.push(`  0x${type.id.padStart(8, '0')}: ${type.name},`)
}
polyLines.push(`}`)
polyLines.push('')
fs.writeFileSync('./types/polymorphic.ts', polyLines.join('\n'))

for (const sno of snoTypes) {
  const lines = createFile([sno], false, sno)
  fs.writeFileSync(`./types/${sno.name}.ts`, lines.join('\n'))
}
