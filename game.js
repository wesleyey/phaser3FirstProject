var game;

window.onload = function() {
  var gameConfig = {
    width: 480,
    height: 630,
    backgroundColor: 0xff0000,
    scene: [bootGame, playGame]
  };
  game = new Phaser.Game(gameConfig);
  window.focus();
  resizeGame();
  window.addEventListener("resize", resizeGame);
};

class bootGame extends Phaser.Scene {
  constructor() {
    super("BootGame");
  }
  preload() {
    this.load.image("emptytile", "assets/sprites/emptytile.png");
  }
  create() {
    console.log("Loading...");
    this.scene.start("PlayGame");
  }
}

class playGame extends Phaser.Scene {
  constructor() {
    super("PlayGame");
  }
  create() {
    console.log("This is my very first Phaser game");
    this.add.image(100, 100, "emptytile");
  }
}

function resizeGame() {
  var canvas = document.querySelector("canvas");
  var windowWidth = window.innerWidth;
  var windowHeight = window.innerHeight;
  var windowRatio = windowWidth / windowHeight;
  var gameRatio = game.config.width / game.config.height;
  if (windowRatio < gameRatio) {
    canvas.style.width = windowWidth + "px";
    canvas.style.height = windowWidth / gameRatio + "px";
  } else {
    canvas.style.width = windowHeight * gameRatio + "px";
    canvas.style.height = windowHeight + "px";
  }
}
