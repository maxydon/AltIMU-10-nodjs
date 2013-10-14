I2C = require('i2c')
sleep = require 'sleep'
Q = require 'q'


class Vector
  constructor:(x,y,z)->
    @x = x or 0
    @y = y or 0
    @z = z or 0

# ============================================================================
#LSM303 Accellerometer
# ============================================================================
class LSM303
  i2c : null
  # device types
  LSM303DLH_DEVICE:   0
  LSM303DLM_DEVICE:   1
  LSM303DLHC_DEVICE:  2
  LSM303_DEVICE_AUTO: 3

  # SA0_A states
  LSM303_SA0_A_LOW:  0
  LSM303_SA0_A_HIGH: 1
  LSM303_SA0_A_AUTO: 2

  # register addresses
  LSM303_CTRL_REG1_A:       0x20
  LSM303_CTRL_REG2_A:       0x21
  LSM303_CTRL_REG3_A:       0x22
  LSM303_CTRL_REG4_A:       0x23
  LSM303_CTRL_REG5_A:       0x24
  LSM303_CTRL_REG6_A:       0x25 # DLHC only
  LSM303_HP_FILTER_RESET_A: 0x25 # DLH, DLM only
  LSM303_REFERENCE_A:       0x26
  LSM303_STATUS_REG_A:      0x27

  LSM303_OUT_X_L_A:         0x28
  LSM303_OUT_X_H_A:         0x29
  LSM303_OUT_Y_L_A:         0x2A
  LSM303_OUT_Y_H_A:         0x2B
  LSM303_OUT_Z_L_A:         0x2C
  LSM303_OUT_Z_H_A:         0x2D

  LSM303_FIFO_CTRL_REG_A:   0x2E # DLHC only
  LSM303_FIFO_SRC_REG_A:    0x2F # DLHC only

  LSM303_INT1_CFG_A:        0x30
  LSM303_INT1_SRC_A:        0x31
  LSM303_INT1_THS_A:        0x32
  LSM303_INT1_DURATION_A:   0x33
  LSM303_INT2_CFG_A:        0x34
  LSM303_INT2_SRC_A:        0x35
  LSM303_INT2_THS_A:        0x36
  LSM303_INT2_DURATION_A:   0x37

  LSM303_CLICK_CFG_A:       0x38 # DLHC only
  LSM303_CLICK_SRC_A:       0x39 # DLHC only
  LSM303_CLICK_THS_A:       0x3A # DLHC only
  LSM303_TIME_LIMIT_A:      0x3B # DLHC only
  LSM303_TIME_LATENCY_A:    0x3C # DLHC only
  LSM303_TIME_WINDOW_A:     0x3D # DLHC only

  LSM303_CRA_REG_M:         0x00
  LSM303_CRB_REG_M:         0x01
  LSM303_MR_REG_M:          0x02

  LSM303_OUT_X_H_M:         0x03
  LSM303_OUT_X_L_M:         0x04
  LSM303_OUT_Y_H_M:         -1   # The addresses of the Y and Z magnetometer output registers 
  LSM303_OUT_Y_L_M:         -2   # are reversed on the DLM and DLHC relative to the DLH.
  LSM303_OUT_Z_H_M:         -3   # These four defines have dummy values so the library can 
  LSM303_OUT_Z_L_M:         -4   # determine the correct address based on the device type.

  LSM303_SR_REG_M:          0x09
  LSM303_IRA_REG_M:         0x0A
  LSM303_IRB_REG_M:         0x0B
  LSM303_IRC_REG_M:         0x0C

  LSM303_WHO_AM_I_M:        0x0F # DLM only

  LSM303_TEMP_OUT_H_M:      0x31 # DLHC only
  LSM303_TEMP_OUT_L_M:      0x32 # DLHC only

  LSM303DLH_OUT_Y_H_M:      0x05
  LSM303DLH_OUT_Y_L_M:      0x06
  LSM303DLH_OUT_Z_H_M:      0x07
  LSM303DLH_OUT_Z_L_M:      0x08

  LSM303DLM_OUT_Z_H_M:      0x05
  LSM303DLM_OUT_Z_L_M:      0x06
  LSM303DLM_OUT_Y_H_M:      0x07
  LSM303DLM_OUT_Y_L_M:      0x08

  LSM303DLHC_OUT_Z_H_M:     0x05
  LSM303DLHC_OUT_Z_L_M:     0x06
  LSM303DLHC_OUT_Y_H_M:     0x07
  LSM303DLHC_OUT_Y_L_M:     0x08

  constructor:(address, device, debug)->
    @address = address or 0x6b
    @device = device or '/dev/i2c-1'
    @debug = debug or false
    @i2c = new I2C(@address, device: @device)

    @accAdress  = 0x19 #accellerometer adress    
    @magAddress = 0x1e #magnetometer adress
    
    @accReading = new Vector() # accelerometer readings
    @magReading = new Vector() # magnetometer readings
    
    # These are just some values for a particular unit; it is recommended that
    # a calibration be done for your particular unit.
    @magMax = new Vector(540,500,180) #maximum magnetometer values, used for calibration
    @magMin = new Vector(-520,-570, -770)# minimum magnetometer values, used for calibration
    
    @ioTimeout = 0 # 0 = no timeout
    @didTimeout = false
    
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
    # Enable Accelerometer
    # 0x27 = 0b00100111
    # Normal power mode, all axes enabled
    @_send(@LSM303_CTRL_REG1_A, 0x27)
  
    if @_device == @LSM303DLHC_DEVICE
      @_send(@LSM303_CTRL_REG4_A, 0x08)# DLHC: enable high resolution mode
  
    # Enable Magnetometer
    # 0x00 = 0b00000000
    # Continuous conversion mode
    @_send(@LSM303_MR_REG_M, 0x00)

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

  # Returns the angular difference in the horizontal plane between the
  # From vector and North, in degrees.
  #
  # Description of heading algorithm:
  # Shift and scale the magnetic reading based on calibration data to
  # to find the North vector. Use the acceleration readings to
  # determine the Up vector (gravity is measured as an upward
  # acceleration). The cross product of North and Up vectors is East.
  # The vectors East and North form a basis for the horizontal plane.
  # The From vector is projected into the horizontal plane and the
  # angle between the projected vector and north is returned.
  heading:(fromVector)->
    fromVector = fromVector or new Vector(0,-1,0)
  
    # shift and scale
    @magReading.x = (@magReading.x - @magMin.x) / (@magMax.x - @magMin.x) * 2 - 1.0
    @magReading.y = (@magReading.y - @magMin.y) / (@magMax.y - @magMin.y) * 2 - 1.0
    @magReading.z = (@magReading.z - @magMin.z) / (@magMax.z - @magMin.z) * 2 - 1.0

    vector temp_a = a;
    # normalize
    vector_normalize(&temp_a);
    #vector_normalize(&m);

    # compute E and N
    vector E;
    vector N;
    vector_cross(&m, &temp_a, &E);
    vector_normalize(&E);
    vector_cross(&temp_a, &E, &N);

    # compute heading
    heading = Math.round(Math.atan2(vector_dot(&E, &from), vector_dot(&N, &from)) * 180 / M_PI);
    if (heading < 0) heading += 360;
    return heading

  readAll:()->
    @readAcc()
    @readMag()
  
  readAcc:->
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

