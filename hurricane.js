/**
 * Hurricane Module for Climate Simulator
 * 
 * This module represents a comprehensive hurricane simulation model that captures
 * the key characteristics and behaviors of tropical cyclones.
 * 
 * @module Hurricane
 * @description Simulates hurricane formation, movement, intensity, and impact
 */

import { Supercell } from './supercell.js';

class Hurricane {
    /**
     * Creates a new Hurricane instance
     * 
     * @constructor
     * @param {Object} config - Configuration parameters for the hurricane
     */
    constructor(config = {}) {
        this.type = config.type || this.randomHurricaneType();
        this.windSpeed = config.windSpeed || this.randomWindSpeed(this.type);
        this.pressureCenter = config.pressureCenter || this.randomPressure(this.type);
        this.intensity = config.intensity || this.calculateIntensity();
        this.location = config.location || { x: 0, y: 0 };
        this.layers = { low: [], mid: [], high: [] };
        this.eye = { x: this.location.x, y: this.location.y, windSpeed: 0 };
        this.supercells = this.generateSupercells();
        this.rainfall = config.rainfall || this.randomRainfall();
        this.shear = config.shear || Math.random() * 10; // Atmospheric shear
    }

    /**
     * Randomly generates a hurricane type
     * 
     * @method randomHurricaneType
     * @returns {string} Hurricane type
     */
    randomHurricaneType() {
        const types = [
            'Tropical Depression',
            'Tropical Storm',
            'Category 1',
            'Category 2',
            'Category 3',
            'Category 4',
            'Category 5',
            'Post-Tropical'
        ];
        return types[Math.floor(Math.random() * types.length)];
    }

    /**
     * Randomly generates wind speed based on hurricane type
     * 
     * @method randomWindSpeed
     * @param {string} type - Hurricane type
     * @returns {number} Wind speed in mph
     */
    randomWindSpeed(type) {
        const windRanges = {
            'Tropical Depression': [20, 38],
            'Tropical Storm': [39, 73],
            'Category 1': [74, 95],
            'Category 2': [96, 110],
            'Category 3': [111, 129],
            'Category 4': [130, 156],
            'Category 5': [157, 200],
            'Post-Tropical': [10, 30]
        };
        const [min, max] = windRanges[type];
        return Math.random() * (max - min) + min;
    }

    /**
     * Randomly generates central pressure based on hurricane type
     * 
     * @method randomPressure
     * @param {string} type - Hurricane type
     * @returns {number} Pressure in millibars
     */
    randomPressure(type) {
        const pressureRanges = {
            'Tropical Depression': [1005, 1010],
            'Tropical Storm': [995, 1005],
            'Category 1': [980, 995],
            'Category 2': [965, 980],
            'Category 3': [945, 965],
            'Category 4': [920, 945],
            'Category 5': [890, 920],
            'Post-Tropical': [1010, 1020]
        };
        const [min, max] = pressureRanges[type];
        return Math.random() * (max - min) + min;
    }

    /**
     * Calculates hurricane intensity based on wind speed and pressure
     * 
     * @method calculateIntensity
     * @returns {number} Intensity value
     */
    calculateIntensity() {
        return this.windSpeed / this.pressureCenter * 100;
    }

    /**
     * Randomly generates rainfall amount
     * 
     * @method randomRainfall
     * @returns {number} Rainfall in mm/hour
     */
    randomRainfall() {
        return Math.random() * 200; // Up to 200 mm/hour
    }

    /**
     * Generates supercells spinning around the hurricane's eye
     * 
     * @method generateSupercells
     * @returns {Supercell[]} Array of supercells
     */
    generateSupercells() {
        const supercells = [];
        const numSupercells = Math.floor(Math.random() * 10) + 5; // 5–15 supercells
        for (let i = 0; i < numSupercells; i++) {
            const angle = (i / numSupercells) * 2 * Math.PI;
            const distance = Math.random() * 50 + 50; // 50–100 units from the eye
            const x = this.eye.x + Math.cos(angle) * distance;
            const y = this.eye.y + Math.sin(angle) * distance;
            supercells.push(new Supercell({ initialState: { x, y } }));
        }
        return supercells;
    }

    /**
     * Updates hurricane state over time
     * 
     * @method evolve
     * @param {Object} environmentalConditions - Atmospheric and oceanic parameters
     */
    evolve(environmentalConditions) {
        // Update wind speed, pressure, and supercell dynamics
        this.windSpeed += environmentalConditions.windChange || 0;
        this.pressureCenter += environmentalConditions.pressureChange || 0;
        this.supercells.forEach(supercell => supercell.updateState());
    }

    /**
     * Renders the hurricane layers and supercells
     * 
     * @method render
     * @param {Object} context - Rendering context
     */
    render(context) {
        // Render low, mid, and high layers
        context.fillStyle = 'rgba(0, 0, 255, 0.3)';
        context.beginPath();
        context.arc(this.eye.x, this.eye.y, 200, 0, 2 * Math.PI); // Low layer
        context.fill();

        context.fillStyle = 'rgba(0, 0, 255, 0.2)';
        context.beginPath();
        context.arc(this.eye.x, this.eye.y, 150, 0, 2 * Math.PI); // Mid layer
        context.fill();

        context.fillStyle = 'rgba(0, 0, 255, 0.1)';
        context.beginPath();
        context.arc(this.eye.x, this.eye.y, 100, 0, 2 * Math.PI); // High layer
        context.fill();

        // Render supercells
        this.supercells.forEach(supercell => {
            context.fillStyle = 'rgba(255, 0, 0, 0.5)';
            context.beginPath();
            context.arc(supercell.state.x, supercell.state.y, 10, 0, 2 * Math.PI);
            context.fill();
        });
    }
}

// Export the Hurricane class for use in other modules
export default Hurricane;
