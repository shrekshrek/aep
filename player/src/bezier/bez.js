import {global} from '../static';

function bezFunction() {

    function BezierData(length) {
        this.segmentLength = 0;
        this.points = new Array(length);
    }

    function PointData(length, ptDistance, point) {
        this.length = length;
        this.ptDistance = ptDistance;
        this.point = point;
    }

    var buildBezierData = (function () {

        var storedData = {};

        return function (keyData, segmentLength) {
            var pt1 = keyData.s;
            var pt2 = keyData.e;
            var pt3 = keyData.to;
            var pt4 = keyData.ti;
            var bezierName = (pt1.join('_') + '_' + pt2.join('_') + '_' + pt3.join('_') + '_' + pt4.join('_')).replace(/\./g, 'p');
            if (storedData[bezierName]) {
                return storedData[bezierName];
            }
            var curveSegments = Math.max(Math.min(Math.round(segmentLength), global.curveSegments), 2);
            var k, i, len;
            var ptCoord, perc, addedLength = 0;
            var ptDistance;
            var point, lastPoint = null;
            var bezierData = new BezierData(curveSegments);
            len = pt3.length;
            for (k = 0; k < curveSegments; k += 1) {
                point = new Array(len);
                perc = k / (curveSegments - 1);
                ptDistance = 0;
                for (i = 0; i < len; i += 1) {
                    ptCoord = Math.pow(1 - perc, 3) * pt1[i] + 3 * Math.pow(1 - perc, 2) * perc * (pt1[i] + pt3[i]) + 3 * (1 - perc) * Math.pow(perc, 2) * (pt2[i] + pt4[i]) + Math.pow(perc, 3) * pt2[i];
                    point[i] = ptCoord;
                    if (lastPoint !== null) {
                        ptDistance += Math.pow(point[i] - lastPoint[i], 2);
                    }
                }
                ptDistance = Math.sqrt(ptDistance);
                addedLength += ptDistance;
                bezierData.points[k] = new PointData(addedLength, ptDistance, point);
                lastPoint = point;
            }
            bezierData.segmentLength = addedLength;
            storedData[bezierName] = bezierData;
            return bezierData;
        }
    }());

    return {
        buildBezierData: buildBezierData
    };
}

var bez = bezFunction();

export {bez};