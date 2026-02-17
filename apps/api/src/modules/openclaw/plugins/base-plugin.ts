export interface OpenClawPlugin {
  name: string;
  description: string;
  initialize(): Promise<void>;
  dispose(): Promise<void>;
}
