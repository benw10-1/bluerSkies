var view, map, fetched, city, zip, source, js_map
var dots = new Set()
const AQkey = "03e6687524e359bbf0987c0f2ede90cb945e4404"
// city and zip are global variables to store the original found location so we can compare later

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

    let m = new ol.Map({
        view: view,
        layers: [tileLayer, vector],
        target: 'js-map'
    })

    m.on("pointermove", event => {
        if (event.dragging) return

        const eventPix = map.getEventPixel(event.originalEvent)

        vector.getFeatures(eventPix).then(features => {
            for (i=0; i < features.length; i++) {
                let s = features[i].getStyle()
                console.log(s)
                let col = s.image.fill.color
                col[3] = 1
                features[i].setStyle(s)
            }
        })
    })
    return m
}

function goToCoord(lon, lat, onDone=() => {}) {
    if (map === undefined) {
        return
    }
    view.animate({
        center: ol.proj.fromLonLat([lon, lat]),
        duration: 2000
    })
    view.animate({
        zoom: 8,
        duration: 2000
    }, interrupted => {
        if (!interrupted) {
            view.setCenter(ol.proj.fromLonLat([lon, lat]))
            view.setZoom(8)
            return
        }
        onDone(Array.prototype.slice.call(arguments, 3))
    })
    
}

function isWater(lon, lat) {
    const blue = [170, 211, 223]

    var xy = map.getPixelFromCoordinate(ol.proj.fromLonLat([lon, lat]))

    var canvasContext = document.getElementById("js-map").querySelector("canvas").getContext('2d')

    let width = 5, height = 5

    let blues = 0

    const startX = xy[0] - Math.floor(width/2)
    const startY = xy[1] - Math.floor(height/2)

    for (vert = 0; vert < height; vert++) {
        for (hor = 0; hor < width; hor++) {
            xy = [hor + startX, vert + startY]
            pixelAtXY = canvasContext.getImageData(xy[0], xy[1], 1, 1).data
            for (i = 0; i < blue.length; i++) {
                if (blue[i] !== pixelAtXY[i]) {
                    blues++
                }
            }
        }
    }
    return blues <= width * height * 2/3
}

function zoom(z=4) {
    if (map === undefined) {
        return
    }
    map.getView().setZoom(z)
}

function getPolutionData(lon, lat) {
    let pollutionUrl = "https://api.waqi.info/feed/geo:" + lat + ";" + lon + "/?token=" + AQkey

    return fetch(pollutionUrl).then(response => {
        return response.json()
    }).catch(error => {
        console.log("error: ", error)
    }).then(result => {
        if (result.status !== "ok") return 
        result.data.latLon = [lat, lon]
        return result.data
    })
}

function getMapState() {
    if (!map) return
    let view =  map.getView()
    return {
        center: view.getCenter(), 
        zoom: view.getZoom(),
        x: view.getCenter()[0],
        y: view.getCenter()[1],
        interacting: view.getInteracting(),
        animating: view.getAnimating(),
        resolutionForZoom: view.getResolutionForZoom(view.getZoom()),
        resolution: view.getResolution()
    }
}

function drawDot(lon, lat, color=[220,220,220, .5], radius=15) {
    if (dots.has([lon, lat])) return
    let feature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat]))
    })
    color.push(.5)
    // var polygon = ol.geom.Polygon.circular([parseFloat(response[0].lon), parseFloat(response[0].lat)], 4000);
    let colorStyle = new ol.style.Style({
        image: new ol.style.Circle({
            radius: radius,
            fill: new ol.style.Fill({ 
                color: color
            })
        })
    })
    feature.setStyle(colorStyle)
    source.addFeature(feature)
    map.render()
    dots.add([lon, lat])
}

function drawGrid(size=9) {
    if (arguments[0] !== undefined) {
        size = arguments[0]
    }

    source.clear()

    let glbox = map.getView().calculateExtent(map.getSize())
    let box = ol.proj.transformExtent(glbox,'EPSG:3857','EPSG:4326')

    let right = box[2], left = box[0], top = box[3], bottom = box[1]
    
    // drawDot(right, top, [255, 0, 0, 255])
    // drawDot(left, bottom, [0, 255, 0, 255])
    // drawDot(right, bottom, [0, 0, 255, 255])
    // drawDot(left, top, [0, 0, 0, 255])

    const lonInc = (right - left)/size
    const latInc = (top - bottom)/size

    let counter = {done: false}
    let c = size**2
    var none = false

    waitForCond(counter, "done", () => {
        counter["done"] = (c === 0)
    }).then(() => {
        if (none) {
            alert("No stations in your area")
        }
    })
    const startLat = bottom + latInc/2
    const startLon = left + lonInc/2

    for (row = 0; row < size; row++) {
        for (column = 0; column < size; column++) {
            getPolutionData(startLon + lonInc * column, startLat + latInc * row).then(data => {
                c -= 1

                let [resLat, resLon] = data.latLon
                if (isWater(resLon, resLat)) return
                // if (resLat > top || resLon > right || resLat < bottom || resLon < left) return
                none = false

                if (data.iaqi["pm25"]){
                    val = data.iaqi["pm25"].v
                }
                else { 
                    val = 0 
                }
                let color = [Math.min(val * 2, 255), Math.max(255 - val * 2, 0), Math.min(Math.max(0, 2 * (val - 70)), 255)]

                drawDot(resLon, resLat, color)
            })
        }
    }
}

function waitForCond(obj, cond, update=() => {return obj}, state=true) {
    return new Promise(resolve => {
        function check(o) {
            if (o[cond] === state) {
                resolve()
            }
            else {
                update()
                setTimeout(check, 450, o)
            }
        }
        check(obj)
    })
}
