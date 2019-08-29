var game;
var gameOptions = {
  tileSize: 200,
  tileSpace: 20,
  boardSize: {
    rows: 4,
    cols: 4
  },
  tweenSpeed: 50,
  swipeMaxTime: 1000,
  swipeMinDistance: 20,
  swipeMinNormal: 0.85,
  aspectRatio: 16 / 9
};

const LEFT = 0;
const RIGHT = 1;
const UP = 2;
const DOWN = 3;

window.onload = function() {
  var tileAndSpacing = gameOptions.tileSize + gameOptions.tileSpace;
  var width = gameOptions.boardSize.cols * tileAndSpacing;
  width += gameOptions.tileSpace;
  var gameConfig = {
    width: width,
    height: width * gameOptions.aspectRatio,
    backgroundColor: 0xecf0f1,
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
    this.load.image("restart", "assets/sprites/restart.png");
    this.load.image("scorepanel", "assets/sprites/scorepanel.png");
    this.load.image("scorelabels", "assets/sprites/scorelabels.png");
    this.load.image("logo", "assets/sprites/logo.png");
    this.load.image("howtoplay", "assets/sprites/howtoplay.png");
    this.load.image("gametitle", "assets/sprites/gametitle.png");
    this.load.image("emptytile", "assets/sprites/emptytile.png");
    this.load.spritesheet("tiles", "assets/sprites/tiles.png", {
      frameWidth: gameOptions.tileSize,
      frameHeight: gameOptions.tileSize
    });
    this.load.audio("move", [
      "assets/sounds/move.ogg",
      "assets/sounds/move.mp3"
    ]);
    this.load.audio("grow", [
      "assets/sounds/grow.ogg",
      "assets/sounds/grow.mp3"
    ]);
    this.load.bitmapFont(
      "font",
      "assets/fonts/font.png",
      "assets/fonts/font.fnt"
    );
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
    this.score = 0;
    var restartXY = this.getTilePosition(-0.8, gameOptions.boardSize.cols - 1);
    var restartButton = this.add.sprite(restartXY.x, restartXY.y, "restart");
    restartButton.setInteractive();
    restartButton.on(
      "pointerdown",
      function() {
        this.scene.start("PlayGame");
      },
      this
    );
    var scoreXY = this.getTilePosition(-0.8, 1);
    this.add.image(scoreXY.x, scoreXY.y, "scorepanel");
    this.add.image(scoreXY.x, scoreXY.y - 70, "scorelabels");
    var textXY = this.getTilePosition(-0.92, -0.4);
    this.scoreText = this.add.bitmapText(textXY.x, textXY.y, "font", 0);
    textXY = this.getTilePosition(-0.92, 1.1);
    this.bestScoreText = this.add.bitmapText(textXY.x, textXY.y, "font", 0);
    var gameTitle = this.add.image(10, 5, "gametitle");
    gameTitle.setOrigin(0, 0);
    var howTo = this.add.image(game.config.width, 5, "howtoplay");
    howTo.setOrigin(1, 0);
    var logo = this.add.sprite(
      game.config.width / 2,
      game.config.height - 10,
      "logo"
    );
    logo.setOrigin(0.5, 1);
    logo.setInteractive();
    logo.on("pointerdown", function() {
      window.location.href =
        "https://play.google.com/store/apps/developer?id=wesleyey";
    });
    this.canMove = false;
    this.boardArray = [];
    console.log("This is my very first Phaser game");
    for (var i = 0; i < gameOptions.boardSize.rows; i++) {
      this.boardArray[i] = [];
      for (var j = 0; j < gameOptions.boardSize.cols; j++) {
        var tilePosition = this.getTilePosition(i, j);
        this.add.image(tilePosition.x, tilePosition.y, "emptytile");
        var tile = this.add.sprite(
          tilePosition.x,
          tilePosition.y,
          "tiles",
          i + j
        );
        tile.visible = false;
        this.boardArray[i][j] = {
          tileValue: 0,
          tileSprite: tile,
          upgraded: false
        };
      }
    }
    this.addTile();
    this.addTile();
    this.input.keyboard.on("keydown", this.handleKey, this);
    this.input.on("pointerup", this.handleSwipe, this);
    this.moveSound = this.sound.add("move");
    this.growSound = this.sound.add("grow");
  }

  endTween(tile) {
    this.movingTiles--;
    tile.depth = 0;
    if (this.movingTiles === 0) {
      this.refreshBoard();
    }
  }

  upgradeTile(tile) {
    this.growSound.play();
    tile.setFrame(tile.frame.name + 1);
    this.tweens.add({
      targets: [tile],
      scaleX: 1.1,
      scaleY: 1.1,
      duration: gameOptions.tweenSpeed,
      yoyo: true,
      repeat: 1,
      callbackScope: this,
      onComplete: function() {
        this.endTween(tile);
      }
    });
  }

  moveTile(tile, point, upgrade) {
    this.movingTiles++;
    tile.depth = this.movingTiles;
    var distance = Math.abs(tile.x - point.x) + Math.abs(tile.y - point.y);
    this.tweens.add({
      targets: [tile],
      x: point.x,
      y: point.y,
      duration: (gameOptions.tweenSpeed * distance) / gameOptions.tileSize,
      callbackScope: this,
      onComplete: function() {
        if (upgrade) {
          this.upgradeTile(tile);
        } else {
          this.endTween(tile);
        }
      }
    });
  }

  refreshBoard() {
    for (var i = 0; i < gameOptions.boardSize.rows; i++) {
      for (var j = 0; j < gameOptions.boardSize.cols; j++) {
        var spritePosition = this.getTilePosition(i, j);
        this.boardArray[i][j].tileSprite.x = spritePosition.x;
        this.boardArray[i][j].tileSprite.y = spritePosition.y;
        var tileValue = this.boardArray[i][j].tileValue;
        if (tileValue > 0) {
          this.boardArray[i][j].tileSprite.visible = true;
          this.boardArray[i][j].tileSprite.setFrame(tileValue - 1);
          this.boardArray[i][j].upgraded = false;
        } else {
          this.boardArray[i][j].tileSprite.visible = false;
        }
      }
    }
    this.addTile();
  }

  isLegalPosition(row, col, value) {
    var rowInside = row >= 0 && row < gameOptions.boardSize.rows;
    var colInside = col >= 0 && col < gameOptions.boardSize.cols;
    if (!rowInside || !colInside) {
      return false;
    }
    var emptySpot = this.boardArray[row][col].tileValue === 0;
    var sameValue = this.boardArray[row][col].tileValue === value;
    var alreadyUpgraded = this.boardArray[row][col].upgraded;
    return emptySpot || (sameValue && !alreadyUpgraded);
  }

  makeMove(d) {
    this.movingTiles = 0;
    //console.log("about to move");
    var dRow = d === LEFT || d === RIGHT ? 0 : d === UP ? -1 : 1;
    var dCol = d === UP || d === DOWN ? 0 : d === LEFT ? -1 : 1;
    this.canMove = false;
    //var movedTiles = 0;
    var firstRow = d === UP ? 1 : 0;
    var lastRow = gameOptions.boardSize.rows - (d === DOWN ? 1 : 0);
    var firstCol = d === LEFT ? 1 : 0;
    var lastCol = gameOptions.boardSize.cols - (d === RIGHT ? 1 : 0);
    //var movedSomething = false;
    for (var i = firstRow; i < lastRow; i++) {
      for (var j = firstCol; j < lastCol; j++) {
        var curRow = dRow === 1 ? lastRow - 1 - i : i;
        var curCol = dCol === 1 ? lastCol - 1 - j : j;
        var tileValue = this.boardArray[curRow][curCol].tileValue;
        if (tileValue !== 0) {
          var newRow = curRow;
          var newCol = curCol;
          while (
            this.isLegalPosition(newRow + dRow, newCol + dCol, tileValue)
          ) {
            newRow += dRow;
            newCol += dCol;
          }
          //movedTiles++;
          if (newRow !== curRow || newCol !== curCol) {
            //movedSomething = true;
            //this.boardArray[curRow][curCol].tileSprite.depth = movedTiles;
            var newPos = this.getTilePosition(newRow, newCol);
            var willUpdate =
              this.boardArray[newRow][newCol].tileValue === tileValue;
            //this.boardArray[curRow][curCol].tileSprite.x = newPos.x;
            //this.boardArray[curRow][curCol].tileSprite.y = newPos.y;
            this.moveTile(
              this.boardArray[curRow][curCol].tileSprite,
              newPos,
              willUpdate
            );
            this.boardArray[curRow][curCol].tileValue = 0;
            if (this.boardArray[newRow][newCol].tileValue === tileValue) {
              this.boardArray[newRow][newCol].tileValue++;
              this.boardArray[newRow][newCol].upgraded = true;
              //this.boardArray[curRow][curCol].tileSprite.setFrame(tileValue);
            } else {
              this.boardArray[newRow][newCol].tileValue = tileValue;
            }
          }
        }
      }
    }
    //if (movedSomething) {
    //  this.refreshBoard();
    //} else {
    //  this.canMove = true;
    //}
    if (this.movingTiles === 0) {
      this.canMove = true;
    } else {
      this.moveSound.play();
    }
  }

  handleKey(e) {
    if (this.canMove) {
      switch (e.code) {
        case "KeyA":
        case "ArrowLeft":
          this.makeMove(LEFT);
          break;
        case "KeyD":
        case "ArrowRight":
          this.makeMove(RIGHT);
          break;
        case "KeyW":
        case "ArrowUp":
          this.makeMove(UP);
          break;
        case "KeyS":
        case "ArrowDown":
          this.makeMove(DOWN);
          break;
      }
    }
    var keyPressed = e.code;
    console.log(`keycode : ${keyPressed}`);
  }

  handleSwipe(e) {
    if (this.canMove) {
      var swipeTime = e.upTime - e.downTime;
      var fastEnough = swipeTime < gameOptions.swipeMaxTime;
      var swipe = new Phaser.Geom.Point(e.upX - e.downX, e.upY - e.downY);
      var swipeMagnitude = Phaser.Geom.Point.GetMagnitude(swipe);
      var longEnough = swipeMagnitude > gameOptions.swipeMinDistance;
      if (longEnough && fastEnough) {
        Phaser.Geom.Point.SetMagnitude(swipe, 1);
        if (swipe.x > gameOptions.swipeMinNormal) {
          this.makeMove(RIGHT);
        }
        if (swipe.x < -gameOptions.swipeMinNormal) {
          this.makeMove(LEFT);
        }
        if (swipe.y > gameOptions.swipeMinNormal) {
          this.makeMove(DOWN);
        }
        if (swipe.y < -gameOptions.swipeMinNormal) {
          this.makeMove(UP);
        }
      }
    }
    //console.log(`Movement time: ${swipeTime} ms`);
    //console.log(`Horizontal distance: ${swipe.x} pixels`);
    //console.log(`Vertical distance: ${swipe.y} pixels`);
  }

  getTilePosition(row, col) {
    var posX =
      gameOptions.tileSpace * (col + 1) + gameOptions.tileSize * (col + 0.5);
    var posY =
      gameOptions.tileSpace * (row + 1) + gameOptions.tileSize * (row + 0.5);
    var boardHeight = gameOptions.boardSize.rows * gameOptions.tileSize;
    boardHeight += (gameOptions.boardSize.rows + 1) * gameOptions.tileSpace;
    var offsetY = (game.config.height - boardHeight) / 2;
    posY += offsetY;
    return new Phaser.Geom.Point(posX, posY);
  }

  addTile() {
    var emptyTiles = [];
    for (var i = 0; i < gameOptions.boardSize.rows; i++) {
      for (var j = 0; j < gameOptions.boardSize.cols; j++) {
        if (this.boardArray[i][j].tileValue === 0) {
          emptyTiles.push({
            row: i,
            col: j
          });
        }
      }
    }
    if (emptyTiles.length > 0) {
      var chosenTile = Phaser.Utils.Array.GetRandom(emptyTiles);
      this.boardArray[chosenTile.row][chosenTile.col].tileValue = 1;
      this.boardArray[chosenTile.row][chosenTile.col].tileSprite.visible = true;
      this.boardArray[chosenTile.row][chosenTile.col].tileSprite.setFrame(0);
      this.boardArray[chosenTile.row][chosenTile.col].tileSprite.alpha = 0;
      this.tweens.add({
        targets: [this.boardArray[chosenTile.row][chosenTile.col].tileSprite],
        alpha: 1,
        duration: gameOptions.tweenSpeed,
        callbackScope: this,
        onComplete: function() {
          console.log("tween completed");
          this.canMove = true;
        }
      });
    }
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
