// Generated by CoffeeScript 1.6.3
var LPS331, i, prSensor, sleep, _i;

require('coffee-script');

sleep = require('sleep');

LPS331 = require('../lib/LPS331');

prSensor = new LPS331();

for (i = _i = 0; _i <= 100; i = ++_i) {
  prSensor.readTemperatureTest();
  sleep.sleep(2);
}