import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const VIEWPORTS = [
  { name: '375x812', width: 375, height: 812, deviceScaleFactor: 3 },
  { name: '390x844', width: 390, height: 844, deviceScaleFactor: 3 },
  { name: '812x375', width: 812, height: 375, deviceScaleFactor: 2 },
  { name: '844x390', width: 844, height: 390, deviceScaleFactor: 2 },
];

const PAGES = [
  { id: 'A', name: 'Main Workspace' },
  { id: 'B', name: 'Documentation Mode' },
  { id: 'C', name: 'Traceability Calendar' },
  { id: 'D', name: 'Teams Map' },
  { id: 'E', name: 'Prompts Library' },
];

const OUTPUT_DIR = path.resolve('qa-mobile-shots');
const REPORT_PATH = path.resolve('qa-mobile-report.json');

class CDPClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Set();
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
      this.ws.addEventListener('message', (event) => {
        const message = JSON.parse(event.data.toString());
        if (message.id && this.pending.has(message.id)) {
          const { resolve: onResolve, reject: onReject } = this.pending.get(message.id);
          this.pending.delete(message.id);
          if (message.error) {
            onReject(new Error(message.error.message));
          } else {
            onResolve(message.result);
          }
          return;
        }

        for (const listener of this.listeners) {
          listener(message);
        }
      });
      this.ws.addEventListener('close', () => {
        for (const { reject: onReject } of this.pending.values()) {
          onReject(new Error('WebSocket closed'));
        }
        this.pending.clear();
      });
    });
  }

  async close() {
    if (!this.ws) {
      return;
    }
    await new Promise((resolve) => {
      this.ws.addEventListener('close', resolve, { once: true });
      this.ws.close();
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) {
      payload.sessionId = sessionId;
    }

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
    });
  }

  waitFor(method, predicate, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.listeners.delete(listener);
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);

      const listener = (message) => {
        if (message.method !== method) {
          return;
        }
        if (predicate && !predicate(message)) {
          return;
        }
        clearTimeout(timeoutId);
        this.listeners.delete(listener);
        resolve(message);
      };

      this.listeners.add(listener);
    });
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getBrowserDebuggerUrl() {
  const response = await fetch('http://127.0.0.1:9222/json/version');
  if (!response.ok) {
    throw new Error(`Cannot reach Chrome debugging endpoint: ${response.status}`);
  }
  const payload = await response.json();
  return payload.webSocketDebuggerUrl;
}

function buildBaseUrl() {
  return pathToFileURL(path.resolve('dist', 'index.html')).href;
}

function buildPageUrl(baseUrl, pageId) {
  const url = new URL(baseUrl);
  url.searchParams.set('responsive_diag', '1');
  url.searchParams.set('page', pageId);
  return url.toString();
}

async function attachPage(browser, viewport) {
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await browser.send('Target.attachToTarget', {
    targetId,
    flatten: true,
  });

  const orientation = viewport.width > viewport.height
    ? { type: 'landscapePrimary', angle: 90 }
    : { type: 'portraitPrimary', angle: 0 };

  await browser.send('Page.enable', {}, sessionId);
  await browser.send('Runtime.enable', {}, sessionId);
  await browser.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.deviceScaleFactor,
    mobile: true,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
    screenOrientation: orientation,
  }, sessionId);
  await browser.send('Emulation.setTouchEmulationEnabled', {
    enabled: true,
    maxTouchPoints: 5,
  }, sessionId);
  await browser.send('Emulation.setEmitTouchEventsForMouse', {
    enabled: true,
    configuration: 'mobile',
  }, sessionId);

  return { sessionId, targetId };
}

async function navigate(browser, sessionId, url) {
  const loadPromise = browser.waitFor(
    'Page.loadEventFired',
    (message) => message.sessionId === sessionId,
    15000,
  );
  await browser.send('Page.navigate', { url }, sessionId);
  await loadPromise;
  await sleep(1200);
}

async function evaluate(browser, sessionId, expression) {
  const { result } = await browser.send(
    'Runtime.evaluate',
    {
      expression,
      returnByValue: true,
      awaitPromise: true,
    },
    sessionId,
  );
  return result.value;
}

async function captureScreenshot(browser, sessionId, filePath) {
  const { data } = await browser.send(
    'Page.captureScreenshot',
    { format: 'png', fromSurface: true },
    sessionId,
  );
  await fs.writeFile(filePath, Buffer.from(data, 'base64'));
}

