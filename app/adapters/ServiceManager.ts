import {
  dataManagers,
  PGDataManagers,
  ShopifyDataManagers,
} from "./DataManager";

export interface ServiceManager {} // eslint-disable-line @typescript-eslint/no-empty-object-type
class ServiceManagerImpl implements ServiceManager {
  private _shopifyDMs?: ShopifyDataManagers;
  private _pgDMs?: PGDataManagers;

  private get shopifyDMs(): ShopifyDataManagers {
    return (this._shopifyDMs ??= dataManagers.shopify);
  }
  private get pgDMs(): PGDataManagers {
    return (this._pgDMs ??= dataManagers.pg);
  }
}
export const serviceManager: ServiceManager = new ServiceManagerImpl();
