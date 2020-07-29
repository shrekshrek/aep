
var generalUtils = function () {
    'use strict';
    var ob = {};

    function random(len) {
        var sequence = 'abcdefghijklmnoqrstuvwxyz1234567890', returnString = '', i;
        for (i = 0; i < len; i += 1) {
            returnString += sequence.charAt(Math.floor(Math.random() * sequence.length));
        }
        return returnString;
    }

    function roundArray(arr, decimals) {
        var i, len = arr.length;
        var retArray = [];
        for (i = 0; i < len; i += 1) {
            if (typeof arr[i] === 'number') {
                retArray.push(roundNumber(arr[i], decimals));
            } else {
                retArray.push(roundArray(arr[i], decimals));
            }
        }
        return retArray;
    }

    function roundNumber(num, decimals) {
        num = num || 0;
        if (typeof num === 'number') {
            return parseFloat(num.toFixed(decimals));
        } else {
            return roundArray(num, decimals);
        }
    }

    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    function arrayRgbToHex(values) {
        return rgbToHex(Math.round(values[0] * 255), Math.round(values[1] * 255), Math.round(values[2] * 255));
    }

    ob.random = random;
    ob.roundNumber = roundNumber;
    ob.arrayRgbToHex = arrayRgbToHex;

    return ob;

}();

export {generalUtils};