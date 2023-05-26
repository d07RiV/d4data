import fs from 'fs'
import { fileMap } from './file.js'

const typeName = process.argv[2]

async function exportType(typeName: string) {
  const { default: typeReader } = await import(`./types/${typeName}.js`)

  if (!fs.existsSync(`output/${typeName}`)) {
    fs.mkdirSync(`output/${typeName}`)
  }

  const files = Object.values(fileMap(typeReader))

  for (const f of files) {
    try {
      const data = { ...(f.data as any) }
      data.uid = f.uid
      fs.writeFileSync(
        `output/${typeName}/${f.name}.json`,
        JSON.stringify(data, undefined, 2)
      )
    } catch (e) {
      console.log(`failed to parse ${typeName}/${f.name}`)
      throw e
    }
  }

  console.log(typeName)
}

exportType(typeName)
