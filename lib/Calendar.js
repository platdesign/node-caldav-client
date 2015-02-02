'use strict';


var $parse = require('./parse.js');
var ical = require('ical');


var Calendar = module.exports = function Calendar (client, id) {
	this.client = client;
	this.id = id;
};



var parseEvent = function(data, parseIcs) {

	var resultItem = {};

	resultItem.calendarData = $parse(data, 'd:propstat[0].d:prop[0].cal:calendar-data[0]');
	resultItem.etag			= $parse(data, 'd:propstat[0].d:prop[0].d:getetag[0]').replace(/\"/g, '');

	if(parseIcs) {
		resultItem.calendarDataParsed = (resultItem.calendarData ? ical.parseICS(resultItem.calendarData):null);
	}

	return resultItem;
};





var proto = Calendar.prototype;

proto.requestAllEventsData = function() {
	// Get all calendar data
	var body =
		'<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">'+
			'<d:prop>'+
				'<d:getetag />'+
				'<c:calendar-data />'+
			'</d:prop>'+
			'<c:filter>'+
				'<c:comp-filter name="VCALENDAR" />'+
			'</c:filter>'+
		'</c:calendar-query>';

	return this.client._request(this.id, 'REPORT', body);
};

proto.getAllEventsData = function(parseIcs) {
	return this.requestAllEventsData().then(function(data) {
		var result = [];

		data.forEach(function(item) {
			result.push( parseEvent(item, parseIcs) );
		});

		return result;
	});
};




proto.requestInformation = function() {
	var body =
		'<d:propfind xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/">'+
			'<d:prop>'+
				'<d:displayname />'+
				'<cs:getctag />'+
			'</d:prop>'+
		'</d:propfind>';

	return this.client._request(this.id, 'PROPFIND', body, {
		Depth: 0
	});
};

proto.getInformation = function() {
	return this.requestInformation().then(function(data) {

		if( $parse(data, '[0].d:href') ) {
			var resultItem = {};

			resultItem.href = $parse(data, '[0].d:href[0]');
			resultItem.displayName = $parse(data, '[0].d:propstat[0].d:prop[0].d:displayname[0]');
			resultItem.etag = $parse(data, '[0].d:propstat[0].d:prop[0].cs:getctag[0]');

			return resultItem;
		}
		return null;
	});
};




proto.requestEventsInformation = function() {
	// Get all calendar data
	var body = '<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">'+
			'<d:prop>'+
				'<d:getetag />'+
			'</d:prop>'+
			'<c:filter>'+
				'<c:comp-filter name="VCALENDAR" />'+
			'</c:filter>'+
		'</c:calendar-query>';

	return this.client._request(this.id, 'REPORT', body);
};

proto.getEventsInformation = function() {

	return this.requestEventsInformation().then(function(data) {
		var results = [];

		data.forEach(function(item) {

			var resultItem = {};

			resultItem.href = $parse(item, 'd:href[0]');
			resultItem.etag = $parse(item, 'd:propstat[0].d:prop[0].d:getetag[0]').replace(/\"/g, '');

			results.push(resultItem);
		});

		return results;
	});
};




proto.requestEventsDataByHrefs = function(hrefs) {

	if(!hrefs || !hrefs.length) {
		throw new Error('Missing hrefs in requestEventsByHref');
	}

	var body = '<c:calendar-multiget xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">'+
			'<d:prop>'+
				'<d:getetag />'+
				'<c:calendar-data />'+
			'</d:prop>';

			(hrefs || []).forEach(function(href) {
				body += '<d:href>'+href+'</d:href>';
			});

		body += '</c:calendar-multiget>';

	return this.client._request(this.id, 'REPORT', body);
};

proto.getEventsDataByHrefs = function(hrefs, parseIcs) {
	return this.requestEventsDataByHrefs(hrefs).then(function(data) {

		var results = [];

		data.forEach(function(item) {
			results.push( parseEvent(item, parseIcs) );
		});

		return results;

	});
};
