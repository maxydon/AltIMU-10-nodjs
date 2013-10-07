I2C = require('i2c')

# ============================================================================
#LPS331 Altimeter
# ============================================================================

class LPS331
  i2c : null

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

  constructor:(device, address, debug)->
  	@address = address or 0x40
  	@device = device or 1
  	@debug = debug or False
  	@i2c = new I2C(@address, {device: @device,debug: @debug})
    
    if (@debug)
      console.log "Reseting LPS331"
    #byte sa0 = LPS331_SA0_AUTO
  
  enableDefault: ( null )->
    
  _writeReg:(reg, value)->
  _readReg:(reg)->

  #float
  readPressureMillibars:(void)->
  #  float 
  readPressureInchesHg:(void)->
  
  #long
  readPressureRaw:(void)->
  #float 
  readTemperatureC:(void)->
  #float 
  readTemperatureF:(void)->
  #int 
  readTemperatureRaw:(void)->

  #static float 
  pressureToAltitudeMeters:(float pressure_mbar, altimeter_setting_mbar)->
    altimeter_setting_mbar = altimeter_setting_mbar or 1013.25
  #static float 
  pressureToAltitudeFeet:(float pressure_inHg, altimeter_setting_inHg)->
    altimeter_setting_inHg = altimeter_setting_inHg or 29.9213





