import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class FoodService {
    // Signals สำหรับจัดการ State
    readonly foodList = signal<string[]>([
        'กะเพรา',
        'ส้มตำ',
        'ชาบู',
        'ราเมง',
        'ข้าวมันไก่'
    ]);

    readonly currentResult = signal<string | null>(null);

    constructor() { }

    // เพิ่มรายการอาหาร
    addFood(name: string): void {
        if (name && name.trim() !== '') {
            this.foodList.update(list => [...list, name.trim()]);
        }
    }

    // ลบรายการอาหารตาม index
    removeFood(index: number): void {
        this.foodList.update(list => list.filter((_, i) => i !== index));
    }

    // คำนวณองศาการหมุนวงล้อให้หมุน 5 รอบ (360 * 5) แล้วบวกตำแหน่งสุ่ม
    calculateWheelRotation(): number {
        const baseRotation = 360 * 5; // หมุนอย่างน้อย 5 รอบ
        const randomExtra = Math.floor(Math.random() * 360);
        return baseRotation + randomExtra;
    }

    // สุ่มเลือกอาหารจากอาร์เรย์
    pickRandomFood(): string | null {
        const currentList = this.foodList();
        if (currentList.length === 0) {
            this.currentResult.set(null);
            return null;
        }

        const randomIndex = Math.floor(Math.random() * currentList.length);
        const result = currentList[randomIndex];
        this.currentResult.set(result);
        return result;
    }
}
