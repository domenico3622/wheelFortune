import {
  AfterViewInit,
  Component,
  DoCheck,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DataService } from '../service/data.service';

//const COLORS = ['#f82', '#0bf', '#fb0', '#0fb', '#b0f', '#f0b', '#bf0'];
const COLORS = ['#2b1d6b', '#4e06c2', '#7f14c7'];  

@Component({
  selector: 'app-wheel',
  templateUrl: './wheel.component.html',
  styleUrl: './wheel.component.css'
})
export class WheelComponent implements OnInit, AfterViewInit, DoCheck {
  @Input() set options(values: string[]) {
    console.log('Values', values);
    this.sectors = values.map((opts, i) => {
      return {
        color: COLORS[(i >= COLORS.length ? i + 1 : i) % COLORS.length],
        label: opts,
      };
    });
    console.log(this.sectors);
    if (this.wheel) {
      this.createWheel();
    }
  }
  @ViewChild('wheel') wheel: ElementRef<HTMLCanvasElement>;
  @ViewChild('spin') spin: ElementRef;
  @ViewChild('wheelSound') wheelSound: ElementRef<HTMLAudioElement>;
  @ViewChild('winFineSound') winFineSound: ElementRef<HTMLAudioElement>;
  currentOptionIndex: number;

  sectors: any[] = [];

  // Aggiungi questa variabile -----------
  destinationIndex: number;

  rand = (m, M) => Math.random() * (M - m) + m;
  tot;
  ctx: CanvasRenderingContext2D;
  dia;
  rad;
  PI;
  TAU;
  arc0;

  friction = 0.995; // 0.995=soft, 0.99=mid, 0.98=hard
  angVel = 0; // Angular velocity
  ang = 0; // Angle in radians
  lastSelection;

  constructor(private dataService: DataService) {}
  ngDoCheck(): void {
    this.engine();
  }

  ngOnInit() {
    // Initial rotation
    // Start engine
  }
  ngAfterViewInit(): void {
    this.createWheel();
  }

  createWheel() {
    this.ctx = this.wheel.nativeElement.getContext('2d');
    this.dia = this.ctx.canvas.width;
    this.tot = this.sectors.length;
    this.rad = this.dia / 2;
    this.PI = Math.PI;
    this.TAU = 2 * this.PI;

    this.arc0 = this.TAU / this.sectors.length;
    this.sectors.forEach((sector, i) => this.drawSector(sector, i));
    this.rotate(true);
  }

  spinner() {
    this.destinationIndex = 3;

    if (!this.angVel) this.angVel = this.rand(0.25, 0.35);
  }

  getIndex = () =>
    Math.floor(this.tot - (this.ang / this.TAU) * this.tot) % this.tot;

  drawSector(sector, i) {
    const ang = this.arc0 * i;
    this.ctx.save();
    this.ctx.beginPath();
    //pattern mio modificato
    this.ctx.fillStyle = COLORS[i % COLORS.length];
    this.ctx.moveTo(this.rad, this.rad);

    this.ctx.arc(this.rad, this.rad, this.rad, ang, ang + this.arc0);
    this.ctx.lineTo(this.rad, this.rad);
    this.ctx.fill();
    // TEXT
    this.ctx.translate(this.rad, this.rad);
    this.ctx.rotate(ang + this.arc0 / 2);
    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 22px Playfair Display';
    this.ctx.fillText(sector.label, this.rad - 10, 10);
    this.ctx.restore();
  }

  rotate(first = false) {
    let index = this.getIndex();
    if (this.currentOptionIndex !== index) {
      this.currentOptionIndex = index;
      this.playWheelSound();
    }
    const sector = this.sectors[index];
    //this.spin.nativeElement.style.background = sector.color;
    this.spin.nativeElement.style.background = COLORS[index % COLORS.length];
    
    this.ctx.canvas.style.transform = `rotate(${this.ang - this.PI / 2}rad)`;
    this.spin.nativeElement.textContent = !this.angVel ? 'spin' : sector.label;
  }

  frame() {
    if (!this.angVel) return;
    // Modifica: ferma la ruota quando raggiunge la destinazione
    if (this.getIndex() == this.destinationIndex && Math.abs(this.angVel) < 0.0027) {
      this.winFineSound.nativeElement.play();
      this.angVel = 0;
      this.ang += 0.09;
    }

    if (this.angVel >= 0.0028) {
      this.angVel *= this.friction; // Decrement velocity by friction 
    }
    else {  //verso la fine la decremento di meno altrimenti ci metterebbe anni
      this.angVel *= 0.9996;
    }
    this.ang += this.angVel; // Update angle
    this.ang %= this.TAU; // Normalize angle
    this.rotate();
  }

  engine() {
    requestAnimationFrame(this.frame.bind(this));
  }

  playWheelSound() {
    if (this.wheelSound && this.wheelSound.nativeElement.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
      //this.wheelSound.nativeElement.currentTime = 0; // Riavvolgi l'audio
      this.wheelSound.nativeElement.play();
    }
  }
}
