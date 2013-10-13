require('coffee-script')
sleep = require 'sleep'
LPS331 = require '../lib/LPS331'

prSensor = new LPS331()

#set resolution to anything from 1 to 10(highest)
prSensor.setResolution(9)

measure=->
  prSensor.readTemperature()
  prSensor.readPressure()
  console.log " "
  if measurements > 0 #0: continuous
    curMeasurements++
    if curMeasurements >= measurements
      clearInterval(timer)
  

measurements = 0
curMeasurements = 0

timer = setInterval measure , 2000


