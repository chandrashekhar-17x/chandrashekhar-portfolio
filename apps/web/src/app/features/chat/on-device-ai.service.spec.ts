import { TestBed } from '@angular/core/testing';

import { ON_DEVICE_AI_ENABLED, OnDeviceAi } from './on-device-ai.service';

// The on-device model is opt-in and only offered when the browser has WebGPU.
describe('OnDeviceAi', () => {
  const nav = navigator as Navigator & { gpu?: unknown };
  const original = nav.gpu;

  const enable = () =>
    TestBed.configureTestingModule({
      providers: [{ provide: ON_DEVICE_AI_ENABLED, useValue: true }],
    });

  afterEach(() => {
    Object.defineProperty(navigator, 'gpu', { value: original, configurable: true });
    localStorage.removeItem('ondevice-ai');
  });

  it('is hidden while the feature flag is off (the default), even with WebGPU', async () => {
    Object.defineProperty(navigator, 'gpu', {
      value: { requestAdapter: () => Promise.resolve({ features: new Set<string>() }) },
      configurable: true,
    });
    const ai = TestBed.inject(OnDeviceAi);
    await ai.init();
    expect(ai.state()).toBe('unsupported');
  });

  it('is unsupported without WebGPU (the chat hides the toggle)', async () => {
    enable();
    Object.defineProperty(navigator, 'gpu', { value: undefined, configurable: true });
    const ai = TestBed.inject(OnDeviceAi);
    await ai.init();
    expect(ai.state()).toBe('unsupported');
    expect(ai.client()).toBeUndefined();
  });

  it('is off by default with WebGPU: nothing downloads until the visitor opts in', async () => {
    enable();
    const adapter = { features: new Set<string>(['shader-f16']) };
    Object.defineProperty(navigator, 'gpu', {
      value: { requestAdapter: () => Promise.resolve(adapter) },
      configurable: true,
    });
    const ai = TestBed.inject(OnDeviceAi);
    await ai.init();
    expect(ai.state()).toBe('off');
    expect(ai.client()).toBeUndefined();
  });
});
