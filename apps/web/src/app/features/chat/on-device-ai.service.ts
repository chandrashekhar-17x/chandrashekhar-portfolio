import { Injectable, InjectionToken, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { LlmClient } from '@portfolio/agent';

// Opt-in on-device LLM (WebLLM + WebGPU): the model runs on the visitor's GPU,
// nothing leaves the browser, it costs nothing. ~1 GB download the first time
// (then cached by the browser). Off by default: the instant answers don't need it.

/**
 * Feature flag: off until `make eval-ondevice` has verified the model on real
 * hardware. While off, the chat never shows the toggle and never loads WebLLM.
 */
export const ON_DEVICE_AI_ENABLED = new InjectionToken<boolean>('ON_DEVICE_AI_ENABLED', {
  factory: () => false,
});

export type OnDeviceState = 'checking' | 'unsupported' | 'off' | 'loading' | 'ready' | 'error';

/** Qwen2.5 1.5B Instruct, 4-bit. f16 shaders when the GPU has them (smaller, faster). */
const MODEL_F16 = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';
const MODEL_F32 = 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC';
const PREF_KEY = 'ondevice-ai';

interface Engine {
  chat: {
    completions: {
      create(req: {
        messages: { role: string; content: string }[];
        temperature: number;
        max_tokens: number;
      }): Promise<{ choices: { message: { content: string | null } }[] }>;
    };
  };
  unload(): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class OnDeviceAi {
  readonly state = signal<OnDeviceState>('checking');
  /** Download / compile progress, e.g. "Loading model 42%". */
  readonly progress = signal('');
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly enabled = inject(ON_DEVICE_AI_ENABLED);
  private engine: Engine | undefined;
  private f16 = false;
  private checked = false;

  /** Detect WebGPU once; re-enable automatically if the visitor turned it on before. */
  async init(): Promise<void> {
    if (this.checked) return;
    this.checked = true;
    if (!this.enabled) {
      this.state.set('unsupported');
      return;
    }
    const gpu = this.browser ? (navigator as Navigator & { gpu?: GpuLike }).gpu : undefined;
    const adapter = gpu ? await gpu.requestAdapter().catch(() => null) : null;
    if (!adapter) {
      this.state.set('unsupported');
      return;
    }
    this.f16 = adapter.features.has('shader-f16');
    this.state.set('off');
    if (readPref()) void this.enable();
  }

  async toggle(): Promise<void> {
    if (this.state() === 'ready' || this.state() === 'loading') await this.disable();
    else await this.enable();
  }

  async enable(): Promise<void> {
    if (this.state() === 'unsupported') return;
    this.state.set('loading');
    this.progress.set('Starting…');
    try {
      const webllm = await import('@mlc-ai/web-llm');
      this.engine = (await webllm.CreateMLCEngine(this.f16 ? MODEL_F16 : MODEL_F32, {
        initProgressCallback: (r: { progress: number }) => {
          this.progress.set(`Loading model ${String(Math.round(r.progress * 100))}%`);
        },
      })) as unknown as Engine;
      this.state.set('ready');
      writePref(true);
    } catch {
      this.state.set('error');
      writePref(false);
    }
  }

  async disable(): Promise<void> {
    const engine = this.engine;
    this.engine = undefined;
    this.state.set('off');
    writePref(false);
    await engine?.unload().catch(() => undefined);
  }

  /** The model as the agent's LlmClient, only when it is loaded. */
  client(): LlmClient | undefined {
    const engine = this.engine;
    if (!engine || this.state() !== 'ready') return undefined;
    return {
      complete: async (messages, opts) => {
        const r = await engine.chat.completions.create({
          messages,
          temperature: opts.temperature,
          max_tokens: opts.maxTokens,
        });
        return r.choices[0]?.message.content ?? '';
      },
    };
  }
}

interface GpuLike {
  requestAdapter(): Promise<{ features: { has(name: string): boolean } } | null>;
}

function readPref(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) === 'on';
  } catch {
    return false;
  }
}

function writePref(on: boolean): void {
  try {
    localStorage.setItem(PREF_KEY, on ? 'on' : 'off');
  } catch {
    // private mode: the choice just isn't remembered
  }
}
