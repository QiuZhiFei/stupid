let cmd = require('commander');

const pkg = require('./package.json');

cmd
	.version(pkg.version)
	.usage(' [-w code1,code2...，codeN] [-r number] [-n bool] [-o number] \n  eg: node stupid -w 600800,000001 -r 10 -n true -o 0.15')
	.description('Stupid 使用命令查询股票并发送Mac通知')
	.option('-w, --watch [stockID,...]', '查看股票')
	.option('-r, --refresh <n>', '刷新时间，默认为 0.15s')
	.option('-n, --noti <n>', '是否发送Mac通知，默认开启')
	.option('-o, --offset <n>', '触发Mac通知的偏移量, 默认 0.2%')
	.parse(process.argv);

let actions = {
	WATCH: function watch() {
		let Stupid_Watch = require('./stupid_watch');
		let stupid_watch = new Stupid_Watch();
		stupid_watch.start(cmd.watch, cmd.refresh, cmd.noti, cmd.offset);
	}
}

function doCmd() {
	let action = 'WATCH';
	if (cmd.watch) {
		action = 'WATCH';
	};

	actions[action]();
};

doCmd();