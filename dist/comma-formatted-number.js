(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.CommaFormattedNumber = factory());
}(this, (function () { 'use strict';

	/*
	object-assign
	(c) Sindre Sorhus
	@license MIT
	*/
	/* eslint-disable no-unused-vars */
	var getOwnPropertySymbols = Object.getOwnPropertySymbols;
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var propIsEnumerable = Object.prototype.propertyIsEnumerable;

	function toObject(val) {
		if (val === null || val === undefined) {
			throw new TypeError('Object.assign cannot be called with null or undefined');
		}

		return Object(val);
	}

	function shouldUseNative() {
		try {
			if (!Object.assign) {
				return false;
			}

			// Detect buggy property enumeration order in older V8 versions.

			// https://bugs.chromium.org/p/v8/issues/detail?id=4118
			var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
			test1[5] = 'de';
			if (Object.getOwnPropertyNames(test1)[0] === '5') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test2 = {};
			for (var i = 0; i < 10; i++) {
				test2['_' + String.fromCharCode(i)] = i;
			}
			var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
				return test2[n];
			});
			if (order2.join('') !== '0123456789') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test3 = {};
			'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
				test3[letter] = letter;
			});
			if (Object.keys(Object.assign({}, test3)).join('') !==
					'abcdefghijklmnopqrst') {
				return false;
			}

			return true;
		} catch (err) {
			// We don't expect any of the above to throw, but better to be safe.
			return false;
		}
	}

	var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
		var from;
		var to = toObject(target);
		var symbols;

		for (var s = 1; s < arguments.length; s++) {
			from = Object(arguments[s]);

			for (var key in from) {
				if (hasOwnProperty.call(from, key)) {
					to[key] = from[key];
				}
			}

			if (getOwnPropertySymbols) {
				symbols = getOwnPropertySymbols(from);
				for (var i = 0; i < symbols.length; i++) {
					if (propIsEnumerable.call(from, symbols[i])) {
						to[symbols[i]] = from[symbols[i]];
					}
				}
			}
		}

		return to;
	};

	function _stripInsignificantZeros(str, decimal) {
	  const parts = str.split(decimal);
	  const integerPart = parts[0];
	  const decimalPart = parts[1].replace(/0+$/, '');

	  if (decimalPart.length > 0) {
	    return integerPart + decimal + decimalPart;
	  }

	  return integerPart;
	}

	/**
	 * The library's settings configuration object.
	 *
	 * Contains default parameters for currency and number formatting
	 */
	const settings = {
	  symbol: '$',        // default currency symbol is '$'
	  format: '%s%v',     // controls output: %s = symbol, %v = value (can be object, see docs)
	  decimal: '.',       // decimal point separator
	  thousand: ',',      // thousands separator
	  precision: 2,       // decimal places
	  grouping: 3,        // digit grouping (not implemented yet)
	  stripZeros: false,  // strip insignificant zeros from decimal part
	  fallback: 0         // value returned on unformat() failure
	};

	/**
	 * Check and normalise the value of precision (must be positive integer)
	 */
	function _checkPrecision(val, base) {
	  val = Math.round(Math.abs(val));
	  return isNaN(val) ? base : val;
	}

	/**
	 * Implementation of toFixed() that treats floats more like decimals
	 *
	 * Fixes binary rounding issues (eg. (0.615).toFixed(2) === '0.61') that present
	 * problems for accounting- and finance-related software.
	 *
	 * ```js
	 *  (0.615).toFixed(2);           // "0.61" (native toFixed has rounding issues)
	 *  accounting.toFixed(0.615, 2); // "0.62"
	 * ```
	 *
	 * @method toFixed
	 * @for accounting
	 * @param {Float}   value         The float to be treated as a decimal number.
	 * @param {Number} [precision=2] The number of decimal digits to keep.
	 * @return {String} The given number transformed into a string with the given precission
	 */
	function toFixed(value, precision) {
	  precision = _checkPrecision(precision, settings.precision);
	  const power = Math.pow(10, precision);

	  // Multiply up by precision, round accurately, then divide and use native toFixed():
	  return (Math.round((value + 1e-8) * power) / power).toFixed(precision);
	}

	/**
	 * Format a number, with comma-separated thousands and custom precision/decimal places
	 * Alias: `accounting.format()`
	 *
	 * Localise by overriding the precision and thousand / decimal separators
	 *
	 * ```js
	 * accounting.formatNumber(5318008);              // 5,318,008
	 * accounting.formatNumber(9876543.21, { precision: 3, thousand: " " }); // 9 876 543.210
	 * ```
	 *
	 * @method formatNumber
	 * @for accounting
	 * @param {Number}        number The number to be formatted.
	 * @param {Object}        [opts={}] Object containing all the options of the method.
	 * @return {String} The given number properly formatted.
	  */
	function formatNumber(number, opts = {}) {
	  // Resursively format arrays:
	  if (Array.isArray(number)) {
	    return number.map((val) => formatNumber(val, opts));
	  }

	  // Build options object from second param (if object) or all params, extending defaults:
	  opts = objectAssign({},
	    settings,
	    opts
	  );

	  // Do some calc:
	  const negative = number < 0 ? '-' : '';
	  const base = parseInt(toFixed(Math.abs(number), opts.precision), 10) + '';
	  const mod = base.length > 3 ? base.length % 3 : 0;

	  // Format the number:
	  const formatted = negative +
	    (mod ? base.substr(0, mod) + opts.thousand : '') +
	      base.substr(mod).replace(/(\d{3})(?=\d)/g, '$1' + opts.thousand) +
	        (opts.precision > 0 ? opts.decimal + toFixed(Math.abs(number), opts.precision).split('.')[1] : '');

	  return opts.stripZeros ? _stripInsignificantZeros(formatted, opts.decimal) : formatted;
	}

	/**
	 * Takes a string/array of strings, removes all formatting/cruft and returns the raw float value
	 * Alias: `accounting.parse(string)`
	 *
	 * Decimal must be included in the regular expression to match floats (defaults to
	 * accounting.settings.decimal), so if the number uses a non-standard decimal
	 * separator, provide it as the second argument.
	 *
	 * Also matches bracketed negatives (eg. '$ (1.99)' => -1.99)
	 *
	 * Doesn't throw any errors (`NaN`s become 0) but this may change in future
	 *
	 * ```js
	 *  accounting.unformat("£ 12,345,678.90 GBP"); // 12345678.9
	 * ```
	 *
	 * @method unformat
	 * @for accounting
	 * @param {String|Array<String>} value The string or array of strings containing the number/s to parse.
	 * @param {Number}               decimal Number of decimal digits of the resultant number
	 * @return {Float} The parsed number
	 */
	function unformat(value, decimal = settings.decimal, fallback = settings.fallback) {
	  // Recursively unformat arrays:
	  if (Array.isArray(value)) {
	    return value.map((val) => unformat(val, decimal, fallback));
	  }

	  // Return the value as-is if it's already a number:
	  if (typeof value === 'number') return value;

	   // Build regex to strip out everything except digits, decimal point and minus sign:
	  const regex = new RegExp('[^0-9-(-)-' + decimal + ']', ['g']);
	  const unformattedValueString =
	      ('' + value)
	      .replace(regex, '')         // strip out any cruft
	      .replace(decimal, '.')      // make sure decimal point is standard
	      .replace(/\(([-]*\d*[^)]?\d+)\)/g, '-$1') // replace bracketed values with negatives
	      .replace(/\((.*)\)/, '');   // remove any brackets that do not have numeric value

	  /**
	   * Handling -ve number and bracket, eg.
	   * (-100) = 100, -(100) = 100, --100 = 100
	   */
	  const negative = (unformattedValueString.match(/-/g) || 2).length % 2,
	    absUnformatted = parseFloat(unformattedValueString.replace(/-/g, '')),
	    unformatted = absUnformatted * ((negative) ? -1 : 1);

	  // This will fail silently which may cause trouble, let's wait and see:
	  return !isNaN(unformatted) ? unformatted : fallback;
	}

	var CommaFormattedNumber = {
	render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('input',{directives:[{name:"format-with-comma",rawName:"v-format-with-comma"}],attrs:{"data-position":_vm.position,"data-prev-value":_vm.prevValue},domProps:{"value":_vm.formatedValue},on:{"input":_vm.handleInput,"blur":_vm.onBlurHandler}})},
	staticRenderFns: [],
	  name: "CommaFormattedNumber",
	  props: {
	    formatOptions: {
	      type: Object,
	      default() {
	        return {};
	      },
	    },
	    value: {
	      type: String,
	      default: "",
	      required: true,
	    }
	  },
	  data() {
	    return {
	      formatedValue: this.processFormatting(this.value, this.formatOptions),
	      prevValue: "",
	      position: 0,
	    };
	  },
	  directives: {
	    formatWithComma: {
	      update(e) {
	        let positionDiff = 0;
	        if (e.dataset.prevValue.length === (e.value.length - 1)) {
	          positionDiff = 1;
	        }
	        if (e.dataset.prevValue.length === (e.value.length + 1)) {
	          positionDiff = -1;
	        }
	        if (e.selectionEnd !== e.dataset.position) {
	          e.selectionEnd = Number(e.dataset.position) + positionDiff;
	        }
	      }
	    }
	  },
	  watch: {
	    value() {
	      this.formatedValue = this.processFormatting(this.value, this.formatOptions);
	    }
	  },
	  methods: {
	    onBlurHandler(e) {
	      this.$emit("blur", e);
	    },
	    handleInput(e) {
	      this.prevValue = e.target.value;
	      let targetValue = unformat(e.target.value);
	      this.position = e.target.selectionStart;
	      this.formatedValue = formatNumber(targetValue, this.formatOptions);
	      this.$emit("input", this.formatedValue);
	    },
	    processFormatting(value, formatOptions) {
	      if (!value) {
	        return 0;
	      }
	      if (typeof value === "string" && value.indexOf(',') >= 0) {
	        return value;
	      }
	      return formatNumber(value, formatOptions);
	    }
	  }
	};

	return CommaFormattedNumber;

})));
