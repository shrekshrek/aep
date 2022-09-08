import {uglify} from 'rollup-plugin-uglify';

export default [{
    input: 'src/AEP.js',
    indent: '\t',
    context: 'window',
    output: [
        {
            format: 'umd',
            name: 'AEP',
            file: 'build/aep.wx.js'
        }
    ],
    banner: '/*!\n * GIT: https://github.com/shrekshrek/aep\n **/\n',
}, {
    input: 'src/AEP.js',
    indent: '\t',
    context: 'window',
    output: [
        {
            format: 'umd',
            name: 'AEP',
            file: 'build/aep.wx.min.js',
        }
    ],
    plugins: [
        uglify()
    ],
}];
