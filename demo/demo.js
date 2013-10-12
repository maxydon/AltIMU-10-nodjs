// Generated by CoffeeScript 1.6.3
var LPS331, curMeasurements, measure, measurements, prSensor, sleep, timer;

require('coffee-script');

sleep = require('sleep');

LPS331 = require('../lib/LPS331');

prSensor = new LPS331();

measure = function() {
  prSensor.readTemperatureTest();
  if (measurements > 0) {
    curMeasurements++;
    if (curMeasurements >= measurements) {
      return clearInterval(timer);
    }
  }
};

measurements = 0;

curMeasurements = 0;

timer = setInterval(measure, 1000);
