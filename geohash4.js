// A base4 geohash library.
//
// This is simular to the standard geohash but is encoded in base4 instead of
// base32. The advantage of base4 is that reduction of precision is more
// predictable and precise. Dropping one digit from the end always increases
// the size of the box by a factor of 2.
//
// A table traslating the number of positions in the base4 geohash to the
// width of the box in degrees and meters. The height of the box will be half
// the width when measured in degrees.
//
// The width in meters depends on the latitude. The numbers below are roughly
// correct for Southern US. They would be about 20% less for Toronto. The
// height of each cell would be about 1/2 of that (or, more precisely, about
// 56%).
//
// # posisions   width in deg.    ~ width in m
//
//    0               360         ~ 36,000 km
//    1               180         ~ 18,000 km
//    2                90          ~ 9,000 km
//    3                45          ~ 4,500 km
//    4                22          ~ 2,350 km
//    5                11          ~ 1,100 km
//    6                5.6           ~ 560 km
//    7                2.8           ~ 280 km
//    8                1.4           ~ 140 km
//    9                0.70           ~ 70 km
//   10                0.35           ~ 35 km
//   11                0.18           ~ 18 km
//   12                0.088           ~ 8.8 km
//   13                0.044           ~ 4.4 km
//   14                0.022           ~ 2.2 km
//   15                0.011           ~ 1.1 km
//   16                0.0055        ~ 550 m
//   17                0.0027        ~ 270 m
//   18                0.0014        ~ 140 m
//   19                0.00069        ~ 67 m
//   20                0.00034        ~ 34 m
//   21                0.00017        ~ 17 m
//   22                0.000086       ~ 8.6 m
//   23                0.000043       ~ 4.3 m
//   24                0.000021       ~ 2.1 m
//

/* global require, exports, _ */

'use strict';

