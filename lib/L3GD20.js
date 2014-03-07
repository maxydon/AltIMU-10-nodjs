(function() {
  var I2C, L3GD20, Q, sleep,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  I2C = require('i2c');

  sleep = require('sleep');

  Q = require('q');

  L3GD20 = (function() {

    L3GD20.prototype.gyroscopeWire = null;
    L3GD20.prototype.L3G4200D_ADDRESS_SA0_LOW = 0xD0 >> 1;
    L3GD20.prototype.L3G4200D_ADDRESS_SA0_HIGH = 0xD2 >> 1;
    L3GD20.prototype.L3GD20_ADDRESS_SA0_LOW = 0xD4 >> 1;
    L3GD20.prototype.L3GD20_ADDRESS_SA0_HIGH = 0xD6 >> 1;
    L3GD20.prototype.L3G_DEVICE_AUTO = 0;
    L3GD20.prototype.L3G4200D_DEVICE = 1;
    L3GD20.prototype.L3GD20_DEVICE = 2;
    L3GD20.prototype.L3G_SA0_LOW = 0;
    L3GD20.prototype.L3G_SA0_HIGH = 1;
    L3GD20.prototype.L3G_SA0_AUTO = 2;
    L3GD20.prototype.L3G_WHO_AM_I = 0x0F;
    L3GD20.prototype.L3G_CTRL_REG1 = 0x20;
    L3GD20.prototype.L3G_CTRL_REG2 = 0x21;
    L3GD20.prototype.L3G_CTRL_REG3 = 0x22;
    L3GD20.prototype.L3G_CTRL_REG4 = 0x23;
    L3GD20.prototype.L3G_CTRL_REG5 = 0x24;
    L3GD20.prototype.L3G_REFERENCE = 0x25;
    L3GD20.prototype.L3G_OUT_TEMP = 0x26;
    L3GD20.prototype.L3G_STATUS_REG = 0x27;
    L3GD20.prototype.L3G_OUT_X_L = 0x28;
    L3GD20.prototype.L3G_OUT_X_H = 0x29;
    L3GD20.prototype.L3G_OUT_Y_L = 0x2A;
    L3GD20.prototype.L3G_OUT_Y_H = 0x2B;
    L3GD20.prototype.L3G_OUT_Z_L = 0x2C;
    L3GD20.prototype.L3G_OUT_Z_H = 0x2D;
    L3GD20.prototype.L3G_FIFO_CTRL_REG = 0x2E;
    L3GD20.prototype.L3G_FIFO_SRC_REG = 0x2F;
    L3GD20.prototype.L3G_INT1_CFG = 0x30;
    L3GD20.prototype.L3G_INT1_SRC = 0x31;
    L3GD20.prototype.L3G_INT1_THS_XH = 0x32;
    L3GD20.prototype.L3G_INT1_THS_XL = 0x33;
    L3GD20.prototype.L3G_INT1_THS_YH = 0x34;
    L3GD20.prototype.L3G_INT1_THS_YL = 0x35;
    L3GD20.prototype.L3G_INT1_THS_ZH = 0x36;
    L3GD20.prototype.L3G_INT1_THS_ZL = 0x37;
    L3GD20.prototype.L3G_INT1_DURATION = 0x38;

    function L3GD20(address, device, debug) {
      // this.testWhoAmI = __bind(this.testWhoAmI, this);
      this.address = address || 0x6b;
      this.device = device || '/dev/i2c-1';
      this.debug = debug || false;
      this.gyroscopeWire = new I2C(this.address, {
        device: this.device
      });
      this.enableDefault();
    }

    L3GD20.prototype._send = function(cmd, values) {
      var _this = this;
      if (cmd != null) {
        if (!(values instanceof Array)) {
          values = [values];
        }
        if (this.debug) {
          console.log("cmd " + (cmd.toString(16)) + " values " + values);
        }
        return this.gyroscopeWire.writeBytes(cmd, values, function(err) {
          if (err != null) {
            return console.log("Error: in I2C", err);
          }
        });
      } else {
        if (this.debug) {
          console.log("cmd " + this.adress + " value " + values);
        }
        return this.gyroscopeWire.writeByte(value, function(err) {
          if (err != null) {
            return console.log("Error: in I2C", err);
          }
        });
      }
    };

    L3GD20.prototype._read = function(cmd, length) {
      var callback, callback2, deferred, errback, i, reads, _i,
        _this = this;
      length = length || 1;
      if (this.debug) {
        console.log("reading at " + (this.gyroscopeWire.address.toString(16)) + ", from " + cmd + ", length: " + length);
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
        this.gyroscopeWire.readBytes(cmd, length, callback);
      } else {
        if (length === 1) {
          this.gyroscopeWire.readByte(callback);
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

    L3GD20.prototype.reset = function() {
      if (this.debug) {
        console.log("Resetting L3G Compass");
      }
      return this._send(this.L3G_CTRL_REG1, 0x00);
    };

    L3GD20.prototype.init = function(sa0) {
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

    L3GD20.prototype.autoDetectAddress = function() {
      var validateAdress, validator,
        _this = this;
      validateAdress = function(adress) {
        var check;
        if (_this.debug) {
          console.log("validating adress: " + (adress.toString(16)));
        }
        _this.__orgiAdress = _this.adress;
        _this.address = adress;
        _this.gyroscopeWire.setAddress(adress);
        console.log("pouic", _this.gyroscopeWire.address.toString(16));
        check = function(flag) {
          if (_this.debug) {
            console.log("Adress " + (adress.toString(16)) + " valid: " + flag);
          }
          if (!flag) {
            _this.address = _this.__orgiAdress;
            _this.gyroscopeWire.setAddress(_this.__orgiAdress);
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

    L3GD20.prototype.testWhoAmI = function() {
      var checkValue,
        _this = this;
      checkValue = function(val) {
        val = val[0];
        console.log("pouet");
        console.log("val checked:", val.toString(16), "bla", _this.gyroscopeWire.address.toString(16));
        return val === 0xBB;
      };
      return Q.when(this._read(this.LPS331_WHO_AM_I).then(checkValue));
    };

    L3GD20.prototype.enableDefault = function() {
      return this._send(this.L3G_CTRL_REG1, 0x0F);
    };

    L3GD20.prototype.setResolution = function(res) {
      var value;
      value = 0x70 + res - 1;
      if (this.debug) {
        console.log("setting resolution ", value.toString(16));
      }
      return this._send(this.LPS331_RES_CONF, value);
    };

    L3GD20.prototype.setInterupts = function() {
      this._send(this.LPS331_CTRL_REG3, 0xa0);
      return this.gyroscopeWire.on('data', function(data) {
        return console.log("recieved data", data);
      });
    };

    L3GD20.prototype.readAllAxes = function() {
      var onResult,
        _this = this;
      this._send(this.L3G_OUT_X_L | (1 << 7));
      onResult = function(res) {
        var x, xhg, xlg, y, yhg, ylg, z, zhg, zlg;
        xlg = res[0], xhg = res[1], ylg = res[2], yhg = res[3], zlg = res[4], zhg = res[5];
        x = (((xlg << 8) | xhg) << 16) >> 16;
        y = (((ylg << 8) | yhg) << 16) >> 16;
        z = (((zlg << 8) | zhg) << 16) >> 16;
        return console.log("x " + x + " y " + y + " z " + z);
      };
      return this._read(null, 6).then(onResult);
    };

    return L3GD20;

  })();

  module.exports = L3GD20;

}).call(this);
