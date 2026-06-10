import { Stronghold, type Client, type Store } from '@tauri-apps/plugin-stronghold';
import { appDataDir, join } from '@tauri-apps/api/path';

class StrongholdService {
  private static instance: StrongholdService;
  private stronghold: Stronghold | null = null;
  private client: Client | null = null;
  private store: Store | null = null;
  private vaultPath: string | null = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): StrongholdService {
    if (!StrongholdService.instance) {
      StrongholdService.instance = new StrongholdService();
    }
    return StrongholdService.instance;
  }

  private async initialize(): Promise<void> {
    if (this.stronghold) return;
    if (this.isInitializing) return this.initPromise!;

    this.isInitializing = true;
    this.initPromise = (async () => {
      try {
        const appData = await appDataDir();
        this.vaultPath = await join(appData, "fluely.hold");
        
        
        this.stronghold = await Stronghold.load(this.vaultPath, "fluely-local-vault");
        
        
        try {
          this.client = await this.stronghold.loadClient("fluely-client");
        } catch {
          this.client = await this.stronghold.createClient("fluely-client");
        }
        
        this.store = this.client.getStore();
      } catch (error) {
        console.error("Failed to initialize Stronghold:", error);
        this.stronghold = null;
        this.isInitializing = false;
        throw error;
      } finally {
        this.isInitializing = false;
      }
    })();

    return this.initPromise;
  }

  public async getStore(): Promise<Store> {
    await this.initialize();
    if (!this.store) throw new Error("Stronghold store not initialized");
    return this.store;
  }

  public async save(): Promise<void> {
    if (this.stronghold) {
      await this.stronghold.save();
    }
  }
}

export const strongholdService = StrongholdService.getInstance();
