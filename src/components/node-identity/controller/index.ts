import type { NodeIdentity } from '../index';

export const controller = (context: NodeIdentity) => {
    let intervalId: NodeJS.Timeout | null = null;

    return {
        async init(): Promise<void> {
            // Обновляем uptime каждую секунду
            intervalId = setInterval(() => {
                context.updateUptime();
            }, 1000);
        },

        async destroy(): Promise<void> {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        }
    };
};