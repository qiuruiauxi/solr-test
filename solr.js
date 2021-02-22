// Requires cors.js to be loaded first

"use strict";

var SOLR_CONFIG = {
    "server": "http://40.76.31.142:8983/solr/auxi_solr/",  // Solr server
    "filter": "all_text",  // Filter results for an organization or user
    "limit": 10,  // Max number of results to retrieve per page
    "resultsElementId": "searchResults",  // Element to contain results
    "urlElementId": "searchUrl",  // Element to display search URL
    "countElementId": "resultCount",  // Element showing number of results
    "pagesElementId": "pagination",  // Element to display result page links
     "showPages": 5  // MUST BE ODD NUMBER! Max number of page links to show
};


// Get URL arguments
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}


// Parse Solr search results into HTML
function parseSolrResults(resultJson) {
    var docs = resultJson["response"]["docs"];
    var html = [];
    for (var i = 0; i < docs.length; i++) {
        var doc = docs[i];

        var row = "slide name: " + doc["ppt_name"]+" slide page: " + doc["slide_number"] + " with title: "+doc["title_text"]+"<br>";
        
        var imgurl = doc["img_url"];
    
        var img = "<img src=" + imgurl + " style='width: 80%; height: 80%' />";
        var box = "<div >" + row + img +"</div>";
        //html.push(row);
        //html.push(img);
        html.push(box);
    }
    if (html.length) {
        return html.join("\n");
    }
    else {
        return "<p>Your search returned no results.</p>";
    }
}


function show_loading(isLoading) {
    var x = document.getElementById("loading-div");
    if (isLoading) {
        document.body.style.cursor = "wait";
        x.style.display = "block";
    }
    else {
        document.body.style.cursor = "default";
        x.style.display = "none";
    }
}


// Function to call if CORS request is successful
function successCallback(headers, response) {
    show_loading(false);

    // Write results to page
    document.getElementById("searchResults").innerHTML = response;
    var data = JSON.parse(response);
    var resultHtml = parseSolrResults(data);
    var elementId = SOLR_CONFIG["resultsElementId"];
    document.getElementById(elementId).innerHTML = resultHtml;

    // Add links to additional search result pages if necessary
    var currentStart = getParameterByName("start");
    if (!currentStart) {
        currentStart = 0;
    }
    else {
        currentStart = parseInt(currentStart);
    }
    var count = parseInt(data["response"]["numFound"]);
    var limit = parseInt(SOLR_CONFIG["limit"]);
    var showPages = parseInt(SOLR_CONFIG["showPages"]);
    var pageElementId = SOLR_CONFIG["pagesElementId"];
    showPageLinks(count, limit, showPages, currentStart, pageElementId);
    var query = getParameterByName("q");
    if (query) query = query.trim();

    showResultCount(query, count, limit, currentStart, SOLR_CONFIG["countElementId"]);
}


// Function to call if CORS request fails
function errorCallback() {
    show_loading(false);
    alert("There was an error making the request.");
}


// Writes CORS request URL to the page so user can see it
function showUrl(url) {
    url = encodeURI(url);
    var txt = '<a href="' + url + '" target="_blank">' + url + '</a>';
    var element = document.getElementById(SOLR_CONFIG["urlElementId"]);
    element.innerHTML = txt;
}


// Passes search URL and callbacks to CORS function

function searchSolr(query,start) {
    var base = SOLR_CONFIG["server"];
    if (start === undefined) start = "0";
    start = "start=" + start;
    query = "q=" + SOLR_CONFIG["filter"] + "%3A" + query;
    var url = base + "select?" +query;
    showUrl(url);
    show_loading(true);
    makeCorsRequest(url, successCallback, errorCallback);
}


// When the window loads, read query parameters and perform search
window.onload = function () {
    var query = getParameterByName("q");
    if (query) query = query.trim();
    var start = getParameterByName("start");
    document.forms.dataSearchForm.q.value = query;
    if (!(query && query.trim())) {
        query = "";  // default for empty query
    }
    if (!start) {
        start = 0;
    }
    searchSolr(query,start);
};