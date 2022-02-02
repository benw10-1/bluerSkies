/*TO DO*/

/*add zip code getter, redraw at new area*/
/*add local storage usage*/
/*display the num grid over the map, unless we use the num grid data to render points with numbers in the map*/


JS:
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////experimental part////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
lon= -94.6341
lat= 38.9887
var gridSize=9;//width and height of grid, must be odd !!!!! MUST BE AT MOST THE NUMBER OF ROWS/COLS IN HTML "numDisp" div !!!!
var half=4;// gridSize/2-.5
var show = document.getElementById("numDisp");

gridExp(lat,lon,gridSize,half)

function gridExp(lati, long, s){
    for (let i = 0; i<s;i++){    
        for (let j=0; j<s; j++){
        pollutionExp(lati-half*.4+i*.4,long-half*.5+j*.5,i,j);
        }
    }
}

function pollutionExp(la,lo,I,J){
    pollutionUrl = "https://api.waqi.info/feed/geo:"+la+";"+lo+"/?token="+AQkey
    fetch(pollutionUrl).then(function (response) {
            return response.json()
    }).then(function (data) {     
            
            show.children[I].children[J].textContent=data.data.iaqi["pm25"].v;
            
            
    }).catch(function(){
            console.log("oopsie");
    });
*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////end of experimental part///////////////////////////////////////////////////////////////////////////////////  
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



HTML:
<!--experimental part///////////////////////////////

        <div id ="numDisp">
            <div class="line">
                <p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p>
            </div>
            <div class="line">
                <p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p>
            </div>
            <div class="line">
                <p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p>
            </div>
            <div class="line">
                <p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p>
            </div>
            <div class="line">
                <p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p>
            </div>
            <div class="line">
                <p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p>
            </div>
            <div class="line">
                <p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p>
            </div>
            <div class="line">
                <p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p>
            </div>
            <div class="line">
                <p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p>
            </div>
            
        </div>

        ////////////////////////////end experimental part-->