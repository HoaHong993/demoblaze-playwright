import { APIRequestContext, APIResponse } from '@playwright/test';
import { randomUUID } from 'crypto';

export interface Product {
  id: number;
  title: string;
  price: number;
  cat: string;
  desc: string;
  img: string;
}

export interface CartItem {
  id: string;
  cookie: string;
  prod_id: number;
}

export interface TimedResponse<T> {
  status: number;
  body: T;
  durationMs: number;
}

/**
 * Thin client over the public DemoBlaze backend (https://api.demoblaze.com).
 * The web UI calls the same endpoints, so this is used both for API tests and
 * for fast test-data setup in UI tests (create users, seed / clean carts).
 *
 * Note: the DemoBlaze front-end base64-encodes the password before sending it,
 * so the client does the same to behave exactly like a real browser session.
 */
export class DemoblazeApi {
  constructor(
    private readonly request: APIRequestContext,
    private readonly apiUrl: string,
  ) {}

  static encodePassword(password: string): string {
    return Buffer.from(password, 'utf-8').toString('base64');
  }

  private async post<T>(path: string, data: unknown): Promise<TimedResponse<T>> {
    const start = Date.now();
    const response = await this.request.post(`${this.apiUrl}${path}`, { data });
    return this.toTimed<T>(response, start);
  }

  private async get<T>(path: string): Promise<TimedResponse<T>> {
    const start = Date.now();
    const response = await this.request.get(`${this.apiUrl}${path}`);
    return this.toTimed<T>(response, start);
  }

  private async toTimed<T>(response: APIResponse, start: number): Promise<TimedResponse<T>> {
    const durationMs = Date.now() - start;
    const text = await response.text();
    let body: unknown = text;
    try {
      body = text ? JSON.parse(text) : '';
    } catch {
      body = text;
    }
    return { status: response.status(), body: body as T, durationMs };
  }

  // ---------- Auth ----------

  signUp(username: string, password: string) {
    return this.post<string | { errorMessage: string }>('/signup', {
      username,
      password: DemoblazeApi.encodePassword(password),
    });
  }

  login(username: string, password: string) {
    return this.post<string | { errorMessage: string }>('/login', {
      username,
      password: DemoblazeApi.encodePassword(password),
    });
  }

  /** Returns the auth token, or throws with the server error message. */
  async getToken(username: string, password: string): Promise<string> {
    const { body } = await this.login(username, password);
    if (typeof body === 'string' && body.startsWith('Auth_token:')) {
      return body.replace('Auth_token:', '').trim();
    }
    throw new Error(`Login failed for "${username}": ${JSON.stringify(body)}`);
  }

  // ---------- Catalog ----------

  getProducts() {
    return this.get<{ Items: Product[]; LastEvaluatedKey?: { id: string } }>('/entries');
  }

  getProductsByCategory(cat: 'phone' | 'notebook' | 'monitor') {
    return this.post<{ Items: Product[] }>('/bycat', { cat });
  }

  getProduct(id: number) {
    return this.post<Product | ''>('/view', { id: String(id) });
  }

  // ---------- Cart ----------

  addToCart(token: string, productId: number) {
    return this.post<string>('/addtocart', {
      id: randomUUID(),
      cookie: token,
      prod_id: productId,
      flag: true,
    });
  }

  viewCart(token: string) {
    return this.post<{ Items: CartItem[] }>('/viewcart', { cookie: token, flag: true });
  }

  deleteItem(cartItemId: string) {
    return this.post<string>('/deleteitem', { id: cartItemId });
  }

  /** Removes every item from the user's cart (used for test isolation). */
  async clearCart(token: string): Promise<void> {
    const { body } = await this.viewCart(token);
    for (const item of body?.Items ?? []) {
      await this.deleteItem(item.id);
    }
  }
}
