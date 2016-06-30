# Geohash4: a base4 geohash implementation.

This is similar to the standard [geohash](https://en.wikipedia.org/wiki/Geohash)
but is encoded in base4 instead of base32.

The advantage of base4 is that reduction of precision is a lot more
predictable and precise: __Dropping one digit from the end always increases
the size of the box by a factor of 2.__

The table below traslats the number of positions in the base4 geohash to the
width of the box in degrees and meters. The height of the box will be half
the width when measured in degrees.

The width in meters depends on the latitude. The numbers below are roughly
correct for Southern US (Austin, TX). They would be about 20% smaller for a city like Toronto. The height of each cell would be about 1/2 of that (or, more precisely, about
56%).

| # Positions  | Width in degrees | Approx. width in meters |
| ------------ | ---------------- | ----------------------- |
|  0           |   360         | ~ 36,000 km |
|  1           |   180         | ~ 18,000 km |
|  2           |    90          | ~ 9,000 km |
|  3           |    45          | ~ 4,500 km |
|  4           |    22          | ~ 2,350 km |
|  5           |    11          | ~ 1,100 km |
|  6           |    5.6           | ~ 560 km |
|  7           |    2.8           | ~ 280 km |
|  8           |    1.4           | ~ 140 km |
|  9           |    0.70           | ~ 70 km |
| 10           |    0.35           | ~ 35 km |
| 11           |    0.18           | ~ 18 km |
| 12           |    0.088           | ~ 8.8 km |
| 13           |    0.044           | ~ 4.4 km |
| 14           |    0.022           | ~ 2.2 km |
| 15           |    0.011           | ~ 1.1 km |
| 16           |    0.0055        | ~ 550 m |
| 17           |    0.0027        | ~ 270 m |
| 18           |    0.0014        | ~ 140 m |
| 19           |    0.00069        | ~ 67 m |
| 20           |    0.00034        | ~ 34 m |
| 21           |    0.00017        | ~ 17 m |
| 22           |    0.000086       | ~ 8.6 m |
| 23           |    0.000043       | ~ 4.3 m |
| 24           |    0.000021       | ~ 2.1 m |
