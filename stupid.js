'use strict'

let _ = require('lodash');
let osascript = require('node-osascript');
let Stupid_Request = require('./Stupid_Request');

let stupid_request = new Stupid_Request();

// Private 
let previousStocks = [];
let stockIDs = ['600800', '600800'];
let notiOffset = 0.1;
let intervalTime = 2000;
let isSendNoti = true;

function getData() {
	stupid_request.get(stockIDs, function(stocks) {
		sendNotiIfNeeded(stocks);
		setTimeout(getData, intervalTime);
	});
};

function sendNotiIfNeeded(stocks) {
	if (!isSendNoti) { return };
	_.forEach(stocks, (stock) => {
		let previousStock = previousStocks[stock.code];
		if (previousStock != undefined) {
			let offset = Math.abs(previousStock.incPct) - Math.abs(stock.incPct);
			if (Math.abs(offset) >= notiOffset) {
				previousStocks[stock.code] = stock;
				let noti_offset = '最近: ' + offset.toFixed(2) + '%';
				let noti = 'display notification ' + `"当前: ${stock.price} ${noti_offset} 今天: ${stock.incPct}%"` + ' with title ' + `"${stock.name}"`;
				osascript.execute(noti, function(err, result, raw) {});
			}
		} else {
			previousStocks[stock.code] = stock;
		}
	});
}

function start() {
	getData();
};

start();