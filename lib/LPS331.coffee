I2C = require('i2c')
sleep = require 'sleep'
Q = require 'q'

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
  LPS331_REF_P_XL :      0x08
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
    
    @reset()
    #FIXME: init (autodetect) does NOT work
    #@init( @LPS331_SA0_AUTO )
    @enableDefault()  
    #@setInterupts()
    
  
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
  
  _read:(cmd, length)->
    length = length or 1
    if @debug
      console.log "reading at #{@i2c.address.toString(16)}, from #{cmd}, length: #{length}"
    
    deferred = Q.defer()
    callback = (err, res)=>
      if err?
        deferred.reject( err )
      else
        deferred.resolve(res)
    
    callback2 = (res)=>
      deferred.resolve(res)
    
    errback = (err)=>
      deferred.reject(err)
    
    if cmd?
      @i2c.readBytes cmd, length, callback
    else
      if length is 1
        @i2c.readByte callback
      else
        reads = []
        reads.push( @_read() ) for i in [0...length]
        Q.all(reads).then callback2, errback
    
    return deferred.promise

  reset:->
    if (@debug)
      console.log "Reseting LPS331"
    #reset
    @_send(@LPS331_CTRL_REG1, 0x00)    
  
  init:(sa0)->
    @autoDetectAddress().then()
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
    
    validateAdress=(adress)=>
      if @debug
        console.log "validating adress: #{adress.toString(16)}"
      @__orgiAdress = @adress
      @address = adress
      @i2c.setAddress( adress )
      console.log "pouic",@i2c.address.toString(16)
      check=(flag)=>
        if @debug 
          console.log "Adress #{adress.toString(16)} valid: #{flag}"
        if not flag
          @address = @__orgiAdress #invalid adress tested, return to original
          @i2c.setAddress( @__orgiAdress )
          throw new Error("Invalid adress")
      
      @testWhoAmI().then( check )

    validator=()=>
      #go through available adresses until one is validated
    
    return validateAdress(0x9B).fail ()=>
      validateAdress(@LPS331AP_ADDRESS_SA0_HIGH)

  testWhoAmI:=>
    checkValue=(val)=>
      val = val[0] #value is a buffer, get first item
      console.log "pouet"
      console.log "val checked:", val.toString(16), "bla",@i2c.address.toString(16)
      return (val == 0xBB)
    return Q.when( @_read(@LPS331_WHO_AM_I).then( checkValue ) )
    
  
  #turns on sensor and enables continuous output
  enableDefault:->
    #active mode, 12.5 Hz output data rate
    #@_send(@LPS331_CTRL_REG1, 0xE0)
    #@_send(@LPS331_CTRL_REG1, 0b11100000)#12.5, same as above
    #@_send(@LPS331_CTRL_REG1, 0b10010000)#1
    @_send(@LPS331_CTRL_REG1, 0b10010000)#1

  #set pressure sensing resolution (1 to 10)
  setResolution:(res)->
    value = 0x70 + res-1
    if @debug
      console.log "setting resolution ",value.toString(16)
    #set pressure sensor to high resolution
    @_send(@LPS331_RES_CONF, value) #0x7A forbidden in auto mode, use  0x79 instead       


  setInterupts:->
    @_send(@LPS331_CTRL_REG3, 0b10100000)
    #experimenting
    @i2c.on 'data', (data)->
      # result for continuous stream contains data buffer, address, length, timestamp
      console.log "recieved data", data  

  # reads pressure and returns either raw 24-bit sensor output or a pre converted value
  readPressure:(pressType)->
    pressType = pressType or "p"
    pressType = pressType.toLowerCase()
    precision = 3
    
    units = {'p':'hpa','h':'inHg'}
    
    #assert MSB to enable register address auto-increment
    @_send(@LPS331_PRESS_OUT_XL | (1 << 7))
    
    onResult=(res)=>
      pxl = res[0]
      pl = res[1]
      ph = res[2]
      # combine bytes
      rawPressure = ( ( (pl << 8) | ph )  ) | pxl  << 16
      rawPressure = ph << 16 | pl << 8 | pxl
      
      #console.log "raw pressure data ", res
      #console.log "raw bytes ", pxl.toString(16), pl.toString(16), ph.toString(16)
      #console.log "raw pressure", rawPressure.toString(16)
      
      switch pressType
        when 'p'
          pressure = @rawPressureToHpa( rawPressure )
        when 'h'
          pressure = @rawPressureToInchesHg( rawPressure )
      
      console.log "initial pressure #{pressure} #{units[pressType]}"
      pressure= parseFloat(pressure.toPrecision(6))
      console.log "pressure #{pressure} #{units[pressType]}"
      
      altitude = @pressureToAltitudeMeters(pressure)
      console.log "Altitude: #{altitude.toFixed(3)} m"
    
    vxl = null
    vpl = null
    vph = null
    
    @_read(@LPS331_PRESS_OUT_XL,1).then( (xl)->
      #console.log "XL",xl
      vxl = xl[0]
    )
    @_read(@LPS331_PRESS_OUT_L,1).then( (pl)->
      #console.log "PL",pl
      vpl = pl[0]
    )
    @_read(@LPS331_PRESS_OUT_H,1).then( (ph)->
      #console.log "PH",ph
      
      vph = ph[0]
      if vxl? and vpl? and vph?
        onResult([vxl,vpl,vph])
    )
   
    #second value not correct for what reason ??? end result is false, while the above works
    #@_read(null,3).then(onResult)


  readTemperature:(tempType)->
    tempType = tempType or "c"
    tempType = tempType.toLowerCase()
    
    @_send(@LPS331_TEMP_OUT_L | (1 << 7))
    
    onResult=(res)=>
      err = null
      if err?
        console.log "error", err
        throw new Error(err)
      
      #console.log "res", res
      tl = res[0]
      th = res[1]
      # combine bytes
      temperatureRaw = ( ((tl << 8) | th) << 16) >> 16
      
      #console.log "raw bytes low/high",tl.toString(16),th.toString(16)
      #console.log "Temp_Ref_s16",Temp_Ref_s16
      
      switch tempType 
        when "c"
          temperature = @rawTemperatureToCelcius(temperatureRaw)
          #Temperature_DegC = 42.5 + Temp_Ref_s16 / (120*4)
          console.log "Temp : #{temperature.toFixed(3)}°C"
        when 'f'
          temperature = @rawTemperatureToFahrenheit(temperatureRaw)
          #Temperature_DegC = 42.5 + Temp_Ref_s16 / (120*4)
          console.log "Temp : #{temperature.toFixed(3)}°F"
    
    @_read(null,2).then(onResult)


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
    return (1 - Math.pow(pressure_mbar / altimeter_setting_mbar, 0.190263)) * 44330.8
    
  #converts pressure in inHg to altitude in feet; see notes above
  pressureToAltitudeFeet:(pressure_inHg, altimeter_setting_inHg)->
    altimeter_setting_inHg = altimeter_setting_inHg or 29.9213
    return (1 - Math.pow(pressure_inHg / altimeter_setting_inHg, 0.190263)) * 145442

  #converts temperature to degrees C
  rawTemperatureToCelcius:(rawTemp)->
    return 42.5 + rawTemp / 480

  #converts temperature to degrees F
  rawTemperatureToFahrenheit:(rawTemp)->
    return 108.5 + rawTemp / 480 * 1.8

  #converts pressure to millibars (mbar)/hectopascals (hPa)
  rawPressureToHpa:(rawPress)->
    return rawPress / 4096
  
  #converts pressure to inches of mercury (inHg)
  rawPressureToInchesHg:(rawPress)->
    return rawPress / 138706.5


module.exports = LPS331

