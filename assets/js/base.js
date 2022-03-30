var view, map, fetched, city, zip, source, js_map, highlighted, old, container, content, closer, overlay, popped, circleRad, first, search, oHeight, oWidth, loading, position, zoom, searches, searchHist, key

const dotsAmt = 9
const AQkey = "03e6687524e359bbf0987c0f2ede90cb945e4404"
const constRad = 15
const pollTypes = ["pm25", "no2", "co", "so2", "nh3", "o3", "pm10"]
const pollVals = ["<strong>PM<sub>2.5</sub></strong> : ", "<strong>NO<sub>2</sub></strong> : ", "<strong>CO</strong> : ", "<strong>SO<sub>2</sub></strong> : ", "<strong>NH<sub>3</sub></strong> : ", "<strong>O<sub>3</sub></strong> : ", "<strong>PM<sub>10</sub></strong> : "]
const allowedKeys = ["ArrowRight", "ArrowLeft", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "Enter", "Shift", " ", ",", 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', "-"]
const searchCollumn = '<div class="column" id="search-column"> <div class="map-container"> <div class="search-history"> <div class="search-header"> <p>Search History</p> </div> <div class="searches"> </div> </div> </div> </div>'

const average = arr => {
    if (typeof arr !== "object" || !arr.reduce) return arr
    return arr.reduce((a,b) => a + b, 0) / arr.length 
}
function generateMap() {
    view = new ol.View({
        center: ol.proj.fromLonLat([-96.21, 37.46]),
        zoom: 4
    })
    tileLayer = new ol.layer.Tile({
        preload: 4,
        source: new ol.source.OSM()
    })
    source = new ol.source.Vector()
    vector = new ol.layer.Vector({
        source: source,
        updateWhileAnimating: true,
        updateWhileInteracting: true
    })
    overlay = new ol.Overlay({
        element: container,
        autoPan: {
            animation: {
                duration: 250,
            }
        }
    })

    let m = new ol.Map({
        view: view,
        overlays: [overlay],
        layers: [tileLayer, vector],
        target: 'js-map'
    })

    m.on("pointermove", onMove)
    return m
}

function loadSearches(obj) {
    for (const k in obj) {
        let container = document.createElement("div")
        container.classList.add("search")
        container.name = k

        container.addEventListener("click", handleClick)

        let bold = document.createElement("p")
        bold.classList.add("search-name")
        bold.innerHTML = k
        container.appendChild(bold)

        let info = document.createElement("p")
        info.innerHTML = ""
        info.classList.add("info")

        let inner = ""

        for (const prop in obj[k]) {
            inner += prop + Math.round(average(obj[k][prop])) + "  "
        }
        info.innerHTML = inner

        container.appendChild(info)

        searchHist.appendChild(container)
    }
}

function onMove(event) {
    if (event.dragging) return
    if (highlighted) {
        highlighted.setStyle(old)
    }
    highlighted = undefined
    const eventPix = map.getEventPixel(event.originalEvent)
    let counter = 0

    map.forEachFeatureAtPixel(eventPix, (feature, layer) => {
        if (!feature) return
        if (highlighted) return
        const col = [37, 122, 253, .5]

        let imgFill = feature.getStyle()

        let colorStyle = new ol.style.Style({
            image: new ol.style.Circle({
                radius: circleRad,
                fill: new ol.style.Fill({
                    color: col
                })
            })
        })

        feature.setStyle(colorStyle)

        feature.setStyle(function (feature, resolution) {
            colorStyle.getImage().setScale(map.getView().getResolutionForZoom(zoom) / resolution)
            return colorStyle
        })

        let ext = feature.getGeometry().getExtent();
        let coordinate = ol.extent.getCenter(ext)

        popupInfo(coordinate, feature.get("pollutionInfo"))

        old = imgFill
        highlighted = feature
        counter++
    })

    if (!counter) {
        clearPopup()
        map.getViewport().style.cursor = 'inherit'
    }
    else {
        map.getViewport().style.cursor = 'pointer'
    }
}

function popupInfo(pos, info) {
    if (popped || !info) return
    overlay.setPosition(pos)

    content.innerHTML = ""

    for (i = 0; i < info.length; i++) {
        let p = document.createElement("p")
        p.innerHTML = info[i][0] + info[i][1]

        content.appendChild(p)
    }
    popped = true
}

function clearPopup() {
    overlay.setPosition(undefined)
    popped = false
}

function searchLocation(location) {
    if (loading) return
    getLocationData(location).then(data => {
        if (!data) return
        let box = data.boundingbox
        let left = box[2], right = box[3], bottom = box[0], top = box[1]
        goToCoord(data.lon, data.lat, [left, bottom], [right, top], drawGrid)
    })
}

function goToCoord(lon, lat, min, max, onDone = () => { }) {
    if (map === undefined) {
        return
    }

    setLoading(true)
    setInteractions(false)
    source.clear()

    setZoomLevel(min, max)

    view.animate({
        center: ol.proj.fromLonLat([lon, lat]),
        zoom: zoom,
        duration: 2000
    }, finished => {
        setInteractions(true)
        setLoading(false)
        onDone()
    })
}
// left-bottom, right-top [LON, LAT]
function setZoomLevel(min, max) {
    let storedExtent = map.getView().calculateExtent(map.getSize())

    let points = [ol.proj.fromLonLat(min), ol.proj.fromLonLat(max), ol.proj.fromLonLat([max[0], min[1]]), ol.proj.fromLonLat([min[0], max[1]])]

    let geo = new ol.geom.Polygon([points], "XY")
    
    map.getView().fit(geo)

    zoom = Math.max(Math.min(map.getView().getZoom(), 14), 4)

    map.getView().fit(storedExtent)
}

function setInteractions(active) {
    let plus = document.querySelector(".ol-zoom-in")
    let minus = document.querySelector(".ol-zoom-out")

    plus.disabled = !active
    minus.disabled = !active

    map.getInteractions().forEach(function (interaction) {
        interaction.setActive(active)
    }, this)
}

function isWater(lon, lat) {
    const blue = [170, 211, 223]

    var xy = map.getPixelFromCoordinate(ol.proj.fromLonLat([lon, lat]))

    var canvasContext = document.getElementById("js-map").querySelector("canvas").getContext('2d')

    let width = 10, height = 10

    let not_blues = 0

    const startX = xy[0] - Math.floor(width / 2)
    const startY = xy[1] - Math.floor(height / 2)

    for (vert = 0; vert < height; vert++) {
        for (hor = 0; hor < width; hor++) {
            xy = [hor + startX, vert + startY]
            pixelAtXY = canvasContext.getImageData(xy[0], xy[1], 1, 1).data
            for (i = 0; i < blue.length; i++) {
                if (blue[i] !== pixelAtXY[i]) {
                    not_blues++
                    break
                }
            }

        }
    }
    return width * height * .9 >= not_blues
}

function getLocationData() {
    let url

    if (arguments.length === 2) {
        url = "https://api.waqi.info/feed/geo:" + arguments[1] + ";" + arguments[0] + "/?token=" + AQkey
    }
    else {
        setLoading(true)
        if (arguments[0].length === 5 && parseInt(arguments[0]) !== NaN) {
            arguments[0] = arguments[0] + " USA"
        }
        url = "https://nominatim.openstreetmap.org/search?q=" + arguments[0] + "&country=USA&format=json"
    }
    return fetch(url).then(response => {
        return response.json()
    }).catch(error => {
        console.log("error: ", error)
    }).then(result => {
        if (result instanceof Array) {
            let imp = 0
            let imp_i = 0
            for (const i in result) {
                if (result[i].importance >= imp) {
                    imp = result[i].importance
                    imp_i = i
                }
            }

            updateHistoryEl(result[imp_i].display_name.split(",").slice(0, 3).join(","))
            return result[imp_i]
        }
        
        if (result.status !== "ok") return
        result.data.lonLat = [arguments[0], arguments[1]]
        return result.data
    })
}

function handleClick() {
    let loc = this.name
    search.value = loc
    searchLocation(loc)
}

function updateHistoryEl(data) {
    if (typeof data === "string") {
        key = data
        if (searches.hasOwnProperty(data)) return
        searches[data] = {}

        let container = document.createElement("div")
        container.classList.add("search")
        container.name = data

        container.addEventListener("click", handleClick)

        let bold = document.createElement("p")
        bold.classList.add("search-name")
        bold.innerHTML = data
        container.appendChild(bold)

        searchHist.appendChild(container)
    }
    else {
        for (const i in searchHist.children) {
            let child = searchHist.children[i]
            if (child.name === key) {
                if (child.children.length === 1) {
                    let info = document.createElement("p")
                    info.innerHTML = ""
                    info.classList.add("info")
                    child.appendChild(info)
                }

                let temp = {}
                let inner = ""
                for (const i in data) {
                    for (const G in data[i]) {
                        if (temp.hasOwnProperty(data[i][G][0])) data[i][0].push(data[i][G][1])
                        else temp[data[i][G][0]] = [data[i][G][1]]
                    }
                }
                for (const k in temp) {
                    inner += k + Math.round(average(temp[k])) + "  "
                }
                child.children[1].innerHTML = inner
                searches[key] = temp
                break
            }
        }
    }
    localStorage.setItem("searches", JSON.stringify(searches))
}

function getMapState() {
    if (!map) return
    let view = map.getView()
    return {
        center: view.getCenter(),
        zoom: view.getZoom(),
        lon: view.getCenter()[0],
        lat: view.getCenter()[1],
        interacting: view.getInteracting(),
        animating: view.getAnimating(),
        resolutionForZoom: view.getResolutionForZoom(view.getZoom()),
        resolution: view.getResolution()
    }
}

function setLoading(state) {
    if (state) {
        search.parentElement.classList.add("is-loading")
    }
    else {
        search.parentElement.classList.remove("is-loading")
    }
    loading = state
}

function drawDot(lon, lat, color = [220, 220, 220, .5], data = null) {
    let feature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat]))
    })

    let colorStyle = new ol.style.Style({
        image: new ol.style.Circle({
            radius: circleRad ?? constRad,
            fill: new ol.style.Fill({
                color: color
            })
        })
    })

    if (data) {
        feature.set("pollutionInfo", data, true)
    }

    feature.setStyle(colorStyle)

    feature.setStyle(function (feature, resolution) {
        colorStyle.getImage().setScale(map.getView().getResolutionForZoom(zoom) / resolution)
        return colorStyle
    })

    source.addFeature(feature)

    return feature
}

