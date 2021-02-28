
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
      return Math.qrt(hypotenuse)
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
      return (hypotenuse)
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

      window.addEventListener('pointermove', continued_stimuli);
      // example usage: if(object.isPointInside(TIP_engine)){ take action }
    });

    // window.addEventListener('pointerup', e => {
    //   window.removeEventListener("pointermove", continued_stimuli);
    // })
    function continued_stimuli(e) {
      let circ = new Circle(TIP_engine.x, TIP_engine.y, 1, "white")
      let obj = {}
      obj.angle = (new LineOP(center, circ)).angle()
      obj.length = (new LineOP(center, circ)).hypotenuse()

      if(angler == 0 ){
        angler = obj.angle - .051
      }
      if((obj.angle-angler) > .05 && obj.angle-angler < .1){
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

  let pomaoimg = new Image()
  pomaoimg.src = "rcpomaolpl.png"

  let angle = 0
  let angle2 = 0
  let dis = 100
  let dis2 = 10
  let center = new Circle(250, 250, 50, "black")
  let dot = new Circle(0, 0, 3, "blue")
  let dot2 = new Circle(0, 0, 3, "#FF000001")
  let circs = []

  let obs = new Observer(350, 350, 1, "white", 300, 100)
  obs.obstacles.push(center)
  center.draw()
  let line = new Line(center.x, center.y, center.x+1000, center.y, "white", 1)
  line.draw()
  center = new Circle(250, 250, 50, "black")
  let x = 0
  let y = 0
  let count1 = 0
  let count2 = 0
  let set = []

  let pomarray = [
    {
      "angle": -3.127411769756162,
      "length": 1078.2106881571235
    },
    {
      "angle": -3.0771016485706926,
      "length": 1137.362238745729
    },
    {
      "angle": -3.026025692309955,
      "length": 1236.4692576027592
    },
    {
      "angle": -2.9754242903904986,
      "length": 1390.5597063995083
    },
    {
      "angle": -2.923605611542274,
      "length": 1512.8581265616813
    },
    {
      "angle": -2.8732902188991405,
      "length": 1637.7391706992057
    },
    {
      "angle": -2.8226734806080565,
      "length": 1761.2957837963477
    },
    {
      "angle": -2.7708868709479977,
      "length": 1863.2112421990023
    },
    {
      "angle": -2.7190537864313664,
      "length": 2004.2293023061939
    },
    {
      "angle": -2.6688362534694883,
      "length": 2154.1270884157275
    },
    {
      "angle": -2.6182969207826745,
      "length": 2287.240950775158
    },
    {
      "angle": -2.5675385296700437,
      "length": 2440.4244592238683
    },
    {
      "angle": -2.516987080578789,
      "length": 2577.3083098317147
    },
    {
      "angle": -2.466835229165751,
      "length": 2671.640319931612
    },
    {
      "angle": -2.415678887684283,
      "length": 2778.954873027804
    },
    {
      "angle": -2.3654655703689027,
      "length": 2914.4357440520544
    },
    {
      "angle": -2.312812617132903,
      "length": 2940.448842909478
    },
    {
      "angle": -2.262306403983799,
      "length": 3011.5182513953187
    },
    {
      "angle": -2.21168074641381,
      "length": 3077.1848588085268
    },
    {
      "angle": -2.1605035485316977,
      "length": 3156.406195073214
    },
    {
      "angle": -2.1101385928879868,
      "length": 3230.438608694123
    },
    {
      "angle": -2.0596951740595646,
      "length": 3156.3784642696846
    },
    {
      "angle": -2.008998479258629,
      "length": 3014.160182523774
    },
    {
      "angle": -1.9581116359601003,
      "length": 2910.4413125038263
    },
    {
      "angle": -1.907822248088823,
      "length": 2814.4010550380335
    },
    {
      "angle": -1.8572280340723162,
      "length": 2724.0925406814204
    },
    {
      "angle": -1.8046854953486573,
      "length": 2661.0140480520204
    },
    {
      "angle": -1.7522570600900247,
      "length": 2618.7597769380664
    },
    {
      "angle": -1.702185575801875,
      "length": 2595.269969892688
    },
    {
      "angle": -1.6502688764323794,
      "length": 2606.5227611828595
    },
    {
      "angle": -1.5979333040637673,
      "length": 2597.257766733237
    },
    {
      "angle": -1.547077178021175,
      "length": 2596.806259322213
    },
    {
      "angle": -1.4954779319774714,
      "length": 2592.3833317042445
    },
    {
      "angle": -1.4428715653422803,
      "length": 2576.587096083269
    },
    {
      "angle": -1.3922770487755614,
      "length": 2592.056842212798
    },
    {
      "angle": -1.3418484838705775,
      "length": 2682.9204552555457
    },
    {
      "angle": -1.2900902256443207,
      "length": 2787.5166116142645
    },
    {
      "angle": -1.2391826596302224,
      "length": 2878.710231921694
    },
    {
      "angle": -1.1882561308123871,
      "length": 3008.4931312371045
    },
    {
      "angle": -1.137647077924563,
      "length": 3143.019115247822
    },
    {
      "angle": -1.0871186861169617,
      "length": 3303.775696873723
    },
    {
      "angle": -1.0354736129359698,
      "length": 3341.7923977852333
    },
    {
      "angle": -0.98500579958961,
      "length": 3194.8506556631182
    },
    {
      "angle": -0.9344768144997845,
      "length": 3010.9234768354945
    },
    {
      "angle": -0.8835306545737108,
      "length": 2942.187966518468
    },
    {
      "angle": -0.8326929557933133,
      "length": 2869.0562328100787
    },
    {
      "angle": -0.7806171545948313,
      "length": 2715.5039824939013
    },
    {
      "angle": -0.7290408995220169,
      "length": 2523.4058318818134
    },
    {
      "angle": -0.678893382358401,
      "length": 2373.5357673991384
    },
    {
      "angle": -0.6275005156285277,
      "length": 2207.333249735879
    },
    {
      "angle": -0.5761336665583278,
      "length": 2086.4210784077877
    },
    {
      "angle": -0.5259071524748967,
      "length": 1961.487106382905
    },
    {
      "angle": -0.4756503922103153,
      "length": 1816.173159093887
    },
    {
      "angle": -0.4237145655085014,
      "length": 1520.767570226235
    },
    {
      "angle": -0.37367143586804413,
      "length": 1259.4550411224482
    },
    {
      "angle": -0.3228855600430013,
      "length": 1080.5778367042803
    },
    {
      "angle": -0.27274562968208443,
      "length": 790.2736423838796
    },
    {
      "angle": -0.2223266367011554,
      "length": 626.0660562157864
    },
    {
      "angle": -0.16678195444069532,
      "length": 602.081382322358
    },
    {
      "angle": -0.11463031287666091,
      "length": 629.0569596934365
    },
    {
      "angle": -0.06393412603678986,
      "length": 742.2322680235375
    },
    {
      "angle": -0.012316321942961833,
      "length": 866.3297502994683
    },
    {
      "angle": 0.037998607719853694,
      "length": 989.9905408323539
    },
    {
      "angle": 0.08961308750587366,
      "length": 1119.049391626162
    },
    {
      "angle": 0.14003339012531266,
      "length": 1261.3028378702002
    },
    {
      "angle": 0.19230789361857067,
      "length": 1354.3175487744884
    },
    {
      "angle": 0.2426860313199931,
      "length": 1477.1166109669866
    },
    {
      "angle": 0.29413406725269176,
      "length": 1561.757445623938
    },
    {
      "angle": 0.3461167379944047,
      "length": 1635.2928684855142
    },
    {
      "angle": 0.39686473189681215,
      "length": 1710.2917607021518
    },
    {
      "angle": 0.4489510974719858,
      "length": 1762.7953168845852
    },
    {
      "angle": 0.4997050871048781,
      "length": 1816.0090387452074
    },
    {
      "angle": 0.5502655464261379,
      "length": 1847.9508946466522
    },
    {
      "angle": 0.6018256113592149,
      "length": 1846.175576635651
    },
    {
      "angle": 0.6530985904099822,
      "length": 1838.9436341953697
    },
    {
      "angle": 0.7052430300619456,
      "length": 1787.5393160725507
    },
    {
      "angle": 0.755838722802763,
      "length": 1731.150548986232
    },
    {
      "angle": 0.8067134610556763,
      "length": 1674.9303730190295
    },
    {
      "angle": 0.8585169800022312,
      "length": 1614.154766007705
    },
    {
      "angle": 0.9098218547361074,
      "length": 1592.1713387132186
    },
    {
      "angle": 0.9610343863595476,
      "length": 1656.606947503169
    },
    {
      "angle": 1.0112517273086032,
      "length": 1775.2894670951791
    },
    {
      "angle": 1.0618212063041776,
      "length": 1989.0179855609458
    },
    {
      "angle": 1.1156849594624938,
      "length": 2177.1928731322405
    },
    {
      "angle": 1.1663399723699939,
      "length": 2287.4840961790323
    },
    {
      "angle": 1.2171561963039412,
      "length": 2336.2514293289423
    },
    {
      "angle": 1.269015616272444,
      "length": 2283.0395341634867
    },
    {
      "angle": 1.3191350047433268,
      "length": 1984.21725959779
    },
    {
      "angle": 1.3697494104368375,
      "length": 1602.3777513981331
    },
    {
      "angle": 1.4203838141409748,
      "length": 1625.0718342650362
    },
    {
      "angle": 1.4705347134049662,
      "length": 1759.384577236211
    },
    {
      "angle": 1.5214125243908168,
      "length": 1870.866188548811
    },
    {
      "angle": 1.5719649782657066,
      "length": 1888.7193907047185
    },
    {
      "angle": 1.6220326109467527,
      "length": 1879.5488488102128
    },
    {
      "angle": 1.6729343817691562,
      "length": 1787.640785990996
    },
    {
      "angle": 1.7239336401201633,
      "length": 1673.7574330568896
    },
    {
      "angle": 1.7748055420949795,
      "length": 1262.9886059475248
    },
    {
      "angle": 1.825907036654489,
      "length": 1022.7421966195834
    },
    {
      "angle": 1.8775152777933413,
      "length": 876.2208143568714
    },
    {
      "angle": 1.9307537790615477,
      "length": 760.9355929017183
    },
    {
      "angle": 1.9810647146032265,
      "length": 705.4544661141117
    },
    {
      "angle": 2.031527997422867,
      "length": 675.8722517276765
    },
    {
      "angle": 2.0822937216484987,
      "length": 660.7327858901699
    },
    {
      "angle": 2.137146431081851,
      "length": 654.3281609202386
    },
    {
      "angle": 2.189216866334204,
      "length": 641.1418626928935
    },
    {
      "angle": 2.23928039844635,
      "length": 621.0045892382623
    },
    {
      "angle": 2.298285787312431,
      "length": 589.6307377934572
    },
    {
      "angle": 2.3487216987116533,
      "length": 577.2089324999251
    },
    {
      "angle": 2.4024167760178923,
      "length": 569.482211899769
    },
    {
      "angle": 2.455083479386079,
      "length": 564.1930066061323
    },
    {
      "angle": 2.5051476974914655,
      "length": 565.628050510888
    },
    {
      "angle": 2.5559545982763705,
      "length": 572.1457435513148
    },
    {
      "angle": 2.6060134755709217,
      "length": 585.3972298885346
    },
    {
      "angle": 2.6574292201604655,
      "length": 591.4749930525431
    },
    {
      "angle": 2.70937294873381,
      "length": 596.2067954922677
    },
    {
      "angle": 2.761785973825037,
      "length": 609.0131305575487
    },
    {
      "angle": 2.81425298063536,
      "length": 639.1954037929536
    },
    {
      "angle": 2.864409950846538,
      "length": 678.0836799335666
    },
    {
      "angle": 2.915929902352013,
      "length": 699.534228346427
    },
    {
      "angle": 2.968969251151705,
      "length": 745.4786960005877
    },
    {
      "angle": 3.0204698923751563,
      "length": 816.3948018170195
    },
    {
      "angle": 3.0711543030881443,
      "length": 886.9942358779954
    },
    {
      "angle": 3.121601802791772,
      "length": 997.231482725183
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




  function pomaohitbox(center, point) {
    let link = new LineOP(center, point)
    let angle = link.angle()
    let dis = link.hypotenuse()
    if (angle > -1.09 && angle < -.87) {
      if (dis < 55.5) {
        return true
      }
    } else if (angle < -.71 && angle > -.87) {
      if (dis < 53) {
        return true
      }
    } else if (angle > -.71 && angle < -.51) {
      if (dis < 49) {
        return true
      }
    } else if (angle > -.71 && angle < -.51) {
      if (dis < 48) {
        return true
      }
    } else if (angle < -.33 && angle > -.51) {
      if (dis < 42) {
        return true
      }
    } else if (angle > -.33 && angle < -.08) {
      if (dis < 35) {
        return true
      }
    } else if (angle > .118 && angle < .28) {
      if (dis < 27) {
        return true
      }
    } else if (angle < .16 && angle > .04) {
      if (dis < 27) {
        return true
      }
    } else if (angle < .04 && angle > -.08) {
      if (dis < 28.5) {
        return true
      }
    } else if (angle < .26 && angle > .04) {
      if (dis < 29.5) {
        return true
      }
    } else if (angle > .26 && angle < .72) {
      if (dis < 24) {
        return true
      }
    } else if (angle < 1.21 && angle > .72) {
      if (dis < 25) {
        return true
      }
    } else if (angle > 1.21 && angle < 1.37) {
      if (dis < 27) {
        return true
      }
    } else if (angle > 1.37 && angle < 1.40) {
      if (dis < 32) {
        return true
      }
    } else if (angle < 1.43 && angle > 1.40) {
      if (dis < 39) {
        return true
      }
    } else if (angle < 1.53 && angle > 1.43) {
      if (dis < 39) {
        return true
      }
    } else if (angle < 1.53 && angle > 1.43) {
      if (dis < 41) {
        return true
      }
    } else if (angle < 1.57 && angle > 1.53) {
      if (dis < 45) {
        return true
      }
    } else if (angle < 1.63 && angle > 1.53) {
      if (dis < 44) {
        return true
      }
    } else if (angle < 1.71 && angle > 1.63) {
      if (dis < 42) {
        return true
      }
    } else if (angle < 1.81 && angle > 1.71) {
      if (dis < 34) {
        return true
      }
    } else if (angle < 1.83 && angle > 1.81) {
      if (dis < 39) {
        return true
      }
    }


  }

  let angles = []

  for (let t = 0; t < pomarray.length; t++) {
    angles.push(pomarray[t].angle)
  }
// console.log(angles)
  let increment = (Math.PI*2)/angles.length

  let zero = Math.PI


  for (let t = 0; t < pomarray.length; t++) {
    pomarray[t].angle = zero
    // pomarray[t].length = pomarray[t].length
    zero+=increment
  }
  // console.log(increment)
  // console.log(pomarray)


  let checkconstant = Math.floor(pomarray.length / 2)
  
  // function checkPomao(center, point) {
  //   let link = new LineOP(center, point)
  //   let angle = link.angle()
  //   let dis = link.hypotenuse()
  //   for(let t = 0;t<pomarray.length-1;t++){
  //       if (angle > pomarray[t].angle && angle < pomarray[t+1].angle) {
  //           if (dis < ((pomarray[t].length+pomarray[t+1].length)*.5) * (center.radius/50)) {
  //               return `rgb(${255-t*(255/pomarray.length)},${0+t*(255/pomarray.length)},${128})`
  //           }
  //       } 
  //   }
  //   return `rgb(${0},${0},${0})`
  // }

  
  function checkPomao(center, point) {
    let link = new LineOP(center, point)
    let angle = link.angle()+Math.PI
    let dis = link.hypotenuse()
    let t = Math.floor((angle)/increment)
    t%=pomarray.length-1
    angle-=Math.PI
    if(angle < 0){
      angle+=Math.PI
    }
        if (angle > (pomarray[t].angle%Math.PI) && angle < (pomarray[t+1].angle%Math.PI)) {
            if (dis < ((pomarray[t].length+pomarray[t+1].length)*.5) * ((center.radius)/50)) {
              return `rgb(${255-((255/pomarray.length)*t)},${255},${0+((255/pomarray.length)*t)}`
            }
        } 
    return "black"
  }

  // console.log("For 10000000 runs:")
  // console.time("Arbitrary shape using indexed angles")
  // for (let t = 0; t < 10000000; t++) {
  //   let circ = new Circle(Math.random()*500, Math.random()*500, .3, "red")
  //  checkPomao(center, circ)
  // }
  // console.timeEnd("Arbitrary shape using indexed angles")

  // // console.log("Circle using function distance")
  // console.time("Circle using function distance")
  // for (let t = 0; t < 10000000; t++) {
  //   let circ = new Circle(Math.random()*500, Math.random()*500, .3, "red")
  //   center.isPointInside(circ)
  // }
  // console.timeEnd("Circle using function distance")




  function main() {
    // canvas_context.drawImage(pomaoimg, 0, 0, pomaoimg.width, pomaoimg.height, center.x - center.radius, center.y - center.radius, center.radius * 2, center.radius * 2)
    // control(obs.body)
    // // obs.draw()
    // // canvas_context.drawImage(pomaoimg, 0,0, pomaoimg.width, pomaoimg.height, 100+center.x-center.radius, center.y-center.radius, center.radius*2, center.radius*2)

    // // angle += (Math.PI / 100)
    // // angle2 += (Math.PI / 123)
    // // // dis += Math.cos(angle)
    // // // dis += Math.cos(angle)
    // // // dis += Math.sin(angle)
    // // dis2 += Math.cos(angle2)
    // // dis2 += Math.sin(angle2)
    // // dot.x = center.x + (Math.cos(Math.cos(Math.cos(angle))) * dis)
    // // dot.y = center.y + ((Math.sin(Math.sin(Math.sin(angle)))) * dis)
    // // // control(center)
    // // // center.x+=2
    // // // dot.draw()
    // // dot2.x = dot.x + (Math.cos(angle2) * dis2)
    // // dot2.y = dot.y + (Math.sin(angle2) * dis2)
    // // // dot2.draw()

    // // let link = new LineOP(center, dot)
    // // let linkangle = link.angle()





    // // link.draw()

    // for (let t = 0; t < circs.length; t++) {
    //     // circs[t].draw()
    // }

    for (let t = 1000; t > 0; t--) {

        x += .5
        if (x > canvas.width) {
            x = 0
            y += .5
        }

        let circ = new Circle(x, y, .3, "white")
        circ.color = checkPomao(center, circ)
    //     // if (checkPomao(center, circ)) {
    //     //     circ.color = "yellow"
    //     //     // count1++
    //     // } else {
    //     //     circ.color = "black"
    //     // }

    //     // if(center.isPointInside(circ)){
    //     //     count2++
    //     // }
    //     // circs.push(circ)
        circ.draw()
    //     // if(circ.y> 1000){
    //     //     // console.log(count1,count2)
    //     // }
    }
    if (keysPressed['f']) {
        console.log(set)
    }
  }







})







