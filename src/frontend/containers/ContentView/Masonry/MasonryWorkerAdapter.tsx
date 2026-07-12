import { runInAction } from 'mobx';

import { Dimensions } from '../../../entities/File';
// Force Webpack to include worker and WASM file in the build folder!
import { MasonryType, MasonryWorker, default as init } from 'wasm/packages/masonry';
import { ITransform, Layouter } from './layout-helpers';

export interface MasonryOptions {
  type: MasonryType;
  thumbSize: number;
  padding: number;
  /** Extra vertical space (in pixels) reserved below each image for the filename/resolution caption */
  captionHeight: number;
}

const defaultOpts: MasonryOptions = {
  type: MasonryType.Vertical,
  thumbSize: 300,
  padding: 8,
  captionHeight: 0,
};

export class MasonryWorkerAdapter implements Layouter {
  private worker?: MasonryWorker;
  private memory?: WebAssembly.Memory;

  private prevNumImgs: number = 0;

  // The WASM worker computes the layout based on image dimensions only.
  // When a caption is shown below each image, that layout is post-processed here:
  // every cell grows by captionHeight, and cells are shifted down accordingly.
  private adjustedTransforms?: Uint32Array;
  private captionHeight: number = 0;

  async initialize(numItems: number) {
    if (this.memory !== undefined && this.worker !== undefined) {
      return;
    }

    this.prevNumImgs = numItems;

    console.debug('initializing masonry worker...');
    const wasm = await init();
    this.memory = wasm.memory;

    const worker = new Worker(new URL('wasm/packages/masonry/worker.js', import.meta.url), {
      type: 'module',
    });
    worker.postMessage(this.memory);
    this.worker = new MasonryWorker(numItems);
  }

  async compute(
    imgs: Dimensions[],
    numImgs: number,
    containerWidth: number,
    opts: Partial<MasonryOptions>,
  ): Promise<number | undefined> {
    const worker = this.worker;
    if (worker === undefined) {
      return Promise.reject('Worker is uninitialized.');
    }
    // Skip calculation when numImgs is 0 to avoid bugs caused by spamming refreshes.
    // This method should return 0 when numImgs is 0 anyway.
    if (numImgs === 0) {
      return 0;
    }

    if (this.prevNumImgs !== numImgs) {
      worker.resize(numImgs);
    }

    this.prevNumImgs = numImgs;
    runInAction(() => {
      for (let i = 0; i < imgs.length; i++) {
        worker.set_dimension(i, imgs[i].width, imgs[i].height);
      }
    });

    await worker.compute(
      containerWidth,
      opts.type ?? defaultOpts.type,
      opts.thumbSize ?? defaultOpts.thumbSize,
      opts.padding ?? defaultOpts.padding,
    );
    return this.postProcess(numImgs, opts);
  }

  async recompute(
    containerWidth: number,
    opts: Partial<MasonryOptions>,
  ): Promise<number | undefined> {
    if (this.worker === undefined) {
      return Promise.reject('Worker is uninitialized.');
    }
    await this.worker.compute(
      containerWidth,
      opts.type ?? defaultOpts.type,
      opts.thumbSize ?? defaultOpts.thumbSize,
      opts.padding ?? defaultOpts.padding,
    );
    return this.postProcess(this.prevNumImgs, opts);
  }

  /**
   * Applies the caption height to the layout computed by the WASM worker
   * and returns the adjusted container height.
   */
  private postProcess(numImgs: number, opts: Partial<MasonryOptions>): number {
    const worker = this.worker;
    const memory = this.memory;
    if (worker === undefined || memory === undefined) {
      throw new Error('Worker is uninitialized.');
    }
    const captionHeight = opts.captionHeight ?? defaultOpts.captionHeight;
    this.captionHeight = captionHeight;
    if (captionHeight === 0 || numImgs === 0) {
      return worker.get_height();
    }

    const type = opts.type ?? defaultOpts.type;
    const padding = opts.padding ?? defaultOpts.padding;

    if (this.adjustedTransforms === undefined || this.adjustedTransforms.length < numImgs * 4) {
      this.adjustedTransforms = new Uint32Array(numImgs * 4);
    }
    const adjusted = this.adjustedTransforms;
    const mem = new Uint32Array(memory.buffer);

    let containerHeight = 0;
    if (type === MasonryType.Vertical) {
      // Cells keep their column assignment; each cell shifts down by one
      // caption height for every cell above it in the same column.
      const columnItemCounts: number[] = [];
      for (let i = 0; i < numImgs; i++) {
        const o = worker.get_transform(i) >>> 2;
        const width = mem[o];
        const height = mem[o + 1];
        const top = mem[o + 2];
        const left = mem[o + 3];
        // The worker positions each cell at left = columnIndex * (itemWidth + padding)
        const columnWidth = width + padding;
        const col = columnWidth > 0 ? Math.round(left / columnWidth) : 0;
        const itemsAbove = columnItemCounts[col] ?? 0;
        columnItemCounts[col] = itemsAbove + 1;

        const adjTop = top + itemsAbove * captionHeight;
        const adjHeight = height + captionHeight;
        adjusted[i * 4] = width;
        adjusted[i * 4 + 1] = adjHeight;
        adjusted[i * 4 + 2] = adjTop;
        adjusted[i * 4 + 3] = left;
        containerHeight = Math.max(containerHeight, adjTop + adjHeight + padding);
      }
    } else {
      // Horizontal masonry and grid layouts place items in rows sharing the same
      // top offset, so each row shifts down by one caption height per row above it.
      let rowIndex = -1;
      let prevTop = -1;
      for (let i = 0; i < numImgs; i++) {
        const o = worker.get_transform(i) >>> 2;
        const width = mem[o];
        const height = mem[o + 1];
        const top = mem[o + 2];
        const left = mem[o + 3];
        if (top !== prevTop) {
          rowIndex++;
          prevTop = top;
        }

        const adjTop = top + rowIndex * captionHeight;
        const adjHeight = height + captionHeight;
        adjusted[i * 4] = width;
        adjusted[i * 4 + 1] = adjHeight;
        adjusted[i * 4 + 2] = adjTop;
        adjusted[i * 4 + 3] = left;
        containerHeight = Math.max(containerHeight, adjTop + adjHeight + padding);
      }
    }
    return containerHeight;
  }

  // This method will be available in the custom VirtualizedRenderer component as layout.getItemLayout
  getTransform(index: number): ITransform {
    if (this.worker === undefined || this.memory === undefined) {
      throw new Error('Worker is uninitialized.');
    }
    if (this.captionHeight > 0 && this.adjustedTransforms !== undefined) {
      return this.adjustedTransforms.subarray(
        index * 4,
        index * 4 + 4,
      ) as unknown as ITransform;
    }
    const ptr = this.worker.get_transform(index);
    return new Uint32Array(this.memory.buffer, ptr, 4) as unknown as ITransform;
  }
}
