const geojsonArea = require('@mapbox/geojson-area')

const preProcess = (f) => {
  f.tippecanoe = {
    layer: 'other',
    minzoom: 15,
    maxzoom: 15
  }
  // name
  if (
    f.properties.hasOwnProperty('en_name') ||
    f.properties.hasOwnProperty('fr_name') ||
    f.properties.hasOwnProperty('es_name') ||
    f.properties.hasOwnProperty('pt_name') ||
    f.properties.hasOwnProperty('ar_name') ||
    f.properties.hasOwnProperty('int_name') ||
    f.properties.hasOwnProperty('name')
  ) {
    let name = ''
    if (f.properties['en_name']) {
      name = f.properties['en_name']
    } else if (f.properties['fr_name']) {
      name = f.properties['fr_name']
    } else if (f.properties['es_name']) {
      name = f.properties['es_name']
    } else if (f.properties['pt_name']) {
      name = f.properties['pt_name']
    } else if (f.properties['ar_name']) {
      name = f.properties['ar_name']
    } else if (f.properties['int_name']) {
      name = f.properties['int_name']
    } else {
      name = f.properties['name']
    }
    delete f.properties['en_name']
    delete f.properties['fr_name']
    delete f.properties['es_name']
    delete f.properties['pt_name']
    delete f.properties['ar_name']
    delete f.properties['int_name']
    delete f.properties['name']
    f.properties.name = name
  }
  return f
}

const postProcess = (f) => {
  delete f.properties['_database']
  delete f.properties['_table']
  return f
}

const flap = (f, defaultZ) => {
  switch (f.geometry.type) {
    case 'MultiPolygon':
    case 'Polygon':
      let mz = Math.floor(
        19 - Math.log2(geojsonArea.geometry(f.geometry)) / 2
      )
      if (mz > 15) { mz = 15 }
      if (mz < 6) { mz = 6 }
      return mz
    default:
      return defaultZ ? defaultZ : 10
  }
}

const minzoomRoad = (f) => {
  switch (f.properties.highway) {
    case 'path':
    case 'pedestrian':
    case 'footway':
    case 'cycleway':
    case 'living_street':
    case 'steps':
    case 'bridleway':
      return 15
    case 'residential':
    case 'service':
    case 'track':
    case 'unclassified':
      return 14
    case 'road':
    case 'tertiary_link':
      return 13
    case 'tertiary':
    case 'secondary_link':
      return 12
    case 'secondary':
    case 'primary_link':
      return 11
    case 'primary':
    case 'trunk_link':
      return 10
    case 'trunk':
    case 'motorway_link':
      return 8
    case 'motorway':
      return 6
    default:
      return 15
  }
}

const minzoomWater = (f) => {
  if (f.properties.natural === 'water') {
    return 6
  } else if (f.properties.natural === 'glacier') {
    return 6
  } else if (f.properties.natural === 'wetland') {
    return 8
  } else if (f.properties.waterway === 'riverbank') {
    return 15
  } else if (f.properties.landuse === 'basin') {
    return 13
  } else if (f.properties.landuse === 'reservoir') {
    return 13
  } else {
    throw new Error(`monzoomWater: ${f.properties}`)
  }
}

const osmPoi = (f) => {
  f.tippecanoe = {
    layer: 'place',
    minzoom: flap(f, 14),
    maxzoom: 15
  }
  return f
}

