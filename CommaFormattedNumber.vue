<template>
  <input
    :value="formatedValue"
    v-format-with-comma
    v-on:input="handleInput"
    :data-position="position"
    :data-prev-value="prevValue"
    @blur="onBlurHandler"
  />
</template>

<script>

import formatNumber from 'accounting-js/lib/formatNumber';
import unformat from 'accounting-js/lib/unformat';

export default {
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
      this.formatedValue = formatNumber(targetValue, this.formatOptions)
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
</script>
