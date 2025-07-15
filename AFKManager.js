class AFKManager {
    constructor() {
        this.afkUsers = new Map();
    }

    setAFK(userId, serverId, reason, isGlobal) {
        const key = isGlobal ? `${userId}:global` : `${userId}:${serverId || 'dm'}`;
        const afkData = {
            timestamp: Date.now(),
            reason: reason,
            isGlobal: isGlobal,
            serverId: serverId,
            pingCount: 0,
            lastPingedBy: null
        };
        
        this.afkUsers.set(key, afkData);
        
        // Remove any conflicting AFK status
        if (isGlobal) {
            // Remove server-specific AFK if setting global
            this.afkUsers.delete(`${userId}:${serverId || 'dm'}`);
        } else {
            // Remove global AFK if setting server-specific
            this.afkUsers.delete(`${userId}:global`);
        }
    }

    removeAFK(userId, serverId) {
        // Check global first
        const globalKey = `${userId}:global`;
        if (this.afkUsers.has(globalKey)) {
            const data = this.afkUsers.get(globalKey);
            this.afkUsers.delete(globalKey);
            return data;
        }
        
        // Check server-specific
        const serverKey = `${userId}:${serverId || 'dm'}`;
        if (this.afkUsers.has(serverKey)) {
            const data = this.afkUsers.get(serverKey);
            this.afkUsers.delete(serverKey);
            return data;
        }
        
        return null;
    }

    isUserAFK(userId, serverId) {
        // Check global first
        if (this.afkUsers.has(`${userId}:global`)) {
            return true;
        }
        
        // Check server-specific
        const serverKey = `${userId}:${serverId || 'dm'}`;
        return this.afkUsers.has(serverKey);
    }

    getAFKData(userId, serverId) {
        // Check global first
        const globalKey = `${userId}:global`;
        if (this.afkUsers.has(globalKey)) {
            return this.afkUsers.get(globalKey);
        }
        
        // Check server-specific
        const serverKey = `${userId}:${serverId || 'dm'}`;
        return this.afkUsers.get(serverKey) || null;
    }

    addPing(userId, pingerId, serverId) {
        const afkData = this.getAFKData(userId, serverId);
        if (afkData) {
            afkData.pingCount++;
            afkData.lastPingedBy = pingerId;
        }
    }

    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d`;
        if (hours > 0) return `${hours}h`;
        if (minutes > 0) return `${minutes}m`;
        return `${seconds}s`;
    }
}

module.exports = AFKManager;
