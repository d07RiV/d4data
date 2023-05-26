export interface TypeDefinition {
  fieldType: (type: DataType) => string
  readFunc: (type: DataType) => string
  getSize: (type: DataType) => number

  commonImports?: string[]
  isTemplate?: boolean
  hasLength?: boolean
  isSNO?: boolean
}

const basicType = (
  type: string,
  read: string,
  size: number
): TypeDefinition => ({
  fieldType: () => type,
  readFunc: () => `reader.${read}()`,
  getSize: () => size
})

export type DataType = {
  type: TypeDefinition
  length?: number
  child?: DataType
}

export const DT_FIXEDARRAY: TypeDefinition = {
  fieldType: ({ child }) => `${child!.type.fieldType(child!)}[]`,
  readFunc: ({ child, length }) =>
    `readFixedArray(reader, ${length}, reader => ${child!.type.readFunc(
      child!
    )})`,
  getSize: ({ child, length }) => child!.type.getSize(child!) * length!,
  commonImports: ['readFixedArray'],
  isTemplate: true,
  hasLength: true
}

export const DT_VARIABLEARRAY: TypeDefinition = {
  fieldType: ({ child }) => `${child!.type.fieldType(child!)}[]`,
  readFunc: ({ child }) =>
    `readVariableArray(reader, reader => ${child!.type.readFunc(child!)})`,
  getSize: () => 16,
  commonImports: ['readVariableArray'],
  isTemplate: true
}

export const DT_CHARARRAY: TypeDefinition = {
  fieldType: () => 'string',
  readFunc: ({ length }) => `reader.string(${length!})`,
  getSize: ({ length }) => length!,
  hasLength: true
}

export const DT_CSTRING: TypeDefinition = {
  fieldType: () => 'string',
  readFunc: () => 'readCString(reader)',
  getSize: () => 16,
  commonImports: ['readCString']
}

export const DT_STRING_FORMULA: TypeDefinition = {
  fieldType: () => 'StringFormula',
  readFunc: () => `new StringFormula(reader)`,
  getSize: () => 32,
  commonImports: ['StringFormula']
}

export const DT_POLYMORPHIC_VARIABLEARRAY: TypeDefinition = {
  fieldType: ({ child }) => `${child!.type.fieldType(child!)}[]`,
  readFunc: ({ child }) =>
    `readPolymorphicArray<${child!.type.fieldType(child!)}>(reader)`,
  getSize: () => 24,
  commonImports: ['readPolymorphicArray'],
  isTemplate: true
}

export const DT_ENUM = basicType('number', 'int32', 4)

export const DT_GBID = basicType('number', 'int32', 4)

export const DT_SNO: TypeDefinition = {
  fieldType: ({ child }) => `SNO<${child!.type.fieldType(child!)}>`,
  readFunc({ child }) {
    const type = child!.type.fieldType(child!)
    return `new SNO<${type}>(reader, ${type})`
  },
  getSize: () => 4,
  commonImports: ['SNO'],
  isSNO: true
}

export const DT_CHAR = basicType('number', 'int8', 1)
export const DT_BYTE = basicType('number', 'uint8', 1)
export const DT_UINT = basicType('number', 'uint32', 4)
export const DT_INT = basicType('number', 'int32', 4)
export const DT_UINT64 = basicType('number', 'uint64', 8)
export const DT_INT64 = basicType('number', 'int64', 8)
export const DT_WORD = basicType('number', 'int16', 2)
export const DT_FLOAT = basicType('number', 'single', 4)
export const DT_STARTLOC_NAME = basicType('number', 'uint32', 4)
export const DT_ACD_NETWORK_NAME = basicType('number', 'uint64', 8)
export const DT_SHARED_SERVER_DATA_ID = basicType('number', 'uint64', 8)

export const DT_SNO_NAME: TypeDefinition = {
  fieldType: () => '[number, number]',
  readFunc: () => `[reader.int32(), reader.int32()]`,
  getSize: () => 8
}

