
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
        }, 1)
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

            // example usage: if(object.isPointInside(TIP_engine)){ take action }
            let circ = new Circle(TIP_engine.x, TIP_engine.y, 1, "white")
            circ.draw()
            let obj = {}
            obj.angle = (new LineOP(center, circ)).angle()
            obj.length = (new LineOP(center, circ)).hypotenuse()
            set.push(obj)
            window.addEventListener('pointermove', continued_stimuli);
        });
        window.addEventListener('pointerup', e => {
            window.removeEventListener("pointermove", continued_stimuli);
        })
        function continued_stimuli(e) {
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
    pomaoimg.src = "pomao.png"

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
    center = new Circle(250, 250, 200, "black")
    let x = 0
    let y = 0
    let count1 = 0
    let count2 = 0
    let set = []

    let pomarray = [
        {
            "angle": -1.0679663391047056,
            "length": 57.12705649475433
        },
        {
            "angle": -1.035519168903954,
            "length": 57.019794150573716
        },
        {
            "angle": -0.9958844112315666,
            "length": 56.52901441667835
        },
        {
            "angle": -0.942711158345535,
            "length": 55.90170162625488
        },
        {
            "angle": -0.9036761082701067,
            "length": 55.58504408601675
        },
        {
            "angle": -0.8553600011012132,
            "length": 54.97577943410592
        },
        {
            "angle": -0.7974133432449845,
            "length": 53.95025264959157
        },
        {
            "angle": -0.7357301478333739,
            "length": 53.093887728706434
        },
        {
            "angle": -0.6920808592232297,
            "length": 52.00249447122613
        },
        {
            "angle": -0.657882743812684,
            "length": 51.59205408709363
        },
        {
            "angle": -0.6245209169538418,
            "length": 50.64402182423419
        },
        {
            "angle": -0.5837949969909209,
            "length": 49.433390789538954
        },
        {
            "angle": -0.5576428057414629,
            "length": 48.610302885227725
        },
        {
            "angle": -0.5073924394792875,
            "length": 47.391162477417126
        },
        {
            "angle": -0.47045239488846974,
            "length": 46.468776665535124
        },
        {
            "angle": -0.44256582374115516,
            "length": 45.38420874674552
        },
        {
            "angle": -0.4046710766361241,
            "length": 43.31059725057743
        },
        {
            "angle": -0.3056523880806368,
            "length": 40.87361409556873
        },
        {
            "angle": -0.26184514002817805,
            "length": 39.02283627939628
        },
        {
            "angle": -0.20975568431980016,
            "length": 37.851767260469536
        },
        {
            "angle": -0.15934909069569755,
            "length": 36.50017919272136
        },
        {
            "angle": -0.11595165041471968,
            "length": 35.22742260414086
        },
        {
            "angle": -0.07000028771525987,
            "length": 34.04952871948161
        },
        {
            "angle": -0.0200596814427396,
            "length": 32.06893664770802
        },
        {
            "angle": 0.01900104704233982,
            "length": 30.70083918671588
        },
        {
            "angle": 0.059282795755874404,
            "length": 29.580605302762805
        },
        {
            "angle": 0.10189516206114842,
            "length": 28.737588247938092
        },
        {
            "angle": 0.1463580221085145,
            "length": 28.356541563814556
        },
        {
            "angle": 0.19570020371329094,
            "length": 27.119205330548965
        },
        {
            "angle": 0.26017408978136786,
            "length": 26.664303577300707
        },
        {
            "angle": 0.31258810203479365,
            "length": 25.616330109342098
        },
        {
            "angle": 0.3867033509698719,
            "length": 25.16557338005537
        },
        {
            "angle": 0.45366600612849983,
            "length": 24.56127215340277
        },
        {
            "angle": 0.5249404647670594,
            "length": 24.079440086272868
        },
        {
            "angle": 0.6080875268757552,
            "length": 23.735169927365657
        },
        {
            "angle": 0.7290326302073745,
            "length": 23.56712406088265
        },
        {
            "angle": 0.8191002695183289,
            "length": 24.23675597094827
        },
        {
            "angle": 0.9265649272715234,
            "length": 24.604929046557633
        },
        {
            "angle": 1.006421567626255,
            "length": 25.282734591430255
        },
        {
            "angle": 1.0784644631728766,
            "length": 25.968266713050085
        },
        {
            "angle": 1.1177100929614256,
            "length": 26.631063622775365
        },
        {
            "angle": 1.194748190697128,
            "length": 27.06293052461558
        },
        {
            "angle": 1.2591503136389355,
            "length": 27.546964920885102
        },
        {
            "angle": 1.3191442622046936,
            "length": 28.770774118924837
        },
        {
            "angle": 1.387987044000915,
            "length": 36.67887294589298
        },
        {
            "angle": 1.3962835403295961,
            "length": 38.40359992467503
        },
        {
            "angle": 1.4030809996935747,
            "length": 39.944567624781854
        },
        {
            "angle": 1.4200877190797834,
            "length": 41.73213058055544
        },
        {
            "angle": 1.4595228161774394,
            "length": 43.15096187335373
        },
        {
            "angle": 1.5034218027362527,
            "length": 44.13527531631973
        },
        {
            "angle": 1.5542323094932824,
            "length": 44.57250545633784
        },
        {
            "angle": 1.5932019076704873,
            "length": 44.57757971973746
        },
        {
            "angle": 1.6320568514858038,
            "length": 44.23792096984967
        },
        {
            "angle": 1.6652468345362998,
            "length": 42.57909348035219
        },
        {
            "angle": 1.7018302787233168,
            "length": 40.86857184550108
        },
        {
            "angle": 1.7370728762816714,
            "length": 38.34393836779076
        },
        {
            "angle": 1.790966938513344,
            "length": 35.27735417390439
        },
        {
            "angle": 1.8309084197688568,
            "length": 35.72787597112123
        },
        {
            "angle": 1.845215325336684,
            "length": 38.386827939831235
        },
        {
            "angle": 1.8316322525870294,
            "length": 40.66992113456907
        },
        {
            "angle": 1.8261988859270082,
            "length": 42.840163701823585
        },
        {
            "angle": 1.849323984558791,
            "length": 44.79670460233012
        },
        {
            "angle": 1.8758840307035014,
            "length": 46.408736804020045
        },
        {
            "angle": 1.9203996658312208,
            "length": 47.85994077007871
        },
        {
            "angle": 1.9790937911554833,
            "length": 47.797513780102754
        },
        {
            "angle": 2.014474978602755,
            "length": 46.92193557456806
        },
        {
            "angle": 2.0544492146252837,
            "length": 45.99416516508045
        },
        {
            "angle": 2.0938836088062014,
            "length": 44.83663362903282
        },
        {
            "angle": 2.1114933615299103,
            "length": 43.51464050719887
        },
        {
            "angle": 2.132764990690985,
            "length": 42.0349465542161
        },
        {
            "angle": 2.1542913931492134,
            "length": 40.215089369728844
        },
        {
            "angle": 2.198068218855361,
            "length": 39.426026397410475
        },
        {
            "angle": 2.2906578271136055,
            "length": 39.44880236792358
        },
        {
            "angle": 2.350633964427519,
            "length": 40.89588793500077
        },
        {
            "angle": 2.4233869175173375,
            "length": 41.632780301947676
        },
        {
            "angle": 2.4663916658360647,
            "length": 41.952586340612314
        },
        {
            "angle": 2.507085591822042,
            "length": 42.59364779867538
        },
        {
            "angle": 2.5649670102259767,
            "length": 42.633055323246445
        },
        {
            "angle": 2.61415953400457,
            "length": 42.40615084180895
        },
        {
            "angle": 2.652630747204031,
            "length": 41.869812111048965
        },
        {
            "angle": 2.6965667691295576,
            "length": 41.874139131488924
        },
        {
            "angle": 2.7282191174965966,
            "length": 41.62307782329136
        },
        {
            "angle": 2.7495935482764597,
            "length": 41.151403164256045
        },
        {
            "angle": 2.771691839333203,
            "length": 40.788774880768294
        },
        {
            "angle": 2.804166405361469,
            "length": 40.29434442449026
        },
        {
            "angle": 2.850475831893571,
            "length": 39.322521558894294
        },
        {
            "angle": 2.8920689236757395,
            "length": 38.697148150540826
        },
        {
            "angle": 2.9403396805895103,
            "length": 37.59737911942761
        },
        {
            "angle": 2.98472234795564,
            "length": 36.77184687938973
        },
        {
            "angle": 3.034570421746232,
            "length": 35.764529720894664
        },
        {
            "angle": 3.103779391292977,
            "length": 33.581301883877664
        },
        {
            "angle": 3.13887037280022,
            "length": 31.562632211094613
        },
        {
            "angle": -3.107839032841043,
            "length": 29.825597650560944
        },
        {
            "angle": -3.0737250819210993,
            "length": 28.339991812336468
        },
        {
            "angle": -3.031087266963155,
            "length": 26.424205698544657
        },
        {
            "angle": -2.948404242866869,
            "length": 24.761431313098644
        },
        {
            "angle": -2.887309747425591,
            "length": 27.32529896851487
        },
        {
            "angle": -2.8781576064846286,
            "length": 29.22706405435108
        },
        {
            "angle": -2.837706778333616,
            "length": 31.6698484332365
        },
        {
            "angle": -2.8007632831567153,
            "length": 33.281637180572616
        },
        {
            "angle": -2.7698992566113834,
            "length": 33.88274442567228
        },
        {
            "angle": -2.768024507138647,
            "length": 35.54387433123149
        },
        {
            "angle": -2.7504007112718245,
            "length": 38.0390236579903
        },
        {
            "angle": -2.7083714506567675,
            "length": 40.36865674161296
        },
        {
            "angle": -2.677720376311294,
            "length": 41.520428742178964
        },
        {
            "angle": -2.640991001604003,
            "length": 42.82374825100233
        },
        {
            "angle": -2.6059790717658275,
            "length": 44.74402288718847
        },
        {
            "angle": -2.577545854301866,
            "length": 45.53063497722368
        },
        {
            "angle": -2.549959551043718,
            "length": 46.35715513019028
        },
        {
            "angle": -2.5086397123945785,
            "length": 47.72246687955465
        },
        {
            "angle": -2.4630686508057877,
            "length": 48.64625633554459
        },
        {
            "angle": -2.419969925642641,
            "length": 49.65275332886978
        },
        {
            "angle": -2.3851808777115235,
            "length": 50.76546200032748
        },
        {
            "angle": -2.3426606844314923,
            "length": 51.84084504721466
        },
        {
            "angle": -2.2977798789825163,
            "length": 52.89491012084011
        },
        {
            "angle": -2.257780397307508,
            "length": 53.8154739841023
        },
        {
            "angle": -2.22896083389497,
            "length": 54.82597161903154
        },
        {
            "angle": -2.18442514073037,
            "length": 55.85384035460031
        },
        {
            "angle": -2.1378505187569905,
            "length": 56.53152991153684
        },
        {
            "angle": -2.104643018344297,
            "length": 57.34967115728302
        },
        {
            "angle": -2.0725142665113845,
            "length": 57.23474457304784
        },
        {
            "angle": -2.038817175301153,
            "length": 56.323841396159175
        },
        {
            "angle": -2.0022706801611427,
            "length": 55.338723085832775
        },
        {
            "angle": -1.9668356905493678,
            "length": 54.48422847205905
        },
        {
            "angle": -1.9304072132033185,
            "length": 53.88011365218563
        },
        {
            "angle": -1.8969553849661926,
            "length": 53.24044570593064
        },
        {
            "angle": -1.8460245975653609,
            "length": 52.40600401742026
        },
        {
            "angle": -1.7993500506345261,
            "length": 51.780146805709734
        },
        {
            "angle": -1.7491658794235352,
            "length": 51.24667422635243
        },
        {
            "angle": -1.7110275827722212,
            "length": 50.845489109059486
        },
        {
            "angle": -1.668298268502801,
            "length": 50.58663827169775
        },
        {
            "angle": -1.607457228510026,
            "length": 50.552217345920376
        },
        {
            "angle": -1.552653261230804,
            "length": 50.52656521926384
        },
        {
            "angle": -1.5216069175652878,
            "length": 50.579428115648845
        },
        {
            "angle": -1.4732891949870972,
            "length": 50.59712011441214
        },
        {
            "angle": -1.4417451232146956,
            "length": 51.03376439483953
        },
        {
            "angle": -1.399578137798293,
            "length": 51.27845263815049
        },
        {
            "angle": -1.3577224816995244,
            "length": 51.69777419217967
        },
        {
            "angle": -1.3175644913340354,
            "length": 52.268536688281756
        },
        {
            "angle": -1.27422351251897,
            "length": 53.091220090430625
        },
        {
            "angle": -1.2312209715564773,
            "length": 53.848401423273884
        },
        {
            "angle": -1.2075313645348478,
            "length": 54.318165220269265
        },
        {
            "angle": -1.1938063135948604,
            "length": 54.87428640535591
        },
        {
            "angle": -1.155771698574184,
            "length": 55.578988182444355
        },
        {
            "angle": -1.118673480692207,
            "length": 56.541923039324764
        },
        {
            "angle": -1.0679663391047056,
            "length": 57.12705649475433
        }
    ]

    let pomarray2 = []
    for(let t = 0;t<pomarray.length-1;t++){
        let obj = {}
        obj.angle = (pomarray[t].angle+ pomarray[t+1].angle)*.5
        obj.length = (pomarray[t].length+ pomarray[t+1].length)*.5
        pomarray2.push(pomarray[t])
        pomarray2.push(obj)
    }



    let pomarray3 = []
    for(let t = 0;t<pomarray2.length-1;t++){
        let obj = {}
        obj.angle = (pomarray2[t].angle+ pomarray2[t+1].angle)*.5
        obj.length = (pomarray2[t].length+ pomarray2[t+1].length)*.5
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

    function checkPomao(center, point){
        let link = new LineOP(center, point)
        let angle = link.angle()
        let dis = link.hypotenuse()
        for(let t = 0;t<pomarray.length-1;t++){
            if (angle > pomarray[t].angle && angle < pomarray[t+1].angle) {
                if (dis < ((pomarray[t].length+pomarray[t+1].length)*.5) * (center.radius/50)) {
                    return true
                }
            } 
        }
    }



    function main() {
        // canvas_context.drawImage(pomaoimg, 0, 0, pomaoimg.width, pomaoimg.height, center.x - center.radius, center.y - center.radius, center.radius * 2, center.radius * 2)
        control(obs.body)
        // obs.draw()
        // canvas_context.drawImage(pomaoimg, 0,0, pomaoimg.width, pomaoimg.height, 100+center.x-center.radius, center.y-center.radius, center.radius*2, center.radius*2)

        angle += (Math.PI / 100)
        angle2 += (Math.PI / 123)
        // dis += Math.cos(angle)
        // dis += Math.cos(angle)
        // dis += Math.sin(angle)
        dis2 += Math.cos(angle2)
        dis2 += Math.sin(angle2)
        dot.x = center.x + (Math.cos(Math.cos(Math.cos(angle))) * dis)
        dot.y = center.y + ((Math.sin(Math.sin(Math.sin(angle)))) * dis)
        // control(center)
        // center.x+=2
        // dot.draw()
        dot2.x = dot.x + (Math.cos(angle2) * dis2)
        dot2.y = dot.y + (Math.sin(angle2) * dis2)
        // dot2.draw()

        let link = new LineOP(center, dot)
        let linkangle = link.angle()





        // link.draw()

        // for (let t = 0; t < circs.length; t++) {
        //     // circs[t].draw()
        // }

        for (let t = 2000; t > 0; t--) {

            x += 2
            if (x > canvas.width) {
                x = 0
                y += 2
            }

            let circ = new Circle(x, y, 3, "white")
            if (checkPomao(center, circ)) {
                circ.color = "yellow"
                // count1++
            } else {
                circ.color = "black"
            }

            // if(center.isPointInside(circ)){
            //     count2++
            // }
            // circs.push(circ)
            circ.draw()
            // if(circ.y> 1000){
            //     // console.log(count1,count2)
            // }
        }
        if (keysPressed['f']) {
            console.log(set)
        }
    }







})







