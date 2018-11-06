import vue from 'rollup-plugin-vue2';
import resolve from 'rollup-plugin-node-resolve';
import cjs from 'rollup-plugin-commonjs';

export default {
  input: 'index.js',
  output: {
    file: 'dist/comma-formatted-number.js',
    format: 'umd',
    name: "CommaFormattedNumber"
  },
  "plugins": [
    vue({'css':'none'}),
    resolve({
      browser: true, 
      jsnext: true,
      only: ["accounting-js", "object-assign"] 
    }),
    cjs(),
  ]
};