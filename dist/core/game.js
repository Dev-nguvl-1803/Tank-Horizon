"use strict";
const runPhaser = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'tank-horizon',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0, x: 0 },
            debug: false
        }
    },
    scene: {
        preload: function () {
        },
        create: function () {
        },
        update: function () {
        }
    }
};
//# sourceMappingURL=game.js.map