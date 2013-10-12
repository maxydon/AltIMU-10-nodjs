require('coffee-script')
sleep = require 'sleep'
LPS331 = require '../lib/LPS331'

prSensor = new LPS331()

for i in [0..100]
  prSensor.readTemperatureTest()
  #prSensor.readPressureTest()
  sleep.sleep(2)
  #sleep.usleep(15000)
