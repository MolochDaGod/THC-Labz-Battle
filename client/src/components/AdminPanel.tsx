import React, { useState, useEffect } from 'react';
import { Edit, Plus, Save, X, Eye, Trash2, Upload } from 'lucide-react';
import { CLASSIFICATION_CARD_DATABASE, ClassificationCard } from '../../../shared/classificationCardDatabase';
import { UnifiedCard } from './UnifiedCard';

interface AdminCard extends ClassificationCard {
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const AdminPanel: React.FC = () => {
  const [cards, setCards] = useState<AdminCard[]>([]);
  const [editingCard, setEditingCard] = useState<AdminCard | null>(null);
  const [viewingCard, setViewingCard] = useState<AdminCard | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cards' | 'stats' | 'sessions'>('cards');

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const response = await fetch('/api/admin/cards');
      if (response.ok) {
        const data = await response.json();
        setCards(data.cards || []);
      } else {
        // Initialize with classification database if no admin cards exist
        setCards(CLASSIFICATION_CARD_DATABASE.map(card => ({
          ...card,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })));
      }
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCard = async (card: AdminCard) => {
    try {
      const method = isCreating ? 'POST' : 'PUT';
      const url = isCreating ? '/api/admin/cards' : `/api/admin/cards/${card.id}`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(card),
      });

      if (response.ok) {
        const savedCard = await response.json();
        if (isCreating) {
          setCards(prev => [...prev, savedCard.card]);
        } else {
          setCards(prev => prev.map(c => c.id === card.id ? savedCard.card : c));
        }
        setEditingCard(null);
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Failed to save card:', error);
    }
  };

  const deleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;
    
