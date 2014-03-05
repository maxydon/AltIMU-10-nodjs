// Generated by CoffeeScript 1.3.3
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


    LPS331.prototype.i2c = null;

    LPS331.prototype.LPS331AP_ADDRESS_SA0_LOW = 0xB8;

    LPS331.prototype.LPS331AP_ADDRESS_SA0_HIGH = 0x5D;

    LPS331.prototype.LPS331_SA0_LOW = 0;

    LPS331.prototype.LPS331_SA0_HIGH = 1;

    LPS331.prototype.LPS331_SA0_AUTO = 2;

    LPS331.prototype.LPS331_REF_P_XL = 0x08;

    LPS331.prototype.LPS331_REF_P_L = 0x09;

    LPS331.prototype.LPS331_REF_P_H = 0x0A;

    LPS331.prototype.LPS331_WHO_AM_I = 0x0F;

    LPS331.prototype.LPS331_RES_CONF = 0x10;

    LPS331.prototype.LPS331_CTRL_REG1 = 0x20;

    LPS331.prototype.LPS331_CTRL_REG2 = 0x21;

    LPS331.prototype.LPS331_CTRL_REG3 = 0x22;

    LPS331.prototype.LPS331_INTERRUPT_CFG = 0x23;

    LPS331.prototype.LPS331_INT_SOURCE = 0x24;

    LPS331.prototype.LPS331_THS_P_L = 0x25;

    LPS331.prototype.LPS331_THS_P_H = 0x26;

    LPS331.prototype.LPS331_STATUS_REG = 0x27;

    LPS331.prototype.LPS331_PRESS_OUT_XL = 0x28;

    LPS331.prototype.LPS331_PRESS_OUT_L = 0x29;

    LPS331.prototype.LPS331_PRESS_OUT_H = 0x2A;

    LPS331.prototype.LPS331_TEMP_OUT_L = 0x2B;

    LPS331.prototype.LPS331_TEMP_OUT_H = 0x2C;

    LPS331.prototype.LPS331_AMP_CTRL = 0x30;

    LPS331.prototype.LPS331_DELTA_PRESS_XL = 0x3C;

    LPS331.prototype.LPS331_DELTA_PRESS_L = 0x3D;

    LPS331.prototype.LPS331_DELTA_PRESS_H = 0x3E;

    function LPS331(address, device, debug) {
      this.testWhoAmI = __bind(this.testWhoAmI, this);
      this.address = address || this.LPS331AP_ADDRESS_SA0_HIGH;
      this.device = device || '/dev/i2c-1';
      this.debug = debug || false;
      this.i2c = new I2C(this.address, {
        device: this.device
      });
      this.reset();
      this.enableDefault();
    }

    LPS331.prototype._send = function(cmd, values) {
      var _this = this;
      if (cmd != null) {
        if (!(values instanceof Array)) {
          values = [values];
        }
        if (this.debug) {
          console.log("cmd " + (cmd.toString(16)) + " values " + values);
        }
        return this.i2c.writeBytes(cmd, values, function(err) {
          if (err != null) {
            return console.log("Error: in I2C", err);
          }
        });
      } else {
        if (this.debug) {
          console.log("cmd " + this.adress + " value " + values);
        }
        return this.i2c.writeByte(value, function(err) {
          if (err != null) {
            return console.log("Error: in I2C", err);
          }
        });
      }
    };

    LPS331.prototype._read = function(cmd, length) {
      var callback, callback2, deferred, errback, i, reads, _i,
        _this = this;
      length = length || 1;
      if (this.debug) {
        console.log("reading at " + (this.i2c.address.toString(16)) + ", from " + cmd + ", length: " + length);
      }
      deferred = Q.defer();
      callback = function(err, res) {
        if (err != null) {
          return deferred.reject(err);
        } else {
          return deferred.resolve(res);
        }
      };
      callback2 = function(res) {
        return deferred.resolve(res);
      };
      errback = function(err) {
        return deferred.reject(err);
      };
      if (cmd != null) {
        this.i2c.readBytes(cmd, length, callback);
      } else {
        if (length === 1) {
          this.i2c.readByte(callback);
        } else {
          reads = [];
          for (i = _i = 0; 0 <= length ? _i < length : _i > length; i = 0 <= length ? ++_i : --_i) {
            reads.push(this._read());
          }
          Q.all(reads).then(callback2, errback);
        }
      }
      return deferred.promise;
    };

    LPS331.prototype.reset = function() {
      if (this.debug) {
        console.log("Reseting LPS331");
      }
      return this._send(this.LPS331_CTRL_REG1, 0x00);
    };

    LPS331.prototype.init = function(sa0) {
      var address;
      this.autoDetectAddress().then();
      return;
      switch (sa0) {
        case this.LPS331_SA0_LOW:
          address = this.LPS331AP_ADDRESS_SA0_LOW;
          return testWhoAmI();
        case this.LPS331_SA0_HIGH:
          address = this.LPS331AP_ADDRESS_SA0_HIGH;
          return testWhoAmI();
        default:
          return this.autoDetectAddress();
      }
    };

    LPS331.prototype.autoDetectAddress = function() {
      var validateAdress, validator,
        _this = this;
      validateAdress = function(adress) {
        var check;
        if (_this.debug) {
          console.log("validating adress: " + (adress.toString(16)));
        }
        _this.__orgiAdress = _this.adress;
        _this.address = adress;
        _this.i2c.setAddress(adress);
        console.log("pouic", _this.i2c.address.toString(16));
        check = function(flag) {
          if (_this.debug) {
            console.log("Adress " + (adress.toString(16)) + " valid: " + flag);
          }
          if (!flag) {
            _this.address = _this.__orgiAdress;
            _this.i2c.setAddress(_this.__orgiAdress);
            throw new Error("Invalid adress");
          }
        };
        return _this.testWhoAmI().then(check);
      };
      validator = function() {};
      return validateAdress(0x9B).fail(function() {
        return validateAdress(_this.LPS331AP_ADDRESS_SA0_HIGH);
      });
    };

    LPS331.prototype.testWhoAmI = function() {
      var checkValue,
        _this = this;
      checkValue = function(val) {
        val = val[0];
        console.log("pouet");
        console.log("val checked:", val.toString(16), "bla", _this.i2c.address.toString(16));
        return val === 0xBB;
      };
      return Q.when(this._read(this.LPS331_WHO_AM_I).then(checkValue));
    };

    LPS331.prototype.enableDefault = function() {
      return this._send(this.LPS331_CTRL_REG1, 0xE0);
    };

    LPS331.prototype.setResolution = function(res) {
      var value;
      value = 0x70 + res - 1;
      if (this.debug) {
        console.log("setting resolution ", value.toString(16));
      }
      return this._send(this.LPS331_RES_CONF, value);
    };

    LPS331.prototype.setInterupts = function() {
      this._send(this.LPS331_CTRL_REG3, 0xa0);
      return this.i2c.on('data', function(data) {
        return console.log("recieved data", data);
      });
    };

    LPS331.prototype.readPressure = function(pressType) {
      // Turn on the barometer.
      this.i2c.writeBytes(this.LPS331_CTRL_REG1, [0xe0], errorHandler);

      // // Read raw pressure
      this.i2c.readBytes((this.LPS331_PRESS_OUT_XL | 0x80), 3, function(err, res)
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
          var pressureMbHPa = pressure / 4096;
          var pressureInHg = pressure / 138706.5;

          console.log('Pressure (raw): ' + pressure);
          console.log('Pressure (mbar/hPa): ' + pressureMbHPa);
          console.log('Pressure (inHg): ' + pressureInHg);
        }
      });
    };

    LPS331.prototype.readTemperature = function() {
      //reading temperature
      this.i2c.readBytes((this.LPS331_TEMP_OUT_L | 0x80), 2, function(err, res)
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

          var temperatureF = 108.5 + temperature / 480 * 1.8;
          console.log('Temperature (F): ' + temperatureF);

          var temperatureC = 42.5 + temperature / 480;
          console.log('Temperature (C): ' + temperatureC);
        }
      });
    };

    LPS331.prototype.pressureToAltitudeMeters = function(pressure_mbar, altimeter_setting_mbar) {
      altimeter_setting_mbar = altimeter_setting_mbar || 1013.25;
      return (1 - Math.pow(pressure_mbar / altimeter_setting_mbar, 0.190263)) * 44330.8;
    };

    LPS331.prototype.pressureToAltitudeFeet = function(pressure_inHg, altimeter_setting_inHg) {
      altimeter_setting_inHg = altimeter_setting_inHg || 29.9213;
      return (1 - Math.pow(pressure_inHg / altimeter_setting_inHg, 0.190263)) * 145442;
    };

    LPS331.prototype.rawTemperatureToCelcius = function(rawTemp) {
      return 42.5 + rawTemp / 480;
    };

    LPS331.prototype.rawTemperatureToFahrenheit = function(rawTemp) {
      return 108.5 + rawTemp / 480 * 1.8;
    };

    LPS331.prototype.rawPressureToHpa = function(rawPress) {
      return rawPress / 4096;
    };

    LPS331.prototype.rawPressureToInchesHg = function(rawPress) {
      return rawPress / 138706.5;
    };

    return LPS331;

  })();

  module.exports = LPS331;

}).call(this);