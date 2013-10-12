require('coffee-script')
sleep = require 'sleep'
LPS331 = require '../lib/LPS331'

prSensor = new LPS331()



measure=->
  prSensor.readTemperatureTest()
  #prSensor.readPressureTest()
  if measurements > 0 #0: continuous
    curMeasurements++
    if curMeasurements >= measurements
      clearInterval(timer)
  

measurements = 0
curMeasurements = 0

timer = setInterval measure , 1000


