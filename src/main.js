import { Game } from './Game.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);

game.init().then(() => {
    game.start();
}).catch(error => {
    console.error('Failed to start game:', error);
});
