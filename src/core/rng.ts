export class Rng {
  constructor(public state:number) { this.state = state >>> 0; }
  next():number { let t = this.state = (this.state + 0x6D2B79F5) >>> 0; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
}
