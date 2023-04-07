# plato
DynamoDB data and traffic generator

### Intro

This tool makes it easy to create complex sample data for DynamoDB.

### Approach

In the 1990s, we listened to music on a tape player.  
You would select a cassette tape, insert it into the player, and press Play.
The player is responsible for turning the tape spool, and the music 
for each moment in time is read from the tape surface.

This generator works the same way.  ```play.js``` is the engine and various tapes 
are provided such as ```tape1.js``` and ```tape2.js```.  

The play engine runs a standard for-loop.  The loop counter is passed as an argument
to the *rowMaker* function within a tape script. The tape uses this counter, called tick, 
to generate and return a new DynamoDB item to the player.  The player then writes this to
your DynamoDB table.  

### Setup steps

1. Open a command prompt that has Git.
2. Clone this repository.  
3. Run ```cd plato```
4. Run ```npm install```
5. Run ```create.sh``` to create some sample tables
6. Run ```node play tape1 DemoTable01``` to add sample data to the first table.
7. Run ```node play tape2 DemoTable02``` to add sample data to the second table.
8. Review the settings at the top of each file.
9. Make your own tape script by copying and updating an existing script. 

### Logging
The player shows a summary of the target table, and of the data load.  

