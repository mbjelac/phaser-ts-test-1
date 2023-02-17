import Phaser from 'phaser';
import { Coords, Direction, Level, Location, Thing } from "../engine/Level";
import { SpritesToAnimate } from "./NewAnimatedSprites";
import Pointer = Phaser.Input.Pointer;

export default class LevelGui extends Phaser.Scene {

  // @ts-ignore
  private player: Phaser.Physics.Arcade.Sprite;

  // @ts-ignore
  private toolLabel: Phaser.GameObjects.Text;

  private readonly level: Level;

  private readonly spritesToAnimate = new SpritesToAnimate();

  constructor() {
    super('GameScene');

    this.level = Level.random(7, 7);
  }


  preload() {
    this.load.image('wall', 'assets/tiles/wall.png');
    this.load.image('floor', 'assets/tiles/floor.png');
    this.load.image('player', 'assets/tiles/wizard1.png');
    this.load.spritesheet('fire', 'assets/tiles/fire.png', { frameWidth: 16, frameHeight: 16 });

  }

  create() {
    this.anims.create({
      key: 'burn',
      frameRate: 7,
      frames: this.anims.generateFrameNumbers('fire', { start: 0, end: 3 }),
      repeat: -1,
    });
    this.level.locations.forEach((row, y) => row.forEach((location, x) => {

      const locationPixelCoords = toPixelCoords({
        x: x,
        y: y
      });


      const floor = this.physics.add.sprite(locationPixelCoords.x, locationPixelCoords.y, 'floor').setInteractive();
      floor.on('pointerup', (pointer: Pointer) => {
        if (pointer.leftButtonReleased()) {
          this.applyEditorTool(location, locationPixelCoords);
        }
      });

      location.things.forEach(thing => {
        this.addThingSprite(locationPixelCoords, location, thing);
      });
    }));

    const playerPixelCoords = toPixelCoords({ x: this.level.start.x, y: this.level.start.y });
    this.player = this.physics.add.sprite(playerPixelCoords.x, playerPixelCoords.y, 'player');


    this.cameras.main.startFollow(this.player);

    this.input.keyboard.on('keydown', (event: KeyboardEvent) => {

      const direction = keyToDirection(event.key);

      if (!!direction) {
        this.move(direction);
      }

      if (event.key === 'c') {
        console.log("toggle collision enabled");
        this.level.collisionEnabled = !this.level.collisionEnabled;
      }

      if (event.key === 'e') {
        this.level.changeEditorTool();
      }


    });

    this.game.canvas.oncontextmenu = function (e) {
      e.preventDefault();
    }

    this.toolLabel = this.add.text(0, 0, "Hello!", { color: "#fff" });
  }


  update(time: number, delta: number) {

    this.toolLabel.x = this.player.x - 70;
    this.toolLabel.y = this.player.y - 70;
    this.toolLabel.text = this.level.currentEditorTool;

    this.spritesToAnimate.animate();
  }

  private move(direction: Direction) {

    const hasMoved = this.level.tryToMove(direction);

    if (!hasMoved) {
      return;
    }

    this.player.setX(this.player.x + tileSize * direction.deltaX);
    this.player.setY(this.player.y + tileSize * direction.deltaY);
  }

  private applyEditorTool(location: Location, locationPixelCoords: Coords) {
    const addedThing = this.level.applyEditorTool(location);

    if (!addedThing) {
      return;
    }

    this.addThingSprite(locationPixelCoords, location, addedThing);
  }

  private addThingSprite(pixelCoords: Coords, location: Location, thing: Thing) {

    const thingSprite = this.physics.add.sprite(pixelCoords.x, pixelCoords.y, thing.sprite).setInteractive();

    this.spritesToAnimate.addAnimatedSprite(thing, thingSprite);

    thingSprite.on('pointerup', (pointer: Pointer) => {
      if (pointer.rightButtonReleased()) {
        this.level.removeThing(location, thing);
        thingSprite.destroy(true);
      }
    });

  }
}

const tileSize = 16;
const tileCenterOffset = 8;

function toPixelCoords(coords: Coords): Coords {
  return {
    x: coords.x * tileSize + tileCenterOffset,
    y: coords.y * tileSize + tileCenterOffset
  }
}

function keyToDirection(eventKey: string): Direction | undefined {
  switch (eventKey) {
    case "ArrowUp":
      return Direction.UP;
    case "ArrowDown":
      return Direction.DOWN;
    case "ArrowRight":
      return Direction.RIGHT;
    case "ArrowLeft":
      return Direction.LEFT;
  }
}