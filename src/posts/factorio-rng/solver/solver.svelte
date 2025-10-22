<script lang="ts">
	/**
	 * Reimplementation of the RNG calls from the disassembled binary.
	 */

	type TRegister = number; // 32-bit unsigned integer

	/**
	 * Single LFSR operation for Factorio RNG
	 */
	function singleLFSR(value: TRegister, a: number, b: number, c: number, d: number): TRegister {
		const bitMask = ((1 << d) - 1) >>> 0;
		return ((((value << a) ^ (value >>> b)) & bitMask) ^ (value >>> c) ^ (value << a)) >>> 0;
	}

	/**
	 * Advance the RNG state a single step.
	 * Returns the new state as a tuple of three 32-bit unsigned integers.
	 */
	function step(state: [TRegister, TRegister, TRegister]): [TRegister, TRegister, TRegister] {
		return [
			singleLFSR(state[0], 12, 6, 19, 13),
			singleLFSR(state[1], 4, 23, 25, 7),
			singleLFSR(state[2], 17, 8, 11, 21)
		];
	}

	class GF2Matrix {
		data: number[][];
		rows: number;
		cols: number;

		constructor(data: number[][]) {
			this.data = data.map(row => row.map(value => value & 1));
			this.rows = data.length;
			this.cols = data[0].length;
		}

		static zero(rows: number, cols: number): GF2Matrix {
			return new GF2Matrix(Array.from({ length: rows }, () => new Array(cols).fill(0)));
		}

		static eye(size: number): GF2Matrix {
			const data = Array.from({ length: size }, (_, i) =>
				Array.from({ length: size }, (_, j) => (i === j ? 1 : 0))
			);
			return new GF2Matrix(data);
		}

		multiplyVector(vec: number[]): number[] {
			const result: number[] = new Array(this.rows).fill(0);
			for (let i = 0; i < this.rows; i++) {
				let sum = 0;
				for (let j = 0; j < this.cols; j++) {
					sum ^= this.data[i][j] & vec[j];
				}
				result[i] = sum % 2;
			}
			return result;
		}

		multiplyMatrix(other: GF2Matrix): GF2Matrix {
			const result = GF2Matrix.zero(this.rows, other.cols);
			for (let i = 0; i < this.rows; i++) {
				for (let j = 0; j < other.cols; j++) {
					let sum = 0;
					for (let k = 0; k < this.cols; k++) {
						sum ^= this.data[i][k] & other.data[k][j];
					}
					result.data[i][j] = sum % 2;
				}
			}
			return result;
		}

		get(row: number, col: number): number {
			return this.data[row][col] & 1;
		}

		set(row: number, col: number, value: number): void {
			this.data[row][col] = value & 1;
		}

    setBits(row: number, colStart: number, value: number): void {
      for (let bit = 0; bit < 32; bit++) {
        const bitValue = (value >> (31 - bit)) & 1;
        this.set(row, colStart + bit, bitValue);
      }
    }

    swapRows(rowA: number, rowB: number): void {
      const temp = this.data[rowA];
      this.data[rowA] = this.data[rowB];
      this.data[rowB] = temp;
    }
	}

	function buildMatrix() {
		let state = [0x80000000, 0x80000000, 0x80000000] as [TRegister, TRegister, TRegister];
		// Build a 96x96 matrix representing which bits influence the current top bits
		let matrix = GF2Matrix.zero(96, 96);
    for (let i = 0; i < 96; i++) {
      // Set the current top bits in the matrix
      matrix.setBits(i, 0, state[0]);
      matrix.setBits(i, 32, state[1]);
      matrix.setBits(i, 64, state[2]);

      // Advance the state
      state = step(state);
    }
		return matrix;
	}


  function invert_init(matrix: GF2Matrix): GF2Matrix {
    const size = matrix.rows;
    const augmented = GF2Matrix.zero(size, size * 2);
    // Initialize augmented matrix [matrix | I]
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        augmented.set(i, j, matrix.get(i, j));
      }
      augmented.set(i, size + i, 1); // Identity part
    }
    return augmented;
  }

  function invert_find_pivot(augmented: GF2Matrix, pivoted_rows: number, col: number): number {
    const size = augmented.rows;
    for (let row = pivoted_rows; row < size; row++) {
      if (augmented.get(row, col) === 1) {
        return row;
      }
    }
    return -1; // No pivot found
  }

  function invert_swap_rows(augmented: GF2Matrix, rowA: number, rowB: number): void {
    augmented.swapRows(rowA, rowB);
  }

  function invert_eliminate(augmented: GF2Matrix, pivotRow: number, col: number): void {
    const size = augmented.rows;
    for (let row = 0; row < size; row++) {
      if (row !== pivotRow && augmented.get(row, col) === 1) {
        for (let j = 0; j < size * 2; j++) {
          const newValue = augmented.get(row, j) ^ augmented.get(pivotRow, j);
          augmented.set(row, j, newValue);
        }
      }
    }
  }

  type StepInfo = {
    action: string;
    col: number;
    row?: number;
    pivotRow?: number;
    step: number;
  };

  function invert_until(matrix: GF2Matrix, steps: number): { augmented: GF2Matrix; stepInfo: StepInfo } {
    const augmented = invert_init(matrix);
    const size = matrix.rows;
    let step = 0;
    let pivoted = 0;
    let lastStepInfo: StepInfo = { action: 'initial', col: -1, step: 0 };

    for (let col = 0; col < size; col++) {
      const pivotRow = invert_find_pivot(augmented, pivoted, col);
      if (pivotRow === -1)
        continue; // No pivots on this column
      
      step++;
      lastStepInfo = { action: 'find_pivot', col, row: pivotRow, step };
      if (step === steps)
        break;

      invert_swap_rows(augmented, pivoted, pivotRow);
      step++;
      lastStepInfo = { action: 'swap_rows', col, row: pivoted, pivotRow, step };
      if (step === steps)
        break;
      pivoted++;

      invert_eliminate(augmented, pivoted - 1, col);
      step++;
      lastStepInfo = { action: 'eliminate', col, row: pivoted - 1, step };
      if (step === steps)
        break;
    }
    return { augmented, stepInfo: lastStepInfo };
  }

  function countInversionSteps(matrix: GF2Matrix): number {
    const { stepInfo } = invert_until(matrix, 10000);
    return stepInfo.step;
  }

  function getStepDescription(stepInfo: StepInfo | null): string {
    if (!stepInfo) return 'Initial state';
    switch (stepInfo.action) {
      case 'find_pivot':
        return `Find pivot in column ${stepInfo.col} → row ${stepInfo.row}`;
      case 'swap_rows':
        return `Swap row ${stepInfo.row} with row ${stepInfo.pivotRow}`;
      case 'eliminate':
        return `Eliminate column ${stepInfo.col} using row ${stepInfo.row}`;
      default:
        return 'Unknown step';
    }
  }

  import { tick, onMount } from 'svelte';

  let originalMatrix: GF2Matrix | null = null; // Store the original matrix
  let displayMatrix: GF2Matrix | null = null; // Matrix to display (may be augmented)
  let rows = 0;
  let cols = 0;
  let computing = false;
  let elapsed = 0;
  let currentStep = 0;
  let maxSteps = 0;
  let currentStepInfo: StepInfo | null = null;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  const cellSize = 6; // pixels per cell
  const cellGap = 2; // pixels between cells
  const cellRound = 1; // pixels corner radius

  onMount(() => {
    if (canvas) {
      ctx = canvas.getContext('2d');
    }
    // Auto-build on load
    buildAndShow();
  });

  function renderMatrix() {
    if (!canvas || !displayMatrix) return;
    
    // Get context if we don't have it yet
    if (!ctx) {
      ctx = canvas.getContext('2d');
    }
    if (!ctx) return;
    
    const width = cols * (cellSize + cellGap);
    const height = rows * (cellSize + cellGap);

    // Set canvas size
    canvas.width = width + 2;
    canvas.height = height + 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, width + 2, height + 2);
    ctx.translate(1, 1); // slight offset for crisp borders

    // Draw cells
    const onColor = getComputedStyle(document.documentElement).getPropertyValue('--brand') || '#0066cc';
    const offColor = getComputedStyle(document.documentElement).getPropertyValue('--surface-4') || '#f0f0f0';
    ctx.beginPath();
    ctx.fillStyle = onColor;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (displayMatrix.get(i, j) === 1) {
          ctx.roundRect(j * (cellSize + cellGap), i * (cellSize + cellGap), cellSize, cellSize, cellRound);
        }
      }
    }
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = offColor;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (displayMatrix.get(i, j) === 0) {
          ctx.roundRect(j * (cellSize + cellGap), i * (cellSize + cellGap), cellSize, cellSize, cellRound);
        }
      }
    }
    ctx.fill();
  }

  async function buildAndShow() {
    computing = true;
    // allow UI to update before heavy sync work
    await tick();
    const t0 = performance.now();
    const m = buildMatrix();
    elapsed = performance.now() - t0;
    originalMatrix = m;
    displayMatrix = m;
    rows = m.rows;
    cols = m.cols;
    maxSteps = countInversionSteps(m);
    currentStep = 0;
    currentStepInfo = null;
    computing = false;
    await tick();
    renderMatrix();
  }

  function updateStep(step: number) {
    if (!originalMatrix) return;
    
    currentStep = step;
    
    if (step === 0) {
      displayMatrix = originalMatrix;
      rows = originalMatrix.rows;
      cols = originalMatrix.cols;
      currentStepInfo = null;
    } else {
      const result = invert_until(originalMatrix, step);
      displayMatrix = result.augmented;
      rows = result.augmented.rows;
      cols = result.augmented.cols;
      currentStepInfo = result.stepInfo;
    }
    
    renderMatrix();
  }

  function handleStepInput(event: Event) {
    const target = event.target as HTMLInputElement;
    updateStep(parseInt(target.value, 10));
  }
