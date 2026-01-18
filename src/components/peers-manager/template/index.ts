/**
 * Шаблоны для компонента управления пирами
 * @module components/peers-manager/template
 * @version 1.0.0
 * @description HTML шаблоны для управления подключенными пирами
 */

/**
 * Основной шаблон компонента управления пирами
 * @function defaultTemplate
 * @param {Object} params - Параметры рендеринга
 * @param {Object} params.state - Состояние компонента
 * @param {Array} [params.state.peers=[]] - Массив подключенных пиров
 * @param {string} [params.state.searchQuery=''] - Поисковый запрос
 * @param {number} [params.state.totalPeers=0] - Общее количество пиров
 * @param {number} [params.state.totalConnections=0] - Общее количество соединений
 * @returns {string} HTML строка
 */
export function defaultTemplate({ state = {} }: { state: any; context?: any }): string {
    const { peers = [], searchQuery = '', totalPeers = 0, totalConnections = 0 } = state;

    return `
    <div class="peers-manager">
      <div class="card full-width">
        <div class="card-header">
          <h3 class="card-title">
            <span class="card-icon">👥</span>
            Connected Peers
          </h3>
          <span class="card-badge">${totalPeers}</span>
        </div>
        <div class="card-content">
          ${renderActionBar()}
          ${renderSearchSection(searchQuery)}
          <div class="peers-list" id="peersList">
            ${renderPeersList(peers)}
          </div>
          ${renderStatsSection(totalPeers, totalConnections)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Шаблон панели действий
 * @function renderActionBar
 * @returns {string} HTML строка панели действий
 */
function renderActionBar(): string {
    return `
    <div class="action-bar">
      <button class="btn btn-success" id="get-all-peers">
        <span>📋</span> Get Detailed Peers Info
      </button>
      <button class="btn btn-warning" id="get-blocked-peers">
        <span>🚫</span> Get Blocked Peers
      </button>
      <button class="btn btn-info" id="get-ping-status">
        <span>📊</span> Ping Status
      </button>
      <button class="btn btn-secondary" id="refresh-peers">
        <span>🔄</span> Refresh
      </button>
      <button class="btn btn-danger" id="disconnect-all-peers">
        <span>🚫</span> Disconnect All
      </button>
    </div>
  `;
}

/**
 * Шаблон секции поиска
 * @function renderSearchSection
 * @param {string} searchQuery - Текущий поисковый запрос
 * @returns {string} HTML строка секции поиска
 */
function renderSearchSection(searchQuery = ''): string {
    return `
    <div class="search-section">
      <div class="search-container">
        <input 
          type="text" 
          id="peer-search-input" 
          class="search-input" 
          placeholder="Search peers by ID, address, or protocol..."
          value="${escapeHtml(searchQuery)}"
        >
        <button class="btn btn-secondary" id="clear-search">
          <span>🗑️</span> Clear
        </button>
      </div>
    </div>
  `;
}

/**
 * Шаблон списка пиров
 * @function renderPeersList
 * @param {Array} peers - Массив пиров
 * @returns {string} HTML строка списка пиров
 */
function renderPeersList(peers = []): string {
    if (peers.length === 0) {
        return `
      <div class="empty-state">
        <div class="empty-icon">👥</div>
        <p class="empty-text">No peers connected</p>
        <p class="empty-description">Connect to peers to see them here</p>
      </div>
    `;
    }

    return `${peers.map(peer => renderPeerItem(peer)).join('')}`;
}

/**
 * Шаблон элемента пира
 * @function renderPeerItem
 * @param {Object} peer - Данные пира
 * @param {string} peer.peerId - ID пира
 * @param {Array} peer.connections - Массив соединений
 * @param {number} peer.connectionCount - Количество соединений
 * @param {number} peer.streamCount - Количество потоков
 * @param {boolean} peer.blocked - Заблокирован ли пир
 * @param {boolean} peer.permanentlyBlocked - Постоянно заблокирован
 * @param {boolean} peer.autoPing - Включен ли авто-пинг
 * @returns {string} HTML строка элемента пира
 */
function renderPeerItem(peer: any): string {
    const isBlocked = peer.blocked || peer.permanentlyBlocked;
    const peerId = escapeHtml(peer.peerId);

    return `
    <div class="peer-item ${isBlocked ? 'peer-blocked' : ''}" data-peer-id="${peerId}">
      <div class="peer-info">
        <div class="peer-id">${peerId}</div>
        <div class="peer-meta">
          <span class="meta-item">🔗 ${peer.connectionCount || 0} connections</span>
          <span class="meta-item">📊 ${peer.streamCount || 0} streams</span>
          ${peer.autoPing ? '<span class="meta-item ping-active">📡 Auto Ping</span>' : ''}
          ${isBlocked ? '<span class="meta-item blocked">🚫 Blocked</span>' : ''}
          ${peer.permanentlyBlocked ? '<span class="meta-item permanently-blocked">⛔ Permanent</span>' : ''}
        </div>
        ${renderConnectionDetails(peer.connections)}
      </div>
      <div class="peer-actions">
        <button class="peer-btn peer-btn-info peer-btn-info" onclick="this.getRootNode().host.getSpecificPeerInfo('${peerId}')">
          🔍 Info
        </button>
        <button class="peer-btn peer-btn-warning peer-btn-ping" onclick="this.getRootNode().host.pingSpecificPeer('${peerId}')">
          📡 Ping
        </button>
        ${peer.autoPing ? `
          <button class="peer-btn peer-btn-secondary peer-btn-auto-ping-stop" onclick="this.getRootNode().host.stopAutoPing('${peerId}')">
            ⏹️ Stop Ping
          </button>
        ` : `
          <button class="peer-btn peer-btn-success peer-btn-auto-ping-start" onclick="this.getRootNode().host.startAutoPing('${peerId}')">
            ▶️ Start Ping
          </button>
        `}
        <button class="peer-btn peer-btn-danger peer-btn-disconnect" onclick="this.getRootNode().host.disconnectSpecificPeer('${peerId}')">
          🚫 Disconnect
        </button>
        ${isBlocked ? `
          <button class="peer-btn peer-btn-warning peer-btn-unblock" onclick="this.getRootNode().host.unblockPeer('${peerId}')">
            ✅ Unblock
          </button>
        ` : `
          <button class="peer-btn peer-btn-danger peer-btn-block" onclick="this.getRootNode().host.blockPeer('${peerId}')">
            🚫 Block
          </button>
        `}
      </div>
    </div>
  `;
}

/**
 * Шаблон деталей соединений пира
 * @function renderConnectionDetails
 * @param {Array} connections - Массив соединений
 * @returns {string} HTML строка деталей соединений
 */
function renderConnectionDetails(connections: any[] = []): string {
    if (!connections || connections.length === 0) {
        return '';
    }

    return `
    <div class="connection-details">
      ${connections.map((conn, index) => `
        <div class="connection-item">
          <span class="connection-id">Connection ${index + 1}</span>
          <span class="connection-status ${conn.status}">${conn.status}</span>
          <span class="connection-addr">${escapeHtml(conn.remoteAddr || 'Unknown')}</span>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Шаблон секции статистики
 * @function renderStatsSection
 * @param {number} totalPeers - Общее количество пиров
 * @param {number} totalConnections - Общее количество соединений
 * @returns {string} HTML строка секции статистики
 */
function renderStatsSection(totalPeers = 0, totalConnections = 0): string {
    return `
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${totalPeers}</div>
          <div class="stat-label">Total Peers</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${totalConnections}</div>
          <div class="stat-label">Total Connections</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" id="activePeersCount">${totalPeers}</div>
          <div class="stat-label">Active Peers</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" id="blockedPeersCount">0</div>
          <div class="stat-label">Blocked Peers</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Шаблон для частичного рендеринга списка пиров
 * @function renderPeersListPart
 * @param {Object} params - Параметры рендеринга
 * @param {Object} params.state - Состояние компонента
 * @param {Array} [params.state.peers=[]] - Массив пиров
 * @returns {string} HTML строка списка пиров
 */
export function renderPeersListPart({ state = {} }: { state: any; context?: any }): string {
    return renderPeersList(state.peers);
}

/**
 * Шаблон для частичного рендеринга статистики
 * @function renderStatsPart
 * @param {Object} params - Параметры рендеринга
 * @param {Object} params.state - Состояние компонента
 * @param {number} [params.state.totalPeers=0] - Общее количество пиров
 * @param {number} [params.state.totalConnections=0] - Общее количество соединений
 * @param {number} [params.state.blockedPeersCount=0] - Количество заблокированных пиров
 * @returns {string} HTML строка статистики
 */
export function renderStatsPart({ state = {} }: { state: any; context?: any }): string {
    const { totalPeers = 0, totalConnections = 0, blockedPeersCount = 0 } = state;

    return `
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-value">${totalPeers}</div>
        <div class="stat-label">Total Peers</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${totalConnections}</div>
        <div class="stat-label">Total Connections</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${totalPeers}</div>
        <div class="stat-label">Active Peers</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${blockedPeersCount}</div>
        <div class="stat-label">Blocked Peers</div>
      </div>
    </div>
  `;
}

/**
 * Шаблон для пустого состояния поиска
 * @function renderSearchEmptyState
 * @param {Object} params - Параметры рендеринга
 * @param {Object} params.state - Состояние компонента
 * @param {string} [params.state.searchQuery=''] - Поисковый запрос
 * @returns {string} HTML строка пустого состояния
 */
export function renderSearchEmptyState({ state = {} }: { state: any; context?: any }): string {
    const { searchQuery = '' } = state;

    return `
    <div class="empty-state">
      <div class="empty-icon">🔍</div>
      <p class="empty-text">No peers found for "${escapeHtml(searchQuery)}"</p>
      <p class="empty-description">Try adjusting your search terms or discover new peers</p>
      <div class="empty-actions">
        <button class="empty-action" onclick="this.getRootNode().host.clearSearch()">
          Clear Search
        </button>
      </div>
    </div>
  `;
}

/**
 * Шаблон для отображения результатов поиска
 * @function renderSearchResults
 * @param {Object} params - Параметры рендеринга
 * @param {Object} params.state - Состояние компонента
 * @param {Array} [params.state.searchResults=[]] - Результаты поиска
 * @param {string} [params.state.searchQuery=''] - Поисковый запрос
 * @returns {string} HTML строка результатов поиска
 */
export function renderSearchResults({ state = {} }: { state: any; context?: any }): string {
    const { searchResults = [], searchQuery = '' } = state;

    if (searchResults.length === 0) {
        return renderSearchEmptyState({ state });
    }

    return `
    <div class="search-results">
      <div class="search-header">
        <h4>Search Results for "${escapeHtml(searchQuery)}"</h4>
        <span class="results-count">${searchResults.length} peers found</span>
      </div>
      <div class="peers-list">
        ${searchResults.map((peer: any) => renderPeerItem(peer)).join('')}
      </div>
    </div>
  `;
}

/**
 * Экранирование HTML строк
 * @function escapeHtml
 * @param {string} text - Текст для экранирования
 * @returns {string} Экранированный текст
 */
function escapeHtml(text: string): string {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}