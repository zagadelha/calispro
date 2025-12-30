
export const getTodayStr = () => {
    const stored = localStorage.getItem('calispro_virtual_date');
    if (stored) return stored;
    return new Date().toISOString().split('T')[0];
};

export const getVirtualDate = getTodayStr; // Alias for backward compatibility

export const getVirtualNow = () => {
    const todayStr = getTodayStr();
    const now = new Date();
    // Create a date object using the virtual date string and current time
    const [year, month, day] = todayStr.split('-').map(Number);
    const virtualNow = new Date(now);
    virtualNow.setFullYear(year, month - 1, day);
    return virtualNow;
};

export const setVirtualDate = (dateStr) => {
    localStorage.setItem('calispro_virtual_date', dateStr);
    window.location.reload();
};

export const addDays = (days) => {
    const current = new Date(getVirtualDate());
    current.setDate(current.getDate() + days);
    setVirtualDate(current.toISOString().split('T')[0]);
};

export const resetDate = () => {
    localStorage.removeItem('calispro_virtual_date');
    window.location.reload();
};
