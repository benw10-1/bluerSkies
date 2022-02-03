window.onload = function () {
    container = document.getElementById('popup')
    content = document.getElementById('popup-content')
    closer = document.getElementById('popup-closer')

    closer.onclick = () => {
        overlay.setPosition(undefined)
        closer.blur()
        return false
    }
    map = generateMap()

    fetch("https://ipapi.co/json/").then(response => {
        return response.json()
    }).then(data => {
        let lat = data["latitude"], lon = data["longitude"]
        city = data.city ?? "Unnamed"
        zip = data.postal ?? "00000"

        if (lat && lon) {
            goToCoord(lon, lat, drawGrid)
            // waitForCond({animating: true}, "animating", getMapState, false).then(drawGrid)
        }
        

        
    }).catch(error => {
        let lat = 34.07440, lon = -117.40499
        zip = "90210"
        city = "Beverley Hills"
        goToCoord(lon, lat, drawGrid)
    })
}

window.addEventListener("keydown", function (event) {
    if (event.code == "Space") {
        // if (map !== undefined) {
        //     goToCoord(-96.21, 37.46)
        // }
        // Test code in this block
        drawGrid()
        // console.log(getMapState().resolution)
    }
})