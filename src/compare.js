const fs = require('fs');
const path = require('path');
const md5File = require('md5-file');

const TARGET_BUT_NOT_SOURCE = '\n';
const RESULTS = [];

const buildMapInFolder = config => {
	const { source, target, ignored } = config;

	const sourceFiles = source ? fs.readdirSync(source).sort() : [];
	const targetFiles = target ? fs.readdirSync(target).sort() : [];

	const map = {};
	sourceFiles
		.filter(file => {
			return ignored.indexOf(file) == -1;
		})
		.forEach(file => {
			if (targetFiles.indexOf(file) != -1) {
				// target也有这个文件
				map[path.resolve(source, file)] = path.resolve(target, file);
			} else {
				// target没有文件
				map[path.resolve(source, file)] = null;
			}
		});
	targetFiles
		.filter(file => {
			return ignored.indexOf(file) == -1;
		})
		.forEach((file, index) => {
			if (sourceFiles.indexOf(file) != -1) {
				// source也有这个文件, 已经统计过了, 不需要再次统计
			} else {
				map[TARGET_BUT_NOT_SOURCE + index] = path.resolve(target, file);
			}
		});
	return map;
};

const compare = (map, parentConfig) => {
	Object.keys(map)
		.filter(source => {
			return !source.startsWith(TARGET_BUT_NOT_SOURCE);
		})
		.forEach(source => {
			const target = map[source];
			if (!target) {
				// 目标下并没有这个文件
				RESULTS.push([source, '', 'Not exists in target']);
				const sourceStats = fs.statSync(source);
				if (!sourceStats.isFile()) {
					const config = {
						source: source,
						target: null,
						ignored: parentConfig.ignored
					};
					compare(buildMapInFolder(config), config);
				}
			} else {
				const sourceStats = fs.statSync(source);
				const targetStats = fs.statSync(target);
				if (sourceStats.isFile()) {
					// 源是文件
					if (targetStats.isFile()) {
						// 目标也是文件, 开始比较
						if (sourceStats.size !== targetStats.size) {
							// 文件尺寸不同, 需要被列出来
							RESULTS.push([source, target, 'Size mismatch']);
						} else {
							console.debug(
								'Compare hash of [' + source + '] and [' + target + ']'
							);
							// 尺寸相同, 比较hash
							const sourceHash = md5File.sync(source);
							const targetHash = md5File.sync(target);
							if (sourceHash !== targetHash) {
								RESULTS.push([source, target, 'Hash mismatch']);
							} else {
								RESULTS.push([source, target, 'Hash match']);
							}
						}
					} else {
						// 目标是目录, 无法比较
						RESULTS.push([
							source,
							target,
							'File type mismatch, file in source but directory in target'
						]);
						const config = {
							source: null,
							target: target,
							ignored: parentConfig.ignored
						};
						compare(buildMapInFolder(config), config);
					}
				} else {
					// 源是目录
					if (targetStats.isFile()) {
						// 目标是文件, 无法比较
						RESULTS.push([
							source,
							target,
							'File type mismatch, directory in source but file in target'
						]);
					} else {
						// 目标也是目录, 比较内部
						const config = {
							source: source,
							target: target,
							ignored: parentConfig.ignored
						};
						compare(buildMapInFolder(config), config);
					}
				}
			}
		});
	Object.keys(map)
		.filter(source => {
			return source.startsWith(TARGET_BUT_NOT_SOURCE);
		})
		.forEach(source => {
			const target = map[source];
			const targetStats = fs.statSync(target);
			RESULTS.push(['', target, 'Not exists in source']);
			if (targetStats.isFile()) {
				// 目标是文件, 无法比较
			} else {
				// 目标也是目录, 比较内部
				const config = {
					source: null,
					target: target,
					ignored: parentConfig.ignored
				};
				compare(buildMapInFolder(config), config);
			}
		});
};

module.exports = config => {
	compare(buildMapInFolder(config), config);

	const output = config.output;
	if (fs.existsSync(output)) {
		// 文件存在
		fs.truncateSync(output);
	}
	fs.appendFileSync(
		output,
		config.sourceName + '\t' + config.targetName + '\tRESULT\n'
	);
	RESULTS.forEach(line => {
		const shortern = [];
		shortern[0] = line[0] === '' ? '' : line[0].substr(config.source.length);
		shortern[1] = line[1] === '' ? '' : line[1].substr(config.target.length);
		shortern[2] = line[2];
		fs.appendFileSync(output, shortern.join('\t') + '\n');
	});
};
