I2C = require('i2c')
sleep = require 'sleep'
Q = require 'q'

# ============================================================================
#L3GD20 Gyro
# ============================================================================

class L3GD20
  i2c : null
  
  L3G4200D_ADDRESS_SA0_LOW:  (0xD0 >> 1)
  L3G4200D_ADDRESS_SA0_HIGH: (0xD2 >> 1)
  L3GD20_ADDRESS_SA0_LOW:    (0xD4 >> 1)
  L3GD20_ADDRESS_SA0_HIGH:   (0xD6 >> 1)

  L3G_DEVICE_AUTO: 0
  L3G4200D_DEVICE: 1
  L3GD20_DEVICE:   2

  # SA0 states
  L3G_SA0_LOW:  0
  L3G_SA0_HIGH: 1
  L3G_SA0_AUTO: 2

  # register addresses
  L3G_WHO_AM_I:      0x0F

  L3G_CTRL_REG1:     0x20
  L3G_CTRL_REG2:     0x21
  L3G_CTRL_REG3:     0x22
  L3G_CTRL_REG4:     0x23
  L3G_CTRL_REG5:     0x24
  L3G_REFERENCE:     0x25
  L3G_OUT_TEMP:      0x26
  L3G_STATUS_REG:    0x27

  L3G_OUT_X_L:       0x28
  L3G_OUT_X_H:       0x29
  L3G_OUT_Y_L:       0x2A
  L3G_OUT_Y_H:       0x2B
  L3G_OUT_Z_L:       0x2C
  L3G_OUT_Z_H:       0x2D

  L3G_FIFO_CTRL_REG: 0x2E
  L3G_FIFO_SRC_REG:  0x2F

  L3G_INT1_CFG:      0x30
  L3G_INT1_SRC:      0x31
  L3G_INT1_THS_XH:   0x32
  L3G_INT1_THS_XL:   0x33
  L3G_INT1_THS_YH:   0x34
  L3G_INT1_THS_YL:   0x35
  L3G_INT1_THS_ZH:   0x36
  L3G_INT1_THS_ZL:   0x37
  L3G_INT1_DURATION: 0x38

  constructor:(address, device, debug)->
    @address = address or 0x6b
    @device = device or '/dev/i2c-1'
    @debug = debug or false
    @i2c = new I2C(@address, device: @device)
    
    #@reset()
    #FIXME: init (autodetect) does NOT work
    #@init( )
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
      console.log "Reseting L3G Compass"
    #reset
    @_send(@L3G_CTRL_REG1, 0x00)    
  
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
    
  
  #turns on sensor 
  enableDefault:->
   # 0x0F = 0b00001111
   # Normal power mode, all axes enabled
    @_send(@L3G_CTRL_REG1, 0x0F)

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


  readAllAxes:()->
    
    # assert the MSB of the address to get the gyro
    # to do slave-transmit subaddress updating.
    
    @_send(@L3G_OUT_X_L | (1 << 7))
  
    onResult=(res)=>
      #console.log "pouet",res
      [xlg, xhg, ylg, yhg, zlg, zhg] = res
      #console.log "tto", xlg, xhg, ylg, yhg, zlg, zhg
     
      # combine bytes
      x = ( ((xlg << 8) | xhg) << 16) >> 16
      y = ( ((ylg << 8) | yhg) << 16) >> 16
      z = ( ((zlg << 8) | zhg) << 16) >> 16
      
      #console.log "raw bytes low/high",tl.toString(16),th.toString(16)
      console.log "x #{x} y #{y} z #{z}"
    
    @_read(null,6).then(onResult)


module.exports = L3GD20

