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

function loadData(syms) {
	let query = _.map(syms, x => conf.market[x.substr(0, 3)] + x).join(',');
	return request.getAsync(ds.url + query, {
		encoding: null
	}).spread((resp, body) => {
		body = iconv.convert(body).toString();
		vm.runInThisContext(body);

		_.each(syms, s => {
			let localVar = ds.flag + conf.market[s.substr(0, 3)] + s;
			if (body.indexOf(localVar) < 0 || body.indexOf(`${localVar}="";`) >= 0) {
				console.error(MSG.SYMBOL_NOT_EXIST.error, s.em);
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

function finished() {
	finishedHandler(results);
	results = [];
}

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