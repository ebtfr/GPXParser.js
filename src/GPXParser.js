/**
 * GPX file parser
 * 
 * @constructor
 */
let gpxParser = function () {
    this.xmlSource = "";
    this.metadata  = {};
    this.waypoints = [];
    this.tracks    = [];
    this.routes    = [];
};

/**
 * Parse a gpx formatted string to a GPXParser Object
 * 
 * @param {string} gpxstring - A GPX formatted String
 * 
 * @return {gpxParser} A GPXParser object
 */
gpxParser.prototype.parse = function (gpxstring) {
    let keepThis = this;

    let domParser = new window.DOMParser();
    this.xmlSource = domParser.parseFromString(gpxstring, 'text/xml');

    metadata = this.xmlSource.querySelector('metadata');
    if(metadata != null){
        this.metadata.name  = this.getElementValue(metadata, "name");
        this.metadata.desc  = this.getElementValue(metadata, "desc");
        this.metadata.time  = this.getElementValue(metadata, "time");

        let author = {};
        let authorElem = metadata.querySelector('author');
        if(authorElem != null){
            author.name = this.getElementValue(authorElem, "name");
            author.email  = {};
            let emailElem = authorElem.querySelector('email');
            if(emailElem != null){
                author.email.id     = emailElem.getAttribute("id");
                author.email.domain = emailElem.getAttribute("domain");
            }

            let link     = {};
            let linkElem = authorElem.querySelector('link');
            if(linkElem != null){
                link.href = linkElem.getAttribute('href');
                link.text = this.getElementValue(linkElem, "text");
                link.type = this.getElementValue(linkElem, "type");
            }
            author.link = link;
        }
        this.metadata.author = author;

        let link = {};
        let linkElem = this.queryDirectSelector(metadata, 'link');
        if(linkElem != null){
            link.href = linkElem.getAttribute('href');
            link.text = this.getElementValue(linkElem, "text");
            link.type = this.getElementValue(linkElem, "type");
            this.metadata.link = link;
        }
    }

    var wpts = [].slice.call(this.xmlSource.querySelectorAll('wpt'));
    for (let idx in wpts){
        var wpt = wpts[idx];
        let pt  = {};
        pt.name = keepThis.getElementValue(wpt, "name");
        pt.sym  = keepThis.getElementValue(wpt, "sym");
        pt.lat  = parseFloat(wpt.getAttribute("lat"));
        pt.lon  = parseFloat(wpt.getAttribute("lon"));

        let floatValue = parseFloat(keepThis.getElementValue(wpt, "ele")); 
        pt.ele = isNaN(floatValue) ? null : floatValue;

        pt.cmt  = keepThis.getElementValue(wpt, "cmt");
        pt.desc = keepThis.getElementValue(wpt, "desc");

        let time = keepThis.getElementValue(wpt, "time");
        pt.time = time == null ? null : new Date(time);

        keepThis.waypoints.push(pt);
    }

    var rtes = [].slice.call(this.xmlSource.querySelectorAll('rte'));
    for (let idx in rtes){
        let rte = rtes[idx];
        let route = {};
        route.name   = keepThis.getElementValue(rte, "name");
        route.cmt    = keepThis.getElementValue(rte, "cmt");
        route.desc   = keepThis.getElementValue(rte, "desc");
        route.src    = keepThis.getElementValue(rte, "src");
        route.number = keepThis.getElementValue(rte, "number");

        let type     = keepThis.queryDirectSelector(rte, "type");
        route.type   = type != null ? type.innerHTML : null;

        let link     = {};
        let linkElem = rte.querySelector('link');
        if(linkElem != null){
            link.href = linkElem.getAttribute('href');
            link.text = keepThis.getElementValue(linkElem, "text");
            link.type = keepThis.getElementValue(linkElem, "type");
        }
        route.link = link;

        let routepoints = [];
        var rtepts = [].slice.call(rte.querySelectorAll('rtept'));

        for (let idxIn in rtepts){
            let rtept = rtepts[idxIn];
            let pt    = {};
            pt.lat    = parseFloat(rtept.getAttribute("lat"));
            pt.lon    = parseFloat(rtept.getAttribute("lon"));

            let floatValue = parseFloat(keepThis.getElementValue(rtept, "ele")); 
            pt.ele = isNaN(floatValue) ? null : floatValue;

            let time = keepThis.getElementValue(rtept, "time");
            pt.time = time == null ? null : new Date(time);

            routepoints.push(pt);
        }

        route.distance  = keepThis.calculDistance(routepoints);
        route.elevation = keepThis.calcElevation(routepoints);
        route.slopes    = keepThis.calculSlope(routepoints, route.distance.cumul);
        route.points    = routepoints;

        keepThis.routes.push(route);
    }

    var trks = [].slice.call(this.xmlSource.querySelectorAll('trk'));
    for (let idx in trks){
        let trk = trks[idx];
        let track = {};

        track.name   = keepThis.getElementValue(trk, "name");
        track.cmt    = keepThis.getElementValue(trk, "cmt");
        track.desc   = keepThis.getElementValue(trk, "desc");
        track.src    = keepThis.getElementValue(trk, "src");
        track.number = keepThis.getElementValue(trk, "number");

        let type     = keepThis.queryDirectSelector(trk, "type");
        track.type   = type != null ? type.innerHTML : null;

        let link     = {};
        let linkElem = trk.querySelector('link');
        if(linkElem != null){
            link.href = linkElem.getAttribute('href');
            link.text = keepThis.getElementValue(linkElem, "text");
            link.type = keepThis.getElementValue(linkElem, "type");
        }
        track.link = link;

        let trackpoints = [];
        let trkpts = [].slice.call(trk.querySelectorAll('trkpt'));
	    for (let idxIn in trkpts){
            var trkpt = trkpts[idxIn];
            let pt = {};
            pt.lat = parseFloat(trkpt.getAttribute("lat"));
            pt.lon = parseFloat(trkpt.getAttribute("lon"));

            let floatValue = parseFloat(keepThis.getElementValue(trkpt, "ele")); 
            pt.ele = isNaN(floatValue) ? null : floatValue;

            let time = keepThis.getElementValue(trkpt, "time");
            pt.time = time == null ? null : new Date(time);

            trackpoints.push(pt);
        }
        track.distance  = keepThis.calculDistance(trackpoints);
        track.elevation = keepThis.calcElevation(trackpoints);
        track.slopes    = keepThis.calculSlope(trackpoints, track.distance.cumul);
        track.points    = trackpoints;

        keepThis.tracks.push(track);
    }
};

