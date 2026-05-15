const KEY = "emails_please_progress";

interface Progress {
    completedDays: number[];
    completedEndings: number[];
}

function load(): Progress {
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return { completedDays: [], completedEndings: [] };
}

function save(p: Progress) {
    localStorage.setItem(KEY, JSON.stringify(p));
}

export function markDayCompleted(day: number) {
    const p = load();
    if (!p.completedDays.includes(day)) {
        p.completedDays.push(day);
        save(p);
    }
}

export function markEndingCompleted(ending: number) {
    const p = load();
    if (!p.completedEndings.includes(ending)) {
        p.completedEndings.push(ending);
        save(p);
    }
}

export function getCompletedDays(): number[] {
    return load().completedDays;
}

export function getCompletedEndings(): number[] {
    return load().completedEndings;
}
