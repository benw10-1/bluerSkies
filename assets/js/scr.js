window.onload = function () {
    container = document.getElementById('popup')
    content = document.getElementById('popup-content')
    search = document.getElementById('')


    map = generateMap()

    fetch("https://ipapi.co/json/", {mode:'cors'}).then(response => {
        return response.json()
    }).then(data => {
        let lat = data["latitude"], lon = data["longitude"]
        city = data.city ?? "Unnamed"
        zip = data.postal ?? "00000"

        if (lat && lon) {
            goToCoord(lon, lat, drawGrid)
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
        drawGrid()
        // console.log(getMapState().resolution)
    }
})