(function() {
  var I2C, LSM303, Q, Vector, sleep,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  I2C = require('i2c');

  sleep = require('sleep');

  Q = require('q');

  Vector = (function() {

    function Vector(x, y, z) {
      this.x = x || 0;
      this.y = y || 0;
      this.z = z || 0;
    }

    return Vector;

  })();

  LSM303 = (function() {

    LSM303.prototype.i2c = null;
    LSM303.prototype.LSM303DLH_DEVICE          = 0;
    LSM303.prototype.LSM303DLM_DEVICE          = 1;
    LSM303.prototype.LSM303DLHC_DEVICE         = 2;
    LSM303.prototype.LSM303_DEVICE_AUTO        = 3;
    LSM303.prototype.LSM303_SA0_A_LOW          = 0;
    LSM303.prototype.LSM303_SA0_A_HIGH         = 1;
    LSM303.prototype.LSM303_SA0_A_AUTO         = 2;
    LSM303.prototype.LSM303_CTRL_REG1_A        = 0x20;
    LSM303.prototype.LSM303_CTRL_REG2_A        = 0x21;
    LSM303.prototype.LSM303_CTRL_REG3_A        = 0x22;
    LSM303.prototype.LSM303_CTRL_REG4_A        = 0x23;
    LSM303.prototype.LSM303_CTRL_REG5_A        = 0x24;
    LSM303.prototype.LSM303_CTRL_REG6_A        = 0x25;
    LSM303.prototype.LSM303_HP_FILTER_RESET_A  = 0x25;
    LSM303.prototype.LSM303_REFERENCE_A        = 0x26;
    LSM303.prototype.LSM303_STATUS_REG_A       = 0x27;
    LSM303.prototype.LSM303_OUT_X_L_A          = 0x28;
    LSM303.prototype.LSM303_OUT_X_H_A          = 0x29;
    LSM303.prototype.LSM303_OUT_Y_L_A          = 0x2A;
    LSM303.prototype.LSM303_OUT_Y_H_A          = 0x2B;
    LSM303.prototype.LSM303_OUT_Z_L_A          = 0x2C;
    LSM303.prototype.LSM303_OUT_Z_H_A          = 0x2D;
    LSM303.prototype.LSM303_FIFO_CTRL_REG_A    = 0x2E;
    LSM303.prototype.LSM303_FIFO_SRC_REG_A     = 0x2F;
    LSM303.prototype.LSM303_INT1_CFG_A         = 0x30;
    LSM303.prototype.LSM303_INT1_SRC_A         = 0x31;
    LSM303.prototype.LSM303_INT1_THS_A         = 0x32;
    LSM303.prototype.LSM303_INT1_DURATION_A    = 0x33;
    LSM303.prototype.LSM303_INT2_CFG_A         = 0x34;
    LSM303.prototype.LSM303_INT2_SRC_A         = 0x35;
    LSM303.prototype.LSM303_INT2_THS_A         = 0x36;
    LSM303.prototype.LSM303_INT2_DURATION_A    = 0x37;
    LSM303.prototype.LSM303_CLICK_CFG_A        = 0x38;
    LSM303.prototype.LSM303_CLICK_SRC_A        = 0x39;
    LSM303.prototype.LSM303_CLICK_THS_A        = 0x3A;
    LSM303.prototype.LSM303_TIME_LIMIT_A       = 0x3B;
    LSM303.prototype.LSM303_TIME_LATENCY_A     = 0x3C;
    LSM303.prototype.LSM303_TIME_WINDOW_A      = 0x3D;
    LSM303.prototype.LSM303_CRA_REG_M          = 0x00;
    LSM303.prototype.LSM303_CRB_REG_M          = 0x01;
    LSM303.prototype.LSM303_MR_REG_M           = 0x02;
    LSM303.prototype.LSM303_OUT_X_H_M          = 0x03;
    LSM303.prototype.LSM303_OUT_X_L_M          = 0x04;
    LSM303.prototype.LSM303_OUT_Y_H_M          = -1;
    LSM303.prototype.LSM303_OUT_Y_L_M          = -2;
    LSM303.prototype.LSM303_OUT_Z_H_M          = -3;
    LSM303.prototype.LSM303_OUT_Z_L_M          = -4;
    LSM303.prototype.LSM303_SR_REG_M           = 0x09;
    LSM303.prototype.LSM303_IRA_REG_M          = 0x0A;
    LSM303.prototype.LSM303_IRB_REG_M          = 0x0B;
    LSM303.prototype.LSM303_IRC_REG_M          = 0x0C;
    LSM303.prototype.LSM303_WHO_AM_I_M         = 0x0F;
    LSM303.prototype.LSM303_TEMP_OUT_H_M       = 0x31;
    LSM303.prototype.LSM303_TEMP_OUT_L_M       = 0x32;
    LSM303.prototype.LSM303DLH_OUT_Y_H_M       = 0x05;
    LSM303.prototype.LSM303DLH_OUT_Y_L_M       = 0x06;
    LSM303.prototype.LSM303DLH_OUT_Z_H_M       = 0x07;
    LSM303.prototype.LSM303DLH_OUT_Z_L_M       = 0x08;
    LSM303.prototype.LSM303DLM_OUT_Z_H_M       = 0x05;
    LSM303.prototype.LSM303DLM_OUT_Z_L_M       = 0x06;
    LSM303.prototype.LSM303DLM_OUT_Y_H_M       = 0x07;
    LSM303.prototype.LSM303DLM_OUT_Y_L_M       = 0x08;
    LSM303.prototype.LSM303DLHC_OUT_Z_H_M      = 0x05;
    LSM303.prototype.LSM303DLHC_OUT_Z_L_M      = 0x06;
    LSM303.prototype.LSM303DLHC_OUT_Y_H_M      = 0x07;
    LSM303.prototype.LSM303DLHC_OUT_Y_L_M      = 0x08;

    function LSM303(address, device, debug) {
      this.testWhoAmI = __bind(this.testWhoAmI, this);
      this.address = address || 0x19;
      this.device = device || '/dev/i2c-1';
      this.debug = debug || false;
      this.accelerometerWire = new I2C(this.address, {
        device: this.device
      });
      this.accAdress = 0x19;
      this.magAddress = 0x1e;
      this.accReading = new Vector();
      this.magReading = new Vector();
      this.magMax = new Vector(540, 500, 180);
      this.magMin = new Vector(-520, -570, -770);
      this.ioTimeout = 0;
      this.didTimeout = false;
      this.enableDefault();
    }

    LSM303.prototype._send = function(cmd, values) {
      var _this = this;
      if (cmd != null) {
        if (!(values instanceof Array)) {
          values = [values];
        }
        if (this.debug) {
          console.log("cmd " + (cmd.toString(16)) + " values " + values);
        }
        return this.accelerometerWire.writeBytes(cmd, values, function(err) {
          if (err != null) {
            return console.log("Error: in I2C", err);
          }
        });
      } else {
        if (this.debug) {
          console.log("cmd " + this.adress + " value " + values);
        }
        return this.accelerometerWire.writeByte(value, function(err) {
          if (err != null) {
            return console.log("Error: in I2C", err);
          }
        });
      }
    };

    LSM303.prototype._read = function(cmd, length) {
      var callback, callback2, deferred, errback, i, reads, _i,
        _this = this;
      length = length || 1;
      if (this.debug) {
        console.log("reading at " + (this.accelerometerWire.address.toString(16)) + ", from " + cmd + ", length: " + length);
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
        this.accelerometerWire.readBytes(cmd, length, callback);
      } else {
        if (length === 1) {
          this.accelerometerWire.readByte(callback);
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

    LSM303.prototype.reset = function() {
      if (this.debug) {
        console.log("Resetting L3G Compass");
      }
      return this._send(this.L3G_CTRL_REG1, 0x00);
    };

    LSM303.prototype.init = function(sa0) {
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

    LSM303.prototype.autoDetectAddress = function() {
      var validateAdress, validator,
        _this = this;
      validateAdress = function(adress) {
        var check;
        if (_this.debug) {
          console.log("validating adress: " + (adress.toString(16)));
        }
        _this.__orgiAdress = _this.adress;
        _this.address = adress;
        _this.accelerometerWire.setAddress(adress);
        console.log("pouic", _this.accelerometerWire.address.toString(16));
        check = function(flag) {
          if (_this.debug) {
            console.log("Adress " + (adress.toString(16)) + " valid: " + flag);
          }
          if (!flag) {
            _this.address = _this.__orgiAdress;
            _this.accelerometerWire.setAddress(_this.__orgiAdress);
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

    LSM303.prototype.testWhoAmI = function() {
      var checkValue,
        _this = this;
      checkValue = function(val) {
        val = val[0];
        console.log("pouet");
        console.log("val checked:", val.toString(16), "bla", _this.accelerometerWire.address.toString(16));
        return val === 0xBB;
      };
      return Q.when(this._read(this.LPS331_WHO_AM_I).then(checkValue));
    };

    LSM303.prototype.enableDefault = function() {
      this._send(this.LSM303_CTRL_REG1_A, 0x27);
      if (this._device === this.LSM303DLHC_DEVICE) {
        this._send(this.LSM303_CTRL_REG4_A, 0x08);
      }
      return this._send(this.LSM303_MR_REG_M, 0x00);
    };

    LSM303.prototype.setResolution = function(res) {
      var value;
      value = 0x70 + res - 1;
      if (this.debug) {
        console.log("setting resolution ", value.toString(16));
      }
      return this._send(this.LPS331_RES_CONF, value);
    };

    LSM303.prototype.setInterupts = function() {
      this._send(this.LPS331_CTRL_REG3, 0xa0);
      return this.accelerometerWire.on('data', function(data) {
        return console.log("recieved data", data);
      });
    };

    LSM303.prototype.heading = function(fromVector) {
      var heading, temp_a;
      fromVector = fromVector || new Vector(0, -1, 0);
      this.magReading.x = (this.magReading.x - this.magMin.x) / (this.magMax.x - this.magMin.x) * 2 - 1.0;
      this.magReading.y = (this.magReading.y - this.magMin.y) / (this.magMax.y - this.magMin.y) * 2 - 1.0;
      this.magReading.z = (this.magReading.z - this.magMin.z) / (this.magMax.z - this.magMin.z) * 2 - 1.0;
      vector(temp_a = a);
      vector_normalize(temp_a);
      vector(E);
      vector(N);
      vector_cross(m, temp_a, E);
      vector_normalize(E);
      vector_cross(temp_a, E, N);
      heading = Math.round(Math.atan2(vector_dot(E, from), vector_dot(N, from)) * 180 / M_PI);
      if (heading < 0) {
        heading += 360;
      }
      return heading;
    };

    LSM303.prototype.readAll = function() {
      this.readAcc();
      return this.readMag();
    };

    LSM303.prototype.readAcc = function() {
      // var onResult,
      //   _this = this;
      // this._send(this.L3G_OUT_X_L | (1 << 7));

      // onResult = function(res) {
      //   var x, xhg, xlg, y, yhg, ylg, z, zhg, zlg;
      //   xlg = res[0], xhg = res[1], ylg = res[2], yhg = res[3], zlg = res[4], zhg = res[5];
      //   x = (((xlg << 8) | xhg) << 16) >> 16;
      //   y = (((ylg << 8) | yhg) << 16) >> 16;
      //   z = (((zlg << 8) | zhg) << 16) >> 16;
      //   return console.log("x " + x + " y " + y + " z " + z);
      // };
      // return this._read(null, 6).then(onResult);
      this.accelerometerWire.readBytes((this.LSM303_OUT_X_L_A | 0x80), 2, function(err, res){
        if (err != null)
        {
          console.log('Error reading linear acceleration on X: ' + err);
        }
        else{
          var xla = res.readUInt8(0);
          console.log('xla: ' + xla);

          var xha = res.readUInt8(1);
          console.log('xha: ' + xha);
          // if (xha&0x80){
          //   xha |= (-1 << 8);
          // }
          var accelerationX = (xha << 8 | xla);
          console.log('Acceleration on X (raw): ' + accelerationX);

        }
      });  


    };

    return LSM303;

  })();

  module.exports = LSM303;

}).call(this);
