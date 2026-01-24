/**
 * Browser Automation Service
 * Uses Puppeteer to fetch feeds that block standard HTTP clients
 */

// @ts-ignore - Puppeteer will be available after npm install
import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from './logger.js';

export interface BrowserFetchOptions {
  timeout?: number;
  waitForSelector?: string;
  waitUntil?: 'domcontentloaded' | 'load' | 'networkidle0' | 'networkidle2';
  userAgent?: string;
  viewport?: { width: number; height: number };
}

export class BrowserAutomationService {
  private browser: Browser | null = null;
  private isLaunching: boolean = false;
  private maxConcurrent: number = 3;
  private activePages: number = 0;

  /**
   * Check if browser automation is available
   */
  isAvailable(): boolean {
    try {
      // Check if Puppeteer is installed and can be loaded
      return true;
    } catch (error) {
      logger.error('Puppeteer not available', error as Error);
      return false;
    }
  }

  /**
   * Warm up browser instance (pre-launch)
   */
  async warmUp(): Promise<void> {
    if (!this.browser) {
      await this.getBrowser();
    }
  }

  /**
   * Get or create browser instance
   */
  private async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.connected) {
      return this.browser;
    }

    // Wait if already launching
    while (this.isLaunching) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (this.browser && this.browser.connected) {
      return this.browser;
    }

    this.isLaunching = true;

    try {
      logger.debug('Launching browser...');
      
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--single-process', // Reduced resource usage
          '--disable-extensions',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-breakpad',
          '--disable-component-extensions-with-background-pages',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-renderer-backgrounding',
          '--disable-sync',
          '--window-size=1920x1080',
        ],
      });

      logger.debug('Browser launched successfully');
      
      // Handle browser disconnect
      this.browser.on('disconnected', () => {
        logger.debug('Browser disconnected');
        this.browser = null;
      });

      return this.browser;
    } catch (error) {
      logger.error('Failed to launch browser', error as Error);
      this.browser = null;
      throw error;
    } finally {
      this.isLaunching = false;
    }
  }

  /**
   * Fetch feed using headless browser.
   * Uses domcontentloaded by default to reduce timeout/target-close issues on feed URLs.
   */
  async fetchWithBrowser(url: string, options: BrowserFetchOptions = {}): Promise<string> {
    const {
      timeout = 30000,
      waitUntil = 'domcontentloaded',
      userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport = { width: 1920, height: 1080 },
    } = options;

    const doFetch = async (): Promise<string> => {
      let page: Page | null = null;
      try {
        const browser = await this.getBrowser();
        page = await browser.newPage();

        logger.debug(`Fetching with browser: ${url}`);

        await page.setUserAgent(userAgent);
        await page.setViewport(viewport);
        await page.setExtraHTTPHeaders({
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        });

        const response = await page.goto(url, { timeout, waitUntil });

        if (!response) {
          throw new Error('No response from page');
        }
        if (!response.ok()) {
          throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
        }

        const content = await page.content();
        logger.debug(`Successfully fetched ${url} (${content.length} bytes)`);
        return content;
      } finally {
        if (page) {
          await page.close().catch((err: any) => {
            logger.error('Error closing page', err);
          });
        }
      }
    };

    while (this.activePages >= this.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.activePages++;
    try {
      return await doFetch();
    } catch (error: any) {
      const isTargetClosed =
        error?.name === 'TargetCloseError' ||
        /Target closed|Protocol error \(Target\.setAutoAttach\)/i.test(String(error?.message ?? ''));
      if (isTargetClosed && this.browser) {
        this.browser = null;
        try {
          return await doFetch();
        } catch (retryErr: any) {
          logger.error(`Failed to fetch ${url}`, retryErr);
          throw retryErr;
        }
      }
      logger.error(`Failed to fetch ${url}`, error);
      throw error;
    } finally {
      this.activePages--;
    }
  }

  /**
   * Shutdown browser instance
   */
  async shutdown(): Promise<void> {
    if (this.browser) {
      logger.debug('Shutting down browser...');
      try {
        await this.browser.close();
        this.browser = null;
        logger.debug('Browser shut down');
      } catch (error) {
        logger.error('Error shutting down browser', error as Error);
      }
    }
  }
}

// Export singleton instance
export const browserAutomationService = new BrowserAutomationService();