const lut = {
  // 1. nature
  un_glc30_global_lc_ss: f => {
    f.tippecanoe = {
      layer: 'nature',
      minzoom: 6,
      maxzoom: 8
    }
    return f
  },
  un_glc30_global_lc_ms: f => {
    f.tippecanoe = {
      layer: 'nature',
      minzoom: 9,
      maxzoom: 11
    }
    return f
  },
  un_mission_lc_ls: f => {
    f.tippecanoe = {
      layer: 'nature',
      minzoom: 12,
      maxzoom: 15
    }
    return f
  },
  osm_planet_landuse_natural_large: f => {
    f.tippecanoe = {
      layer: 'nature',
      minzoom: flap(f, 15),
      maxzoom: 15
    }
    switch (f.properties.fclass) {
      case 'heath':
        f.properties.natural = f.properties.fclass
        break
      case 'park':
      case 'common':
      // case 'recreation_ground':
        f.properties.leisure = f.properties.fclass
        break
      case 'meadow':
      case 'allotments':
      case 'recreation_ground':
      case 'orchard':
      case 'vineyard':
      case 'quarry':
        f.properties.landuse = f.properties.fclass
        break
      default:
        throw new Error(`osm_planet_landuse_natural_large: ${f.properties.fclass}`)
    }
    delete f.properties['fclass']
    return f
  },
  osm_planet_landuse_natural_medium: f => {
    f.tippecanoe = {
      layer: 'nature',
      minzoom: flap(f, 15),
      maxzoom: 15
    }
    switch (f.properties.fclass) {
      case 'forest':
      case 'farm':
      case 'farmyard':
      case 'farmland':
      case 'grass':
        f.properties.landuse = f.properties.fclass
        break
      case 'wood':
      case 'scrub':
        f.properties.natural = f.properties.fclass
        break
      default:
        throw new Error(`osm_planet_landuse_natural_medium: ${f.properties.fclass}`)
    }
    delete f.properties['fclass']
    return f
  },
  osm_planet_landuse_park_reserve: f => {
    f.tippecanoe = {
      layer: 'nature',
      minzoom: flap(f, 15),
      maxzoom: 15
    }
    switch (f.properties.fclass) {
      case 'national_park':
        f.properties.boundary = f.properties.fclass
        break
      case 'nature_reserve':
        f.properties.leisure = f.properties.fclass
        break
      default:
        throw new Error(`osm_planet_landuse_park_reserve: ${f.properties.fclass}`)
    }
    delete f.properties['fclass']
    return f
  },
  un_srtm90_global_hs_ss: f => {
    f.tippecanoe = {
      layer: 'nature',
      minzoom: 6,
      maxzoom: 7
    }
    return f
  },
  un_srtm30r_global_hs_ms: f => {
    f.tippecanoe = {
      layer: 'nature',
      minzoom: 8,
      maxzoom: 9
    }
    return f
  },
  // 2. water
  custom_planet_ocean_l08: f => {
    f.tippecanoe = {
      layer: 'water',
      minzoom: 6,
      maxzoom: 9
    }
    return f
  },
  custom_planet_ocean: f => {
    f.tippecanoe = {
      layer: 'water',
      minzoom: 10,
      maxzoom: 15
    } 
    return f
  },
  osm_planet_water: f => {
    switch (f.properties.fclass) {
      case 'water':
      case 'glacier':
      case 'wetland':
        f.properties.natural = f.properties.fclass
        break
      case 'riverbank':
        f.properties.waterway = f.properties.fclass
        break
      case 'basin':
      case 'reservoir':
        f.properties.landuse = f.properties.fclass
        break
    }
    f.tippecanoe = {
      layer: 'water',
      minzoom: minzoomWater(f),
      maxzoom: 15
    }
    delete f.properties['fclass']
    return f
  },
  custom_ne_rivers_lakecentrelines: f => {
    f.tippecanoe = {
      layer: 'water',
      minzoom: (f.properties.scalerank > 1) ? f.properties.scalerank : 10,
      maxzoom: 10
    }
    if (f.tippecanoe.minzoom > 10) f.tippecanoe.minzoom = 10
    return f
  },
  osm_planet_waterways_small: f => {
    f.tippecanoe = {
      layer: 'water',
      minzoom: 11,
      maxzoom: 13
    }
    f.properties.waterway = f.properties.fclass
    delete f.properties['fclass']
    return f
  },
  osm_planet_waterways_large: f => {
    f.tippecanoe = {
      layer: 'water',
      minzoom: 14,
      maxzoom: 15
    }
    f.properties.waterway = f.properties.fclass
    delete f.properties['fclass']
    return f
  },
  // 3. boundary
  unhq_bndl25: f => {
    f.tippecanoe = {
      layer: 'boundary',
      minzoom: 6,
      maxzoom: 7
    }
    return f
  },
  unhq_bndl05: f => {
    f.tippecanoe = {
      layer: 'boundary',
      minzoom: 8,
      maxzoom: 9
    }
    return f
  },
  unhq_bndl: f => {
    f.tippecanoe = {
      layer: 'boundary',
      minzoom: 10,
      maxzoom: 11
    }
    return f
  },
  custom_unmap_0_bndl_a1: f => {
    f.tippecanoe = {
      layer: 'boundary',
      minzoom: 12,
      maxzoom: 13
    }
    return f
  },
  custom_unmap_0_bndl_a2: f => {
    f.tippecanoe = {
      layer: 'boundary',
      minzoom: 14,
      maxzoom: 15
    }
    return f
  },
  // 4. road
  osm_planet_major_roads: f => {
    f.properties.highway = f.properties.fclass
    f.tippecanoe = {
      layer: 'road',
      minzoom: minzoomRoad(f),
      maxzoom: 15
    }
    delete f.properties['fclass']
    return f
  },
  osm_planet_minor_roads: f => {
    f.properties.highway = f.properties.fclass
    f.tippecanoe = {
      layer: 'road',
      minzoom: minzoomRoad(f),
      maxzoom: 15
    }
    delete f.properties['fclass']
    return f
  },
  un_unifil_roads: f => {
    f.tippecanoe = {
      layer: 'road',
      minzoom: 10,
      maxzoom: 15
    }
    return f
  },
  un_onuci_roads: f => {
    f.tippecanoe = {
      layer: 'road',
      minzoom: 10,
      maxzoom: 15
    }
    return f
  },
  un_unsos_roads: f => {
    f.tippecanoe = {
      layer: 'road',
      minzoom: 10,
      maxzoom: 15
    }
    return f
  },
  un_minusca_roads: f => {
    f.tippecanoe = {
      layer: 'road',
      minzoom: 10,
      maxzoom: 15
    }
    return f
  },
  // 5. railway
  osm_planet_railways: f => {
    f.tippecanoe = {
      layer: 'railway',
      minzoom: 10,
      maxzoom: 15
    }
    f.properties.railway = f.properties.fclass
    delete f.properties['fclass']
    return f
  },
  // 6. route
  osm_planet_ferries: f => {
    f.tippecanoe = {
      layer: 'route',
      minzoom: 11,
      maxzoom: 15
    }
    f.properties.route = f.properties.fclass
    delete f.properties['fclass']
    return f
  },
  // 7. structure
  osm_planet_runways: f => {
    f.tippecanoe = {
      layer: 'structure',
      minzoom: 10,
      maxzoom: 15
    }
    f.properties.aeroway = f.properties.fclass
    delete f.properties['fclass']
    return f
  },
  osm_planet_transport_areas: f => {
    f.tippecanoe = {
      layer: 'structure',
      minzoom: flap(f, 10),
      maxzoom: 15
    }
    switch (f.properties.fclass) {
      case 'airport':
      case 'bus_station':
      case 'ferry_terminal':
        f.properties.amenity = f.properties.fclass
        break
      case 'aerodrome':
      case 'airfield':
      case 'helipad':
      case 'aeroway':
        f.properties.aeroway = f.properties.fclass
        break
      case 'station':
      case 'halt':
      case 'tram_stop':
        f.properties.railway = f.properties.fclass
        break
      case 'stop_position':
        f.properties.public_transport = f.properties.fclass
        break
      case 'bus_stop':
        f.properties.highway = f.properties.fclass
        break
      default:
        throw new Error(`osm_planet_transport_areas: ${f.properties.fclass}`)
    }
    delete f.properties['fclass']
    return f
  },
  // 8. building
  osm_planet_landuse_urban: f => {
    f.tippecanoe = {
      layer: 'building',
      minzoom: flap(f, 12),
      maxzoom: 12
    }
    if (f.tippecanoe.minzoom > 12) f.tippecanoe.minzoom = 12
    f.properties.landuse = f.properties.fclass
    delete f.properties['fclass']
    return f
  },
  osm_planet_buildings_general: f => {
    f.tippecanoe = {
      layer: 'building',
      minzoom: flap(f, 15),
      maxzoom: 15
    }
    f.properties.building = f.properties.fclass
    delete f.properties['fclass']
    return f
  },
  // 9. place
  unhq_bndp: f => {
    f.tippecanoe = {
      layer: 'place',
      minzoom: 8,
      maxzoom: 15
    }
    f.properties._source = 'unhq_bndp' // FIXME
    return f
  },
  osm_planet_places_areas: f => {
    f.tippecanoe = {
      layer: 'place',
      minzoom: flap(f, 14),
      mazoom: 15
    }
    f.properties.place = f.properties.fclass
    delete f.properties['fclass']
    return f
  },
  osm_planet_pois_heritage: f => {
    switch (f.properties.fclass) {
      case 'theatre':
      case 'grave_yard':
        f.properties.amenity = f.properties.fclass
        break
      case 'museum':
        f.properties.tourism = f.properties.fclass
        break
      case 'monument':
      case 'memorial':
      case 'castle':
      case 'fort':
      case 'archaeological_site':
      case 'ruins':
      case 'cemetry':
        f.properties.historic = f.properties.fclass
        break
      default:
        throw new Error(`osm_planet_pois_heritage: ${f.properties.fclass}`)
    }
    delete f.properties['fclass']
    return osmPoi(f)
  },
  osm_planet_pois_other: f => {
    switch (f.properties.fclass) {
      case 'golf_course':
      case 'water_park':
      case 'pitch':
      case 'stadium':
      case 'sports_centre':
      case 'swimming_pool':
      case 'park':
      case 'playground':
        f.properties.leisure = f.properties.fclass
        break
      case 'zoo':
      case 'theme_park':
        f.properties.tourism = f.properties.fclass
        break
      case 'tower':
      case 'water_tower':
      case 'communications_tower':
      case 'windmill':
      case 'lighthouse':
        f.properties.man_made = f.properties.fclass
        break
      case 'car_repair':
      case 'supermarket':
      case 'kiosk':
      case 'department_store':
      case 'clothes':
      case 'books':
      case 'butcher':
      case 'beverages':
      case 'alcohol':
      case 'optician':
      case 'stationery':
      case 'mobile_phone':
      case 'greengrocer':
      case 'car':
      case 'furniture':
      case 'computer':
      case 'hairdresser':
      case 'bakery':
      case 'travel_agency':
        f.properties.shop = f.properties.fclass
        break
      case 'bank':
      case 'atm':
      case 'marketplace':
      case 'car_rental':
      case 'pharmacy':
      case 'waste_disposal':
        f.properties.amenity = f.properties.fclass
        break
      case 'swimming':
      case 'tennis':
        f.properties.sport = f.properties.fclass
        break
      case 'station':
        f.properties.power = f.properties.fclass
        break
      case 'landfill':
        f.properties.landuse = f.properties.fclass
        break
      default:
        throw new Error(`osm_planet_pois_other: ${f.properties.fclass}`)
    }
    delete f.properties['fclass']
    return osmPoi(f)
  },
  osm_planet_pois_public: f => {
    switch (f.properties.fclass) {
      case 'public_building':
      case 'townhall':
      case 'embassy':
      case 'courthouse':
      case 'police':
      case 'prison':
      case 'fire_station':
      case 'post_office':
      case 'social_facility':
      case 'customs':
        f.properties.amenity = f.properties.fclass
        break
      case 'government':
      case 'ngo':
        f.properties.office = f.properties.fclass
        break
      default:
        throw new Error(`osm_planet_pois_public: ${f.properties.fclass}`)
    }
    delete f.properties['fclass']
    return osmPoi(f)
  },
  osm_planet_pois_services: f => {
    switch (f.properties.fclass) {
      case 'shelter':
      case 'school':
      case 'college':
      case 'university':
      case 'hospital':
      case 'restaurant':
      case 'fast_food':
      case 'cafe':
      case 'food_court':
      case 'biergarten':
      case 'nightclub':
      case 'pub':
      case 'bar':
      case 'community_centre':
      case 'cinema':
      case 'library':
      case 'arts_centre':
      case 'money_transfer':
      case 'bureau_de_change':
        f.properties.amenity = f.properties.fclass
        break
      case 'bed_and_breakfast':
      case 'hotel':
      case 'motel':
      case 'guest_house':
      case 'hostel':
      case 'chalet':
        f.properties.tourism = f.properties.fclass
        break
      default:
        throw new Error(`osm_planet_pois_services: ${f.properties.fclass}`)
    }
    delete f.properties['fclass']
    return osmPoi(f)
  },
  osm_planet_pois_traffic: f => {
    switch (f.properties.fclass) {
      case 'fuel':
        f.properties.amenity = f.properties.fclass
        break
      default:
        throw new Error(`osm_planet_pois_traffic: ${f.properties.fclass}`)
    }
    delete f.properties['fclass']
    return osmPoi(f)
  },
  osm_planet_pois_transport: f => {
    switch (f.properties.fclass) {
      case 'airport':
      case 'bus_station':
      case 'ferry_terminal':
      case 'parking':
        f.properties.amenity = f.properties.fclass
        break
      case 'aerodrome':
      case 'airfield':
      case 'helipad':
      case 'aeroway':
        f.properties.aeroway = f.properties.fclass
        break
      case 'station':
      case 'halt':
      case 'tram_stop':
        f.properties.railway = f.properties.fclass
        break
      case 'stop_position':
        f.properties.public_transport = f.properties.fclass
        break
      case 'bus_stop':
        f.properties.highway = f.properties.fclass
        break
      default:
        throw new Error(`osm_planet_pois_transport: ${f.properties.fclass}`)
    }
    delete f.properties['fclass']
    return osmPoi(f)
  },
  osm_planet_pois_water: f => {
    switch (f.properties.fclass) {
      case 'drinking_water':
        f.properties.amenity = f.properties.fclass
        break
      case 'wastewater_plant':
      case 'watermill':
      case 'water_works':
      case 'water_well':
      case 'storage_tank':
        f.properties.man_made = f.properties.fclass
        break
      default:
        throw new Error(`osm_planet_pois_water: ${f.properties.fclass}`)
    }
    delete f.properties['fclass']
    return osmPoi(f)
  },
  osm_planet_pois_worship: f => {
    switch (f.properties.fclass) {
      case 'christian':
      case 'jewish':
      case 'muslim':
      case 'buddhist':
      case 'hindu':
      case 'taoist':
      case 'shintoist':
      case 'sikh':
        f.properties.religion = f.properties.fclass
        break
      default:
        throw new Error(`osm_planet_pois_worship: ${f.properties.fclass}`)
    }
    delete f.properties['fclass']
    return osmPoi(f)
  },
  unhq_popp: f => {
    f.tippecanoe = {
      layer: 'place',
      minzoom: 8,
      maxzoom: 15
    }
    f.properties._source = 'unhq_popp'
    return f
  },
  un_global_places: f => {
    f.tippecanoe = {
      layer: 'place',
      minzoom: 8,
      maxzoom: 15
    }
    f.properties._source = 'un_global_places'
    return f
  },
  un_global_pois: f => {
    f.tippecanoe = {
      layer: 'place',
      minzoom: 8,
      maxzoom: 15
    }
    f.properties._source = 'un_global_pois'
    return f
  }
}

module.exports = (f) => {
  return postProcess(lut[f.properties._table](preProcess(f)))
}
