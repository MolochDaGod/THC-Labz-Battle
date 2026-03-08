/**
 * Admin Gameboard Manager - Centralized system for loading admin-created PvE gameboards
 * This ensures all battle systems use the exact layouts created in /admingame interface
 */

export interface AdminGameElement {
  id: string;
  type: 'castle' | 'tower' | 'bridge' | 'drop_area' | 'river' | 'wall';
  x: number;
  y: number;
  width?: number;
  height?: number;
  team: 'player' | 'ai' | 'neutral';
  health?: number;
  maxHealth?: number;
  attack?: number;
  clickable: boolean;
  draggable?: boolean;
  resizable?: boolean;
}

export interface AdminGameboard {
  elements: AdminGameElement[];
  minions: any[];
  gridBlocked: string[];
  drawnElements: any[];
  gridSize: number;
  dimensions: { width: number; height: number };
  blockedCells: string[];
  version: string;
  precision: string;
  createdAt: string;
  gameSystem: string;
  isOfficialPvEBoard: boolean;
}

export class AdminGameboardManager {
  private static instance: AdminGameboardManager;
  private cachedGameboard: AdminGameboard | null = null;
  private lastLoadTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): AdminGameboardManager {
    if (!AdminGameboardManager.instance) {
      AdminGameboardManager.instance = new AdminGameboardManager();
    }
    return AdminGameboardManager.instance;
  }

  /**
   * Load the official PvE gameboard from server or local storage
   * This is the primary method all battle systems should use
   */
  async loadOfficialPvEGameboard(): Promise<AdminGameboard | null> {
    const now = Date.now();
    
    // Return cached version if still valid
    if (this.cachedGameboard && (now - this.lastLoadTime) < this.CACHE_DURATION) {
      console.log('🎮 Using cached admin PvE gameboard');
      return this.cachedGameboard;
    }

    try {
      console.log('🔍 Loading official PvE gameboard from admin interface...');
      
      // Try server first
      const response = await fetch('/api/admin/load-pve-gameboard');
      const result = await response.json();
      
      if (result.success && result.gameboard) {
        console.log('✅ Official PvE gameboard loaded from server:', {
          elements: result.gameboard.elements?.length || 0,
          dimensions: result.gameboard.dimensions,
          version: result.gameboard.version
        });
        
        this.cachedGameboard = result.gameboard;
        this.lastLoadTime = now;
        return this.cachedGameboard;
      }
      
      // Fallback to local storage
      const localBoard = localStorage.getItem('thc-clash-pve-gameboard');
      if (localBoard) {
        const boardData = JSON.parse(localBoard);
        console.log('✅ Official PvE gameboard loaded from local storage:', {
          elements: boardData.elements?.length || 0,
          dimensions: boardData.dimensions,
          version: boardData.version
        });
        
        this.cachedGameboard = boardData;
        this.lastLoadTime = now;
        return this.cachedGameboard;
      }
      
      console.warn('⚠️ No official PvE gameboard found!');
      console.log('🔧 Please create one in the /admingame interface');
      return null;
      
    } catch (error) {
      console.error('❌ Failed to load official PvE gameboard:', error);
      return null;
    }
  }

  /**
   * Extract towers/castles from the admin gameboard
   */
  extractTowers(gameboard: AdminGameboard): AdminGameElement[] {
    if (!gameboard?.elements) return [];
    
    return gameboard.elements.filter(element => 
      element.type === 'tower' || element.type === 'castle'
    );
  }

  /**
   * Extract blocked grid cells from admin gameboard
   */
  extractBlockedCells(gameboard: AdminGameboard): Set<string> {
    if (!gameboard?.gridBlocked) return new Set();
    
    return new Set(gameboard.gridBlocked);
  }

  /**
   * Get deployment zones based on admin elements or fallback logic
   */
  getDeploymentZones(gameboard: AdminGameboard | null, canvasWidth: number, canvasHeight: number) {
    if (!gameboard) {
      // Fallback deployment zones
      return {
        player: { 
          minY: canvasHeight * 0.7, 
          maxY: canvasHeight,
          minX: 0,
          maxX: canvasWidth 
        },
        ai: { 
          minY: 0, 
          maxY: canvasHeight * 0.3,
          minX: 0,
          maxX: canvasWidth 
        }
      };
    }

    // Check for admin-defined deployment areas
    const playerDropAreas = gameboard.elements?.filter(el => 
      el.type === 'drop_area' && el.team === 'player'
    ) || [];
    
    const aiDropAreas = gameboard.elements?.filter(el => 
      el.type === 'drop_area' && el.team === 'ai'
    ) || [];

    if (playerDropAreas.length > 0 && aiDropAreas.length > 0) {
      // Use admin-defined zones
      const playerBounds = this.calculateBounds(playerDropAreas);
      const aiBounds = this.calculateBounds(aiDropAreas);
      
      return {
        player: playerBounds,
        ai: aiBounds
      };
    }

    // Fallback if no specific drop areas defined
    return {
      player: { 
        minY: canvasHeight * 0.7, 
        maxY: canvasHeight,
        minX: 0,
        maxX: canvasWidth 
      },
      ai: { 
        minY: 0, 
        maxY: canvasHeight * 0.3,
        minX: 0,
        maxX: canvasWidth 
      }
    };
  }

  /**
   * Calculate bounds for a set of elements
   */
  private calculateBounds(elements: AdminGameElement[]) {
    if (elements.length === 0) {
      return { minX: 0, maxX: 800, minY: 0, maxY: 600 };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    elements.forEach(el => {
      minX = Math.min(minX, el.x);
      maxX = Math.max(maxX, el.x + (el.width || 50));
      minY = Math.min(minY, el.y);
      maxY = Math.max(maxY, el.y + (el.height || 50));
    });

    return { minX, maxX, minY, maxY };
  }

  /**
   * Validate that a gameboard is suitable for battle
   */
  validateGameboard(gameboard: AdminGameboard | null): boolean {
    if (!gameboard) {
      console.warn('⚠️ No gameboard to validate');
      return false;
    }

    const towers = this.extractTowers(gameboard);
    const playerTowers = towers.filter(t => t.team === 'player');
    const aiTowers = towers.filter(t => t.team === 'ai');

    if (playerTowers.length === 0) {
      console.error('❌ Gameboard validation failed: No player towers found');
      return false;
    }

    if (aiTowers.length === 0) {
      console.error('❌ Gameboard validation failed: No AI towers found');
      return false;
    }

    console.log('✅ Gameboard validation passed:', {
      playerTowers: playerTowers.length,
      aiTowers: aiTowers.length,
      totalElements: gameboard.elements?.length || 0
    });

    return true;
  }

  /**
   * Clear cached gameboard (useful when admin saves a new one)
   */
  clearCache(): void {
    this.cachedGameboard = null;
    this.lastLoadTime = 0;
    console.log('🔄 Admin gameboard cache cleared');
  }

  /**
   * Get gameboard status for debugging
   */
  getStatus(): object {
    return {
      hasCached: !!this.cachedGameboard,
      cacheAge: this.cachedGameboard ? Date.now() - this.lastLoadTime : 0,
      cacheValid: this.cachedGameboard && (Date.now() - this.lastLoadTime) < this.CACHE_DURATION,
      elements: this.cachedGameboard?.elements?.length || 0,
      version: this.cachedGameboard?.version || 'unknown'
    };
  }
}

/**
 * Convenience function for components to use
 */
export const loadAdminGameboard = () => {
  return AdminGameboardManager.getInstance().loadOfficialPvEGameboard();
};

/**
 * Hook-like function for React components
 */
export const useAdminGameboard = () => {
  const manager = AdminGameboardManager.getInstance();
  
  return {
    loadGameboard: () => manager.loadOfficialPvEGameboard(),
    validateGameboard: (board: AdminGameboard | null) => manager.validateGameboard(board),
    extractTowers: (board: AdminGameboard) => manager.extractTowers(board),
    extractBlockedCells: (board: AdminGameboard) => manager.extractBlockedCells(board),
    getDeploymentZones: (board: AdminGameboard | null, w: number, h: number) => 
      manager.getDeploymentZones(board, w, h),
    clearCache: () => manager.clearCache(),
    getStatus: () => manager.getStatus()
  };
};