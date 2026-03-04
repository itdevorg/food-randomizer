import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface FoodItem {
    id: number | string;
    name: string;
    category?: string; // 'food' | 'drink'
    image_url?: string;
    rarity?: 'common' | 'rare' | 'legendary';
}

export interface HistoryItem {
    id: number | string;
    food_name: string;
    player_name?: string;
    category?: string;
    created_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class FoodService {
    private supabase: SupabaseClient;

    readonly foodList = signal<FoodItem[]>([]);
    readonly historyList = signal<HistoryItem[]>([]);
    readonly currentResult = signal<FoodItem | null>(null);
    readonly activeCategory = signal<'food' | 'drink'>('food');

    // Mission & Streak State
    readonly streakDays = signal<number>(0);
    readonly isMissionCompleted = signal<boolean>(false);
    readonly dailyMission = signal<string>('สุ่มและบันทึกเมนูอะไรก็ได้วันนี้ เพื่อรักษาสถิติรายวัน!');

    // Secret Menus unlocked at 5 days
    private secretFoods: FoodItem[] = [
        { id: 'sec-1', name: '👑 ซูชิโอมากาเสะระดับเทพ', category: 'food', rarity: 'legendary' },
        { id: 'sec-2', name: '✨ ข้าวผัดทองคำเนื้อวากิว', category: 'food', rarity: 'legendary' },
        { id: 'sec-3', name: '🍷 น้ำอมฤตบาดาล (ลับ)', category: 'drink', rarity: 'legendary' }
    ];

    constructor() {
        this.supabase = createClient(
            'https://esxjyohypiqvdkykytzz.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeGp5b2h5cGlxdmRreWt5dHp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNDIzMzUsImV4cCI6MjA4NzcxODMzNX0._k1XEXbN_TSuvqtT4RMXYIIDIbpf91nl1M4iFAwgtsg'
        );
        this.loadFoods();
        this.loadHistory();
        this.initStreakAndMission();
    }

    private initStreakAndMission() {
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        const lastVisit = localStorage.getItem('last_visit_date');
        let currentStreak = parseInt(localStorage.getItem('streak_days') || '0', 10);
        const missionCompletedDate = localStorage.getItem('mission_completed_date');

        if (lastVisit !== today) {
            // New day check
            if (lastVisit) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toLocaleDateString('en-CA');

                if (lastVisit !== yesterdayStr && missionCompletedDate !== yesterdayStr) {
                    // Missed a day, streak broken (if we require daily mission to keep streak)
                    // Let's be lenient: if they didn't complete yesterday, streak resets.
                    currentStreak = 0;
                }
            }
            // Update last visit
            localStorage.setItem('last_visit_date', today);
        }

        this.streakDays.set(currentStreak);
        this.isMissionCompleted.set(missionCompletedDate === today);

        // Dynamic mission text based on streak
        if (currentStreak >= 5) {
            this.dailyMission.set('🔥 คุณได้รับสิทธิ์สุ่ม "เมนูลับ" แล้ว! สุ่มต่อเพื่อรักษาสถิติ');
        }
    }

    completeDailyMission() {
        const today = new Date().toLocaleDateString('en-CA');
        const missionCompletedDate = localStorage.getItem('mission_completed_date');

        if (missionCompletedDate !== today) {
            // Unlocked today
            const newStreak = this.streakDays() + 1;
            this.streakDays.set(newStreak);
            this.isMissionCompleted.set(true);

            localStorage.setItem('streak_days', newStreak.toString());
            localStorage.setItem('mission_completed_date', today);

            if (newStreak === 5) {
                this.dailyMission.set('🎉 ยินดีด้วย! ปลดล็อก "เมนูลับ" สำเร็จแล้ว');
            }
        }
    }