    try {
      const response = await fetch(`/api/admin/cards/${cardId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCards(prev => prev.filter(c => c.id !== cardId));
      }
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  };

  const toggleCardActive = async (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const updatedCard = { ...card, isActive: !card.isActive };
    await saveCard(updatedCard);
  };

  const createNewCard = () => {
    const newCard: AdminCard = {
      id: `custom_${Date.now()}`,
      name: 'New Card',
      cost: 3,
      attack: 100,
      health: 100,
      description: 'A new custom card',
      rarity: 'common',
      class: 'melee',
      type: 'minion',
      image: 'https://i.imgur.com/9MIRkig.png',
      abilities: [],
      traitRequirements: [],
      isNFTConnected: false,
      isActive: true
    };
    setEditingCard(newCard);
    setIsCreating(true);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-500 to-orange-500';
      case 'epic': return 'from-purple-500 to-pink-500';
      case 'rare': return 'from-blue-500 to-cyan-500';
      case 'uncommon': return 'from-green-500 to-emerald-500';
      case 'common': return 'from-gray-500 to-gray-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getClassColor = (cardClass: string) => {
    switch (cardClass) {
      case 'ranged': return 'bg-blue-600';
      case 'magical': return 'bg-purple-600';
      case 'tank': return 'bg-red-600';
      case 'melee': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tower': return '🏰';
      case 'minion': return '⚔️';
      case 'spell': return '✨';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading Admin Panel...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header - Mobile Optimized */}
          <div className="bg-gray-800/80 backdrop-blur-md rounded-xl p-3 border border-blue-500/30 mb-3 max-w-full overflow-hidden">
            <h1 className="text-lg sm:text-2xl font-bold text-white mb-1">🛠️ Admin Panel</h1>
            <p className="text-blue-300 text-sm">Manage cards and game data</p>
          </div>

          {/* Tabs - Mobile Optimized */}
          <div className="flex space-x-1 mb-4 overflow-x-auto">
          {[
            { id: 'cards', label: '🃏 Cards', shortLabel: 'Cards', count: cards.length },
            { id: 'stats', label: '📊 Stats', shortLabel: 'Stats', count: null },
            { id: 'sessions', label: '🎮 Games', shortLabel: 'Games', count: null }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
              {tab.count !== null && (
                <span className="ml-1 bg-blue-500/20 px-1 py-0.5 rounded text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
          </div>

          {/* Card Management Tab */}
          {activeTab === 'cards' && (
          <div className="space-y-6 pb-8">
            {/* Actions Bar */}
            <div className="bg-gray-800/50 rounded-lg p-2 sm:p-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 max-w-full overflow-hidden">
              <div className="flex flex-wrap gap-2 sm:gap-4 justify-center sm:justify-start">
                <button
                  onClick={createNewCard}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold shadow-lg hover:shadow-green-500/20"
                >
                  <Plus size={20} />
                  CREATE NEW THC CARD
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold shadow-lg hover:shadow-blue-500/20"
                >
                  <Upload size={20} />
                  REFRESH CARDS
                </button>
                <button 
                  onClick={loadCards}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold shadow-lg hover:shadow-purple-500/20"
                >
                  <Save size={20} />
                  SAVE ALL CHANGES
                </button>
              </div>
              <div className="text-white bg-black/30 rounded-lg px-4 py-2">
                <div className="text-lg font-bold">Total Cards: {cards.length}</div>
                <div className="text-sm">Active: {cards.filter(c => c.isActive).length}</div>
              </div>
            </div>

            {/* Cards Grid - Responsive Layout with Click Modal */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-8 max-w-7xl mx-auto">
              {cards.map(card => (
                <div 
                  key={card.id}
                  className="cursor-pointer transform transition-all hover:scale-105 hover:shadow-xl"
                  onClick={() => setViewingCard(card)}
                >
                  <UnifiedCard
                    card={card}
                    isAdmin={true}
                    onEdit={(card) => {
                      setEditingCard(card);
                      setViewingCard(null);
                    }}
                    onToggleActive={toggleCardActive}
                    onDelete={deleteCard}
                    size="large"
                    showAddToDeck={false}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Game Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-600/20 rounded-lg p-4 border border-blue-500/30">
                <h3 className="text-blue-300 text-lg font-semibold mb-2">Card Distribution</h3>
                <div className="space-y-2 text-white">
                  <div>Minions: {cards.filter(c => c.type === 'minion').length}</div>
                  <div>Towers: {cards.filter(c => c.type === 'tower').length}</div>
                  <div>Spells: {cards.filter(c => c.type === 'spell').length}</div>
                </div>
              </div>
              <div className="bg-purple-600/20 rounded-lg p-4 border border-purple-500/30">
                <h3 className="text-purple-300 text-lg font-semibold mb-2">Rarity Distribution</h3>
                <div className="space-y-2 text-white">
                  <div>Common: {cards.filter(c => c.rarity === 'common').length}</div>
                  <div>Rare: {cards.filter(c => c.rarity === 'rare').length}</div>
                  <div>Epic: {cards.filter(c => c.rarity === 'epic').length}</div>
                  <div>Legendary: {cards.filter(c => c.rarity === 'legendary').length}</div>
                </div>
              </div>
              <div className="bg-green-600/20 rounded-lg p-4 border border-green-500/30">
                <h3 className="text-green-300 text-lg font-semibold mb-2">System Status</h3>
                <div className="space-y-2 text-white">
                  <div>Active Cards: {cards.filter(c => c.isActive).length}</div>
                  <div>Total Games: 0</div>
                  <div>Online Players: 0</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Recent Game Sessions</h2>
            <div className="text-gray-400 text-center py-8">
              No game sessions recorded yet. Start playing to see session data here.
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Card View Modal */}
      {viewingCard && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <Eye className="text-blue-400" size={32} />
                Card Details
              </h2>
              <button
                onClick={() => setViewingCard(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={28} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Card Display */}
              <div className="flex justify-center">
                <div className="w-80">
                  <UnifiedCard
                    card={viewingCard}
                    size="large"
                    showActions={false}
                    isAdmin={false}
                  />
                </div>
              </div>

              {/* Card Information */}
              <div className="space-y-6">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                  <h3 className="text-xl font-bold text-white mb-4">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Name:</span>
                      <p className="text-white font-medium">{viewingCard.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Type:</span>
                      <p className="text-white font-medium capitalize">{viewingCard.type}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Rarity:</span>
                      <p className="text-white font-medium capitalize">{viewingCard.rarity}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Class:</span>
                      <p className="text-white font-medium">{viewingCard.class}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                  <h3 className="text-xl font-bold text-white mb-4">Combat Stats</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center bg-red-900/30 rounded-lg p-3 border border-red-500/30">
                      <div className="text-2xl font-bold text-red-400">⚔️</div>
                      <div className="text-lg font-bold text-white">{viewingCard.attack}</div>
                      <div className="text-xs text-gray-400">Attack</div>
                    </div>
                    <div className="text-center bg-blue-900/30 rounded-lg p-3 border border-blue-500/30">
                      <div className="text-2xl font-bold text-blue-400">❤️</div>
                      <div className="text-lg font-bold text-white">{viewingCard.health}</div>
                      <div className="text-xs text-gray-400">Health</div>
                    </div>
                    <div className="text-center bg-purple-900/30 rounded-lg p-3 border border-purple-500/30">
                      <div className="text-2xl font-bold text-purple-400">⚡</div>
                      <div className="text-lg font-bold text-white">{viewingCard.cost}</div>
                      <div className="text-xs text-gray-400">Cost</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                  <h3 className="text-xl font-bold text-white mb-4">Description</h3>
                  <p className="text-gray-300 leading-relaxed">{viewingCard.description}</p>
                </div>

                {viewingCard.abilities && viewingCard.abilities.length > 0 && (
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                    <h3 className="text-xl font-bold text-white mb-4">Special Abilities</h3>
                    <div className="space-y-2">
                      {viewingCard.abilities.map((ability, index) => (
                        <div key={index} className="bg-purple-900/20 rounded-lg p-3 border border-purple-500/30">
                          <p className="text-purple-300 font-medium">{ability}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => {
                      setEditingCard(viewingCard);
                      setViewingCard(null);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit size={20} />
                    Edit Card
                  </button>
                  <button
                    onClick={() => setViewingCard(null)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Edit Modal */}
      {editingCard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {isCreating ? 'Create New Card' : 'Edit Card'}
              </h2>
              <button
                onClick={() => {
                  setEditingCard(null);
                  setIsCreating(false);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveCard(editingCard);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Card Name</label>
                  <input
                    type="text"
                    value={editingCard.name}
                    onChange={(e) => setEditingCard({...editingCard, name: e.target.value})}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Cost</label>
                  <input
                    type="number"
                    value={editingCard.cost}
                    onChange={(e) => setEditingCard({...editingCard, cost: parseInt(e.target.value)})}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500"
                    min="0"
                    max="10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Attack</label>
                  <input
                    type="number"
                    value={editingCard.attack}
                    onChange={(e) => setEditingCard({...editingCard, attack: parseInt(e.target.value)})}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Health</label>
                  <input
                    type="number"
                    value={editingCard.health}
                    onChange={(e) => setEditingCard({...editingCard, health: parseInt(e.target.value)})}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Rarity</label>
                  <select
                    value={editingCard.rarity}
                    onChange={(e) => setEditingCard({...editingCard, rarity: e.target.value as any})}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500"
                  >
                    <option value="common">Common</option>
                    <option value="uncommon">Uncommon</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Class</label>
                  <select
                    value={editingCard.class}
                    onChange={(e) => setEditingCard({...editingCard, class: e.target.value as any})}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500"
                  >
                    <option value="melee">Melee</option>
                    <option value="ranged">Ranged</option>
                    <option value="magical">Magical</option>
                    <option value="tank">Tank</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Type</label>
                  <select
                    value={editingCard.type}
                    onChange={(e) => setEditingCard({...editingCard, type: e.target.value as any})}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500"
                  >
                    <option value="minion">Minion</option>
                    <option value="tower">Tower</option>
                    <option value="spell">Spell</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Image URL</label>
                  <select
                    value={editingCard.image}
                    onChange={(e) => setEditingCard({...editingCard, image: e.target.value})}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500"
                  >
                    <option value="/attached_assets/good_dealer.png">Good Dealer</option>
                    <option value="/attached_assets/OEnuzI4_1753906070523.png">Minion 1</option>
                    <option value="/attached_assets/eUOASsw_1753906068538.png">Minion 2</option>
                    <option value="/attached_assets/7EBiEdQ_1753906078020.png">Minion 3</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">Description</label>
                <textarea
                  value={editingCard.description}
                  onChange={(e) => setEditingCard({...editingCard, description: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCard(null);
                    setIsCreating(false);
                  }}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Save size={20} />
                  {isCreating ? 'Create Card' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;