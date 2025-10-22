/**
 * Tornado Module for Simulating Tornado Dynamics
 * 
 * This module provides comprehensive functionality for generating, 
 * tracking, and simulating tornado behavior in a game or simulation environment.
 * 
 * @module TornadoSystem
 */
class TornadoSystem {
    /**
     * Creates a new tornado instance with configurable properties
     * 
     * @constructor
     * @param {Object} config - Configuration parameters for the tornado
     * @param {number} config.x - Initial x-coordinate of tornado
     * @param {number} config.y - Initial y-coordinate of tornado
     * @param {number} [config.intensity=1] - Strength of the tornado (1-10 scale)
     * @param {number} [config.radius=50] - Radius of tornado's destructive area
     * @param {number} [config.duration=30] - Total lifetime of tornado in seconds
     */
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.intensity = config.intensity || 1;
        this.radius = config.radius || 50;
        this.duration = config.duration || 30;
        this.active = true;
        this.elapsedTime = 0;
    }

    /**
     * Updates tornado's position and state each game tick
     * 
     * @method update
     * @param {number} deltaTime - Time elapsed since last update
     */
    update(deltaTime) {
        // Implement tornado movement and decay logic
        this.elapsedTime += deltaTime;
        
        if (this.elapsedTime >= this.duration) {
            this.active = false;
        }
    }

    /**
     * Determines destructive impact on objects within tornado's radius
     * 
     * @method checkCollisions
     * @param {Array} gameObjects - List of objects in the game world
     * @returns {Array} Affected objects
     */
    checkCollisions(gameObjects) {
        return gameObjects.filter(obj => {
            const distance = Math.sqrt(
                Math.pow(obj.x - this.x, 2) + 
                Math.pow(obj.y - this.y, 2)
            );
            return distance <= this.radius;
        });
    }

    /**
     * Generates a random tornado with procedural characteristics
     * 
     * @static
     * @method generateRandom
     * @param {Object} worldBounds - Boundaries of game world
     * @returns {TornadoSystem} Randomly generated tornado
     */
    static generateRandom(worldBounds) {
        return new TornadoSystem({
            x: Math.random() * worldBounds.width,
            y: Math.random() * worldBounds.height,
            intensity: Math.random() * 10,
            radius: 50 + Math.random() * 100,
            duration: 15 + Math.random() * 45
        });
    }
}

// Tornado management system
class TornadoManager {
    constructor() {
        this.tornadoes = [];
    }

    /**
     * Spawns a new tornado in the game world
     * 
     * @method spawnTornado
     * @param {Object} config - Tornado configuration
     */
    spawnTornado(config) {
        const tornado = new TornadoSystem(config);
        this.tornadoes.push(tornado);
    }

    /**
     * Updates all active tornadoes
     * 
     * @method updateTornadoes
     * @param {number} deltaTime - Time elapsed since last update
     */
    updateTornadoes(deltaTime) {
        this.tornadoes = this.tornadoes.filter(tornado => {
            tornado.update(deltaTime);
            return tornado.active;
        });
    }
}

// Export modules for use in game systems
module.exports = {
    TornadoSystem,
    TornadoManager
};

class Tornado {
  constructor({
    x = 0, 
    y = 0, 
    radius = 100, 
    windSpeed = 100, 
    rotationSpeed = 10, 
    pressureDrop = 50, 
    funnelHeight = 1000, 
    debrisFieldRadius = 200, 
    intensity = 1, 
    direction = 0, 
    speed = 10
  } = {}) {
    this.x = x; // X-coordinate of the tornado's center
    this.y = y; // Y-coordinate of the tornado's center
    this.radius = radius; // Radius of the tornado's base
    this.windSpeed = windSpeed; // Maximum wind speed in m/s
    this.rotationSpeed = rotationSpeed; // Angular velocity in degrees per second
    this.pressureDrop = pressureDrop; // Pressure drop in hPa
    this.funnelHeight = funnelHeight; // Height of the tornado funnel in meters
    this.debrisFieldRadius = debrisFieldRadius; // Radius of the debris field
    this.intensity = intensity; // Tornado intensity (e.g., EF scale)
    this.direction = direction; // Direction of movement in degrees
    this.speed = speed; // Speed of movement in m/s
    this.debris = []; // Array to hold debris objects
  }

  // Update the tornado's position based on its speed and direction
  move() {
    const rad = (this.direction * Math.PI) / 180;
    this.x += Math.cos(rad) * this.speed;
    this.y += Math.sin(rad) * this.speed;
  }

  // Simulate the rotation of the tornado
  rotate() {
    // Logic to simulate rotation of the tornado
    console.log(`Tornado rotating at ${this.rotationSpeed} degrees per second.`);
  }

  // Add debris to the tornado
  addDebris(debris) {
    this.debris.push(debris);
  }

  // Remove debris from the tornado
  removeDebris(debris) {
    const index = this.debris.indexOf(debris);
    if (index > -1) {
      this.debris.splice(index, 1);
    }
  }

  // Calculate the wind force at a given distance from the center
  calculateWindForce(distance) {
    if (distance > this.radius) return 0;
    return this.windSpeed * (1 - distance / this.radius);
  }

  // Render the tornado (placeholder for graphical representation)
  render(context) {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    context.fillStyle = 'rgba(128, 128, 128, 0.5)';
    context.fill();
    context.stroke();
  }

  // Check if a point is inside the tornado
  isPointInside(px, py) {
    const dx = px - this.x;
    const dy = py - this.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius;
  }

  // Simulate the effect of the tornado on an object
  affectObject(object) {
    const distance = Math.sqrt(
      Math.pow(object.x - this.x, 2) + Math.pow(object.y - this.y, 2)
    );
    if (distance <= this.radius) {
      const force = this.calculateWindForce(distance);
      object.vx += Math.cos(this.direction) * force;
      object.vy += Math.sin(this.direction) * force;
    }
  }

  // Update the tornado's state
  update() {
    this.move();
    this.rotate();
    console.log(`Tornado updated: Position (${this.x}, ${this.y})`);
  }
}

export default Tornado;
