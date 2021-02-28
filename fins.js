
let angler = 0
window.addEventListener('DOMContentLoaded', (event) => {
  const gamepadAPI = {
    controller: {},
    turbo: true,
    connect: function (evt) {
      if (navigator.getGamepads()[0] != null) {
        gamepadAPI.controller = navigator.getGamepads()[0]
        gamepadAPI.turbo = true;
      } else if (navigator.getGamepads()[1] != null) {
        gamepadAPI.controller = navigator.getGamepads()[0]
        gamepadAPI.turbo = true;
      } else if (navigator.getGamepads()[2] != null) {
        gamepadAPI.controller = navigator.getGamepads()[0]
        gamepadAPI.turbo = true;
      } else if (navigator.getGamepads()[3] != null) {
        gamepadAPI.controller = navigator.getGamepads()[0]
        gamepadAPI.turbo = true;
      }
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] === null) {
          continue;
        }
        if (!gamepads[i].connected) {
          continue;
        }
      }
    },
    disconnect: function (evt) {
      gamepadAPI.turbo = false;
      delete gamepadAPI.controller;
    },
    update: function () {
      gamepadAPI.controller = navigator.getGamepads()[0]
      gamepadAPI.buttonsCache = [];// clear the buttons cache
      for (var k = 0; k < gamepadAPI.buttonsStatus.length; k++) {// move the buttons status from the previous frame to the cache
        gamepadAPI.buttonsCache[k] = gamepadAPI.buttonsStatus[k];
      }
      gamepadAPI.buttonsStatus = [];// clear the buttons status
      var c = gamepadAPI.controller || {}; // get the gamepad object
      var pressed = [];
      if (c.buttons) {
        for (var b = 0, t = c.buttons.length; b < t; b++) {// loop through buttons and push the pressed ones to the array
          if (c.buttons[b].pressed) {
            pressed.push(gamepadAPI.buttons[b]);
          }
        }
      }
      var axes = [];
      if (c.axes) {
        for (var a = 0, x = c.axes.length; a < x; a++) {// loop through axes and push their values to the array
          axes.push(c.axes[a].toFixed(2));
        }
      }
      gamepadAPI.axesStatus = axes;// assign received values
      gamepadAPI.buttonsStatus = pressed;
      // console.log(pressed); // return buttons for debugging purposes
      return pressed;
    },
    buttonPressed: function (button, hold) {
      var newPress = false;
      for (var i = 0, s = gamepadAPI.buttonsStatus.length; i < s; i++) {// loop through pressed buttons
        if (gamepadAPI.buttonsStatus[i] == button) {// if we found the button we're looking for...
          newPress = true;// set the boolean variable to true
          if (!hold) {// if we want to check the single press
            for (var j = 0, p = gamepadAPI.buttonsCache.length; j < p; j++) {// loop through the cached states from the previous frame
              if (gamepadAPI.buttonsCache[j] == button) { // if the button was already pressed, ignore new press
                newPress = false;
              }
            }
          }
        }
      }
      return newPress;
    },
    buttons: [
      'A', 'B', 'X', 'Y', 'LB', 'RB', 'Left-Trigger', 'Right-Trigger', 'Back', 'Start', 'Axis-Left', 'Axis-Right', 'DPad-Up', 'DPad-Down', 'DPad-Left', 'DPad-Right', "Power"
    ],
    buttonsCache: [],
    buttonsStatus: [],
    axesStatus: []
  };
  let canvas
  let canvas_context
  let keysPressed = {}
  let FLEX_engine
  let TIP_engine = {}
  let XS_engine
  let YS_engine
  class Point {
    constructor(x, y) {
      this.x = x
      this.y = y
      this.radius = 0
    }
    pointDistance(point) {
      return (new LineOP(this, point, "transparent", 0)).hypotenuse()
    }
  }
  class Line {
    constructor(x, y, x2, y2, color, width) {
      this.x1 = x
      this.y1 = y
      this.x2 = x2
      this.y2 = y2
      this.color = color
      this.width = width
    }
    hypotenuse() {
      let xdif = this.x1 - this.x2
      let ydif = this.y1 - this.y2
      let hypotenuse = (xdif * xdif) + (ydif * ydif)
      return Math.sqrt(hypotenuse)
    }
    draw() {
      let linewidthstorage = canvas_context.lineWidth
      canvas_context.strokeStyle = this.color
      canvas_context.lineWidth = this.width
      canvas_context.beginPath()
      canvas_context.moveTo(this.x1, this.y1)
      canvas_context.lineTo(this.x2, this.y2)
      canvas_context.stroke()
      canvas_context.lineWidth = linewidthstorage
    }
  }
  class LineOP {
    constructor(object, target, color, width) {
      this.object = object
      this.target = target
      this.color = color
      this.width = width
    }
    xdis() {
      return this.target.x - this.object.x
    }
    ydis() {
      return this.target.y - this.object.y
    }
    angle() {
      return Math.atan2(this.object.y - this.target.y, this.object.x - this.target.x)
    }
    hypotenuse() {
      let xdif = this.object.x - this.target.x
      let ydif = this.object.y - this.target.y
      let hypotenuse = (xdif * xdif) + (ydif * ydif)
      return Math.sqrt(hypotenuse)
    }
    draw() {
      let linewidthstorage = canvas_context.lineWidth
      canvas_context.strokeStyle = this.color
      canvas_context.lineWidth = this.width
      canvas_context.beginPath()
      canvas_context.moveTo(this.object.x, this.object.y)
      canvas_context.lineTo(this.target.x, this.target.y)
      canvas_context.stroke()
      canvas_context.lineWidth = linewidthstorage
    }
  }
  class Triangle {
    constructor(x, y, color, length, fill = 0, strokeWidth = 0, leg1Ratio = 1, leg2Ratio = 1, heightRatio = 1) {
      this.x = x
      this.y = y
      this.color = color
      this.length = length
      this.x1 = this.x + this.length * leg1Ratio
      this.x2 = this.x - this.length * leg2Ratio
      this.tip = this.y - this.length * heightRatio
      this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
      this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
      this.fill = fill
      this.stroke = strokeWidth
    }
    draw() {
      canvas_context.strokeStyle = this.color
      canvas_context.stokeWidth = this.stroke
      canvas_context.beginPath()
      canvas_context.moveTo(this.x, this.y)
      canvas_context.lineTo(this.x1, this.y)
      canvas_context.lineTo(this.x, this.tip)
      canvas_context.lineTo(this.x2, this.y)
      canvas_context.lineTo(this.x, this.y)
      if (this.fill == 1) {
        canvas_context.fill()
      }
      canvas_context.stroke()
      canvas_context.closePath()
    }
    isPointInside(point) {
      if (point.x <= this.x1) {
        if (point.y >= this.tip) {
          if (point.y <= this.y) {
            if (point.x >= this.x2) {
              this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
              this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
              this.basey = point.y - this.tip
              this.basex = point.x - this.x
              if (this.basex == 0) {
                return true
              }
              this.slope = this.basey / this.basex
              if (this.slope >= this.accept1) {
                return true
              } else if (this.slope <= this.accept2) {
                return true
              }
            }
          }
        }
      }
      return false
    }
  }
  class Rectangle {
    constructor(x, y, width, height, color, fill = 1, stroke = 0, strokeWidth = 1) {
      this.x = x
      this.y = y
      this.height = height
      this.width = width
      this.color = color
      this.xmom = 0
      this.ymom = 0
      this.stroke = stroke
      this.strokeWidth = strokeWidth
      this.fill = fill
    }
    draw() {
      canvas_context.fillStyle = this.color
      canvas_context.fillRect(this.x, this.y, this.width, this.height)
    }
    move() {
      this.x += this.xmom
      this.y += this.ymom
    }
    isPointInside(point) {
      if (point.x >= this.x) {
        if (point.y >= this.y) {
          if (point.x <= this.x + this.width) {
            if (point.y <= this.y + this.height) {
              return true
            }
          }
        }
      }
      return false
    }
    doesPerimeterTouch(point) {
      if (point.x + point.radius >= this.x) {
        if (point.y + point.radius >= this.y) {
          if (point.x - point.radius <= this.x + this.width) {
            if (point.y - point.radius <= this.y + this.height) {
              return true
            }
          }
        }
      }
      return false
    }
  }
  class Circle {
    constructor(x, y, radius, color, xmom = 0, ymom = 0, friction = 1, reflect = 0, strokeWidth = 0, strokeColor = "transparent") {
      this.x = x
      this.y = y
      this.radius = radius
      this.color = color
      this.xmom = xmom
      this.ymom = ymom
      this.friction = friction
      this.reflect = reflect
      this.strokeWidth = strokeWidth
      this.strokeColor = strokeColor
    }
    draw() {
      canvas_context.lineWidth = this.strokeWidth
      canvas_context.strokeStyle = this.color
      canvas_context.beginPath();
      if (this.radius > 0) {
        canvas_context.arc(this.x, this.y, this.radius, 0, (Math.PI * 2), true)
        canvas_context.fillStyle = this.color
        canvas_context.fill()
        canvas_context.stroke();
      } else {
        console.log("The circle is below a radius of 0, and has not been drawn. The circle is:", this)
      }
    }
    move() {
      if (this.reflect == 1) {
        if (this.x + this.radius > canvas.width) {
          if (this.xmom > 0) {
            this.xmom *= -1
          }
        }
        if (this.y + this.radius > canvas.height) {
          if (this.ymom > 0) {
            this.ymom *= -1
          }
        }
        if (this.x - this.radius < 0) {
          if (this.xmom < 0) {
            this.xmom *= -1
          }
        }
        if (this.y - this.radius < 0) {
          if (this.ymom < 0) {
            this.ymom *= -1
          }
        }
      }
      this.x += this.xmom
      this.y += this.ymom
    }
    unmove() {
      if (this.reflect == 1) {
        if (this.x + this.radius > canvas.width) {
          if (this.xmom > 0) {
            this.xmom *= -1
          }
        }
        if (this.y + this.radius > canvas.height) {
          if (this.ymom > 0) {
            this.ymom *= -1
          }
        }
        if (this.x - this.radius < 0) {
          if (this.xmom < 0) {
            this.xmom *= -1
          }
        }
        if (this.y - this.radius < 0) {
          if (this.ymom < 0) {
            this.ymom *= -1
          }
        }
      }
      this.x -= this.xmom
      this.y -= this.ymom
    }
    frictiveMove() {
      if (this.reflect == 1) {
        if (this.x + this.radius > canvas.width) {
          if (this.xmom > 0) {
            this.xmom *= -1
          }
        }
        if (this.y + this.radius > canvas.height) {
          if (this.ymom > 0) {
            this.ymom *= -1
          }
        }
        if (this.x - this.radius < 0) {
          if (this.xmom < 0) {
            this.xmom *= -1
          }
        }
        if (this.y - this.radius < 0) {
          if (this.ymom < 0) {
            this.ymom *= -1
          }
        }
      }
      this.x += this.xmom
      this.y += this.ymom
      this.xmom *= this.friction
      this.ymom *= this.friction
    }
    frictiveunMove() {
      if (this.reflect == 1) {
        if (this.x + this.radius > canvas.width) {
          if (this.xmom > 0) {
            this.xmom *= -1
          }
        }
        if (this.y + this.radius > canvas.height) {
          if (this.ymom > 0) {
            this.ymom *= -1
          }
        }
        if (this.x - this.radius < 0) {
          if (this.xmom < 0) {
            this.xmom *= -1
          }
        }
        if (this.y - this.radius < 0) {
          if (this.ymom < 0) {
            this.ymom *= -1
          }
        }
      }
      this.xmom /= this.friction
      this.ymom /= this.friction
      this.x -= this.xmom
      this.y -= this.ymom
    }
    isPointInside(point) {
      this.areaY = point.y - this.y
      this.areaX = point.x - this.x
      if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.radius * this.radius)) {
        return true
      }
      return false
    }
    doesPerimeterTouch(point) {
      this.areaY = point.y - this.y
      this.areaX = point.x - this.x
      if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= ((this.radius + point.radius) * (this.radius + point.radius))) {
        return true
      }
      return false
    }
  } class Polygon {
    constructor(x, y, size, color, sides = 3, xmom = 0, ymom = 0, angle = 0, reflect = 0) {
      if (sides < 2) {
        sides = 2
      }
      this.reflect = reflect
      this.xmom = xmom
      this.ymom = ymom
      this.body = new Circle(x, y, size - (size * .293), "transparent")
      this.nodes = []
      this.angle = angle
      this.size = size
      this.color = color
      this.angleIncrement = (Math.PI * 2) / sides
      this.sides = sides
      for (let t = 0; t < sides; t++) {
        let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
        this.nodes.push(node)
        this.angle += this.angleIncrement
      }
    }
    isPointInside(point) { // rough approximation
      this.body.radius = this.size - (this.size * .293)
      if (this.sides <= 2) {
        return false
      }
      this.areaY = point.y - this.body.y
      this.areaX = point.x - this.body.x
      if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.body.radius * this.body.radius)) {
        return true
      }
      return false
    }
    move() {
      if (this.reflect == 1) {
        if (this.body.x > canvas.width) {
          if (this.xmom > 0) {
            this.xmom *= -1
          }
        }
        if (this.body.y > canvas.height) {
          if (this.ymom > 0) {
            this.ymom *= -1
          }
        }
        if (this.body.x < 0) {
          if (this.xmom < 0) {
            this.xmom *= -1
          }
        }
        if (this.body.y < 0) {
          if (this.ymom < 0) {
            this.ymom *= -1
          }
        }
      }
      this.body.x += this.xmom
      this.body.y += this.ymom
    }
    draw() {
      this.nodes = []
      this.angleIncrement = (Math.PI * 2) / this.sides
      this.body.radius = this.size - (this.size * .293)
      for (let t = 0; t < this.sides; t++) {
        let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
        this.nodes.push(node)
        this.angle += this.angleIncrement
      }
      canvas_context.strokeStyle = this.color
      canvas_context.fillStyle = this.color
      canvas_context.lineWidth = 0
      canvas_context.beginPath()
      canvas_context.moveTo(this.nodes[0].x, this.nodes[0].y)
      for (let t = 1; t < this.nodes.length; t++) {
        canvas_context.lineTo(this.nodes[t].x, this.nodes[t].y)
      }
      canvas_context.lineTo(this.nodes[0].x, this.nodes[0].y)
      canvas_context.fill()
      canvas_context.stroke()
      canvas_context.closePath()
    }
  }
  class Shape {
    constructor(shapes) {
      this.shapes = shapes
    }
    isPointInside(point) {
      for (let t = 0; t < this.shapes.length; t++) {
        if (this.shapes[t].isPointInside(point)) {
          return true
        }
      }
      return false
    }
    doesPerimeterTouch(point) {
      for (let t = 0; t < this.shapes.length; t++) {
        if (this.shapes[t].doesPerimeterTouch(point)) {
          return true
        }
      }
      return false
    }
    isInsideOf(box) {
      for (let t = 0; t < this.shapes.length; t++) {
        if (box.isPointInside(this.shapes[t])) {
          return true
        }
      }
      return false
    }
    push(object) {
      this.shapes.push(object)
    }
  }
  class Spring {
    constructor(x, y, radius, color, body = 0, length = 1, gravity = 0, width = 1) {
      if (body == 0) {
        this.body = new Circle(x, y, radius, color)
        this.anchor = new Circle(x, y, radius, color)
        this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
        this.length = length
      } else {
        this.body = body
        this.anchor = new Circle(x, y, radius, color)
        this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
        this.length = length
      }
      this.gravity = gravity
      this.width = width
    }
    balance() {
      this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
      if (this.beam.hypotenuse() < this.length) {
        this.body.xmom += (this.body.x - this.anchor.x) / this.length
        this.body.ymom += (this.body.y - this.anchor.y) / this.length
        this.anchor.xmom -= (this.body.x - this.anchor.x) / this.length
        this.anchor.ymom -= (this.body.y - this.anchor.y) / this.length
      } else {
        this.body.xmom -= (this.body.x - this.anchor.x) / this.length
        this.body.ymom -= (this.body.y - this.anchor.y) / this.length
        this.anchor.xmom += (this.body.x - this.anchor.x) / this.length
        this.anchor.ymom += (this.body.y - this.anchor.y) / this.length
      }
      let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
      let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
      this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
      this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
      this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
      this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
    }
    draw() {
      this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
      this.beam.draw()
      this.body.draw()
      this.anchor.draw()
    }
    move() {
      this.anchor.ymom += this.gravity
      this.anchor.move()
    }

  }
  class Color {
    constructor(baseColor, red = -1, green = -1, blue = -1, alpha = 1) {
      this.hue = baseColor
      if (red != -1 && green != -1 && blue != -1) {
        this.r = red
        this.g = green
        this.b = blue
        if (alpha != 1) {
          if (alpha < 1) {
            this.alpha = alpha
          } else {
            this.alpha = alpha / 255
            if (this.alpha > 1) {
              this.alpha = 1
            }
          }
        }
        if (this.r > 255) {
          this.r = 255
        }
        if (this.g > 255) {
          this.g = 255
        }
        if (this.b > 255) {
          this.b = 255
        }
        if (this.r < 0) {
          this.r = 0
        }
        if (this.g < 0) {
          this.g = 0
        }
        if (this.b < 0) {
          this.b = 0
        }
      } else {
        this.r = 0
        this.g = 0
        this.b = 0
      }
    }
    normalize() {
      if (this.r > 255) {
        this.r = 255
      }
      if (this.g > 255) {
        this.g = 255
      }
      if (this.b > 255) {
        this.b = 255
      }
      if (this.r < 0) {
        this.r = 0
      }
      if (this.g < 0) {
        this.g = 0
      }
      if (this.b < 0) {
        this.b = 0
      }
    }
    randomLight() {
      var letters = '0123456789ABCDEF';
      var hash = '#';
      for (var i = 0; i < 6; i++) {
        hash += letters[(Math.floor(Math.random() * 12) + 4)];
      }
      var color = new Color(hash, 55 + Math.random() * 200, 55 + Math.random() * 200, 55 + Math.random() * 200)
      return color;
    }
    randomDark() {
      var letters = '0123456789ABCDEF';
      var hash = '#';
      for (var i = 0; i < 6; i++) {
        hash += letters[(Math.floor(Math.random() * 12))];
      }
      var color = new Color(hash, Math.random() * 200, Math.random() * 200, Math.random() * 200)
      return color;
    }
    random() {
      var letters = '0123456789ABCDEF';
      var hash = '#';
      for (var i = 0; i < 6; i++) {
        hash += letters[(Math.floor(Math.random() * 16))];
      }
      var color = new Color(hash, Math.random() * 255, Math.random() * 255, Math.random() * 255)
      return color;
    }
  }
  class Softbody { //buggy, spins in place
    constructor(x, y, radius, color, members = 10, memberLength = 5, force = 10, gravity = 0) {
      this.springs = []
      this.pin = new Circle(x, y, radius, color)
      this.spring = new Spring(x, y, radius, color, this.pin, memberLength, gravity)
      this.springs.push(this.spring)
      for (let k = 0; k < members; k++) {
        this.spring = new Spring(x, y, radius, color, this.spring.anchor, memberLength, gravity)
        if (k < members - 1) {
          this.springs.push(this.spring)
        } else {
          this.spring.anchor = this.pin
          this.springs.push(this.spring)
        }
      }
      this.forceConstant = force
      this.centroid = new Point(0, 0)
    }
    circularize() {
      this.xpoint = 0
      this.ypoint = 0
      for (let s = 0; s < this.springs.length; s++) {
        this.xpoint += (this.springs[s].anchor.x / this.springs.length)
        this.ypoint += (this.springs[s].anchor.y / this.springs.length)
      }
      this.centroid.x = this.xpoint
      this.centroid.y = this.ypoint
      this.angle = 0
      this.angleIncrement = (Math.PI * 2) / this.springs.length
      for (let t = 0; t < this.springs.length; t++) {
        this.springs[t].body.x = this.centroid.x + (Math.cos(this.angle) * this.forceConstant)
        this.springs[t].body.y = this.centroid.y + (Math.sin(this.angle) * this.forceConstant)
        this.angle += this.angleIncrement
      }
    }
    balance() {
      for (let s = this.springs.length - 1; s >= 0; s--) {
        this.springs[s].balance()
      }
      this.xpoint = 0
      this.ypoint = 0
      for (let s = 0; s < this.springs.length; s++) {
        this.xpoint += (this.springs[s].anchor.x / this.springs.length)
        this.ypoint += (this.springs[s].anchor.y / this.springs.length)
      }
      this.centroid.x = this.xpoint
      this.centroid.y = this.ypoint
      for (let s = 0; s < this.springs.length; s++) {
        this.link = new Line(this.centroid.x, this.centroid.y, this.springs[s].anchor.x, this.springs[s].anchor.y, 0, "transparent")
        if (this.link.hypotenuse() != 0) {
          this.springs[s].anchor.xmom += (((this.springs[s].anchor.x - this.centroid.x) / (this.link.hypotenuse()))) * this.forceConstant
          this.springs[s].anchor.ymom += (((this.springs[s].anchor.y - this.centroid.y) / (this.link.hypotenuse()))) * this.forceConstant
        }
      }
      for (let s = 0; s < this.springs.length; s++) {
        this.springs[s].move()
      }
      for (let s = 0; s < this.springs.length; s++) {
        this.springs[s].draw()
      }
    }
  }
  class Observer {
    constructor(x, y, radius, color, range = 100, rays = 10, angle = (Math.PI * .125)) {
      this.body = new Circle(x, y, radius, color)
      this.color = color
      this.ray = []
      this.rayrange = range
      this.globalangle = Math.PI
      this.gapangle = angle
      this.currentangle = 0
      this.obstacles = []
      this.raymake = rays
    }
    beam() {
      this.currentangle = this.gapangle / 2
      for (let k = 0; k < this.raymake; k++) {
        this.currentangle += (this.gapangle / Math.ceil(this.raymake / 2))
        let ray = new Circle(this.body.x, this.body.y, 1, "white", (((Math.cos(this.globalangle + this.currentangle)))), (((Math.sin(this.globalangle + this.currentangle)))))
        ray.collided = 0
        ray.lifespan = this.rayrange - 1
        this.ray.push(ray)
      }
      for (let f = 0; f < this.rayrange; f++) {
        for (let t = 0; t < this.ray.length; t++) {
          if (this.ray[t].collided < 1) {
            this.ray[t].move()
            for (let q = 0; q < this.obstacles.length; q++) {
              if (anglecollider(this.obstacles[q], (this.ray[t]))) {
                this.ray[t].collided = 1
              }
            }
          }
        }
      }
    }
    draw() {
      this.beam()
      this.body.draw()
      canvas_context.lineWidth = 1
      canvas_context.fillStyle = this.color
      canvas_context.strokeStyle = this.color
      canvas_context.beginPath()
      canvas_context.moveTo(this.body.x, this.body.y)
      for (let y = 0; y < this.ray.length; y++) {
        canvas_context.lineTo(this.ray[y].x, this.ray[y].y)
        canvas_context.lineTo(this.body.x, this.body.y)
      }
      canvas_context.stroke()
      canvas_context.fill()
      this.ray = []
    }
  }
  function setUp(canvas_pass, style = "blue") {
    canvas = canvas_pass
    canvas_context = canvas.getContext('2d');
    canvas.style.background = style
    window.setInterval(function () {
      main()
    }, 10)
    document.addEventListener('keydown', (event) => {
      keysPressed[event.key] = true;
    });
    document.addEventListener('keyup', (event) => {
      delete keysPressed[event.key];
    });
    canvas.addEventListener('pointerdown', e => {
      FLEX_engine = canvas.getBoundingClientRect();
      XS_engine = e.clientX - FLEX_engine.left;
      YS_engine = e.clientY - FLEX_engine.top;
      TIP_engine.x = XS_engine
      TIP_engine.y = YS_engine
      TIP_engine.body = TIP_engine
      let circ = new Circle(TIP_engine.x, TIP_engine.y, 1, "red")
      let obj = {}
      obj.angle = (new LineOP(center, circ)).angle()
      obj.length = (new LineOP(center, circ)).hypotenuse()

      if(angler == 0 ){
        angler = obj.angle - .0201
      }
      if((obj.angle-angler) > .02 && obj.angle-angler < .022){
        console.log(obj.angle, angler)
        set.push(obj)
        circ.draw()
        angler = obj.angle
        console.log(obj.angle)
      }
      checkPomao(center,circ)
      FLEX_engine = canvas.getBoundingClientRect();
      XS_engine = e.clientX - FLEX_engine.left;
      YS_engine = e.clientY - FLEX_engine.top;
      TIP_engine.x = XS_engine
      TIP_engine.y = YS_engine
      TIP_engine.body = TIP_engine
      window.addEventListener('pointermove', continued_stimuli);
      // example usage: if(object.isPointInside(TIP_engine)){ take action }
    });

    // window.addEventListener('pointerup', e => {
    //   window.removeEventListener("pointermove", continued_stimuli);
    // })
    function continued_stimuli(e) {
      let circ = new Circle(TIP_engine.x, TIP_engine.y, 1, "red")
      let obj = {}
      obj.angle = (new LineOP(center, circ)).angle()
      obj.length = (new LineOP(center, circ)).hypotenuse()

      if(angler == 0 ){
        angler = obj.angle - .0201
      }
      if((obj.angle-angler) > .02 && obj.angle-angler < .022){
        console.log(obj.angle, angler)
        set.push(obj)
        circ.draw()
        angler = obj.angle
        console.log(obj.angle)
      }
      checkPomao(center,circ)
      FLEX_engine = canvas.getBoundingClientRect();
      XS_engine = e.clientX - FLEX_engine.left;
      YS_engine = e.clientY - FLEX_engine.top;
      TIP_engine.x = XS_engine
      TIP_engine.y = YS_engine
      TIP_engine.body = TIP_engine
    }
  }
  function gamepad_control(object, speed = 1) { // basic control for objects using the controler
    console.log(gamepadAPI.axesStatus[1] * gamepadAPI.axesStatus[0])
    if (typeof object.body != 'undefined') {
      if (typeof (gamepadAPI.axesStatus[1]) != 'undefined') {
        if (typeof (gamepadAPI.axesStatus[0]) != 'undefined') {
          object.body.x += (gamepadAPI.axesStatus[2] * speed)
          object.body.y += (gamepadAPI.axesStatus[1] * speed)
        }
      }
    } else if (typeof object != 'undefined') {
      if (typeof (gamepadAPI.axesStatus[1]) != 'undefined') {
        if (typeof (gamepadAPI.axesStatus[0]) != 'undefined') {
          object.x += (gamepadAPI.axesStatus[0] * speed)
          object.y += (gamepadAPI.axesStatus[1] * speed)
        }
      }
    }
  }
  function control(object, speed = 1) { // basic control for objects
    if (typeof object.body != 'undefined') {
      if (keysPressed['w']) {
        object.body.y -= speed * gamepadAPI.axesStatus[0]
      }
      if (keysPressed['d']) {
        object.body.x += speed
      }
      if (keysPressed['s']) {
        object.body.y += speed
      }
      if (keysPressed['a']) {
        object.body.x -= speed
      }
    } else if (typeof object != 'undefined') {
      if (keysPressed['w']) {
        object.y -= speed
      }
      if (keysPressed['d']) {
        object.x += speed
      }
      if (keysPressed['s']) {
        object.y += speed
      }
      if (keysPressed['a']) {
        object.x -= speed
      }
    }
  }
  function getRandomLightColor() { // random color that will be visible on  black background
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[(Math.floor(Math.random() * 12) + 4)];
    }
    return color;
  }
  function getRandomColor() { // random color
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[(Math.floor(Math.random() * 16) + 0)];
    }
    return color;
  }
  function getRandomDarkColor() {// color that will be visible on a black background
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[(Math.floor(Math.random() * 12))];
    }
    return color;
  }
  function castBetween(from, to, granularity = 10, radius = 1) { //creates a sort of beam hitbox between two points, with a granularity (number of members over distance), with a radius defined as well
    let limit = granularity
    let shape_array = []
    for (let t = 0; t < limit; t++) {
      let circ = new Circle((from.x * (t / limit)) + (to.x * ((limit - t) / limit)), (from.y * (t / limit)) + (to.y * ((limit - t) / limit)), radius, "red")
      shape_array.push(circ)
    }
    return (new Shape(shape_array))
  }

  let setup_canvas = document.getElementById('canvas') //getting canvas from document

  setUp(setup_canvas) // setting up canvas refrences, starting timer. 

  // object instantiation and creation happens here 




  function anglecollider(center, obj) {
    let link = new LineOP(center, obj)
    let angle = link.angle()
    let cos = Math.cos(Math.sin((((angle - .1) / 1.40) - .00001) - .0003)) - .04
    let sin = Math.cos(Math.sin(angle))
    let obbj = {}
    obbj.x = link.xdis() * (cos * cos)
    obbj.x += 10
    obbj.y = link.ydis() * (sin * cos)
    let obbj2 = {}
    obbj2.x = -(center.radius * sin * cos) / 10 //-5/cos
    obbj2.y = (center.radius * sin * cos) / 4
    let line = new LineOP(obbj, obbj2)
    if (angle > -.10 && angle < 1.59) {

      if (link.hypotenuse() < center.radius * 2.9) {
        if (line.hypotenuse() < center.radius * 1) {
          return true
        } else {
          return false
        }
      } else {
        return false
      }
    } else {

      let angle = link.angle()
      let cos = Math.cos(Math.sin((((angle - .1) / 1.40) - .00001) - .0003)) - .04
      let sin = Math.sin(Math.sin(Math.sin(Math.sin(Math.sin(Math.sin(Math.cos(Math.cos((Math.sin((angle - .1) / 1.1) + 1.3)) + .995))))))) + .01
      let obbj = {}
      obbj.x = link.xdis() * (cos * cos * cos)
      obbj.x += 10
      obbj.y = link.ydis() * (sin * cos)
      let obbj2 = {}
      obbj2.x = -(center.radius * sin * cos) / 10 //-5/cos
      obbj2.y = (center.radius * sin * cos) / 4
      let line = new LineOP(obbj, obbj2)
      if (line.hypotenuse() < center.radius * 1) {
        return true
      } else {
        return false
      }
    }
  }

  let pngimage = new Image()
  pngimage.src = "sprite.png"

  let angle = 0
  let angle2 = 0
  let dis = 100
  let dis2 = 10
  let center = new Circle(250, 250, 200, "black")
  let dot = new Circle(0, 0, 3, "blue")
  let dot2 = new Circle(0, 0, 3, "#FF000001")
  let circs = []

  let obs = new Observer(350, 350, 1, "white", 300, 100)
  obs.obstacles.push(center)
  center.draw()
  let line = new Line(center.x, center.y, center.x+1000, center.y, "white", 1)
  line.draw()
  center = new Circle(250, 250, 200, "black")
  let x = 0
  let y = 0
  let count1 = 0
  let count2 = 0
  let set = []

  let pomarray = [
    {
      "angle": -3.126583360488169,
      "length": 201.5204976494886
    },
    {
      "angle": -3.1059200641049234,
      "length": 200.27697891961458
    },
    {
      "angle": -3.085487951816748,
      "length": 198.55350024480296
    },
    {
      "angle": -3.063941735868306,
      "length": 197.10737109844635
    },
    {
      "angle": -3.0423032916164887,
      "length": 195.5703855554611
    },
    {
      "angle": -3.0211108837931184,
      "length": 193.57291360372685
    },
    {
      "angle": -3.0001007933019777,
      "length": 191.6045128904371
    },
    {
      "angle": -2.978573418631672,
      "length": 189.5623921645389
    },
    {
      "angle": -2.958423821820395,
      "length": 188.13383777124645
    },
    {
      "angle": -2.9370882053633034,
      "length": 186.5891159900558
    },
    {
      "angle": -2.915779368742004,
      "length": 185.54082773739523
    },
    {
      "angle": -2.894843545731272,
      "length": 184.7014894671906
    },
    {
      "angle": -2.8737734074403587,
      "length": 183.25857704531865
    },
    {
      "angle": -2.852461928660445,
      "length": 182.16861331349088
    },
    {
      "angle": -2.83114138932749,
      "length": 181.04066795102207
    },
    {
      "angle": -2.80967015637988,
      "length": 180.14764078505354
    },
    {
      "angle": -2.789403709314092,
      "length": 179.49512006674976
    },
    {
      "angle": -2.769376077771328,
      "length": 178.8568944241668
    },
    {
      "angle": -2.7491836034684134,
      "length": 178.54670899910937
    },
    {
      "angle": -2.7276249552186176,
      "length": 178.1019476616253
    },
    {
      "angle": -2.7058608501696146,
      "length": 179.82000744983884
    },
    {
      "angle": -2.685628799751333,
      "length": 177.9872951100005
    },
    {
      "angle": -2.6656079701307434,
      "length": 177.2069113096731
    },
    {
      "angle": -2.644927862284623,
      "length": 176.81163786614368
    },
    {
      "angle": -2.6249007442993104,
      "length": 176.43637986439433
    },
    {
      "angle": -2.603182588176866,
      "length": 177.16225534285772
    },
    {
      "angle": -2.582085577165635,
      "length": 175.15455791726507
    },
    {
      "angle": -2.5609409478329628,
      "length": 173.15349996486705
    },
    {
      "angle": -2.5405892905318526,
      "length": 172.71891977690666
    },
    {
      "angle": -2.520028229552765,
      "length": 171.67302134838263
    },
    {
      "angle": -2.4998276886725197,
      "length": 168.42215019088943
    },
    {
      "angle": -2.4786265642116474,
      "length": 163.8118638968177
    },
    {
      "angle": -2.456682144173303,
      "length": 160.11986415759895
    },
    {
      "angle": -2.435525615861718,
      "length": 156.56572822578303
    },
    {
      "angle": -2.414505138042235,
      "length": 152.83225731372116
    },
    {
      "angle": -2.3938770439248995,
      "length": 149.40032055966796
    },
    {
      "angle": -2.3725011348609324,
      "length": 146.06698392757622
    },
    {
      "angle": -2.351669802315103,
      "length": 143.02015208740835
    },
    {
      "angle": -2.3301379669293065,
      "length": 140.06417988499095
    },
    {
      "angle": -2.309156934408898,
      "length": 137.35908186365694
    },
    {
      "angle": -2.2874926283184496,
      "length": 137.28635406616232
    },
    {
      "angle": -2.2664353698343787,
      "length": 134.84261907779472
    },
    {
      "angle": -2.2461890786768772,
      "length": 132.62816239185972
    },
    {
      "angle": -2.2259489108298975,
      "length": 130.34994053209934
    },
    {
      "angle": -2.2041384866421656,
      "length": 128.2316513006615
    },
    {
      "angle": -2.1829962427170675,
      "length": 126.29940112664482
    },
    {
      "angle": -2.1628296391047135,
      "length": 124.56094646518558
    },
    {
      "angle": -2.142156723883896,
      "length": 122.35622389177048
    },
    {
      "angle": -2.1219110329990176,
      "length": 120.98158387152235
    },
    {
      "angle": -2.1017610272543465,
      "length": 119.68611775321538
    },
    {
      "angle": -2.0812562755506665,
      "length": 118.28683058029006
    },
    {
      "angle": -2.060875918868369,
      "length": 116.9762546082504
    },
    {
      "angle": -2.039748207844368,
      "length": 115.36278926605436
    },
    {
      "angle": -2.0196299922879044,
      "length": 114.22173669606737
    },
    {
      "angle": -1.9979286217597014,
      "length": 113.06670697589723
    },
    {
      "angle": -1.9778771224920244,
      "length": 112.06652468737087
    },
    {
      "angle": -1.9572309247556936,
      "length": 111.10125928335752
    },
    {
      "angle": -1.9363132988748335,
      "length": 110.94761559839831
    },
    {
      "angle": -1.9159979165495182,
      "length": 110.11425888021702
    },
    {
      "angle": -1.8955554243503214,
      "length": 109.33343540312677
    },
    {
      "angle": -1.8752166790137303,
      "length": 108.7549453111632
    },
    {
      "angle": -1.8551126530548,
      "length": 108.39172391675125
    },
    {
      "angle": -1.8346942911372646,
      "length": 107.77117050033779
    },
    {
      "angle": -1.8134819154953543,
      "length": 107.18101320372962
    },
    {
      "angle": -1.7925987587496064,
      "length": 106.31655428401751
    },
    {
      "angle": -1.7713605182166292,
      "length": 105.69006944700159
    },
    {
      "angle": -1.7509553002527047,
      "length": 105.27529927108404
    },
    {
      "angle": -1.729719218236719,
      "length": 104.74182919428429
    },
    {
      "angle": -1.7096751695246106,
      "length": 104.27632976346963
    },
    {
      "angle": -1.6896035866808674,
      "length": 105.34754427907365
    },
    {
      "angle": -1.6685357877780682,
      "length": 105.10656150217024
    },
    {
      "angle": -1.6482824472435487,
      "length": 105.9429172924359
    },
    {
      "angle": -1.6272544103295228,
      "length": 107.35858863918126
    },
    {
      "angle": -1.6060578934085612,
      "length": 107.95327584837075
    },
    {
      "angle": -1.5853816442287,
      "length": 107.89764584333707
    },
    {
      "angle": -1.564775795127254,
      "length": 107.88812472741154
    },
    {
      "angle": -1.5444816594365027,
      "length": 107.48588221549016
    },
    {
      "angle": -1.5239517376083807,
      "length": 106.53651853815002
    },
    {
      "angle": -1.5029889680543271,
      "length": 104.95998257189261
    },
    {
      "angle": -1.4823836532835295,
      "length": 103.24254485909813
    },
    {
      "angle": -1.4611840977727544,
      "length": 101.43240668383814
    },
    {
      "angle": -1.440994919734487,
      "length": 99.07229501714062
    },
    {
      "angle": -1.4193604827961017,
      "length": 96.36854641524481
    },
    {
      "angle": -1.3977242774729106,
      "length": 93.50635488143793
    },
    {
      "angle": -1.3771433676864309,
      "length": 89.83320324020808
    },
    {
      "angle": -1.3569027261964166,
      "length": 88.06947140083896
    },
    {
      "angle": -1.334966856613911,
      "length": 85.09190310744789
    },
    {
      "angle": -1.3139789242101139,
      "length": 82.1749907116469
    },
    {
      "angle": -1.2934560841363272,
      "length": 78.95693352097507
    },
    {
      "angle": -1.2719710609770005,
      "length": 76.920035609208
    },
    {
      "angle": -1.2518016363529934,
      "length": 74.53475758253794
    },
    {
      "angle": -1.2298784538639067,
      "length": 72.51488667121568
    },
    {
      "angle": -1.209348577991477,
      "length": 70.16539183029435
    },
    {
      "angle": -1.1885660482927507,
      "length": 68.51588570069178
    },
    {
      "angle": -1.1675504593922883,
      "length": 68.74370459746996
    },
    {
      "angle": -1.1462643581898257,
      "length": 68.59096794009383
    },
    {
      "angle": -1.1252108271890688,
      "length": 69.03289653452092
    },
    {
      "angle": -1.1038333996596212,
      "length": 68.94616021250974
    },
    {
      "angle": -1.0835225480602495,
      "length": 68.7063972224511
    },
    {
      "angle": -1.0635108482728157,
      "length": 69.51805168623191
    },
    {
      "angle": -1.0428094752209933,
      "length": 74.47994702875178
    },
    {
      "angle": -1.0226850744159817,
      "length": 70.42516309020556
    },
    {
      "angle": -1.002080614312328,
      "length": 70.7599624814269
    },
    {
      "angle": -0.9806200671511947,
      "length": 74.06542765589228
    },
    {
      "angle": -0.9596896350507437,
      "length": 72.9421786524647
    },
    {
      "angle": -0.937739281367774,
      "length": 71.10997413419776
    },
    {
      "angle": -0.9162933605865656,
      "length": 70.77083882476066
    },
    {
      "angle": -0.8949958428110797,
      "length": 71.27420519158542
    },
    {
      "angle": -0.8735485304597841,
      "length": 71.54752431186303
    },
    {
      "angle": -0.8527307738373162,
      "length": 71.4326959803918
    },
    {
      "angle": -0.8313424709611745,
      "length": 120.95450897107067
    },
    {
      "angle": -0.8094796356586581,
      "length": 122.39644267348498
    },
    {
      "angle": -0.7886381110412043,
      "length": 122.93612938113496
    },
    {
      "angle": -0.7674125671228548,
      "length": 122.55921506917244
    },
    {
      "angle": -0.7461815029366723,
      "length": 121.64020613969792
    },
    {
      "angle": -0.7253672925738003,
      "length": 121.10246100427412
    },
    {
      "angle": -0.7044314157455314,
      "length": 120.11163656382142
    },
    {
      "angle": -0.6832068802286397,
      "length": 118.92935673790807
    },
    {
      "angle": -0.6621058017317643,
      "length": 118.97058627244816
    },
    {
      "angle": -0.6414756045370066,
      "length": 120.34086270391487
    },
    {
      "angle": -0.6210632798949762,
      "length": 119.29798898887543
    },
    {
      "angle": -0.600650123264549,
      "length": 117.94106888253316
    },
    {
      "angle": -0.5798810962671508,
      "length": 117.0182944862516
    },
    {
      "angle": -0.5591694833934541,
      "length": 115.90423805082737
    },
    {
      "angle": -0.5389047729896516,
      "length": 114.98859014909253
    },
    {
      "angle": -0.5186554314350625,
      "length": 114.3287393807441
    },
    {
      "angle": -0.49862843513732175,
      "length": 113.35623643107058
    },
    {
      "angle": -0.4768925031033619,
      "length": 112.53579502237855
    },
    {
      "angle": -0.455879573336681,
      "length": 111.54471825479597
    },
    {
      "angle": -0.43582190881345445,
      "length": 110.65971730821815
    },
    {
      "angle": -0.41508354813846526,
      "length": 109.81418745238145
    },
    {
      "angle": -0.3947679447175023,
      "length": 108.98058087267759
    },
    {
      "angle": -0.37290159749387564,
      "length": 109.46359816755394
    },
    {
      "angle": -0.3516807729308375,
      "length": 110.12869616934883
    },
    {
      "angle": -0.33024701167107645,
      "length": 109.94178028120206
    },
    {
      "angle": -0.30974080078828214,
      "length": 110.07817100859401
    },
    {
      "angle": -0.28885418815261077,
      "length": 110.34981420657547
    },
    {
      "angle": -0.2685417257700239,
      "length": 110.51569250052721
    },
    {
      "angle": -0.24735883576833118,
      "length": 110.65396526475733
    },
    {
      "angle": -0.22626117151993533,
      "length": 110.43027121332345
    },
    {
      "angle": -0.20620559566965382,
      "length": 110.33032796557191
    },
    {
      "angle": -0.18575093071573598,
      "length": 110.03979149456913
    },
    {
      "angle": -0.16385279083966584,
      "length": 109.6150383588812
    },
    {
      "angle": -0.14338745430602695,
      "length": 109.26822168217824
    },
    {
      "angle": -0.12278109969637778,
      "length": 108.60823825581022
    },
    {
      "angle": -0.10238064950887213,
      "length": 107.6912444916545
    },
    {
      "angle": -0.0819810866830095,
      "length": 106.98509295834549
    },
    {
      "angle": -0.06148610472516525,
      "length": 106.32826428198413
    },
    {
      "angle": -0.040105063603817034,
      "length": 105.72719857352877
    },
    {
      "angle": -0.019593938769068477,
      "length": 104.98967959290337
    },
    {
      "angle": 0.0009447413918817751,
      "length": 104.20004154204973
    },
    {
      "angle": 0.02136351336841603,
      "length": 103.2430835438476
    },
    {
      "angle": 0.041474020101988994,
      "length": 102.46545089943191
    },
    {
      "angle": 0.06291112621924344,
      "length": 101.46243322818944
    },
    {
      "angle": 0.0847181732856399,
      "length": 100.47126542428795
    },
    {
      "angle": 0.10488110627284598,
      "length": 98.98375248277449
    },
    {
      "angle": 0.1261900763981851,
      "length": 98.48228776730214
    },
    {
      "angle": 0.14718357701739193,
      "length": 96.34795443529144
    },
    {
      "angle": 0.16774240648019176,
      "length": 94.97682109432638
    },
    {
      "angle": 0.18857382523886898,
      "length": 92.43312579245587
    },
    {
      "angle": 0.20878326472642414,
      "length": 89.94545435352626
    },
    {
      "angle": 0.22898463155557433,
      "length": 87.0431422128892
    },
    {
      "angle": 0.2494537590001762,
      "length": 83.582398865133
    },
    {
      "angle": 0.27018730005944824,
      "length": 79.2249862347078
    },
    {
      "angle": 0.29031953876334904,
      "length": 75.33622614131068
    },
    {
      "angle": 0.3114006796990633,
      "length": 70.84720644784856
    },
    {
      "angle": 0.3326543722447599,
      "length": 70.5570741581488
    },
    {
      "angle": 0.35301976437756716,
      "length": 69.76800846230178
    },
    {
      "angle": 0.3740218113864412,
      "length": 106.76052004577502
    },
    {
      "angle": 0.39428899191122996,
      "length": 106.74694409306926
    },
    {
      "angle": 0.4143274444805315,
      "length": 105.82866527693199
    },
    {
      "angle": 0.43488817811715313,
      "length": 104.40675136437247
    },
    {
      "angle": 0.4550747915097038,
      "length": 102.54040929509888
    },
    {
      "angle": 0.47542873623428505,
      "length": 100.44869558482868
    },
    {
      "angle": 0.49598837593903744,
      "length": 97.97038927036787
    },
    {
      "angle": 0.5161816719634766,
      "length": 94.69570048791944
    },
    {
      "angle": 0.5368189935727917,
      "length": 91.3919171705319
    },
    {
      "angle": 0.5569735426642448,
      "length": 88.52509042434447
    },
    {
      "angle": 0.578280852589494,
      "length": 85.38669396817068
    },
    {
      "angle": 0.5985361261201498,
      "length": 82.36606284416418
    },
    {
      "angle": 0.6191474647193939,
      "length": 79.76990016887277
    },
    {
      "angle": 0.6403495825938792,
      "length": 77.2913162974951
    },
    {
      "angle": 0.6614969187162061,
      "length": 75.81180473026913
    },
    {
      "angle": 0.6819638742030444,
      "length": 76.70845178539737
    },
    {
      "angle": 0.7023189664951205,
      "length": 76.25655395940309
    },
    {
      "angle": 0.7228450537709737,
      "length": 75.89282333340347
    },
    {
      "angle": 0.7445929139048294,
      "length": 75.59076623138186
    },
    {
      "angle": 0.7659739639825398,
      "length": 75.25698417317858
    },
    {
      "angle": 0.7870761143443821,
      "length": 75.0672236707385
    },
    {
      "angle": 0.8080883799702308,
      "length": 77.64760131211462
    },
    {
      "angle": 0.8284633609427678,
      "length": 84.59923360093659
    },
    {
      "angle": 0.8503828770175418,
      "length": 84.28604280546473
    },
    {
      "angle": 0.8721853289176672,
      "length": 82.80836757552565
    },
    {
      "angle": 0.8935819909847618,
      "length": 81.14532089547049
    },
    {
      "angle": 0.9139971222173647,
      "length": 79.93612513411959
    },
    {
      "angle": 0.9348488067635531,
      "length": 78.87474313666208
    },
    {
      "angle": 0.9556501874350154,
      "length": 77.76922364148598
    },
    {
      "angle": 0.9758011494572341,
      "length": 76.69285368391397
    },
    {
      "angle": 0.9973585476129808,
      "length": 75.60736789774874
    },
    {
      "angle": 1.0174651309231317,
      "length": 74.65312050741925
    },
    {
      "angle": 1.0387640479080453,
      "length": 83.1493193230666
    },
    {
      "angle": 1.0602002030670195,
      "length": 82.67992054555809
    },
    {
      "angle": 1.0809108298112011,
      "length": 81.92977477621129
    },
    {
      "angle": 1.1022495540593034,
      "length": 81.08498239390845
    },
    {
      "angle": 1.1222802264521026,
      "length": 80.28716719378221
    },
    {
      "angle": 1.1436344656988577,
      "length": 79.4885106962881
    },
    {
      "angle": 1.1639100440628392,
      "length": 78.5352432674302
    },
    {
      "angle": 1.1842114837597038,
      "length": 77.7587440548831
    },
    {
      "angle": 1.2044369576885212,
      "length": 77.13946381741009
    },
    {
      "angle": 1.2259896464900062,
      "length": 76.5244778387713
    },
    {
      "angle": 1.2477376262089914,
      "length": 77.61594134699185
    },
    {
      "angle": 1.267757334533926,
      "length": 80.42560647724562
    },
    {
      "angle": 1.2877712014623377,
      "length": 79.82260966056853
    },
    {
      "angle": 1.3084901741328798,
      "length": 78.89067616904401
    },
    {
      "angle": 1.329143578874978,
      "length": 83.06511767578239
    },
    {
      "angle": 1.3502724992228259,
      "length": 83.4177819423313
    },
    {
      "angle": 1.3713264421233615,
      "length": 83.16781898924033
    },
    {
      "angle": 1.391332631000147,
      "length": 83.1836174660243
    },
    {
      "angle": 1.4133046270740692,
      "length": 82.93105579294996
    },
    {
      "angle": 1.4341609091061458,
      "length": 82.10506780472
    },
    {
      "angle": 1.4560424029113757,
      "length": 82.06709599242681
    },
    {
      "angle": 1.4762953982859448,
      "length": 82.01594197362338
    },
    {
      "angle": 1.4972916439396233,
      "length": 81.87106840987973
    },
    {
      "angle": 1.5190803382256337,
      "length": 81.7021997731957
    },
    {
      "angle": 1.5404797423627998,
      "length": 81.57341844957234
    },
    {
      "angle": 1.56161848131717,
      "length": 81.46280246460256
    },
    {
      "angle": 1.582859563636767,
      "length": 81.40904526705425
    },
    {
      "angle": 1.6032509975934794,
      "length": 81.49838290332238
    },
    {
      "angle": 1.6239389891724925,
      "length": 81.46735133448053
    },
    {
      "angle": 1.6453640930087476,
      "length": 81.30405604189518
    },
    {
      "angle": 1.6661406611836012,
      "length": 81.21887881333
    },
    {
      "angle": 1.686361479523291,
      "length": 81.12785665287706
    },
    {
      "angle": 1.7079199364753803,
      "length": 80.98597123260448
    },
    {
      "angle": 1.728410233325319,
      "length": 80.67736610047696
    },
    {
      "angle": 1.7488701683111887,
      "length": 80.41220292422392
    },
    {
      "angle": 1.7691202005785396,
      "length": 80.22808121417623
    },
    {
      "angle": 1.7910994683473898,
      "length": 79.28496623694441
    },
    {
      "angle": 1.8125628074576812,
      "length": 78.68691980178417
    },
    {
      "angle": 1.8339316006346913,
      "length": 78.26341511155282
    },
    {
      "angle": 1.854916799561521,
      "length": 77.78409868597254
    },
    {
      "angle": 1.875522569096357,
      "length": 77.35112889689165
    },
    {
      "angle": 1.8965120961340112,
      "length": 76.69991631958749
    },
    {
      "angle": 1.9175172387811394,
      "length": 75.85457181294558
    },
    {
      "angle": 1.9379334760537827,
      "length": 76.21080833098029
    },
    {
      "angle": 1.9584795617267436,
      "length": 75.86531681261096
    },
    {
      "angle": 1.9791461333786164,
      "length": 75.26334843120165
    },
    {
      "angle": 1.9998352240011994,
      "length": 75.26534503312158
    },
    {
      "angle": 2.0209342365620646,
      "length": 75.00072088419743
    },
    {
      "angle": 2.041223753897568,
      "length": 74.8799524044469
    },
    {
      "angle": 2.0615047346170097,
      "length": 74.97171541976029
    },
    {
      "angle": 2.0822851725535623,
      "length": 74.84087799158888
    },
    {
      "angle": 2.104155429043235,
      "length": 99.30564742402781
    },
    {
      "angle": 2.125319749799935,
      "length": 102.15458669254234
    },
    {
      "angle": 2.1455645552373084,
      "length": 101.69152288335128
    },
    {
      "angle": 2.166499315381295,
      "length": 101.69646651168453
    },
    {
      "angle": 2.187040741747611,
      "length": 101.90223051687258
    },
    {
      "angle": 2.207369286826657,
      "length": 102.2990234264772
    },
    {
      "angle": 2.2283245409155845,
      "length": 102.65151102735874
    },
    {
      "angle": 2.2486680762607048,
      "length": 102.92438246387937
    },
    {
      "angle": 2.2704592129883943,
      "length": 102.41443886704265
    },
    {
      "angle": 2.290651428900816,
      "length": 74.93191806740687
    },
    {
      "angle": 2.3115627590538144,
      "length": 74.77200903994392
    },
    {
      "angle": 2.3319891120786003,
      "length": 74.86476664354669
    },
    {
      "angle": 2.3523601121247273,
      "length": 74.91630556311992
    },
    {
      "angle": 2.3724020532312227,
      "length": 75.2963234040354
    },
    {
      "angle": 2.393749664742616,
      "length": 75.67013765656874
    },
    {
      "angle": 2.415453601480209,
      "length": 76.32860660570536
    },
    {
      "angle": 2.4367158050212194,
      "length": 76.48276898315318
    },
    {
      "angle": 2.4583329322351015,
      "length": 77.05527233277448
    },
    {
      "angle": 2.4796845203296956,
      "length": 79.36392296806402
    },
    {
      "angle": 2.499945640948185,
      "length": 79.97779554975108
    },
    {
      "angle": 2.5210221944163265,
      "length": 80.89002098947148
    },
    {
      "angle": 2.541986422446782,
      "length": 82.10831092317807
    },
    {
      "angle": 2.5623905656728914,
      "length": 83.56644517584512
    },
    {
      "angle": 2.5841991566685025,
      "length": 84.06866184065849
    },
    {
      "angle": 2.6046491260134923,
      "length": 84.6479237038478
    },
    {
      "angle": 2.6263877575914405,
      "length": 84.75233511412685
    },
    {
      "angle": 2.6474250802177646,
      "length": 85.57364833484839
    },
    {
      "angle": 2.668088808585767,
      "length": 86.49461184075791
    },
    {
      "angle": 2.688931582310331,
      "length": 86.94741974694936
    },
    {
      "angle": 2.709533714674423,
      "length": 87.77977219624846
    },
    {
      "angle": 2.7298427404053713,
      "length": 89.07350971736258
    },
    {
      "angle": 2.7507961547047604,
      "length": 89.66658489644335
    },
    {
      "angle": 2.7714263626361983,
      "length": 90.343434087834
    },
    {
      "angle": 2.7923093558572916,
      "length": 91.32117970762724
    },
    {
      "angle": 2.813202862095618,
      "length": 92.32004229225012
    },
    {
      "angle": 2.834715529285147,
      "length": 93.23797223059455
    },
    {
      "angle": 2.855108524715059,
      "length": 93.93309925882822
    },
    {
      "angle": 2.876314748974387,
      "length": 94.82482298815182
    },
    {
      "angle": 2.8973137022857616,
      "length": 95.86640191547879
    },
    {
      "angle": 2.9181254004218946,
      "length": 97.05868840578592
    },
    {
      "angle": 2.9395956973232007,
      "length": 98.16145605112412
    },
    {
      "angle": 2.959624739993485,
      "length": 99.40610153193214
    },
    {
      "angle": 2.980401828845358,
      "length": 100.33978851611506
    },
    {
      "angle": 3.001266782907217,
      "length": 101.47558375705474
    },
    {
      "angle": 3.0221122892041024,
      "length": 102.3783300839797
    },
    {
      "angle": 3.0437412894658706,
      "length": 103.60655403272096
    },
    {
      "angle": 3.0648716827176017,
      "length": 104.82476444225898
    },
    {
      "angle": 3.086765627494296,
      "length": 105.85437955915053
    },
    {
      "angle": 3.1084495896436684,
      "length": 107.24875646972984
    },
    {
      "angle": 3.130397928472642,
      "length": 107.5442524859724
    }
  ]
  let pomarray2 = []
  for (let t = 0; t < pomarray.length - 1; t++) {
    let obj = {}
    obj.angle = (pomarray[t].angle + pomarray[t + 1].angle) * .5
    obj.length = (pomarray[t].length + pomarray[t + 1].length) * .5
    pomarray2.push(pomarray[t])
    pomarray2.push(obj)
  }

  let pomarray3 = []
  for (let t = 0; t < pomarray2.length - 1; t++) {
    let obj = {}
    obj.angle = (pomarray2[t].angle + pomarray2[t + 1].angle) * .5
    obj.length = (pomarray2[t].length + pomarray2[t + 1].length) * .5
    pomarray3.push(pomarray2[t])
    pomarray3.push(obj)
  }

  let pomarray4 = []
  for (let t = 0; t < pomarray3.length - 1; t++) {
    let obj = {}
    obj.angle = (pomarray3[t].angle + pomarray3[t + 1].angle) * .5
    obj.length = (pomarray3[t].length + pomarray3[t + 1].length) * .5
    pomarray4.push(pomarray3[t])
    pomarray4.push(obj)
  }


  let angles = []

  for (let t = 0; t < pomarray4.length; t++) {
    angles.push(pomarray4[t].angle)
  }
  let increment = (Math.PI*2)/angles.length

  let zero = Math.PI


  for (let t = 0; t < pomarray4.length; t++) {
    pomarray4[t].angle = zero
    // pomarray4[t].length = (pomarray4[t].length)
    zero+=increment
  }

  
  let invincrement = 1/increment
  
  function checkPomao(center, point) {
    let link = new LineOP(center, point)
    let angle = link.angle()+Math.PI
    let dis = link.hypotenuse()
    let t = Math.floor((angle)*invincrement)
    t%=pomarray4.length-1
    angle-=Math.PI
    if(angle < 0){
      angle+=Math.PI
    }
        if (angle > (pomarray4[t].angle%Math.PI) && angle < (pomarray4[t+1].angle%Math.PI)) {
            if (dis < ((pomarray4[t].length+pomarray4[t+1].length)*.5) * ((center.radius)*.004)) {
                            return `rgb(${255-t*(255/pomarray4.length)},${0+t*(255/pomarray4.length)},${(t*2)%255})`
            }
        } 
          return `rgb(${0},${0},${0})`
  }

  let circx = new Circle(0,0, 0,"transparent")

  console.time("chek1") // could be better without sqrt in hypotenuse function
  for(let t = 0;t<10000000;t++){
    checkPomao(center, circx)
  }
  console.timeEnd("chek1")
  console.time("chek2")
  for(let t = 0;t<10000000;t++){
    center.isPointInside(circx)
  }
  console.timeEnd("chek2")



  function main() {
    //  canvas_context.drawImage(pngimage, 0, 0, pngimage.width, pngimage.height, center.x - center.radius, center.y - center.radius, center.radius * 2, center.radius * 2)
    drawer()
    if (keysPressed['f']) {
        console.log(set)
    }
  }


function drawer(){

  for (let t = 1000; t > 0; t--) {

    x += .5
    if (x > canvas.width) {
        x = 0
        y += .5
    }

    let circ = new Circle(x, y, .3, "white")
    circ.color = (checkPomao(center, circ))
      circ.draw()
    
  }
}




})







