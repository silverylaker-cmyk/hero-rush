import Phaser from 'phaser';
import './style.css';
class Welcome extends Phaser.Scene {
  create() { this.add.text(960, 540, 'HERO RUSH', { fontSize: '100px', color: '#f1cd82' }).setOrigin(0.5); }
}
new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 1920, height: 1080, backgroundColor: '#101c20', scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: [Welcome] });
if (import.meta.env.PROD && 'serviceWorker' in navigator) window.addEventListener('load', () => { void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`); });