    async loadFoods() {
        const { data, error } = await this.supabase
            .from('foods')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('Error fetching foods:', error);
            // Fallback mock data if table doesn't exist or error fetching
            if (this.foodList().length === 0) {
                this.foodList.set([
                    { id: 1, name: 'กะเพรา', image_url: 'https://placehold.co/400x400/FF5722/FFF?text=%E0%B8%81%E0%B8%B0%E0%B9%80%E0%B8%9E%E0%B8%A3%E0%B8%B2', rarity: 'common' },
                    { id: 2, name: 'ส้มตำ', image_url: 'https://placehold.co/400x400/4CAF50/FFF?text=%E0%B8%AA%E0%B9%89%E0%B8%A1%E0%B8%95%E0%B8%B3', rarity: 'common' },
                    { id: 3, name: 'ชาบู', image_url: 'https://placehold.co/400x400/F44336/FFF?text=%E0%B8%8A%E0%B8%B2%E0%B8%9A%E0%B8%B9', rarity: 'rare' },
                    { id: 4, name: 'ราเมง', image_url: 'https://placehold.co/400x400/FFC107/FFF?text=%E0%B8%A3%E0%B8%B2%E0%B9%80%E0%B8%A1%E0%B8%87', rarity: 'rare' },
                    { id: 5, name: 'โอมากาเสะพรีเมียม', image_url: 'https://placehold.co/400x400/9C27B0/FFF?text=%E0%B9%82%E0%B8%AD%E0%B8%A1%E0%B8%B2%E0%B8%81%E0%B8%B2%E0%B9%80%E0%B8%AA%E0%B8%B0', rarity: 'legendary' }
                ]);
            }
        } else if (data) {
            this.foodList.set(data as FoodItem[]);
        }
    }

    async loadHistory() {
        const { data, error } = await this.supabase
            .from('history')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching history:', error);
        } else if (data) {
            this.historyList.set(data as HistoryItem[]);
        }
    }

    async saveHistory(food: FoodItem, playerName: string = 'ผู้ไม่ประสงค์ออกนาม', category: string = 'food') {
        const { error } = await this.supabase
            .from('history')
            .insert([{ food_name: food.name, player_name: playerName, category }]);

        if (error) {
            console.error('Error saving history:', error);
        } else {
            // Reload history to get new item with created_at timestamp
            this.loadHistory();
            this.completeDailyMission(); // Trigger mission complete logic
        }
    }

    async deleteHistory(id: number | string) {
        // Optimistic update
        const backup = this.historyList();
        this.historyList.update(list => list.filter(h => h.id !== id));

        const { error } = await this.supabase
            .from('history')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting history:', error);
            this.historyList.set(backup);
        }
    }

    async addFood(name: string, category: 'food' | 'drink' = 'food', imageUrl: string = '', rarity: 'common' | 'rare' | 'legendary' = 'common'): Promise<void> {
        if (!name || name.trim() === '') return;

        // Optimistic UI Update placeholder
        const tempId = 'temp-' + Date.now();
        const payload = { name: name.trim(), category, image_url: imageUrl.trim(), rarity };
        this.foodList.update(list => [...list, { id: tempId, ...payload }]);

        let { data, error } = await this.supabase
            .from('foods')
            .insert([payload])
            .select();

        if (error && error.message.includes('rarity')) {
            // fallback if rarity column doesn't exist in DB
            const fallbackPayload = { name: name.trim(), category, image_url: imageUrl.trim() };
            const res = await this.supabase.from('foods').insert([fallbackPayload]).select();
            data = res.data;
            error = res.error;
        }

        if (error) {
            console.error('Error adding food:', error);
            // Revert on error
            this.foodList.update(list => list.filter(f => f.id !== tempId));
        } else if (data && data[0]) {
            // Replace temp with real. Keep the local rarity if DB doesn't have it
            this.foodList.update(list => list.map(f => f.id === tempId ? { ...data[0], rarity: f.rarity } : f));
        }
    }

    async editFood(id: number | string, newName: string, newImageUrl: string = '', newRarity: 'common' | 'rare' | 'legendary' = 'common'): Promise<void> {
        if (!newName || newName.trim() === '') return;

        // Optimistic update
        this.foodList.update(list => list.map(f => f.id === id ? { ...f, name: newName.trim(), image_url: newImageUrl.trim(), rarity: newRarity } : f));

        const payload = { name: newName.trim(), image_url: newImageUrl.trim(), rarity: newRarity };
        let { data, error } = await this.supabase
            .from('foods')
            .update(payload)
            .eq('id', id)
            .select();

        if (error && error.message.includes('rarity')) {
            const fallbackPayload = { name: newName.trim(), image_url: newImageUrl.trim() };
            const res = await this.supabase.from('foods').update(fallbackPayload).eq('id', id).select();
            data = res.data;
            error = res.error;
        }

        if (error) {
            console.error('Error updating food:', error);
            // We would need to revert here in a real robust app, but keeping it simple for now
            // Just reload foods to sync state
            this.loadFoods();
        }
    }

    async deleteFood(id: number | string): Promise<void> {
        // Optimistic update
        const backup = this.foodList();
        this.foodList.update(list => list.filter(f => f.id !== id));

        const { error } = await this.supabase
            .from('foods')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting food:', error);
            // Revert
            this.foodList.set(backup);
        }
    }

    // คำนวณองศาการหมุนวงล้อให้หมุน 5 รอบ (360 * 5) แล้วบวกตำแหน่งสุ่ม
    calculateWheelRotation(): number {
        const baseRotation = 360 * 5; // หมุนอย่างน้อย 5 รอบ
        const randomExtra = Math.floor(Math.random() * 360);
        return baseRotation + randomExtra;
    }

    // สุ่มเลือกอาหารจากอาร์เรย์ (ถูกกรองด้วย category ปัจจุบัน)
    pickRandomFood(): FoodItem | null {
        let typeList = this.foodList().filter(f => (f.category || 'food') === this.activeCategory());

        // Add secret foods if unlocked (streak >= 5)
        if (this.streakDays() >= 5) {
            const unlockedSecrets = this.secretFoods.filter(f => f.category === this.activeCategory());
            typeList = [...typeList, ...unlockedSecrets];
        }

        if (typeList.length === 0) {
            this.currentResult.set(null);
            return null;
        }

        const randomIndex = Math.floor(Math.random() * typeList.length);
        const result = typeList[randomIndex];
        this.currentResult.set(result);

        return result;
    }

    pickGachaFood(): FoodItem | null {
        let typeList = this.foodList().filter(f => (f.category || 'food') === this.activeCategory());

        // Add secret foods if unlocked (streak >= 5)
        if (this.streakDays() >= 5) {
            const unlockedSecrets = this.secretFoods.filter(f => f.category === this.activeCategory());
            typeList = [...typeList, ...unlockedSecrets];
        }

        if (typeList.length === 0) {
            this.currentResult.set(null);
            return null;
        }

        const rand = Math.random() * 100;
        let targetRarity: 'common' | 'rare' | 'legendary' = 'common';

        // 10% Legendary, 20% Rare, 70% Common
        if (rand <= 10) targetRarity = 'legendary';
        else if (rand <= 30) targetRarity = 'rare';
        else targetRarity = 'common';

        let pool = typeList.filter(f => (f.rarity || 'common') === targetRarity);

        // Fallbacks if pool is empty
        if (pool.length === 0) {
            if (targetRarity === 'legendary') pool = typeList.filter(f => (f.rarity || 'common') === 'rare');
            if (pool.length === 0) pool = typeList.filter(f => (f.rarity || 'common') === 'common');
            if (pool.length === 0) pool = typeList; // Total fallback
        }

        const randomIndex = Math.floor(Math.random() * pool.length);
        const result = pool[randomIndex];
        this.currentResult.set(result);
        return result;
    }
}
