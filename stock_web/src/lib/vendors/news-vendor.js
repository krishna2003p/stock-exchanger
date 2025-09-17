// src/lib/vendors/news-vendor.js
import { BaseVendor } from './base-vendor.js';
import { VENDOR_IDS, MESSAGE_TYPES } from '../../utils/constants.js';

export class NewsVendor extends BaseVendor {
  constructor(vendorId, config) {
    super(vendorId, config);
    this.subscribedCategories = new Set();
  }

  async authenticate() {
    switch (this.vendorId) {
      case VENDOR_IDS.FINNHUB_NEWS:
        if (!this.config.apiKey) {
          throw new Error('Finnhub API key required for news feed');
        }
        this.isAuthenticated = true;
        console.log(`${this.vendorId}: Authenticated with API key`);
        break;
        
      default:
        this.isAuthenticated = true;
    }
  }

  prepareWebSocketUrl() {
    let url = this.config.wsUrl;
    
    switch (this.vendorId) {
      case VENDOR_IDS.FINNHUB_NEWS:
        // Finnhub requires token in URL
        if (this.config.apiKey) {
          url += `?token=${this.config.apiKey}`;
        }
        break;
    }
    
    return url;
  }

  sendInitialSubscriptions() {
    // Subscribe to general news by default
    this.subscribeToNews(['general']);
  }

  subscribeToNews(categories = []) {
    if (!this.isConnected) {
      console.warn(`${this.vendorId}: Not connected, cannot subscribe to news`);
      return false;
    }

    const categoriesArray = Array.isArray(categories) ? categories : [categories];
    const newCategories = categoriesArray.filter(cat => !this.subscribedCategories.has(cat));
    
    if (newCategories.length === 0) {
      console.log(`${this.vendorId}: Already subscribed to all categories`);
      return true;
    }

    console.log(`${this.vendorId}: Subscribing to news categories:`, newCategories);

    switch (this.vendorId) {
      case VENDOR_IDS.FINNHUB_NEWS:
        // Finnhub subscribes to specific symbols for news
        newCategories.forEach(category => {
          const symbol = this.getCategorySymbol(category);
          this.send({
            type: 'subscribe',
            symbol: symbol
          });
        });
        break;
        
      default:
        this.send({
          type: MESSAGE_TYPES.SUBSCRIBE_NEWS,
          categories: newCategories
        });
    }

    newCategories.forEach(category => {
      this.subscribedCategories.add(category);
      this.subscriptions.add(category);
    });
    
    return true;
  }

  unsubscribeFromNews(categories = []) {
    if (!this.isConnected) {
      console.warn(`${this.vendorId}: Not connected, cannot unsubscribe from news`);
      return false;
    }

    const categoriesArray = Array.isArray(categories) ? categories : [categories];
    const subscribedCats = categoriesArray.filter(cat => this.subscribedCategories.has(cat));
    
    if (subscribedCats.length === 0) {
      return true;
    }

    console.log(`${this.vendorId}: Unsubscribing from news categories:`, subscribedCats);

    switch (this.vendorId) {
      case VENDOR_IDS.FINNHUB_NEWS:
        subscribedCats.forEach(category => {
          const symbol = this.getCategorySymbol(category);
          this.send({
            type: 'unsubscribe',
            symbol: symbol
          });
        });
        break;
        
      default:
        this.send({
          type: 'unsubscribe_news',
          categories: subscribedCats
        });
    }

    subscribedCats.forEach(category => {
      this.subscribedCategories.delete(category);
      this.subscriptions.delete(category);
    });
    
    return true;
  }

  getCategorySymbol(category) {
    // Map news categories to symbols for Finnhub
    const categoryMap = {
      'general': 'AAPL',
      'market': 'SPY',
      'crypto': 'BTCUSD',
      'forex': 'EURUSD',
      'indian_market': 'RELIANCE'
    };
    
    return categoryMap[category] || 'AAPL';
  }

  // Data transformation method
  static createFinnhubTransformer() {
    return (rawData) => {
      try {
        const parsed = JSON.parse(rawData);
        
        if (parsed.type === 'news' && parsed.data) {
          const newsItems = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
          
          return newsItems.map(item => ({
            type: MESSAGE_TYPES.NEWS_UPDATE,
            id: item.id || `news_${Date.now()}`,
            headline: item.headline,
            summary: item.summary,
            source: item.source,
            category: item.category || 'general',
            related_symbols: item.related || [],
            url: item.url,
            image: item.image,
            datetime: new Date(item.datetime * 1000).toISOString(),
            timestamp: new Date().toISOString(),
            vendor: VENDOR_IDS.FINNHUB_NEWS
          }));
        }
        
      } catch (error) {
        console.error('Error transforming Finnhub news data:', error);
      }
      return null;
    };
  }
}
