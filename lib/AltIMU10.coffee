
I2C = require('i2c')

# ============================================================================
# Pololu AltIMU-10 Gyro, Accelerometer, Compass, and Altimeter
# ============================================================================

class AltIMU10
  i2c = null

  # Registers/etc.


  constructor:(device, address, debug)->
  	@address = address or 0x40
  	@device = device or 1
  	@debug = debug or False
  	@i2c = new I2C(@address, {device: @device,debug: @debug})
      
      if (@debug)
        console.log "Reseting AltIMU-10"

  _send: (cmd, values) ->
    @i2c.writeBytes cmd, values, (err) ->
      console.log err

  setPWMFreq:(freq)->
    #"Sets the PWM frequency"
    prescaleval = 25000000.0    # 25MHz
    prescaleval /= 4096.0       # 12-bit
    prescaleval /= float(freq)
    prescaleval -= 1.0
    if @debug
      console.log "Setting PWM frequency to %d Hz" % freq
      console.log "Estimated pre-scale: %d" % prescaleval
    prescale = math.floor(prescaleval + 0.5)
    if @debug
      console.log "Final pre-scale: %d" % prescale

    oldmode = @i2c.readU8(@__MODE1);
    newmode = (oldmode & 0x7F) | 0x10             # sleep
    @i2c.writeByte(@__MODE1, newmode)        # go to sleep
    @i2c.writeByte(@__PRESCALE, int(math.floor(prescale)))
    @i2c.writeByte(@__MODE1, oldmode)
    #time.sleep(0.005)
    @i2c.writeByte(@__MODE1, oldmode | 0x80)

  setPWM:(channel, on, off)->
    #"Sets a single PWM channel"
    @i2c.writeByte(@__LED0_ON_L+4*channel, on & 0xFF)
    @i2c.writeByte(@__LED0_ON_H+4*channel, on >> 8)
    @i2c.writeByte(@__LED0_OFF_L+4*channel, off & 0xFF)
    @i2c.writeByte(@__LED0_OFF_H+4*channel, off >> 8)

module.exports = AltIMU10
