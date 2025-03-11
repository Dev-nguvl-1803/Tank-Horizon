import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
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