window.onload = function () {
    map = generateMap()
    fetch("https://ipapi.co/json/").then(response => {
        return response.json()
    }).then(data => {
        let lat = data["latitude"], lon = data["longitude"], 
            city = data.city ?? "Unnamed", zip = data.postal ?? "00000"
        if (lat && lon) {
            goToCoord(lon, lat, drawStations)
            // waitForCond({animating: true}, "animating", getMapState, false).then(drawGrid)
        }        
    })
}

window.addEventListener("keydown", function (event) {
    if (event.code == "Space") {
        // if (map !== undefined) {
        //     goToCoord(-96.21, 37.46)
        // }
        // Test code in this block
        drawStations()
        // console.log(getMapState().resolution)
    }
})