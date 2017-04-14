#! node

const fs           = require('fs')
const vm           = require('vm')
const d3           = Object.assign({}, require('d3'), require('d3-geo-projection'))
const d3_composite = require('d3-composite-projections')
const readline     = require('readline')
const chalk        = require('chalk')
const topojson     = require('topojson')
const program      = require('commander')

const quantitize      = 1e5
const OUTPUT_DIR      = './static/geodata/'
const OUTPUT_GEO_DIR  = './static/geodata/geojson/'
const OUTPUT_TOPO_DIR = './static/geodata/topojson/'


// Log in the same place (erase/write)
const logProgress = progress => {
  process.stdout.clearLine()
  process.stdout.cursorTo(0)
  process.stdout.write(chalk.gray(`${progress}`))
}


// Create file and replace if it exists.
const exportFile = (data, filepath) => {
  fs.writeFileSync(
    filepath,
    JSON.stringify(data) + '\n',
    {flag: 'w+'} // rewrite flag
  )

  console.log(chalk.yellow(`Exported into`, chalk.bold(filepath)))
}


const export2geo = (data, filename) => {
  exportFile(data, OUTPUT_GEO_DIR + filename)
}


const export2topo = (data, filename) => {
  let topo = topojson.topology({area: data}, quantitize)
  topojson.presimplify(topo)
  exportFile(topo, OUTPUT_TOPO_DIR + filename)
}


// Recursive export nest (groupby) function
const exportNest = (nest, prefix = 'country') => {
  let collection = {type: 'FeatureCollection', features: []}
  nest.map( n => {
    // console.log(chalk.red('N'), n);
    if (n.values !== undefined) {
      exportNest(n.values, n.key)
    }

    if (n.type === 'Feature') {
      collection.features.push(n)
    }

    if (n.value && n.value.type === 'MultiPolygon') {
      collection.features.push({
        'type': 'Feature',
        'geometry': {
          'type': n.value.type,
          'coordinates': n.value.coordinates
        },
        'properties': n.value.properties,
      })
    }

  })

  if (collection.features.length > 0) {
    export2geo(collection, `${prefix}.json`)
    export2topo(collection, `${prefix}.json`)
  }
}


/*****************/
/* HANDLE PROMPT */
program
.version('0.0.1')
.option('--geoconic', 'Use d3\'s geoConicConformal projection')
.option('--export', 'Export all intermediate steps')
.option('-d, --dpt', 'Export 1 file merged by "dpt" key')
.parse(process.argv);

if (program.args.length !== 1) {
  program.outputHelp();
  process.exit(1);
}
/**************/


