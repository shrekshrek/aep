export default [{
	entry: 'src/exporter.jsx',
	indent: '\t',
	targets: [
		{
			format: 'es',
			dest: 'build/aexporter.jsx'
		}
	],
    banner: '/*!\n * GIT: https://github.com/shrekshrek\n * @author: Shrek.wang\n **/\n',
}];
