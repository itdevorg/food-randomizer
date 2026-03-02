import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FoodService, FoodItem } from './services/food.service';
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
  activeTab = signal<'wheel' | 'esiimsi' | 'admin' | 'history'>('wheel');

  // Admin State
  editingId = signal<number | string | null>(null);

  // Wheel State
  wheelRotation = signal<number>(0);
  isSpinning = signal<boolean>(false);

  // Esiimsi State
  isShaking = signal<boolean>(false);
  showStick = signal<boolean>(false);

  // Modal State
  showModal = signal<boolean>(false);
  isResultSaved = signal<boolean>(false);
  previewImageUrl = signal<string | null>(null);

  // Holding State
  isHolding = signal<boolean>(false);
  private animationFrameId: number | null = null;
  private lastTime = 0;

  // Computed property for conic-gradient CSS based on foodList and active category
  wheelGradient = computed(() => {
    const list = this.foodService.foodList().filter(f => (f.category || 'food') === this.foodService.activeCategory());
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

  // Group history by date (YYYY-MM-DD or formatted)
  groupedHistory = computed(() => {
    // Filter history by the currently active category (defaulting to 'food' if undefined)
    const list = this.foodService.historyList().filter(h => (h.category || 'food') === this.foodService.activeCategory());

    const groups: { date: string, items: typeof list }[] = [];
    const map = new Map<string, typeof list>();

    list.forEach(item => {
      // created_at is likely ISO string "2026-03-02T10:32:09+07:00"
      const dateObj = new Date(item.created_at);
      const dateKey = dateObj.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(item);
    });

    map.forEach((items, date) => {
      groups.push({ date, items });
    });

    return groups;
  });

  getFoodImage(foodName: string): string | undefined {
    return this.foodService.foodList().find(f => f.name === foodName)?.image_url;
  }

  setTab(tab: 'wheel' | 'esiimsi' | 'admin' | 'history') {
    if (this.isSpinning() || this.isShaking()) return;
    this.activeTab.set(tab);
    this.showModal.set(false);
    this.showStick.set(false);
  }

  addFood(name: string, category: 'food' | 'drink', imageUrl: string = '') {
    this.foodService.addFood(name, category, imageUrl);
  }

  setCategory(category: 'food' | 'drink') {
    this.foodService.activeCategory.set(category);
  }

  startEdit(id: number | string) {
    this.editingId.set(id);
  }

  saveEdit(id: number | string, newName: string, newImageUrl: string = '') {
    this.foodService.editFood(id, newName, newImageUrl);
    this.editingId.set(null);
  }

  cancelEdit() {
    this.editingId.set(null);
  }

  deleteFood(id: number | string) {
    if (confirm('ยืนยันการลบเมนูนี้?')) {
      this.foodService.deleteFood(id);
    }
  }

  confirmResult(playerName: string) {
    const food = this.foodService.currentResult();
    if (food) {
      this.foodService.saveHistory(food, playerName || 'ผู้ไม่ประสงค์ออกนาม', this.foodService.activeCategory());
      this.isResultSaved.set(true);
    }
  }

  deleteHistory(id: number | string) {
    if (confirm('ยืนยันการลบประวัตินี้?')) {
      this.foodService.deleteHistory(id);
    }
  }

  startSpin(e?: Event) {
    if (e && e.cancelable) e.preventDefault();
    const typeList = this.foodService.foodList().filter(f => (f.category || 'food') === this.foodService.activeCategory());
    if (this.isSpinning() || typeList.length === 0) return;

    this.isSpinning.set(true);
    this.isHolding.set(true);
    this.showModal.set(false);
    this.isResultSaved.set(false);

    this.lastTime = performance.now();
    const rotate = (time: number) => {
      const delta = time - this.lastTime;
      this.lastTime = time;
      this.wheelRotation.update(v => v + delta * 0.8);
      this.animationFrameId = requestAnimationFrame(rotate);
    };
    this.animationFrameId = requestAnimationFrame(rotate);
  }

  stopSpin() {
    if (!this.isHolding()) return;
    this.isHolding.set(false);

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    const rotation = this.foodService.calculateWheelRotation();
    // Add new rotation to keep spinning forward before stopping
    this.wheelRotation.update(current => current + rotation);

    this.foodService.pickRandomFood();

    // Wait for spin animation (4s) to finish
    setTimeout(() => {
      this.isSpinning.set(false);
      this.showModal.set(true);
      this.triggerConfetti();
    }, 4000);
  }

  startShake(e?: Event) {
    if (e && e.cancelable) e.preventDefault();
    const list = this.foodService.foodList().filter(f => (f.category || 'food') === this.foodService.activeCategory());
    if (this.isShaking() || list.length === 0) return;

    this.isShaking.set(true);
    this.isHolding.set(true);
    this.showStick.set(false);
    this.showModal.set(false);
    this.isResultSaved.set(false);
  }

  stopShake() {
    if (!this.isHolding()) return;
    this.isHolding.set(false);

    // Let it shake a fraction longer
    setTimeout(() => {
      this.isShaking.set(false);
      this.foodService.pickRandomFood();
      this.showStick.set(true);

      setTimeout(() => {
        this.showModal.set(true);
        this.triggerConfetti();
      }, 150);
    }, 300);
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
      const query = encodeURIComponent(`ร้าน ${food.name} ใกล้ฉัน`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  }
}
