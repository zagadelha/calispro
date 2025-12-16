
export const getVirtualDate = () => {
    const stored = localStorage.getItem('calispro_virtual_date');
    if (stored) return stored;
    return new Date().toISOString().split('T')[0];
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
