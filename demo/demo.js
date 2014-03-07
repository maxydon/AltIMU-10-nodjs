var L3GD20, LPS331, LSM303, compass, curMeasurements, measure, measurements, prSensor, timer;

// var i2c = require('i2c');
// var address = 0x18;
// var wire = new i2c(address, {device: '/dev/i2c-1'}); // point to your i2c address, debug provides REPL interface

LPS331 = require('../lib/LPS331');
LSM303 = require('../lib/LSM303');
L3GD20 = require('../lib/L3GD20');

// prSensor = new LPS331(wire, null, null, true);
// compass = new L3GD20();
accelerometer = new LSM303(null, null, true);

// prSensor.setResolution(9);

measure = function() {
  console.log("---------------*****---------------");

  // console.log("---------------*****---------------");
  // console.log("Reading Temperature");
  // prSensor.readTemperature();
  // console.log("---------------");
  // console.log("Reading Pressure");
  // prSensor.readPressure();
  accelerometer.readAcc();
  // console.log("-------Reading axes--------");
  // compass.readAllAxes();

  console.log(" ");
  if (measurements > 0) {
    curMeasurements++;
    if (curMeasurements >= measurements) {
      return clearInterval(timer);
    }
  }
};

measurements = 0;

curMeasurements = 0;

timer = setInterval(measure, 900);


// wire.scan(function(err, data) {
//   // result contains an array of addresses
//   for (var i = data.length - 1; i >= 0; i--) {
//     console.log(data[i].toString(16));
//   };
// });