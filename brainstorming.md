# Brainstorming

This file is used to document your thoughts, approaches and research conducted across all tasks in the Technical Assessment.

## Firmware

## Telemetry

Completely first time setting up WSL and Docker. Unfortunately I had some issues with it as well and it took quite a while as I had to install/reinstall quite a few times to get it to work correctly.

The telemetry segment seemed the most approachable to me out of all three but still very new stuff.


1. When running the emulator, the streaming service will occasionally crash. Think about where and why this crash is happening, and add something to the code to better handle this issue.

   - You may have to run this for up to ~30 seconds before the crash happens

After running the docker container I'm guessing the error causing the crash probably has something to do with the following output:

(
streaming-service-1  | Received: {"battery_temperature":71.88664032197345,"timestamp":1709132683355}}
streaming-service-1  | /app/src/server.ts:20
streaming-service-1  |     const jsonData: VehicleData = JSON.parse(msg.toString());
streaming-service-1  |                                        ^   
streaming-service-1  | SyntaxError: Unexpected token } in JSON at position 67
streaming-service-1  |     at JSON.parse (<anonymous>)
streaming-service-1  |     at Socket.<anonymous> (/app/src/server.ts:20:40)
streaming-service-1  |     at Socket.emit (node:events:517:28)
streaming-service-1  |     at Socket.emit (node:domain:489:12)
streaming-service-1  |     at addChunk (node:internal/streams/readable:368:12)
streaming-service-1  |     at readableAddChunk (node:internal/streams/readable:341:9)
streaming-service-1  |     at Socket.Readable.push (node:internal/streams/readable:278:10)
streaming-service-1  |     at TCP.onStreamRead (node:internal/stream_base_commons:190:23)
streaming-service-1  | [nodemon] app crashed - waiting for file changes before starting...
)

The issue specifically in line 20 of server.t, "const jsonData: VehicleData = JSON.parse(msg.toString());" using the JSON.parse function on msg.toString() returns the unexpected token '}' in the VehicleData?

msg.tostring() is {"battery_temperature":example,"timestamp":example}

Upon further research about JSON.parse it seems to take in a string and returns an object. Looking at examples of JSON formatted strings, I'm pretty sure that msg.tostring() is okay so I'm not exactly sure why there is an error.

Just by messing around I found that using JSON.stringify on the msg.tostring() like this JSON.parse(JSON.stringify(msg.toString())); seems to fix the issue and prevents the service from crashing and it continually reads out different battery temps and timestamps.

After working on part 2 of the problem, I realised that although my fix to part 1 was able to fix the error and prevent the service from crashing, it didn't actually fix the issue. Doing some more testing, now I realise that occasionally the msg.tostring() is not correct JSON as when the error occurs it recieves something like this.

Received: {"battery_temperature":23.14044141806852,"timestamp":1709356893056}}

Containing an extra } on the end making it incorrect JSON.

After coming back from pt2. I fixed the issue by using 'try' and 'catch(error)' so that it would do the normal 
jsonData = JSON.parse(msg.toString());
but in cases where an error would occur, create a new string which removed the last character '}' and then parse that new string to jsonData instead.

This finally seemed to correctly fix the issue. :>


2. A safe operating range for the battery temperature is 20-80 degrees. Add a feature to the backend `streaming-service` so that each time the received battery temperature exceeds this range more than 3 times in 5 seconds, the current timestamp and a simple error message is printed to console.

Created an array temp_checker which stores the object of VehicleData parsed into jsonData. The array continues to grow by pushing jsonData until it hits a size of 5 entries (0-4). Once it hits this limit, the code loops through the battery_temperature for each index and checks whether or not it is within the suitable range. IF it isn't it increments 'count' by one for each occurence. Then after it's finished iterating through the array it checks whether count >= 3, and if so prints out an error message with the current timestamp. It finally clears the oldest data in the array using temp_checker.shift() so it can be filled with new data and also rests count to 0 for the next iteration.

Had some trouble with this stage because of my incorrect solution to stage 1. When I used JSON.stringify the temp_checker array was filling up with strings I think and not objects and so the count never increased because the loop that tries to access temp_checker[i].battery_temperature was doing nothing since it was actually an undefined value. 

I could print temp_checker, temp_checker[i] and jsonData but not go into it like jsonData.battery_tempereature or jsonData.timestamp

Realised I made a mistake and it is "more" than 3 times so not >= 3, just > 3.

Went back and fixed part 1 and now the both parts are working properly.


3. The ReactJS frontend is currently very basic. Extend the frontend by:

- Making the battery temperature value change colours based on the current temperature (e.g. changing to red when the safe temperature range is exceeded).
  - Safe operating ranges are defined below
    | Range | Colour |
    |---------------------------------|--------|
    | Safe (20-80) | Green |
    | Nearing unsafe (20-25 or 75-80) | Yellow |
    | Unsafe (<20 or >80) | Red |
- Making the frontend more aesthetically pleasing, however you see fit.

Slightly confused on where to start. Found live_value.tsx and used some simple if, if else, else to change the valueColour depemding depending on the number given.

Added an image battery_with_thermometer to the page because it records battery temperatures.


## Cloud