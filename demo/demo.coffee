require('coffee-script')
LPS331 = require '../lib/LPS331'
L3GD20 = require '../lib/L3GD20'

#debugging attempts for multiple devices
#I2C = require('i2c')
#i2c = new I2C(0x1e, device: '/dev/i2c-1')

prSensor = new LPS331()
compass  = new L3GD20()#problem with multiple I2c devices ! dang ! see here https://github.com/kelly/node-i2c/issues/7


#set pressure resolution to anything from 1 to 10(highest)
prSensor.setResolution(9)

measure=->
  prSensor.readTemperature()
  prSensor.readPressure()
  console.log "---------------"
  compass.readAllAxes()
  console.log " "
  
  if measurements > 0 #0: continuous
    curMeasurements++
    if curMeasurements >= measurements
      clearInterval(timer)
  

measurements = 0
curMeasurements = 0

timer = setInterval measure , 2000
