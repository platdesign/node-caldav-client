'use strict';

var Client = require('../');


var client = new Client({
	url: 		'http://baikal.dev/cal.php/calendars/',
	username: 	'dev',
	password: 	'dev'
});



var cal = client.calendar('default');


cal.getEventsInformation().then(function(data) {
	console.log(data);
}, function(err) {
	console.log(err);
});
