import { useEffect, useState } from 'react';
//Import Helper
import { NetworkMonitor } from '@renderer/common/services/monitor-network.service';


export function useNetworkMonitorInit(): void {
    useEffect(() => {
        NetworkMonitor.start();
        return () => NetworkMonitor.stop();
    }, []);
}


export function useNetworkStatus(): 'online' | 'offline' {
    const [status, setStatus] = useState(NetworkMonitor.getCurrentStatus());

    useEffect(() => {
        const unsubscribe = NetworkMonitor.subscribe(setStatus);
        return unsubscribe;
    }, []);

    return status;
}