export const DT_BCVEC2I: TypeDefinition = {
  fieldType: () => '[number, number]',
  readFunc: () => '[reader.uint32(), reader.uint32()]',
  getSize: () => 8
}

export const DT_RGBACOLOR: TypeDefinition = {
  fieldType: () => 'Color',
  readFunc: () => `readColor(reader)`,
  getSize: () => 4,
  commonImports: ['Color', 'readColor']
}

export const DT_RGBACOLORVALUE: TypeDefinition = {
  fieldType: () => 'Color',
  readFunc: () => `readColorValue(reader)`,
  commonImports: ['Color', 'readColorValue'],
  getSize: () => 16
}

export const DT_OPTIONAL: TypeDefinition = {
  fieldType: ({ child }) => `Optional<${child!.type.fieldType(child!)}>`,
  readFunc: ({ child }) =>
    `readOptional(reader, reader => ${child!.type.readFunc(child!)})`,
  getSize: ({ child }) => 4 + child!.type.getSize(child!),
  commonImports: ['Optional', 'readOptional'],
  isTemplate: true
}

export const DT_VECTOR2D: TypeDefinition = {
  fieldType: () => 'Vector2D',
  readFunc: () => `readVector2D(reader)`,
  getSize: () => 8,
  commonImports: ['Vector2D', 'readVector2D']
}

export const DT_VECTOR3D: TypeDefinition = {
  fieldType: () => 'Vector3D',
  readFunc: () => `readVector3D(reader)`,
  getSize: () => 12,
  commonImports: ['Vector3D', 'readVector3D']
}

export const DT_VECTOR4D: TypeDefinition = {
  fieldType: () => 'Vector4D',
  readFunc: () => `readVector4D(reader)`,
  getSize: () => 16,
  commonImports: ['Vector4D', 'readVector4D']
}

export const DT_TAGMAP: TypeDefinition = {
  fieldType: ({ child }) => `${child!.type.fieldType(child!)}[]`,
  readFunc: ({ child }) =>
    `readFixedArray(reader, 4, reader => ${child!.type.readFunc(child!)})`,
  getSize: ({ child }) => 4 * child!.type.getSize(child!),
  commonImports: ['readFixedArray'],
  isTemplate: true
}

export const DT_RANGE: TypeDefinition = {
  fieldType: ({ child }) => `Range<${child!.type.fieldType(child!)}>`,
  readFunc: ({ child }) =>
    `{start: ${child!.type.readFunc(child!)}, end: ${child!.type.readFunc(
      child!
    )}}`,
  getSize: ({ child }) => 2 * child!.type.getSize(child!),
  commonImports: ['Range'],
  isTemplate: true
}

export const DT_NULL: TypeDefinition = {
  fieldType: () => 'null',
  readFunc: () => 'null',
  getSize: () => 0
}

export const basicTypes: { [name: string]: TypeDefinition } = {
  DT_FIXEDARRAY,
  DT_VARIABLEARRAY,
  DT_CHARARRAY,
  DT_CSTRING,
  DT_STRING_FORMULA,
  DT_POLYMORPHIC_VARIABLEARRAY,
  DT_ENUM,
  DT_GBID,
  DT_SNO,
  DT_CHAR,
  DT_BYTE,
  DT_UINT,
  DT_INT,
  DT_UINT64,
  DT_INT64,
  DT_WORD,
  DT_FLOAT,
  DT_STARTLOC_NAME,
  DT_ACD_NETWORK_NAME,
  DT_SHARED_SERVER_DATA_ID,
  DT_SNO_NAME,
  DT_BCVEC2I,
  DT_RGBACOLOR,
  DT_RGBACOLORVALUE,
  DT_OPTIONAL,
  DT_VECTOR2D,
  DT_VECTOR3D,
  DT_VECTOR4D,
  DT_TAGMAP,
  DT_RANGE,
  DT_NULL
}
