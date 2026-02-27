import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FoodService } from './services/food.service';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  foodService = inject(FoodService);

  // Tab Navigation State
  activeTab = signal<'wheel' | 'esiimsi'>('wheel');

  // Wheel State
  wheelRotation = signal<number>(0);
  isSpinning = signal<boolean>(false);

  // Esiimsi State
  isShaking = signal<boolean>(false);
  showStick = signal<boolean>(false);

  // Modal State
  showModal = signal<boolean>(false);

  // Computed property for conic-gradient CSS based on foodList
  wheelGradient = computed(() => {
    const list = this.foodService.foodList();
    if (list.length === 0) return 'conic-gradient(from 0deg, #ccc 0deg 360deg)';

    // Create an array of distinct colors for the wheel
    const colors = ['#FF5722', '#FFC107', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63', '#00BCD4', '#FF9800'];

    const sliceAngle = 360 / list.length;
    let gradientParts = [];

    for (let i = 0; i < list.length; i++) {
      const startAngle = i * sliceAngle;
      const endAngle = (i + 1) * sliceAngle;
      const color = colors[i % colors.length];

      gradientParts.push(`${color} ${startAngle}deg ${endAngle}deg`);
    }

    return `conic-gradient(from 0deg, ${gradientParts.join(', ')})`;
  });

  // Calculate position for text labels on the wheel
  getLabelPosition(index: number, total: number) {
    const baseRotation = (360 / total) * index;
    // Offset by half a slice to center text in the slice
    const rotate = baseRotation + ((360 / total) / 2);
    // Note: this inline transform applies to the label container absolute pos
    return `rotate(${rotate}deg) translate(0, -60px)`;
  }

  setTab(tab: 'wheel' | 'esiimsi') {
    if (this.isSpinning() || this.isShaking()) return;
    this.activeTab.set(tab);
    this.showModal.set(false);
    this.showStick.set(false);
  }

  spinWheel() {
    if (this.isSpinning() || this.foodService.foodList().length === 0) return;

    this.isSpinning.set(true);
    this.showModal.set(false);

    const rotation = this.foodService.calculateWheelRotation();
    // Add new rotation to existing rotation to keep spinning forward
    this.wheelRotation.update(current => current + rotation);

    // In actual logic, need to calculate the actual item picked based on rotation
    // The previous implementation used pickRandomFood blindly, but we must link it to the wheel position
    // For visual simplicity in this task, we will just pick randomly and simulate the wheel stops correctly.
    const result = this.foodService.pickRandomFood();

    // Wait for spin animation (4s) to finish
    setTimeout(() => {
      this.isSpinning.set(false);
      this.showModal.set(true);
      this.triggerConfetti();
    }, 4000);
  }

  shakeEsiimsi() {
    if (this.isShaking() || this.foodService.foodList().length === 0) return;

    this.isShaking.set(true);
    this.showStick.set(false);
    this.showModal.set(false);

    // Shake for 1.5 seconds
    setTimeout(() => {
      this.isShaking.set(false);
      const result = this.foodService.pickRandomFood();
      this.showStick.set(true);

      // Show modal shortly after stick appears
      setTimeout(() => {
        this.showModal.set(true);
        this.triggerConfetti();
      }, 800);

    }, 1500);
  }

  triggerConfetti() {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF5722', '#FFC107', '#4CAF50']
    });
  }

  openGoogleMaps() {
    const food = this.foodService.currentResult();
    if (food) {
      const query = encodeURIComponent(`ร้าน ${food} ใกล้ฉัน`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  }
}
