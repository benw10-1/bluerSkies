window.onload = function () {
    container = document.getElementById('popup')
    content = document.getElementById('popup-content')
    search = document.getElementById('search')
    searchHist = document.querySelector(".searches")

    search.addEventListener("keydown", (event) => {
        return handleInput(search, event)
    })
    if (localStorage.getItem("searches")) searches = JSON.parse(localStorage.getItem("searches"))
    else {
        searches = {}
    }
    loadSearches(searches)

    map = generateMap()

    fetch("https://ipapi.co/json/", {mode:'cors'}).then(response => {
        return response.json()
    }).then(data => {
        let lat = data["latitude"], lon = data["longitude"]
        position = [lon, lat]
        city = data.city ?? "Unnamed"
        zip = data.postal ?? "00000"
        search.value = ""
        if (lat && lon) {
            getLocationData(city + " " + zip).then(data => {
                if (!data) throw Error("No location found")
                let box = data.boundingbox
                let left = box[2], right = box[3], bottom = box[0], top = box[1]
                goToCoord(data.lon, data.lat, [left, bottom], [right, top], drawGrid)
            })
        }
        else {
            throw Error("No location found")
        }
    }).catch(error => {
        let lat = 34.07440, lon = -117.40499
        position = [lon, lat]
        zip = "90210"
        city = "Beverly Hills"

        getLocationData(city).then(data => {
            let box = data.boundingbox
            let left = box[2], right = box[3], bottom = box[0], top = box[1]
            goToCoord(data.lon, data.lat, [left, bottom], [right, top], drawGrid)
        })
    })
}

window.addEventListener("keydown", event => {
    if (event.path[0].tagName === "BODY") {
        if (event.key === " ") {
            drawGrid()
        }
    }
})