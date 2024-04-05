var map = L.map('map').setView([31.5204, 74.3587], 12);

var layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
});

var osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France'
});

var petrolpumpsLayer = L.geoJSON(petrolpumps, {
    pointToLayer: function(feature, latlng) {
        // Define the custom icon for petrol pumps using a PNG image
        var customIcon = L.icon({
            iconUrl: 'fuel-station.png',
            iconSize: [40, 40], // Size of the icon
            iconAnchor: [20, 40], // Point of the icon which will correspond to marker's location
            popupAnchor: [0, -32] // Point from which the popup should open relative to the iconAnchor
        });
        return L.marker(latlng, { icon: customIcon }).bindPopup(`<b>${feature.properties.name}</b><br>${feature.properties.address}`);
    }
});


var hotelsLayer = L.geoJSON(hotels, {
    pointToLayer: function(feature, latlng) {
        // Define the custom icon for hotels using a PNG image
        var customIcon = L.icon({
            iconUrl: 'hotell.png',
            iconSize: [40, 40], // Size of the icon
            iconAnchor: [20, 40], // Point of the icon which will correspond to marker's location
            popupAnchor: [0, -32] // Point from which the popup should open relative to the iconAnchor
        });
        return L.marker(latlng, { icon: customIcon }).bindPopup(`<b>${feature.properties['name ']}</b><br>${feature.properties.Address}`);
    }
});


var baselayer = {
    "Layer": layer,
    "openstreetmap": osm,
    "openHot": osmHOT
};

// Add petrol pumps and hotels to separate layer groups
var overlays = {
    "Petrol Pumps": petrolpumpsLayer,
    "Hotels": hotelsLayer
};

// Add layer control
var layerControl = L.control.layers(baselayer, overlays).addTo(map);

// Function to filter layers based on search query
function filterLayers(query) {
    query = query.toLowerCase();
    
    // Remove all layers from the map
    map.eachLayer(function(layer) {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
    
    // Add only the hotels that match the search query
    hotelsLayer.eachLayer(function(layer) {
        if (layer.feature.properties['Name '].toLowerCase().indexOf(query) !== -1) {
            layer.addTo(map);
        }
    });
}


// Create custom control for search input
var searchControl = L.Control.extend({
    onAdd: function(map) {
        var searchDiv = L.DomUtil.create('div', 'search-div');
        var searchInput = L.DomUtil.create('input', 'search-input', searchDiv);
        searchInput.id = 'searchInput';
        searchInput.placeholder = 'Search for locations...';
        L.DomEvent.disableClickPropagation(searchDiv);
        return searchDiv;
    }
});

map.addControl(new searchControl());

var searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', function(e) {
    var query = e.target.value.trim();
    if (query !== '') {
        filterLayers(query);
    } else {
        // If search input is empty, show all layers
        map.eachLayer(function(layer) {
            if (layer instanceof L.Marker) {
                map.addLayer(layer);
            }
        });
    }
});


function findNearestPetrolPump(hotelLatLng) {
    var hotelPoint = turf.point([hotelLatLng.lng, hotelLatLng.lat]);
    var nearest = null;
    var minDistance = Infinity;
    
    petrolpumpsLayer.eachLayer(function(layer) {
        var petrolPumpLatLng = layer.getLatLng();
        var petrolPumpPoint = turf.point([petrolPumpLatLng.lng, petrolPumpLatLng.lat]);
        var distance = turf.distance(hotelPoint, petrolPumpPoint);
        
        if (distance < minDistance) {
            minDistance = distance;
            nearest = layer;
        }
    });
    
    return nearest;
}


// Event listener for click on hotels
hotelsLayer.on('click', function(e) {
    var hotelMarker = e.layer;
    var nearestPetrolPump = findNearestPetrolPump(e.latlng);
    
    if (nearestPetrolPump) {
        var nearestLatLng = nearestPetrolPump.getLatLng();
        var nearestPopupContent = `<b>Nearest Petrol Pump</b><br>Name: ${nearestPetrolPump.feature.properties.name}<br>Address: ${nearestPetrolPump.feature.properties.address}`;
        
        // Define the custom icon using a PNG image
        var customIcon = L.icon({
            iconUrl: 'fuel-station.png',
            iconSize: [60, 60], // Size of the icon
            iconAnchor: [20, 40], // Point of the icon which will correspond to marker's location
            popupAnchor: [0, -32] // Point from which the popup should open relative to the iconAnchor
        });
        
        // Create a custom marker and add it to the map
        var customMarker = L.marker(nearestLatLng, { icon: customIcon }).addTo(map);
        
        
        // Create a popup for the petrol pump
        var petrolPopup = L.popup({ closeButton: false })
            .setLatLng(nearestLatLng)
            .setContent(nearestPopupContent)
            .openOn(map);

        // Create a popup and bind it to the custom marker
        customMarker.bindPopup(nearestPopupContent).openPopup();
            
        // Bind popup for the hotel marker
        hotelMarker.bindPopup(`<b><b>Name:${hotelMarker.feature.properties['Name ']}</b><br>${hotelMarker.feature.properties.Address}`)
            .openPopup();

        // Adjust map view to show both markers
        var group = new L.featureGroup([hotelMarker, customMarker]);
        map.fitBounds(group.getBounds());
    } else {
        console.log('No petrol pump found.');
    }
});








// // Event listener for click on hotels
// hotelsLayer.bindpopup("Hello").on('click', function(e) {
//     var hotelMarker = e.layer;
//     var nearestPetrolPump = findNearestPetrolPump(e.latlng);
    
//     if (nearestPetrolPump) {
//         var nearestLatLng = nearestPetrolPump.getLatLng();
//         var nearestPopupContent = `<b>Nearest Petrol Pump</b><br>name: ${nearestPetrolPump.feature.properties.name}<br>address: ${nearestPetrolPump.feature.properties.address}`;
        
//         // Define the custom icon using a PNG image
//         var customIcon = L.icon({
//             iconUrl: 'fuel-station.png',
//             iconSize: [40, 40], // Size of the icon
//             iconAnchor: [20, 40], // Point of the icon which will correspond to marker's location
//             popupAnchor: [0, -32] // Point from which the popup should open relative to the iconAnchor
//         });
        
//         // Create a custom marker and add it to the map
//         var customMarker = L.marker(nearestLatLng, { icon: customIcon }).addTo(map);
        
//         // Create a popup and bind it to the custom marker
//         customMarker.bindPopup(nearestPopupContent).openPopup();

//         // Bind popup for the hotel marker
//         hotelMarker.bindPopup(`<b>${hotelMarker.feature.properties['name ']}</b><br>${hotelMarker.feature.properties.Address}`)
//             .openPopup();
            
//     } else {
//         console.log('No petrol pump found.');
//     }
// });

