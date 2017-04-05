'use strict';

let conf = {
    provider: {
        SINA: {
            url: 'http://hq.sinajs.cn/list=',
            flag: 'hq_str_',
            sep: ',',
            nameIdx: 0,
            priceIdx: 3,
            openIdx: 1,
            closeIdx: 2,
            lowIdx: 5,
            highIdx: 4,
            capIdx: -1,
            peIdx: -1,
            pbIdx: -1,
        }
    },
    market: {
        '000': 'sz',
        '001': 'sz',
        '002': 'sz',
        '200': 'sz', // 深圳B股
        '300': 'sz',
        '600': 'sh',
        '601': 'sh',
        '603': 'sh',
        '900': 'sh', // 上海B股
    }
}

module.exports = conf;