function diagnosticsExpression() {
  return `(() => {
    const parseDiagnostics = () => {
      const raw = document.getElementById('responsive-diagnostics')?.textContent || '{}';
      try {
        return JSON.parse(raw);
      } catch {
        return { parseError: true, raw };
      }
    };

    const rect = (selector) => {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) {
        return null;
      }
      const box = element.getBoundingClientRect();
      return {
        top: box.top,
        right: box.right,
        bottom: box.bottom,
        left: box.left,
        width: box.width,
        height: box.height,
      };
    };

    const visibleScrollable = Array.from(document.querySelectorAll('*'))
      .filter((element) => element instanceof HTMLElement)
      .map((element) => {
        const styles = window.getComputedStyle(element);
        const box = element.getBoundingClientRect();
        return {
          element,
          overflowY: styles.overflowY,
          clientHeight: element.clientHeight,
          scrollHeight: element.scrollHeight,
          width: box.width,
          height: box.height,
        };
      })
      .filter((item) =>
        (item.overflowY === 'auto' || item.overflowY === 'scroll') &&
        item.scrollHeight > item.clientHeight &&
        item.width > 0 &&
        item.height > 0,
      )
      .slice(0, 12)
      .map((item) => ({
        overflowY: item.overflowY,
        clientHeight: item.clientHeight,
        scrollHeight: item.scrollHeight,
        className: item.element.className,
        tagName: item.element.tagName,
      }));

    return {
      diagnostics: parseDiagnostics(),
      bodyOverflow: window.getComputedStyle(document.body).overflow,
      bodyOverflowY: window.getComputedStyle(document.body).overflowY,
      rootOverflow: window.getComputedStyle(document.getElementById('root')).overflow,
      menuButtonRect: rect('[data-mobile-menu-button]'),
      composerRect: rect('.ui-chat-composer'),
      bottomNavRect: rect('.ui-bottomnav'),
      topBarRect: rect('.ui-topbar'),
      workspaceTabRects: Array.from(document.querySelectorAll('[data-workspace-tab]')).map((element) => {
        const box = element.getBoundingClientRect();
        return {
          label: element.getAttribute('data-workspace-tab'),
          left: box.left,
          right: box.right,
          width: box.width,
        };
      }),
      visibleScrollable,
      activeTitle: document.title,
    };
  })()`;
}

async function clickMenu(browser, sessionId) {
  return evaluate(
    browser,
    sessionId,
    `(() => {
      const button = document.querySelector('[data-mobile-menu-button]');
      if (!(button instanceof HTMLElement)) {
        return false;
      }
      button.click();
      return true;
    })()`,
  );
}

async function clickMenuItem(browser, sessionId, label) {
  return evaluate(
    browser,
    sessionId,
    `(() => {
      const button = Array.from(document.querySelectorAll('[data-mobile-menu-item]'))
        .find((element) => element.getAttribute('data-mobile-menu-item') === ${JSON.stringify(label)});
      if (!(button instanceof HTMLElement)) {
        return false;
      }
      button.click();
      return true;
    })()`,
  );
}

async function run() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const baseUrl = buildBaseUrl();
  const browser = new CDPClient(await getBrowserDebuggerUrl());
  await browser.connect();

  const report = {
    baseUrl,
    generatedAt: new Date().toISOString(),
    cases: [],
    menuChecks: [],
  };

  try {
    for (const viewport of VIEWPORTS) {
      for (const page of PAGES) {
        const { sessionId, targetId } = await attachPage(browser, viewport);
        try {
          await navigate(browser, sessionId, buildPageUrl(baseUrl, page.id));
          const diagnostics = await evaluate(browser, sessionId, diagnosticsExpression());
          const screenshotPath = path.join(
            OUTPUT_DIR,
            `${viewport.name}-${page.id}.png`,
          );
          await captureScreenshot(browser, sessionId, screenshotPath);
          report.cases.push({
            viewport: viewport.name,
            page: page.name,
            screenshotPath,
            diagnostics,
          });
        } finally {
          await browser.send('Target.closeTarget', { targetId });
        }
      }

      const { sessionId, targetId } = await attachPage(browser, viewport);
      try {
        await navigate(browser, sessionId, buildPageUrl(baseUrl, 'A'));
        await clickMenu(browser, sessionId);
        await sleep(400);
        const openState = await evaluate(browser, sessionId, diagnosticsExpression());
        const openShot = path.join(OUTPUT_DIR, `${viewport.name}-menu-open.png`);
        await captureScreenshot(browser, sessionId, openShot);

        await clickMenuItem(browser, sessionId, 'Documentation Mode');
        await sleep(500);
        const afterNavigate = await evaluate(browser, sessionId, diagnosticsExpression());

        report.menuChecks.push({
          viewport: viewport.name,
          openShot,
          openState,
          afterNavigate,
        });
      } finally {
        await browser.send('Target.closeTarget', { targetId });
      }
    }

    await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
