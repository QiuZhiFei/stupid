'use strict'

let _ = require('lodash');
let osascript = require('node-osascript');
let Stupid_Request = new require('./Stupid_Request');
let stupid_request = new Stupid_Request();
let Stock = require('./Stock');
let Table = require('easy-table');

let colors = require('colors');
colors.setTheme({
	high: 'red',
	flat: 'white',
	low: 'green'
});

let yaml = require('js-yaml');
let fs = require('fs');
let util = require('util');

// Private 
let previousStocks = {};
let currentStocks = [];
let stockIDs = null;

let intervalTime = 2000;
let isSendNoti = true;
let notiOffset = 0.15;

function refreshData() {
	stupid_request.get(stockIDs, function(stocks) {
		currentStocks = stocks;
		sendNotiIfNeeded(stocks);
		updateData();
		setTimeout(refreshData, intervalTime);
	});
};

function sendNotiIfNeeded(stocks) {
	_.forEach(stocks, (stock) => {
		let previousStock = previousStocks[stock.code];
		if (previousStock != undefined) {
			let offset = Math.abs(previousStock.incPct) - Math.abs(stock.incPct);
			if (Math.abs(offset) >= notiOffset) {
				previousStocks[stock.code] = stock;
				if (!isSendNoti) {
					return
				};
				let noti_offset = '最近: ' + offset.toFixed(2) + '%';
				let noti = 'display notification ' + `"当前: ${stock.price} ${noti_offset} 今天: ${stock.incPct}%"` + ' with title ' + `"${stock.name}"`;
				osascript.execute(noti, function(err, result, raw) {});
			}
		} else {
			previousStocks[stock.code] = stock;
		}
	});
};

function updateData() {
	let table = new Table();
	_.forEach(currentStocks, function(stock, id) {
		table.cell('公司', stock.name);
		table.cell('代码', stock.code);
		table.cell('当前价', getPrice(stock));
		table.cell('涨跌', stock.inc);
		table.cell('涨跌%', stock.incPct);
		table.cell('最低', stock.low);
		table.cell('最高', stock.high);
		table.cell('开盘价', stock.open);
		table.cell('上次收盘', stock.close);
		table.newRow();
	});

	console.log(table.toString());
};

function getPrice(stock) {
	let price = stock.price;
	let incPct = parseFloat(stock.incPct);
	if (incPct === 0) {
		return price.flat;
	};
	if (incPct > 0) {
		return price.high;
	};
	return price.low;
};

function getValidSockIDs(args) {
	if (args != undefined) {
		let stockIDs = args.split(',');
		if (stockIDs.length > 0) {
			return args
		};
	};
	// symbols.yaml
	let contents = yaml.load(fs.readFileSync('symbols.yaml', 'utf8'));
	let list = contents.MineList;
	let stockIDs = [];
	_.forEach(list, function(stock, k) {
		stockIDs.push(stock.code);
	});
	if (stockIDs.length > 0) {
		return stockIDs.join(',');
	};
	return '000001';
};

//////////////////////////////

let Stupid_Watch = function() {
	this.start = function(args, refresh, noti, offset) {
		stockIDs = getValidSockIDs(args);
		if (refresh != undefined) {
			intervalTime = refresh * 1000
		};
		if (noti != undefined) {
			isSendNoti = (String(noti) === 'true')
		};
		if (offset != undefined) {
			notiOffset = offset
		};
		refreshData();
	}
};

module.exports = Stupid_Watch;