function drawGrid() {
    source.clear()
    setLoading(true)

    let glbox = map.getView().calculateExtent(map.getSize())
    let box = ol.proj.transformExtent(glbox, 'EPSG:3857', 'EPSG:4326')

    let right = box[2], left = box[0], top = box[3], bottom = box[1]

    let width = right - left
    let height = top - bottom

    const rowSize = dotsAmt
    const columnSize = dotsAmt * Math.round((width / height))

    let c = rowSize * columnSize

    circleRad = constRad / (map.getView().getResolutionForZoom(zoom) / getMapState().resolution)

    const lonInc = width / columnSize
    const latInc = height / rowSize

    const startLat = bottom + latInc / 2
    const startLon = left + lonInc / 2

    let forHist = []
    
    for (row = 0; row < rowSize; row++) {
        for (column = 0; column < columnSize; column++) {
            getLocationData(startLon + lonInc * column, startLat + latInc * row).then(data => {
                if (!data) return

                let [resLon, resLat] = data.lonLat
                if (isWater(resLon, resLat)) {
                    return
                }

                let d = []
                let val

                for (i = 0; i < pollTypes.length; i++) {
                    if (data["iaqi"].hasOwnProperty(pollTypes[i])) {
                        if (pollTypes[i] === "pm25") val = data["iaqi"][pollTypes[i]].v
                        d.push([pollVals[i], data["iaqi"][pollTypes[i]].v])
                    }
                }
                if (!val && data["aqi"]) {
                    val = data["aqi"]
                    d.push([pollVals[0], data["aqi"]])
                }
                forHist.push(d)

                let color = [Math.min(val * 2, 255), Math.max(255 - val * 2, 0), Math.min(Math.max(0, 2 * (val - 70)), 255), .5]

                drawDot(resLon, resLat, color, d)
            }).then(() => {
                c -= 1
                if (c === 0) {
                    updateHistoryEl(forHist)
                    setLoading(false)
                }
            })
        }
    }
}

function handleInput(el, event) {
    if (event.key === "Backspace") return

    if (allowedKeys.indexOf(event.key) < 0) event.preventDefault()

    if (event.key === "Enter" && !loading) searchLocation(el.value)
}

// 0-lon 1-lat
function getDistanceLonLat(pos1, pos2) {
    let temp = pos1[0]
    pos1[0] = pos1[1]
    pos1[0] = temp

    temp = pos2[0]
    pos2[0] = pos2[1]
    pos2[0] = temp

    const R = 6371

    let [dLat, dLon] = [(pos2[0] - pos1[0]) * (Math.PI / 180), (pos2[1] - pos1[1]) * (Math.PI / 180)]

    let a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos((pos1[0]) * (Math.PI / 180)) * Math.cos((pos2[0]) * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2)

    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    // radius of the earth times circumference section of a sphere between "coordinates" pos1 and pos2
    return R * c
}