</script>

<div class="controls">
  {#if computing}
    <div class="loading">Building matrix...</div>
  {:else if displayMatrix}
    <div class="step-control">
      <label for="step-slider">
        Step {currentStep} / {maxSteps}
      </label>
      <input
        id="step-slider"
        type="range"
        min="0"
        max={maxSteps}
        value={currentStep}
        on:input={handleStepInput}
        class="step-slider"
      />
      <div class="step-info">
        {getStepDescription(currentStepInfo)}
      </div>
    </div>
    <div class="matrix-info">
      {rows} × {cols} — Built in {elapsed.toFixed(1)} ms
    </div>
  {/if}
</div>

{#if displayMatrix}
  <div class="canvas-container">
    <canvas
      bind:this={canvas}
      aria-label="GF(2) matrix visualization"
    ></canvas>
  </div>
{/if}

<style>
  .controls {
    margin: 16px 0;
  }

  .loading {
    padding: 12px;
    background: var(--surface-2);
    border-radius: 4px;
    text-align: center;
    color: var(--text-2);
  }

  .step-control {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: var(--surface-2);
    border-radius: 4px;
  }

  .step-control label {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text-1);
  }

  .step-slider {
    width: 100%;
    cursor: pointer;
  }

  .step-info {
    font-size: 0.9rem;
    color: var(--text-2);
    min-height: 1.5em;
    font-family: monospace;
  }

  .matrix-info {
    margin-top: 8px;
    font-size: 0.85rem;
    color: var(--text-3);
  }

  .canvas-container {
    display: inline-block;
    overflow: auto;
    max-width: 100%;
  }

  canvas {
    display: block;
    width: 100%;
  }
</style>