/**
 * Get value from a XML DOM element
 * 
 * @param  {Element} parent - Parent DOM Element
 * @param  {string} needle - Name of the searched element
 * 
 * @return {} The element value
 */
gpxParser.prototype.getElementValue = function(parent, needle){
    let elem = parent.querySelector(needle);
    if(elem != null){
        return elem.innerHTML != undefined ? elem.innerHTML : elem.childNodes[0].data;
    }
    return elem;
};


/**
 * Search the value of a direct child XML DOM element
 * 
 * @param  {Element} parent - Parent DOM Element
 * @param  {string} needle - Name of the searched element
 * 
 * @return {} The element value
 */
gpxParser.prototype.queryDirectSelector = function(parent, needle) {

    let elements  = parent.querySelectorAll(needle);
    let finalElem = elements[0];

    if(elements.length > 1) {
        let directChilds = parent.childNodes;

        for(idx in directChilds) {
            elem = directChilds[idx];
            if(elem.tagName === needle) {
                finalElem = elem;
            }
        }
    }

    return finalElem;
};

/**
 * Calcul the Distance Object from an array of points
 * 
 * @param  {} points - An array of points with lat and lon properties
 * 
 * @return {DistanceObject} An object with total distance and Cumulative distances
 */
gpxParser.prototype.getDistance = function(points) {
    let distance = {};
    let totalDistance = 0;
    let cumulDistance = [];
    for (var i = 0; i < points.length - 1; i++) {
        totalDistance += this.getDistanceBetween(points[i],points[i+1]);
        cumulDistance[i] = totalDistance;
    }
    cumulDistance[points.length - 1] = totalDistance;

    distance.total = totalDistance;
    distance.cumul = cumulDistance;

    return distance;
};

/**
 * Source: https://stackoverflow.com/questions/10053358/measuring-the-distance-between-two-coordinates-in-php
 * Calculates the great-circle distance between two points, with the Vincenty formula.
 * @param  {} wpt1 - A geographic point with lat and lon properties
 * @param  {} wpt2 - A geographic point with lat and lon properties
 * @param float earthRadius Mean earth radius in [m]
 * @return float Distance between points in [m] (same as earthRadius)
 */
gpxParser.prototype.getDistanceBetween = function (wpt1, wpt2) {
	** convert degrees to radians
	var d2r = Math.PI / 180,
    	latFrom = wpt1.lat * d2r,
	lonFrom = wpt1.lon * d2r,
    	latTo = wpt2.lat * d2r,
    	lonTo = wpt2.lon * d2r,
	lonDelta = lonTo - lonFrom;
	var a = Math.pow(Math.cos(latTo) * Math.sin(lonDelta), 2) +
    		Math.pow(Math.cos(latFrom) * Math.sin(latTo) - Math.sin(latFrom) * Math.cos(latTo) * Math.cos(lonDelta), 2);
  	var b = Math.sin(latFrom) * Math.sin(latTo) + Math.cos(latFrom) * Math.cos(latTo) * Math.cos(lonDelta);
	var angle = Math.atan2(Math.sqrt(a), b);
	var earthRadius=this.getEarthRadiusAtLatitude((wpt1.lat+wpt2.lat)/2);
  	return angle * earthRadius;
};

