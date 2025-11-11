export declare const useScoreboardApi: () => {
    incrementWinCount: () => Promise<{
        wins: number;
    }>;
    getWinCount: () => Promise<{
        wins: number;
    }>;
    isAuthenticated: any;
};
