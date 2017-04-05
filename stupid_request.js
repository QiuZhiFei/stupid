'use strict';

let colors = require('colors');
let osascript = require('node-osascript');

let vm = require('vm');
let conf = require('./conf');
let _ = require('lodash');
let Promise = require('bluebird');
let request = Promise.promisifyAll(require('request'), {
	multiArgs: true
});
let cmd = require('commander');
let columnify = require('columnify');
let Stock = require('./stock');

let Iconv = require('iconv').Iconv;
let iconv = new Iconv('GBK', 'UTF-8//TRANSLIT//IGNORE');

let start = new Date().getTime();

let ClientError = e => (e.code >= 400 && e.code < 500 || e.code === 'ENOTFOUND');

let src = (cmd.data || '').toUpperCase();
let source = 'SINA';
let ds = conf.provider[source];

let results = [];
let finishedHandler = null;

const MSG = {
    INPUT_ERROR      : '输入错误，当前只支持通过证券代码查询，请检查后重新输入！',
    TOO_MANY_SYMS    : '查询的股票太多，一次最多支持查询25只股票！',
    SYMBOL_NOT_EXIST : '该股票代码不存在:',
};

function loadData(syms) {
	let sockIDs = getValidSockIDs(syms);
	let query = _.map(sockIDs, x => conf.market[x.substr(0, 3)] + x).join(',');
	return request.getAsync(ds.url + query, {
		encoding: null
	}).spread((resp, body) => {
		body = iconv.convert(body).toString();
		vm.runInThisContext(body);

		_.each(sockIDs, s => {
			let localVar = ds.flag + conf.market[s.substr(0, 3)] + s;
			if (body.indexOf(localVar) < 0 || body.indexOf(`${localVar}="";`) >= 0) {
				console.error(MSG.SYMBOL_NOT_EXIST, s);
				return false;
			}
			let splits = vm.runInThisContext(ds.flag + conf.market[s.substr(0, 3)] + s).split(ds.sep);

			let stock = new Stock();
			stock.name = splits[ds.nameIdx];
			stock.code = s;
			stock.open = +splits[ds.openIdx];
			stock.close = +splits[ds.closeIdx];
			stock.price = +splits[ds.priceIdx] || stock.close;
			stock.low = +splits[ds.lowIdx];
			stock.high = +splits[ds.highIdx];
			stock.inc = stock.price - stock.close;
			stock.incPct = ((stock.price - stock.close) / stock.close) * 100;
			stock.capacity = (ds.capIdx > -1) ? +splits[ds.capIdx] : 0;
			stock.pe = (ds.peIdx > -1) ? +splits[ds.peIdx] : 0;
			stock.pb = (ds.pbIdx > -1) ? +splits[ds.pbIdx] : 0;
			_.forEach(stock, (v, k) => {
				if (k !== 'name' && k !== 'code' && v !== undefined) {
					stock[k] = v.toFixed(2);
				}
				if (src === 'SINA') {
					delete stock.pe;
					delete stock.pb;
					delete stock.capacity;
				}
			});

			results.push(stock);
		});
	}).catch(ClientError, e => {
		console.error(e);
	});
};

function getValidSockIDs(stockIDs) {
	return  stockIDs.split(',');
};

function finished(value) {
	finishedHandler(results);
	results = [];
};

let Stupid_Request = function() {
	this.get = function(stocks, handler) {
		finishedHandler = handler;
		Promise
			.resolve(stocks)
			.then(loadData)
			.then(finished);
	};
};

module.exports = Stupid_Request;