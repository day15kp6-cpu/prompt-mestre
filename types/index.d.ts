export type Status = string

declare module 'claude-code' {
  interface PluginState {
    'prompt-mestre': { status: Status; original: string }
  }
}
