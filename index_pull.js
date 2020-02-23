const config = require('config')
const { Pool, Query } = require('pg')
const fs = require('fs')
const ora = require('ora')

// constants
const host = config.get('host')
const port = config.get('port')
const user = config.get('user')
const password = config.get('password')
const database = config.get('database')
const relations = config.get('relations')
const blacklist = config.get('blacklist')
const dstPath = config.get('dstPath')

const createPool = () => {
  return new Pool({
    host: host,
    user: user,
    port: port,
    password: password,
    database: database
  })
}

const getCols = (pool, relation) => {
  return new Promise((resolve, reject) => {
    pool.connect(async (err, client, release) => {
      if (err) {
        release()
        reject(err)
      } else {
        let sql = `
SELECT column_name FROM information_schema.columns 
WHERE table_name='${relation}' ORDER BY ordinal_position
`
        let cols = await client.query(sql)
        cols = cols.rows.map(r => r.column_name).filter(r => r !== 'geom')
        cols = cols.filter(v => !blacklist.includes(v))
        cols.push('ST_AsGeoJSON(ST_MakeValid(geom))')
        release()
        resolve(cols)
      }
    })
  })
}

const pull = (pool, relation, cols, downstream) => {
  return new Promise((resolve, reject) => {
    pool.connect(async (err, client, release) => {
      if (err) {
        release()
        reject(err)
      } else {
        const sql = `SELECT ${cols.toString()} FROM ${relation}`
        const spinner = ora(sql).start()
        client.query(new Query(sql))
          .on('row', async row => {
            let f = {
              type: 'Feature',
              properties: row,
              geometry: JSON.parse(row.st_asgeojson)
            }
            delete f.properties.st_asgeojson
            f.properties._relation = relation
	    if (f.geometry !== null) {
              downstream.write(`\x1e${JSON.stringify(f)}\n`)
	    }
          })
          .on('error', err => {
            reject(err)
          })
          .on('end', async () => {
            release()
            spinner.succeed()
            resolve()
          })
      }
    })
  })
}

const main = async () => {
  const pool = createPool()
  const downstream = fs.createWriteStream(dstPath)
  for (const relation of relations) {
    const cols = await getCols(pool, relation)
    await pull(pool, relation, cols, downstream)
      .catch(e => {
        console.error(e.stack)
      })
  }
  downstream.close()
  console.log('complete.')
}

main()
