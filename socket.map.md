# Socket Map

`[Socket A]`

**(Game Socket)**
- newGame
- joinGame
**(Room Socket)**
- spectateGame
- getRoom
- startGame
- spectateMode
**(Player Socket)**
- disconnect
- sendLocations
- sendBullet
- bulletDestroyed
- playerDied
- getPowerup


`[Socket B] Listen to Socket A and Emit to Socket C`

`[Socket C] Phaser game`
**(Wating room)**
- invalidRoomId
- waitingRoom
- playerJoined
- spectateGameInProgress
- spectateWaitingRoom
- sendRoom
- notAuthorized
- notEnoughPlayers
- gameStart
- newHost
**(Ingame)**
- playerLeft
- renderMovement
- bulletLimitReached
- renderBullet
- bulletCountUpdated
- scoreUpdated
- gameOver
- spectateMode
- removePlayer
- hasPowerup