/*********/
/* MAIN */
let main = {

  // Attributes
  attr: {
    origin: {
      path: program.args[0],
      filename: program.args[0].match(/[^\\/]+$/)[0],
      get filenameClean () {
        return this.filename.replace(/\.[^/.]+$/, '')
      },
      get obj () {
        return JSON.parse(fs.readFileSync(this.path).toString())
      }
    },

    projections: {
      geoConicConformalFrance: d3_composite.geoConicConformalFrance(),
      geoConicConformal: d3.geoConicConformal(),
      get using () {
        return this[this.usingName]
      },
      get usingName () {
        return program.geoconic === true ? 'geoConicConformal' : 'geoConicConformalFrance'
      }
    },

    get baseName () {
      return `${this.origin.filenameClean}.${this.projections.usingName}`
    },
    get reprojectFile () {
      return `${this.baseName}.geojson`
    },
    get splitFile () {
      return `${this.baseName}.ndjson`
    },
    get cleanFile () {
      return `${this.baseName}.cleaned.ndjson`
    },
    get geojsonFile () {
      return `${this.baseName}.cleaned.geojson`
    },
    get topojsonFile () {
      return `${this.baseName}.topojson`
    },
    get simplifyFile () {
      return `${this.baseName}.simplified.topojson`
    },


    colorIndex: 1,
    colorStore: {},
    idStore: {}
  },


  // Main function that holds the reprojection cycle.
  start () {
    console.log(chalk.bgGreen(`REPROJECT ${this.attr.origin.filename}`))

    let start = this.clock()
    let cycle = new Promise((resolve, reject) => resolve(this.reproject()))

    cycle
    .then( reprojection => this.nextStep('splitByFeature', reprojection))
    .then( ndjson => this.nextStep('cleanProperties', ndjson))
    .then( cleaned => this.nextStep('saveIdColors', cleaned))
    .then( cleaned => this.nextStep('nd2geo', cleaned))
    .then( geojson => this.nextStepLinked(
      'groupByCitiesByDpt',
      exportNest,
      geojson
    ))
    // .then( geojson => this.nextStep('geo2topo', geojson))
    // .then( topology => this.nextStepLinked(
    //   'groupByReg',
    //   exportNest,
    //   topology
    // ))
    // .then( topology => this.nextStepLinked(
    //   'groupByDptByReg',
    //   exportNest,
    //   topology
    // ))
    .then (_ => this.nextStep('exportList'))
    .then( _ => {
      console.log(chalk.bgGreen('Conversion complete.'))
      console.log(chalk.green(`reproject in ${this.clock(start)/1000}s`))
    })
  },


  nextStep (funcName, arg) {
    console.log(chalk.inverse(funcName))
    let start = this.clock()

    return new Promise ( (resolve, reject) => {
      let result = this[funcName](arg)
      console.log(chalk.blue(chalk.bold(funcName), `in ${this.clock(start)}ms`))
      resolve(result)
    })
  },


  nextStepLinked (func, postFunc, arg) {
    return this.nextStep(func, arg)
    .then(result => postFunc(result))
    .then( _ => arg)
  },


  // Project geojson data into antother one
  reproject () {
    console.log(chalk.inverse(`reproject`))
    console.log(chalk.white(`d3.geoProject using ${this.attr.projections.usingName}...`))
    let start = this.clock()

    let reprojection = d3.geoProject(this.attr.origin.obj, this.attr.projections.using)

    console.log(chalk.blue(`reproject in ${this.clock(start)}ms`))

    return reprojection
  },


  // Split by features to speed up processing
  splitByFeature (reprojection) {
    console.log(chalk.white('Split by feature to speed up processing...'))

    return reprojection.features
  },


  // Removes unnecessary data, focus on unique INSEE_COM, CODE_DEPT, and CODE_REG
  cleanProperties (ndFeatures) {
    console.log(chalk.white('Remove unnecessary data to light file...'))

    let to3Car = code => {
      code = code + ''
      if (code.length > 3) return code.slice(0, 3)
      for (var i = code.length; i < 3; i++) { code = 0 + code }
      return code
    }

    let formatLenght = (length, code) => {
      code = code + ''
      if (code.length > length) return code.slice(0, length)
      for (var i = code.length; i < length; i++) { code = 0 + code }
      return code
    }

    let cleaned = ndFeatures.map((f, i) => {
      logProgress(`cleaning feature ${i}`)
      let prop = {
        cit: `cit_${formatLenght(6, f.properties.INSEE_COM)}`,
        // prefix to prevent confusion with reg, and distinct between DOM
        dpt: `dpt_${formatLenght(3, f.properties.CODE_DEPT)}`,
        // dpt: `dpt_${formatLenght(3, f.properties.CODE_DEPT)}_${f.properties.NOM_DEPT.slice(0, 3)}`,
        reg: `reg_${formatLenght(3, f.properties.CODE_REG)}`
      }


      this.saveIdProp(f, prop)

      f.properties = {}
      f.properties = prop
      delete f.id
      return f
    })
    console.log() // linebreak

    return cleaned
  },


  // Converts ndjson to geojson
  nd2geo (cleaned) {
    console.log(chalk.white('Converting .ndjson into .geojson...'))

    let collection = {type: 'FeatureCollection', features: []}

    collection.features = cleaned.map( (f, i) => {
      logProgress(`converting feature ${i}`)
      if (f.type === 'Feature') return f
      else console.log(chalk.bgRed(`non feature detected in line ${i}`))
    })
    console.log() // linebreak

    return collection
  },


  // Converts geojson to topojson https://github.com/topojson/topojson-server/blob/master/README.md#topology
  geo2topo (collection, quantization = true) {
    console.log(chalk.white('Converting .geojson into .topojson...'))

    let topology
    if (quantization){
      topology = topojson.topology({cities: collection}, quantitize)
    } else {
      topology = topojson.topology({region: collection})
    }

    return topology
  },


  // Generate a nest keyed by region
  groupByReg (topology) {
    console.log(chalk.white('Splitting country by region'))
    return d3.nest()
    .key(d => d.properties.reg)
    .rollup(group => {
      let prop = group[0].properties
      let topo = topojson.merge(topology, group)
      topo.properties = {
        reg: prop.reg
      }

      return topo
    })
    .entries(topology.objects.cities.geometries)
  },


  // Generate a nest keyed by region and by department
  groupByDptByReg (topology) {
    console.log(chalk.white('Splitting regions by dpt'))

    return d3.nest()
    .key(d => d.properties.reg)
    .key(d => d.properties.dpt)
    .rollup(group => {
      let prop = group[0].properties
      let topo = topojson.merge(topology, group)
      topo.properties = {
        reg: prop.reg,
        dpt: prop.dpt
      }

      return topo
    })
    .entries(topology.objects.cities.geometries)
  },


  // Generate one file by department, containing all cities
  groupByCitiesByDpt (geojson) {
    console.log(chalk.white('Splitting dpt by cities'))
    // console.log('groupByCitiesByDpt', geojson);
    return d3.nest()
    .key(d => d.properties.reg)
    .key(d => d.properties.dpt)
    .entries(geojson.features)
  },


  genColor () {
    var ret = [];
    // via http://stackoverflow.com/a/15804183
    if(this.attr.colorIndex < 16777215){
      ret.push(this.attr.colorIndex & 0xff) // R
      ret.push((this.attr.colorIndex & 0xff00) >> 8) // G
      ret.push((this.attr.colorIndex & 0xff0000) >> 16) // B

      this.attr.colorIndex++
    }
    var col = `rgb(${ret.join(',')})`
    return col
  },


  saveIdColors (cleaned) {
    cleaned.map( f => {
      Object.keys(f.properties).map( key => {
        if (this.attr.idStore[f.properties[key]] !== undefined) return

        let color = this.genColor()
        this.attr.idStore[f.properties[key]] = color
        this.attr.colorStore[color] = f.properties[key]
      })
    })

    return cleaned
  },


  saveIdProp (feature, prop) {
    Object.keys(prop).map( key => {
      if (this.attr.idStore[prop[key]] !== undefined) return

      let color = this.genColor()
      let ref = key.slice(0, 3)
      let name
      try {
        switch (ref) {
          case 'cit':{
            name = feature.properties.NOM_COM
            break;
          }
          case 'dpt':{
            name = feature.properties.NOM_DEPT
            break;
          }
          case 'reg':{
            name = feature.properties.NOM_REG
            break;
          }
        }
      } catch (e) {
        console.error('ERROR');
        console.log(e);
      } finally {

      }

      this.attr.idStore[prop[key]] = {
        color: color,
        name: name
      }
      this.attr.colorStore[color] = prop[key]
    })
  },


  exportList () {
    exportFile(this.attr.idStore, `${OUTPUT_DIR}idStore.json`)
    exportFile(this.attr.colorStore, `${OUTPUT_DIR}colorStore.json`)
  },


  // Mesure execution time between two moments, in ms.
  clock (start) {
    if ( !start ) return process.hrtime()
    var end = process.hrtime(start)
    return Math.round((end[0]*1000) + (end[1]/1000000))
  }
}
/**********/


main.start()
