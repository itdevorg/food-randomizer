import { Component, computed, inject, signal, HostListener } from '@angular/core';
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

  // Device shake state
  lastShakeTime = 0;

  @HostListener('window:devicemotion', ['$event'])
  onDeviceMotion(event: any) {
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;

    const threshold = 15; // ความแรงในการเขย่า
    const delta = Math.sqrt(acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2);

    if (delta > threshold) {
      const currentTime = Date.now();
      if (currentTime - this.lastShakeTime > 1000) { // กันรัวเกินไป
        let shouldVibrate = false;

        if (this.activeTab() === 'wheel' && !this.isSpinning()) {
          this.triggerSpinFromDevice();
          shouldVibrate = true;
        } else if (this.activeTab() === 'esiimsi' && !this.isShaking()) {
          this.triggerShakeFromDevice();
          shouldVibrate = true;
        } else if (this.activeTab() === 'gacha' && !this.isOpeningGacha()) {
          this.startGacha();
          shouldVibrate = true;
        }

        this.lastShakeTime = currentTime;

        if (shouldVibrate && typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(200);
        }
      }
    }
  }

  triggerSpinFromDevice() {
    this.startSpin();
    setTimeout(() => {
      this.stopSpin();
    }, 400); // จำลองการกดแช่ 400ms แล้วปล่อย
  }

  triggerShakeFromDevice() {
    this.startShake();
    setTimeout(() => {
      this.stopShake();
    }, 400);
  }

  playTick() {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  }

  simulateSpinDecay() {
    let delay = 50;
    const tick = () => {
      if (!this.isSpinning()) return;
      this.playTick();
      delay += 25; // Slower tick rate over time
      if (delay < 400) {
        setTimeout(tick, delay);
      }
    };
    tick();
  }

  // Tab Navigation State
  activeTab = signal<'wheel' | 'esiimsi' | 'gacha' | 'dashboard' | 'history' | 'admin' | 'mission'>('mission');

  // Admin State
  editingId = signal<number | string | null>(null);
  searchQuery = signal<string>('');

  filteredFoodList = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const activeCat = this.foodService.activeCategory();
    return this.foodService.foodList().filter(f =>
      (f.category || 'food') === activeCat &&
      f.name.toLowerCase().includes(query)
    );
  });

  // Wheel State
  wheelRotation = signal<number>(0);
  isSpinning = signal<boolean>(false);

  // Esiimsi State
  isShaking = signal<boolean>(false);
  showStick = signal<boolean>(false);

  // Gacha State
  isOpeningGacha = signal<boolean>(false);
  gachaRarity = signal<'common' | 'rare' | 'legendary' | null>(null);

  // Modal State
  showModal = signal<boolean>(false);
  isResultSaved = signal<boolean>(false);
  previewImageUrl = signal<string | null>(null);

  // Holding State
  isHolding = signal<boolean>(false);
  private animationFrameId: number | null = null;
  private lastTime = 0;

  // Audio State
  audioCtx: AudioContext | null = null;
  shakeIntervalId: any = null;

  initAudio() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playTickSound() {
    this.initAudio();
    const ctx = this.audioCtx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  playCelebrationSound(isLegendary: boolean = false) {
    this.initAudio();
    const ctx = this.audioCtx;
    if (!ctx) return;
    const notes = isLegendary ? [523.25, 659.25, 783.99, 1046.50, 1318.51] : [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isLegendary ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 1);
    });
  }

  playMagicSound() {
    this.initAudio();
    const ctx = this.audioCtx;
    if (!ctx) return;
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    for (let i = 0; i < 20; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freqs[i % freqs.length] + (Math.random() * 20);
      const startTime = ctx.currentTime + i * 0.05;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.05, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    }
  }

  playShakeSound() {
    this.initAudio();
    const ctx = this.audioCtx;
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800; // Wood clack freq
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }

  startShakeSoundLoop() {
    this.playShakeSound();
    this.shakeIntervalId = setInterval(() => {
      this.playShakeSound();
    }, 150);
  }

  stopShakeSoundLoop() {
    if (this.shakeIntervalId) {
      clearInterval(this.shakeIntervalId);
      this.shakeIntervalId = null;
    }
  }

  // Computed property for conic-gradient CSS based on foodList and active category
  wheelGradient = computed(() => {
    // 🔥 Golden wheel if secret unlocked
    if (this.foodService.streakDays() >= 5) {
      return 'conic-gradient(from 0deg, #FFD700 0deg, #FFA500 120deg, #FFDF00 240deg, #FFD700 360deg)';
    }

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

  // Calculate top randomized items (All-time and By-Month) for the active category
  dashboardData = computed(() => {
    const list = this.foodService.historyList().filter(h => (h.category || 'food') === this.foodService.activeCategory());

    const allTimeMap = new Map<string, number>();
    const byMonthMap = new Map<string, Map<string, number>>();

    list.forEach(item => {
      const name = item.food_name;
      allTimeMap.set(name, (allTimeMap.get(name) || 0) + 1);

      const dateObj = new Date(item.created_at);
      // Format to "เดือน ปี" e.g. "มีนาคม 2569"
      const monthLabel = dateObj.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
      // Sortable key "YYYY-MM"
      const sortKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

      if (!byMonthMap.has(sortKey)) {
        byMonthMap.set(sortKey, new Map<string, number>());
      }
      const monthData = byMonthMap.get(sortKey)!;
      monthData.set(name, (monthData.get(name) || 0) + 1);
    });

    const getTop = (map: Map<string, number>, limit = 5) => {
      return Array.from(map.entries())
        .map(([food_name, count]) => ({ food_name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    };

    const allTimeTop = getTop(allTimeMap, 5);
    const byMonthTop = Array.from(byMonthMap.entries())
      .map(([sortKey, map]) => {
        // Find a representative date to get the label back nicely or re-format
        const [year, month] = sortKey.split('-');
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthLabel = dateObj.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
        return { monthLabel, sortKey, items: getTop(map, 5) };
      })
      .sort((a, b) => b.sortKey.localeCompare(a.sortKey)); // newest month first

    return { allTimeTop, byMonthTop };
  });

  getFoodImage(foodName: string): string | undefined {
    return this.foodService.foodList().find(f => f.name === foodName)?.image_url;
  }

  setTab(tab: 'wheel' | 'esiimsi' | 'gacha' | 'dashboard' | 'admin' | 'history' | 'mission') {
    if (this.isSpinning() || this.isShaking() || this.isOpeningGacha()) return;
    this.activeTab.set(tab);
    this.showModal.set(false);
    this.showStick.set(false);
    this.gachaRarity.set(null);
  }

  addFood(name: string, category: 'food' | 'drink', imageUrl: string = '', rarity: string = 'common') {
    this.foodService.addFood(name, category, imageUrl, rarity as 'common' | 'rare' | 'legendary');
  }

  setCategory(category: 'food' | 'drink') {
    this.foodService.activeCategory.set(category);
  }

  startEdit(id: number | string) {
    this.editingId.set(id);
  }

  saveEdit(id: number | string, newName: string, newImageUrl: string = '', newRarity: string = 'common') {
    this.foodService.editFood(id, newName, newImageUrl, newRarity as 'common' | 'rare' | 'legendary');
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
    let lastTickAngle = this.wheelRotation();
    const rotate = (time: number) => {
      const delta = time - this.lastTime;
      this.lastTime = time;
      this.wheelRotation.update(v => v + delta * 0.8);

      // Play tick sound/vibration every 30 degrees
      if (this.wheelRotation() - lastTickAngle >= 30) {
        lastTickAngle = this.wheelRotation();
        this.playTick();
      }

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
    this.simulateSpinDecay();

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
    this.startShakeSoundLoop();
  }

  stopShake() {
    if (!this.isHolding()) return;
    this.isHolding.set(false);
    this.stopShakeSoundLoop();

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
    const result = this.foodService.currentResult() || { rarity: 'common' };
    const isLegendary = (result as any).rarity === 'legendary';

    this.playCelebrationSound(isLegendary);

    if (isLegendary) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400, 100, 500]);
      confetti({
        particleCount: 250,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FFFFFF', '#FFDF00'], // ทองแบบจัดเต็ม
        ticks: 300
      });
    } else {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(100);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF5722', '#FFC107', '#4CAF50']
      });
    }
  }

  startGacha() {
    const list = this.foodService.foodList().filter(f => (f.category || 'food') === this.foodService.activeCategory());
    if (this.isOpeningGacha() || list.length === 0) return;

    this.isOpeningGacha.set(true);
    this.showModal.set(false);
    this.isResultSaved.set(false);
    this.gachaRarity.set(null);

    this.playMagicSound();

    // Vibrate during pull
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([50, 100, 50]);

    // Simulate opening animation duration
    setTimeout(() => {
      this.openGacha();
    }, 2500);
  }

  openGacha() {
    this.isOpeningGacha.set(false);
    const result = this.foodService.pickGachaFood();

    if (result) {
      this.gachaRarity.set(result.rarity || 'common');
      this.showModal.set(true);

      // Trigger special confetti based on rarity
      if (result.rarity === 'legendary') {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
        confetti({ particleCount: 250, spread: 120, origin: { y: 0.6 }, colors: ['#FFD700', '#FFA500', '#FFFFFF', '#FFDF00'], ticks: 400 });
      } else if (result.rarity === 'rare') {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100]);
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#52b6ff', '#1e6091', '#FFFFFF'] }); // ฟ้า/ขาว
      } else {
        this.triggerConfetti();
      }
    }
  }

  openGoogleMaps() {
    const food = this.foodService.currentResult();
    if (food) {
      const query = encodeURIComponent(`ร้าน ${food.name} ใกล้ฉัน`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  }
}
