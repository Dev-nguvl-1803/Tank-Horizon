"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const phaser_1 = __importDefault(require("phaser"));
class BootScene extends phaser_1.default.Scene {
    constructor() {
        super("BootScene");
    }
    preload() {
        this.load.image("logo", "../../public/logo/studio.png");
    }
    create() {
        const logo = this.add.image(400, 150, "logo");
        this.tweens.add({
            targets: logo,
            y: 450,
            duration: 2000,
            ease: "Power2",
            yoyo: true,
            loop: -1
        });
        this.add.text(this.scale.width / 2, 600, "© 2025 Your Studio", {
            fontFamily: "Arial",
            fontSize: "14px",
            color: "#cccccc",
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: "#000000",
                blur: 2,
                fill: true
            }
        }).setOrigin(0.5);
    }
}
//# sourceMappingURL=init.js.map