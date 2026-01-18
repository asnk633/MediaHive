export const triggerHaptic = () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        // 15ms is a crisp "click" feel suitable for UI headers/buttons
        window.navigator.vibrate(15);
    }
};

export const triggerHapticSuccess = () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        // Double tap for success
        window.navigator.vibrate([10, 50, 10]);
    }
};
