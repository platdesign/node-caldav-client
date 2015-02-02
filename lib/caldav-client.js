'use strict';



var xml2js = require('xml2js');
var Q = require('q');
var extend = require('extend');
var request = require('request');
var $parse = require('./parse.js');
var Calendar = require('./Calendar.js');

var CalDavClient = module.exports = function(config) { this.config = config; };

var proto = CalDavClient.prototype;
proto._request = function(uri, method, body, headers) {

	body = '<?xml version="1.0" encoding="utf-8" ?>' + body;

	var username = this.config.username;
	var password = this.config.password;
	var serverUrl = this.config.url + '/' + username + '/' + (uri||'');

	var reqOptions = {
		url: serverUrl,
		method: method,
		body: body,
		headers : extend(false, {
			'Content-type' 	: 	'application/xml; charset=utf-8',
			'Content-Length': 	body.length,
			'User-Agent'	: 	'calDavClient',
			'Connection' 	: 	'close',
			'Depth'			: 	'0',
			'Prefer'		: 	'return-minimal'
		}, headers)
	};

	if( username && password ){
		reqOptions.headers.Authorization = 'Basic ' + new Buffer( username + ':' + password ).toString('base64');
	}

	var d = Q.defer();

	request(reqOptions, function(err, data) {
		if(err) { return d.reject(err); }

		xml2js.parseString(data.body, function(err, data) {
			if(err) { return d.reject(err); }

			if( $parse(data, 'd:error') ) {
				return d.reject(data);
			}

			d.resolve( $parse(data, 'd:multistatus.d:response') || [] );
		});
	});

	return d.promise;
};



proto.requestCalendarsInformation = function() {

	var body =
		'<d:propfind xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/">'+
 			'<d:prop>'+
				'<d:displayname />'+
				'<cs:getctag />'+
			'</d:prop>'+
		'</d:propfind>';

	return this._request(null, 'PROPFIND', body, {
		Depth: 1
	});
};


proto.getCalendarsInformation = function() {
	return this.requestCalendarsInformation().then(function(data) {
		var results = [];

		data.forEach(function(item) {
			var resultItem = {};

			resultItem.href = $parse(item, 'd:href[0]');
			resultItem.displayName = $parse(item, 'd:propstat[0].d:prop[0].d:displayname[0]') || '';
			resultItem.etag = $parse(item, 'd:propstat[0].d:prop[0].cs:getctag[0]') || null;

			results.push(resultItem);
		});

		return results;

	});
};


proto.calendar = function(id) {
	return new Calendar(this, id);
};






