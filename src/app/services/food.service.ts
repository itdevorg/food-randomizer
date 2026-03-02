import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface FoodItem {
    id: number | string;
    name: string;
}

export interface HistoryItem {
    id: number | string;
    food_name: string;
    created_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class FoodService {
    private supabase: SupabaseClient;

    readonly foodList = signal<FoodItem[]>([]);
    readonly historyList = signal<HistoryItem[]>([]);
    readonly currentResult = signal<string | null>(null);

    constructor() {
        this.supabase = createClient(
            'https://esxjyohypiqvdkykytzz.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeGp5b2h5cGlxdmRreWt5dHp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNDIzMzUsImV4cCI6MjA4NzcxODMzNX0._k1XEXbN_TSuvqtT4RMXYIIDIbpf91nl1M4iFAwgtsg'
        );
        this.loadFoods();
        this.loadHistory();
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
                    { id: 1, name: 'กะเพรา' },
                    { id: 2, name: 'ส้มตำ' },
                    { id: 3, name: 'ชาบู' },
                    { id: 4, name: 'ราเมง' },
                    { id: 5, name: 'ข้าวมันไก่' }
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

    async saveHistory(foodName: string) {
        const { error } = await this.supabase
            .from('history')
            .insert([{ food_name: foodName }]);

        if (error) {
            console.error('Error saving history:', error);
        } else {
            // Reload history to get new item with created_at timestamp
            this.loadHistory();
        }
    }

    async addFood(name: string): Promise<void> {
        if (!name || name.trim() === '') return;

        // Optimistic UI Update placeholder
        const tempId = 'temp-' + Date.now();
        this.foodList.update(list => [...list, { id: tempId, name: name.trim() }]);

        const { data, error } = await this.supabase
            .from('foods')
            .insert([{ name: name.trim() }])
            .select();

        if (error) {
            console.error('Error adding food:', error);
            // Revert on error
            this.foodList.update(list => list.filter(f => f.id !== tempId));
        } else if (data && data[0]) {
            // Replace temp with real
            this.foodList.update(list => list.map(f => f.id === tempId ? data[0] : f));
        }
    }

    async editFood(id: number | string, newName: string): Promise<void> {
        if (!newName || newName.trim() === '') return;

        // Optimistic update
        this.foodList.update(list => list.map(f => f.id === id ? { ...f, name: newName.trim() } : f));

        // Note: Supabase will fail if id is not the correct type (number likely), 
        // assuming id is number in real db
        const { data, error } = await this.supabase
            .from('foods')
            .update({ name: newName.trim() })
            .eq('id', id)
            .select();

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

    // สุ่มเลือกอาหารจากอาร์เรย์
    pickRandomFood(): string | null {
        const currentList = this.foodList();
        if (currentList.length === 0) {
            this.currentResult.set(null);
            return null;
        }

        const randomIndex = Math.floor(Math.random() * currentList.length);
        const result = currentList[randomIndex].name;
        this.currentResult.set(result);

        // Save result to history
        this.saveHistory(result);

        return result;
    }
}
