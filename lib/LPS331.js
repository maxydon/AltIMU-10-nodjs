/******************************************************************************
 * LPS331AP Barometer
 * - DATASHEET: http://www.pololu.com/file/download/LPS331AP.pdf?file_id=0J622
 * - ARDUINO LIBRARY: https://github.com/pololu/lps331-arduino/
 ******************************************************************************/

(function() {
  var I2C, LPS331, Q, sleep,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  I2C = require('i2c');

  sleep = require('sleep');

  Q = require('q');

  var errorHandler = new function(err)
  {
    if (err != null)
    {
      console.log('Error caught: ' + err);
    }
  };

  LPS331 = (function() {


    LPS331.prototype.barometerWire = null;

    //SLAVE ADDRESSES
    var LPS331AP_ADDRESS_SA0_LOW   = 0x5c;
    var LPS331AP_ADDRESS_SA0_HIGH  = 0x5D;

    //SLAVE ADDRESS STATES
    var LPS331_SA0_LOW             = 0;
    var LPS331_SA0_HIGH            = 1;
    var LPS331_SA0_AUTO            = 2;

    //REGISTER ADDRESSES
    /* Note: Some of the register names in the datasheet are inconsistent
     * between Table 14 in section 6 and the register descriptions in
     * section 7. Where they differ, the names from section 7 have been
     * used here.
     **/
    var LPS331_REF_P_XL            = 0x08;
    var LPS331_REF_P_L             = 0x09;
    var LPS331_REF_P_H             = 0x0A;
    var LPS331_WHO_AM_I            = 0x0F;
    var LPS331_RES_CONF            = 0x10;
    var LPS331_CTRL_REG1           = 0x20;
    var LPS331_CTRL_REG2           = 0x21;
    var LPS331_CTRL_REG3           = 0x22;
    var LPS331_INTERRUPT_CFG       = 0x23;
    var LPS331_INT_SOURCE          = 0x24;
    var LPS331_THS_P_L             = 0x25;
    var LPS331_THS_P_H             = 0x26;
    var LPS331_STATUS_REG          = 0x27;
    var LPS331_PRESS_OUT_XL        = 0x28;
    var LPS331_PRESS_OUT_L         = 0x29;
    var LPS331_PRESS_OUT_H         = 0x2A;
    var LPS331_TEMP_OUT_L          = 0x2B;
    var LPS331_TEMP_OUT_H          = 0x2C;
    var LPS331_AMP_CTRL            = 0x30;
    var LPS331_DELTA_PRESS_XL      = 0x3C;
    var LPS331_DELTA_PRESS_L       = 0x3D;
    var LPS331_DELTA_PRESS_H       = 0x3E;
    var LPS331_P_DA                = 0x2; //index 1 bit of the LPS331_STATUS_REG register: 1 if new pressure data is available
    var LPS331_T_DA                = 0x1; //LSB of the LPS331_STATUS_REG register: 1 if new temperature data is available


    /* 

    STEPS TO READ BAROMETER SENSORS
    1. Begin: Write 0xe0 to LPS331_CTRL_REG1, to switch to active mode, 12.5 Hz output data rate (write 0x00 for off)
    2. Read raw pressure: 
      1. Read 3 consecutive bytes starting at LPS331_PRESS_OUT_XL (MSB)
      2. Combine to get raw reading
    3. Read raw temperature:
      1. Read 2 consecutive bytes starting at LPS331_TEMP_OUT_L (MSB)
      2. Combine to get raw reading

    MEASUREMENT / CALCULATIONS
    Pressure:
      1. Pressure in millibars (mbar)/hectopascals (hPa)
        - raw / 4096
      2. Pressure in inches of mercury (inHg)
        - raw / 138706.5
    Temperature:
      1. Temperature in degrees F
        - 108.5 + raw / 480 * 1.8
      2. Temperature in degrees C
        - 42.5 + raw / 480
    */



    function LPS331(wire, address, device, debug) {
      this.address = address || LPS331AP_ADDRESS_SA0_HIGH;
      this.device = device || '/dev/i2c-1';
      this.debug = debug || false;
      this.pressureReady = false;
      this.barometerWire = new I2C(this.address, {
        device: this.device
        // debug: this.debug
      });
      // var resetvalue = this.resetWire();
      var turnon = this.enableDefault();
    };

    LPS331.prototype.resetWire = function() {
      if (this.debug) {
        console.log("Resetting LPS331");
      }
      // Turn off the barometer.
      return this.barometerWire.writeBytes(LPS331_CTRL_REG1, [0x00], errorHandler);
    };

    LPS331.prototype.enableDefault = function() {
      if (this.debug) {
        console.log("Turn on the barometer");
      }
      return this.barometerWire.writeBytes(LPS331_CTRL_REG1, [0xe0], errorHandler);
    };

    LPS331.prototype.newPressureValue = function(next) {
      if (this.debug) {
          console.log("Checking if new Pressure value is available");
          console.log("P_DA value outside function : " + LPS331_P_DA);
        }
      var _this = this;
      return this.barometerWire.readBytes(LPS331_STATUS_REG, 1, function(err, res){
        // LPS331_STATUS_REG => 1 Byte
        // | 7 | 6 |   5|   4| 3 | 2 |   1|   0| 
        // | 0 | 0 |P_OR|T_OR| 0 | 0 |P_DA|T_DA|
        var statusRegister = res.readUInt8(0);
        console.log("LPS331_STATUS_REG value: " + statusRegister);
        console.log("P_DA value: " + LPS331_P_DA);
        console.log("new pressure " + (statusRegister & LPS331_P_DA));
        return (res.readUInt8(0) & LPS331_P_DA) !=0;
      });
    };

    LPS331.prototype.readPressure = function() {
      if (this.debug) {
        console.log("Reading Pressure value");
        console.log("Pressure register " + LPS331_PRESS_OUT_XL);
      }
      // Read raw pressure
      if(this.newPressureValue()){
        var _this = this;
        this.barometerWire.readBytes((LPS331_PRESS_OUT_XL | 0x80), 3, function(err, res)
        {
          if (err != null)
          {
            console.log('Error reading pressure: ' + err);
          }
          else
          {
            console.log("Pressure Buffer: " + res.toString('hex'));

            var pxl = res.readUInt8(0);
            console.log('pxl: ' + pxl);

            var pl = res.readUInt8(1);
            console.log('pl: ' + pl);

            var ph = res.readUInt8(2);
            console.log('ph: ' + ph);

            if (ph&0x80){
              ph |= (-1 << 8);
            }

            var pressure = (ph << 16 | pl << 8 | pxl);
            var pressureMbHPa = _this.rawPressureToHpa(pressure);
            var pressureInHg = _this.rawPressureToInchesHg(pressure);
            var altitudeM = _this.pressureToAltitudeMeters(pressureMbHPa);
            var altitudeF = _this.pressureToAltitudeFeet(pressureInHg);  

            console.log('Pressure (raw): ' + pressure);
            console.log('Pressure (mbar/hPa): ' + pressureMbHPa);
            console.log('Pressure (inHg): ' + pressureInHg);
            console.log('Altitude (m): ' + altitudeM);
            console.log('Altitude (f): ' + altitudeF);
          }
        });
      }
    };
    LPS331.prototype.rawPressureToHpa = function(rawPress) {
      return rawPress / 4096;
    };

    LPS331.prototype.rawPressureToInchesHg = function(rawPress) {
      return rawPress / 138706.5;
    };
    LPS331.prototype.pressureToAltitudeMeters = function(pressure_mbar, altimeter_setting_mbar) {
      altimeter_setting_mbar = altimeter_setting_mbar || 1013.25;
      return (1 - Math.pow(pressure_mbar / altimeter_setting_mbar, 0.190263)) * 44330.8;
    };

    LPS331.prototype.pressureToAltitudeFeet = function(pressure_inHg, altimeter_setting_inHg) {
      altimeter_setting_inHg = altimeter_setting_inHg || 29.9213;
      return (1 - Math.pow(pressure_inHg / altimeter_setting_inHg, 0.190263)) * 145442;
    };

    LPS331.prototype.readTemperature = function() {
      if (this.debug) {
        console.log("Reading Temperature value");
      }
      var _this = this;

      this.barometerWire.readBytes((LPS331_TEMP_OUT_L | 0x80), 2, function(err, res)
      {
        if (err != null)
        {
          console.log('Error reading temperature: ' + err);
        }
        else
        {
          console.log("Temperature Buffer: " + res.toString('hex'));

          var tl = res.readUInt8(0);
          console.log('tl: ' + tl);

          var th = res.readUInt8(1);
          console.log('th: ' + th);

          if (th&0x80){
            th |= (-1 << 8);
          }

          var temperature = (th << 8 | tl);
          console.log('Temperature (raw): ' + temperature);

          var temperatureF = _this.rawTemperatureToFahrenheit(temperature);
          console.log('Temperature (F): ' + temperatureF);

          var temperatureC = _this.rawTemperatureToCelcius(temperature);
          console.log('Temperature (C): ' + temperatureC);
        }
      });
    };

    LPS331.prototype.rawTemperatureToCelcius = function(rawTemp) {
      return 42.5 + rawTemp / 480;
    };

    LPS331.prototype.rawTemperatureToFahrenheit = function(rawTemp) {
      return 108.5 + rawTemp / 480 * 1.8;
    };

    LPS331.prototype.setResolution = function(res) {
      var value;
      value = 0x70 + res - 1;
      if (this.debug) {
        console.log("setting resolution ", value.toString(16));
      }
      return this.barometerWire.writeBytes(LPS331_RES_CONF,[value], function(err) {
          if (err != null) {
            return console.log("Error: in I2C", err);
          }
        });
    };

    LPS331.prototype.setInterupts = function() {
      this.barometerWire.writeBytes(LPS331_CTRL_REG3,[0xa0], function(err) {
          if (err != null) {
            return console.log("Error: in I2C", err);
          }
        });
      return this.barometerWire.on('data', function(data) {
        return console.log("recieved data", data);
      });
    };

    return LPS331;

  })();

  module.exports = LPS331;

}).call(this);
