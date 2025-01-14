import { Injectable } from '@angular/core';
import { Storage }    from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private storage: Storage | null = null;
  private readonly initPromise: Promise<void>;

  constructor(private ionicStorage: Storage) {
    if (this.storage === null)
      this.initPromise = this.init().then();
  }

  async init() {
    this.storage = await this.ionicStorage.create();
  }

  whenReady(): Promise<void> {
    return this.initPromise;
  }

  public async set(key: string, value: any): Promise<any> {
    return this.storage?.set(key, value);
  }

  public async get(key: string): Promise<any> {
    return this.storage?.get(key);
  }

  public async remove(key: string): Promise<any> {
    return this.storage?.remove(key);
  }

  public async clear(): Promise<void> {
    return this.storage?.clear();
  }

  public async keys(): Promise<string[]> {
    return this.storage?.keys();
  }
}
