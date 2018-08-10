const fs = require('fs');
const path = require('path');
const colors = require('colors');

colors.setTheme({
	info: 'green'
});

module.exports = filename => {
	// 读取文件
	const appDirectory = fs.realpathSync(process.cwd());
	console.log(`Application directory is [${appDirectory}].`.info);
	const resolveApp = relativePath => path.resolve(appDirectory, relativePath);
	const file = resolveApp(filename);
	console.log(`Configuration file is [${file}].`.info);
	require('./compare')(require(file));
};
