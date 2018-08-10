# Configuration
Create and put `folder-compare-config.js` in your app directory.  

```javascript
{
	source: 'SOURCE_DIRECTORY_ABSOLUTE_PATH',
	sourceName: 'SOURCE_COLUMN_NAME',
	target: 'TARGET_DIRECTORY_ABSOLUTE_PATH',
	targetName: 'TARGET_COLUMN_NAME',
	ignored: ['.svn', '.git', '.gitignore', '.DS_Store'],
	output: 'OUTPUT_FILE_ABSOLUTE_PATH'
}
```

# Run
`folder-comparasion`

# Result
A CSV file separated by `TAB`, then open it by Excel.

# Note
The output file:
* Truncate if existed,
* Create if not existed.