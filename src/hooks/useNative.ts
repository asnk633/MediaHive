import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export function useNative() {
    const [isNative, setIsNative] = useState(false);
    const [platform, setPlatform] = useState<'web' | 'android' | 'ios'>('web');

    useEffect(() => {
        const native = Capacitor.isNativePlatform();
        if (native) {
            console.log("📱 Mobile Mode Activated (" + Capacitor.getPlatform() + ")");
        }
        setIsNative(native);
        setPlatform(Capacitor.getPlatform() as 'web' | 'android' | 'ios');
    }, []);

    return {
        isNative,
        platform,
        isAndroid: platform === 'android',
        isIos: platform === 'ios',
        isWeb: platform === 'web'
    };
}
