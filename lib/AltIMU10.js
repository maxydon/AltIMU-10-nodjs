(function() {
  var AltIMU10, I2C;

  I2C = require('i2c');

  AltIMU10 = (function() {
    var i2c;

    i2c = null;

    function AltIMU10(device, address, debug) {
      this.address = address || 0x40;
      this.device = device || 1;
      this.debug = debug || False;
      this.i2c = new I2C(this.address, {
        device: this.device,
        debug: this.debug
      });
      if (this.debug) {
        console.log("Reseting AltIMU-10");
      }
    }

    AltIMU10.prototype._send = function(cmd, values) {
      return this.i2c.writeBytes(cmd, values, function(err) {
        return console.log(err);
      });
    };

    AltIMU10.prototype.setPWMFreq = function(freq) {
      var newmode, oldmode, prescale, prescaleval;
      prescaleval = 25000000.0;
      prescaleval /= 4096.0;
      prescaleval /= float(freq);
      prescaleval -= 1.0;
      if (this.debug) {
        console.log("Setting PWM frequency to %d Hz" % freq);
        console.log("Estimated pre-scale: %d" % prescaleval);
      }
      prescale = math.floor(prescaleval + 0.5);
      if (this.debug) {
        console.log("Final pre-scale: %d" % prescale);
      }
      oldmode = this.i2c.readU8(this.__MODE1);
      newmode = (oldmode & 0x7F) | 0x10;
      this.i2c.writeByte(this.__MODE1, newmode);
      this.i2c.writeByte(this.__PRESCALE, int(math.floor(prescale)));
      this.i2c.writeByte(this.__MODE1, oldmode);
      return this.i2c.writeByte(this.__MODE1, oldmode | 0x80);
    };

    AltIMU10.prototype.setPWM = function(channel) {
      this.i2c.writeByte(this.__LED0_ON_L + 4 * channel, true & 0xFF);
      this.i2c.writeByte(this.__LED0_ON_H + 4 * channel, true >> 8);
      this.i2c.writeByte(this.__LED0_OFF_L + 4 * channel, false & 0xFF);
      return this.i2c.writeByte(this.__LED0_OFF_H + 4 * channel, false >> 8);
    };

    return AltIMU10;

  })();

  module.exports = AltIMU10;

}).call(this);