var GeoHash4 = (function () {

  var b4bits = {
    '00': 'a',
    '01': 'b',
    '10': 'c',
    '11': 'd'
  };

  var invert = {
    'a': [0, 0],
    'b': [0, 1],
    'c': [1, 0],
    'd': [1, 1]
  };

  function getBits(value, min, max, numBits) {
    var mid;
    if (numBits === 0) {
      return '';
    } else {
      mid = (max + min) / 2;
      if (value < mid) {
        return '0' + getBits(value, min, mid, numBits - 1);
      } else {
        return '1' + getBits(value, mid, max, numBits - 1);
      }
    }
  }

  function mergeBits(lngBits, latBits) {
    var mergedBits = [];
    var i;
    var length = lngBits.length;
    var twoBits;

    for (i = 0; i < length; i++) {
      twoBits = latBits[i] + lngBits[i];
      mergedBits.push(b4bits[twoBits]);
    }
    return mergedBits.join('');
  }

  function encode(longitude, latitude, precision) {
    return mergeBits(
      getBits(longitude, -180, 180, precision || 24),
      getBits(latitude, -90, 90, precision || 24)
    );
  }

  function decode(geohash) {
    var i;
    var length = geohash.length;
    var lat = -90;
    var lng = -180;
    var curSize = 90;
    var bits;

    for (i = 0; i < length; i++) {
      bits = invert[geohash[i]];
      lng += 2 * curSize * bits[1];
      lat += curSize * bits[0];
      curSize = curSize / 2;
    }
    return {
      longitude: lng + curSize * 2,
      longitudeMargin: curSize * 2,
      latitude: lat + curSize,
      latitudeMargin: curSize
    };
  }

  function calculateGapRatio(hash1, hash2, axis) {
    var decoded1 = decode(hash1);
    var decoded2 = decode(hash2);
    var axisMargin = axis + 'Margin';
    var delta = decoded1[axis] - decoded2[axis];
    var margins = decoded1[axisMargin] + decoded2[axisMargin];

    if (delta < 0.00000000001) {
      return 0;
    } else {
      return (delta - margins) / delta;
    }
  }

  function getOptimalPrefixLength(boundingBox, factor) {

    // First, figure out the width of the bounding box in degrees.
    var mapWidth = Math.abs(Number(boundingBox[2]) - Number(boundingBox[0]));

    // If a factor is provided, multiply by this. (This is to allow the client
    // to get precision corresponding to larger boxes.
    mapWidth = mapWidth * (factor || 1);

    // Calculate ratio of target box width to the planet's circumference.
    // E.g., if we are working with a box that is 0.5 degrees wide, this will
    // give us 720, meaning our box is 1/720th of Earth's circumference.
    var ratioToCircumference = 360 / mapWidth;

    // Now take a natural log of that. This tells us how many times we would
    // need to divide the circumference to get to the desired width. For a box
    // that .5 degrees wide, we would get 9.49. Meaning, if we halve the
    // circumference 9 times we would get a somewhat bigger box and if  while
    // halving it 10 times would give us a smaller box.
    var log2 = Math.log(ratioToCircumference) / Math.log(2);

    // We then return the floor as the desired precision. In this case, we
    // conclude that the best size of the prefix is 9.
    return Math.floor(log2);
  }

  function getGeohashesForBoundingBox(boundingBox, precision, indent) {

    indent = indent || '';

    var lat1, lat2, lng1, lng2;
    var sw; // Southwest
    var nw; // Northwest
    var ne;
    var se;
    var eastWestGap;
    var northSouthGap;
    var results;
    var midPoint;
    var caseName;

    lng1 = Number(boundingBox[0]);
    lat1 = Number(boundingBox[1]);
    lng2 = Number(boundingBox[2]);
    lat2 = Number(boundingBox[3]);

    precision = precision || getOptimalPrefixLength(boundingBox);

    // First, let's see if 2 geohashes will span east-west.
    sw = encode(lng1, lat1, precision);
    se = encode(lng2, lat1, precision);
    eastWestGap = calculateGapRatio(sw, se, 'longitude');

    if (eastWestGap) {
      // Split east-west
      caseName = 'Split east-west';
      midPoint = (lng1 + lng2) / 2;
      results = [
        getGeohashesForBoundingBox([lng1, lat1, midPoint, lat2], precision,
          indent + '  '),
        getGeohashesForBoundingBox([midPoint, lat1, lng2, lat2], precision,
          indent + '  ')
      ];
    } else {
      nw = encode(lng1, lat2, precision);
      northSouthGap = calculateGapRatio(nw, sw, 'latitude');
      if (northSouthGap) {
        // Split north-south
        caseName = 'Split north-south';
        midPoint = (lat1 + lat2) / 2;
        results = [
          getGeohashesForBoundingBox([lng1, lat1, lng2, midPoint], precision,
            indent + '  '),
          getGeohashesForBoundingBox([lng1, midPoint, lng2, lat2], precision,
            indent + '  ')
        ];
      } else {
        // Looks like geohashes for 4 courners should be enough
        caseName = 'Basic';
        ne = encode(lng2, lat2, precision);
        results = [nw, ne, sw, se];
      }
    }

    var __;

    if (typeof require !== 'undefined') {
      __ = require('underscore');
    } else {
      __ = _;
    }

    results = __.uniq(__.flatten(results));

    // console.log(indent, boundingBox.join(','), results.join(','), caseName, eastWestGap, northSouthGap);

    return results;
  }

  return {
    encode: encode,
    decode: decode,
    getGeohashesForBoundingBox: getGeohashesForBoundingBox,
    getOptimalPrefixLength: getOptimalPrefixLength
  };

})();

if (typeof exports !== 'undefined') {
  exports.encode = GeoHash4.encode;
  exports.decode = GeoHash4.decode;
  exports.getOptimalPrefixLength = GeoHash4.getOptimalPrefixLength;
  exports.getGeohashesForBoundingBox = GeoHash4.getGeohashesForBoundingBox;
}