/**
* Source:https://rechneronline.de/earth-radius/
* Calculates the earth radius in meters based on the latitude (in degrees)
* @param float latitude - The latitude
* @return float earth radius in meters
*/
gpxParser.prototype.getEarthRadiusAtLatitude(latitude){
	var x=latitude*Math.PI/180,
		r1=6378137,
		r2=6356752.3
	;
	return Math.sqrt((Math.pow(r1*r1*Math.cos(x),2)+Math.pow(r2*r2*Math.sin(x),2)) / (Math.pow(r1*Math.cos(x),2)+Math.pow(r2*Math.sin(x),2)));
}

/**
 * Generate Elevation Object from an array of points
 * 
 * @param  {} points - An array of points with ele property
 * 
 * @returns {ElevationObject} An object with negative and positive height difference and average, max and min altitude data
 */
gpxParser.prototype.calcElevation = function (points) {
    var dp = 0,
        dm = 0,
        ret = {};

    for (var i = 0; i < points.length - 1; i++) {
        let rawNextElevation = points[i + 1].ele;
        let rawElevation =  points[i].ele;

        if(rawNextElevation !== null && rawElevation !== null) {
            let diff = parseFloat(rawNextElevation) - parseFloat(rawElevation);

            if (diff < 0) {
                dm += diff;
            } else if (diff > 0) {
                dp += diff;
            }
        }
    }

    var elevation = [];
    var sum = 0;

    for (var i = 0, len = points.length; i < len; i++) {
        let rawElevation = points[i].ele;

        if(rawElevation !== null) {
            var ele = parseFloat(points[i].ele);
            elevation.push(ele);
            sum += ele;
        }
    }

    ret.max = Math.max.apply(null, elevation) || null;
    ret.min = Math.min.apply(null, elevation) || null;
    ret.pos = Math.abs(dp) || null;
    ret.neg = Math.abs(dm) || null;
    ret.avg = sum / elevation.length || null;

    return ret;
};

/**
 * Generate slopes Object from an array of Points and an array of Cumulative distance 
 * 
 * @param  {} points - An array of points with ele property
 * @param  {} cumul - An array of cumulative distance
 * 
 * @returns {SlopeObject} An array of slopes
 */
gpxParser.prototype.calculSlope = function(points, cumul) {
    let slopes = [];

    for (var i = 0; i < points.length - 1; i++) {
        let point = points[i];
        let nextPoint = points[i+1];
        let elevationDiff = nextPoint.ele - point.ele;
        let distance = cumul[i+1] - cumul[i];

        let slope = (elevationDiff * 100) / distance;
        slopes.push(slope);
    }

    return slopes;
};

/**
 * Export the GPX object to a GeoJSON formatted Object
 * 
 * @returns {} a GeoJSON formatted Object
 */
gpxParser.prototype.toGeoJSON = function () {
    var GeoJSON = {
        "type": "FeatureCollection",
        "features": [],
        "properties": {
            "name": this.metadata.name,
            "desc": this.metadata.desc,
            "time": this.metadata.time,
            "author": this.metadata.author,
            "link": this.metadata.link,
        },
    };

    for(idx in this.tracks) {
        let track = this.tracks[idx];

        var feature = {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": []
            },
            "properties": {
            }
        };

        feature.properties.name   = track.name;
        feature.properties.cmt    = track.cmt;
        feature.properties.desc   = track.desc;
        feature.properties.src    = track.src;
        feature.properties.number = track.number;
        feature.properties.link   = track.link;
        feature.properties.type   = track.type;

        for(idx in track.points) {
            let pt = track.points[idx];
        
            var geoPt = [];
            geoPt.push(pt.lon);
            geoPt.push(pt.lat);
            geoPt.push(pt.ele);

            feature.geometry.coordinates.push(geoPt);
        }

        GeoJSON.features.push(feature);
    }

    for(idx in this.routes) {
        let track = this.routes[idx];

        var feature = {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": []
            },
            "properties": {
            }
        };

        feature.properties.name   = track.name;
        feature.properties.cmt    = track.cmt;
        feature.properties.desc   = track.desc;
        feature.properties.src    = track.src;
        feature.properties.number = track.number;
        feature.properties.link   = track.link;
        feature.properties.type   = track.type;


        for(idx in track.points) {
            let pt = track.points[idx];
        
            var geoPt = [];
            geoPt.push(pt.lon);
            geoPt.push(pt.lat);
            geoPt.push(pt.ele);

            feature.geometry.coordinates.push(geoPt);
        }

        GeoJSON.features.push(feature);
    }

    for(idx in this.waypoints) {
        let pt = this.waypoints[idx];
    
        var feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": []
            },
            "properties": {
            }
        };

        feature.properties.name = pt.name;
        feature.properties.sym = pt.sym;
        feature.properties.cmt  = pt.cmt;
        feature.properties.desc = pt.desc;

        feature.geometry.coordinates = [pt.lon, pt.lat, pt.ele];

        GeoJSON.features.push(feature);
    }

    return GeoJSON;
};

if(typeof module !== 'undefined'){
    require('jsdom-global')();
    module.exports = gpxParser;
}
