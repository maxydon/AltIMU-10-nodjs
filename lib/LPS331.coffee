I2C = require('i2c')
sleep = require 'sleep'

# ============================================================================
#LPS331 Altimeter
# ============================================================================

class LPS331
  i2c : null

  LPS331AP_ADDRESS_SA0_LOW:  0xB8
  LPS331AP_ADDRESS_SA0_HIGH: 0x5D
  
  LPS331_SA0_LOW : 0
  LPS331_SA0_HIGH : 1
  LPS331_SA0_AUTO: 2

  # Registers/etc.
  LPS331_REF_P_XL : 0x08
  LPS331_REF_P_L:        0x09
  LPS331_REF_P_H:        0x0A

  LPS331_WHO_AM_I:       0x0F

  LPS331_RES_CONF:       0x10

  LPS331_CTRL_REG1 :     0x20
  LPS331_CTRL_REG2:      0x21
  LPS331_CTRL_REG3 :     0x22
  LPS331_INTERRUPT_CFG : 0x23
  LPS331_INT_SOURCE :   0x24
  LPS331_THS_P_L :       0x25
  LPS331_THS_P_H :      0x26
  LPS331_STATUS_REG :    0x27

  LPS331_PRESS_OUT_XL :   0x28
  LPS331_PRESS_OUT_L :    0x29
  LPS331_PRESS_OUT_H :    0x2A

  LPS331_TEMP_OUT_L :     0x2B
  LPS331_TEMP_OUT_H :     0x2C

  LPS331_AMP_CTRL :       0x30

  LPS331_DELTA_PRESS_XL : 0x3C
  LPS331_DELTA_PRESS_L :  0x3D
  LPS331_DELTA_PRESS_H :  0x3E

  constructor:(address, device, debug)->
    #this helps !!http://www.pololu.com/file/0J623/LPS331AP_AN4159_Hardware_and_software_guidelines.pdf
    @address = address or 0x5d
    @device = device or '/dev/i2c-1'
    @debug = debug or false
    @i2c = new I2C(@address, device: @device)
    
    if (@debug)
      console.log "Reseting LPS331"
      
    #@init( @LPS331_SA0_AUTO )
    
    #reset
    @_send(@LPS331_CTRL_REG1, 0x00)
    #set pressure sensor to high resolution
    @_send(@LPS331_RES_CONF, 0x7A) #0x7A forbidden in auto mode, use  0x79 instead      
  
  _send:(cmd, values)->
    if cmd?
      if not (values instanceof Array)
        values = [values]
      if @debug
        console.log "cmd #{cmd.toString(16)} values #{values}"
      @i2c.writeBytes cmd, values, (err)=>
        if err?
          console.log "Error: in I2C", err
    else
      if @debug
        console.log "cmd #{@adress} value #{values}"
      @i2c.writeByte value, (err)=>
        if err?
          console.log "Error: in I2C", err
      
  _read:(cmd, length, callback)->
    @i2c.readBytes cmd, length, callback
  
  
  init:(sa0)->
    return
    switch(sa0)
      when @LPS331_SA0_LOW
        address = @LPS331AP_ADDRESS_SA0_LOW
        return testWhoAmI()
      when @LPS331_SA0_HIGH
        address = @LPS331AP_ADDRESS_SA0_HIGH
        return testWhoAmI()
      else
        return @autoDetectAddress()
  
  
  autoDetectAddress:->
    address = @LPS331AP_ADDRESS_SA0_LOW
    if (testWhoAmI()) then return true
    address = @LPS331AP_ADDRESS_SA0_HIGH
    if (testWhoAmI()) then return true
    return false

  testWhoAmI:->
    return (@readReg(@LPS331_WHO_AM_I) == 0xBB);
  
  #turns on sensor and enables continuous output
  enableDefault:->
    #active mode, 12.5 Hz output data rate
    @_send(@LPS331_CTRL_REG1, 0xE0)
    
    #same ??
    
    

  readPressureMillibars:->
    return @readPressureRaw() / 4096
    
  readPressureInchesHg:->
    return @readPressureRaw() / 138706.5
  
  # reads pressure and returns raw 24-bit sensor output
  readPressureRaw:->
    #Wire.beginTransmission(address);
    #assert MSB to enable register address auto-increment
    ### 
    @_send(@LPS331_PRESS_OUT_XL | (1 << 7))
  
    @_read(address, (byte)3)

    while (Wire.available() < 3)
  
    uint8_t pxl = Wire.read()
    uint8_t pl = Wire.read()
    uint8_t ph = Wire.read()

    # combine bytes
    # GCC performs an arithmetic right shift for signed negative
    # numbers, but this code will not work if you port it to a
    # compiler that does a logical right shift instead.
    return (int32_t)ph << 16 | (uint16_t)pl << 8 | pxl###

  readPressureTest:->
    
    onResult=(err, res)=>
      if err?
        console.log "error", err
        throw new Error(err)
      console.log "bla",res
      pxl = res[0]
      pl = res[1]
      ph = res[2]
      # combine bytes
      #rawPressure = ( ( (pl << 8) | ph ) << 16 ) >> 16
      rawPressure = ( ( (pl << 8) | ph ) << 16 ) | pxl  
      
      #console.log "raw bytes ", pxl.toString(16), pl.toString(16), ph.toString(16)
      #console.log "raw pressure", rawPressure
      pressure = rawPressure / 4096
      console.log "pressure", pressure
      
    @_read(@LPS331_PRESS_OUT_XL, 3, onResult)

  readTemperatureTest:(tempType)->
    tempType = tempType or "c"
    tempType = tempType.toLowerCase()

    toto = true
    if toto
      #Turn on the pressure sensor analog front end in single shot mode
      @_send(@LPS331_CTRL_REG1, 0x84)
      #Run one shot measurement (Temperature and Pressure), self clearing bit when done.
      @_send(@LPS331_CTRL_REG2, 0x01) # @0x21=0x01
      sleep.usleep(5000)
    else
      @_send(@LPS331_TEMP_OUT_L | (1 << 7))
    
    onResult=(err, res)=>
      if err?
        console.log "error", err
        throw new Error(err)
      
      console.log "res", res
      tl = res[0]
      th = res[1]
      # combine bytes
      temperatureRaw = ( ((tl << 8) | th) << 16) >> 16
      
      #console.log "raw bytes low/high",tl.toString(16),th.toString(16)
      #console.log "Temp_Ref_s16",Temp_Ref_s16
      
      if tempType is "c"
        temperature = @rawTemperatureToCelcius(temperatureRaw)
        #Temperature_DegC = 42.5 + Temp_Ref_s16 / (120*4)
        console.log "T°C : #{temperature}"
      else if temptType is 'f'
        temperature = @rawTemperatureToFahrenheit(temperatureRaw)
        #Temperature_DegC = 42.5 + Temp_Ref_s16 / (120*4)
        console.log "T°F : #{temperature}"
      
    if toto
      @_read(@LPS331_TEMP_OUT_H, 2, onResult)
    else
      @_read(0x00, 2, onResult)

  readTemperatureRaw:->
    address = @LPS331AP_ADDRESS_SA0_HIGH
    #assert MSB to enable register address auto-increment
    @_send(address, @LPS331_TEMP_OUT_L | (1 << 7))
    
    ###
    onResult=(err, res)->
      if err?
        console.log "error", err
        throw new Error(err)
      
      tl = res[0]
      th = res[1]
      # combine bytes
      #  GCC performs an arithmetic right shift for signed negative
      #  numbers, but this code will not work if you port it to a
      #  compiler that does a logical right shift instead.
      return (int16_t)th << 8 | tl
      
    @_read(address, 2, onResult)###
  

  # converts pressure in mbar to altitude in meters, using 1976 US
  # Standard Atmosphere model (note that this formula only applies to a
  # height of 11 km, or about 36000 ft)
  #  If altimeter setting (QNH, barometric pressure adjusted to sea
  #  level) is given, this function returns an indicated altitude
  #  compensated for actual regional pressure; otherwise, it returns
  #  the pressure altitude above the standard pressure level of 1013.25
  #  mbar or 29.9213 inHg
  pressureToAltitudeMeters:(pressure_mbar, altimeter_setting_mbar)->
    altimeter_setting_mbar = altimeter_setting_mbar or 1013.25
    return (1 - Math.pow(pressure_mbar / altimeter_setting_mbar, 0.190263)) * 44330.8;
    
  #converts pressure in inHg to altitude in feet; see notes above
  pressureToAltitudeFeet:(pressure_inHg, altimeter_setting_inHg)->
    altimeter_setting_inHg = altimeter_setting_inHg or 29.9213
    return (1 - Math.pow(pressure_inHg / altimeter_setting_inHg, 0.190263)) * 145442;

  #converts temperature to degrees C
  rawTemperatureToCelcius:(rawTemp)->
    return 42.5 + rawTemp / 480

  #converts temperature to degrees F
  rawTemperatureToFahrenheit:(rawTemp)->
    return 108.5 + rawTemp / 480 * 1.8


module.exports = LPS331

