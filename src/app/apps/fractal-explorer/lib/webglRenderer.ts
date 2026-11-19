import { computeAutoIterations, complexSpanPerPixel } from "./camera";
import {
  FRACTAL_FORMULAS,
  coloringModeToIndex,
  formulaIdToIndex,
  interiorModeToIndex,
  transferScaleToIndex,
} from "./formulas";
import { buildPaletteRGBA, hexToRgb01, paletteFingerprint } from "./palette";
import { VERTEX_SHADER_SRC, buildFragmentShaderDS64, buildFragmentShaderF32 } from "./shaders";
import type { FractalSettings } from "./types";

interface CompiledProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

const COMMON_UNIFORM_NAMES = [
  "u_resolution",
  "u_formula",
  "u_isJulia",
  "u_power",
  "u_paramP",
  "u_maxIter",
  "u_bailout",
  "u_coloring",
  "u_interior",
  "u_interiorColor",
  "u_transfer",
  "u_paletteScale",
  "u_paletteOffset",
  "u_stripeDensity",
  "u_trap",
  "u_lightEnabled",
  "u_lightDir",
  "u_lightStrength",
  "u_lightSpecular",
  "u_aa",
  "u_palette",
];

const F32_EXTRA_UNIFORMS = ["u_center", "u_scale", "u_juliaC", "u_cosR", "u_sinR"];
const DS64_EXTRA_UNIFORMS = [
  "u_one",
  "u_split",
  "u_centerX_ds",
  "u_centerY_ds",
  "u_scale_ds",
  "u_juliaCx_ds",
  "u_juliaCy_ds",
  "u_cosR_ds",
  "u_sinR_ds",
];

export function splitFloat64(val: number): [number, number] {
  const hi = Math.fround(val);
  const lo = Math.fround(val - hi);
  return [hi, lo];
}

export function canUseDS64(settings: FractalSettings): boolean {
  const meta = FRACTAL_FORMULAS[settings.family];
  return meta.supportsDS64 && Math.abs(settings.power - 2) < 1e-4;
}

export class WebGLFractalRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private vbo: WebGLBuffer | null = null;
  private paletteTex: WebGLTexture | null = null;
  private lastPaletteKey = "";
  private progF32: CompiledProgram | null = null;
  private progDS64: CompiledProgram | null = null;
  private ds64Failed = false;
  private contextLost = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.initContext();
    canvas.addEventListener("webglcontextlost", this.handleLost);
    canvas.addEventListener("webglcontextrestored", this.handleRestored);
  }

  private handleLost = (e: Event) => {
    e.preventDefault();
    this.contextLost = true;
  };

  private handleRestored = () => {
    this.contextLost = false;
    this.progF32 = null;
    this.progDS64 = null;
    this.paletteTex = null;
    this.lastPaletteKey = "";
    this.initContext();
  };

  private initContext(): void {
    const gl = this.canvas.getContext("webgl2", {
      antialias: false,
      depth: false,
      stencil: false,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    if (!gl) {
      this.gl = null;
      return;
    }
    this.gl = gl;

    // Create static quad geometry
    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();
    if (vao && vbo) {
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
      this.vao = vao;
      this.vbo = vbo;
    }

    // Create 1024x1 palette texture
    const tex = gl.createTexture();
    if (tex) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.paletteTex = tex;
    }
  }

  public isAvailable(): boolean {
    return this.gl !== null && !this.contextLost;
  }

  public isDS64Available(): boolean {
    return this.isAvailable() && !this.ds64Failed;
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl;
    if (!gl) return null;
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn("[FractalExplorer] Shader compile error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private linkProgram(fragSource: string, uniformNames: string[]): CompiledProgram | null {
    const gl = this.gl;
    if (!gl) return null;
    const vs = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fragSource);
    if (!vs || !fs) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      return null;
    }

    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, "a_pos");
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("[FractalExplorer] Program link error:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    for (const name of uniformNames) {
      uniforms[name] = gl.getUniformLocation(program, name);
    }
    return { program, uniforms };
  }

  private getProgram(mode: "f32" | "ds64"): CompiledProgram | null {
    if (mode === "ds64") {
      if (this.ds64Failed) return null;
      if (!this.progDS64) {
        this.progDS64 = this.linkProgram(buildFragmentShaderDS64(), [
          ...COMMON_UNIFORM_NAMES,
          ...DS64_EXTRA_UNIFORMS,
        ]);
        if (!this.progDS64) {
          this.ds64Failed = true;
          return null;
        }
      }
      return this.progDS64;
    }

    if (!this.progF32) {
      this.progF32 = this.linkProgram(buildFragmentShaderF32(), [
        ...COMMON_UNIFORM_NAMES,
        ...F32_EXTRA_UNIFORMS,
      ]);
    }
    return this.progF32;
  }

  private syncPaletteTexture(settings: FractalSettings): void {
    const gl = this.gl;
    if (!gl || !this.paletteTex) return;
    const key = paletteFingerprint(settings.palette);
    if (key === this.lastPaletteKey) return;
    this.lastPaletteKey = key;

    const rgba = buildPaletteRGBA(settings.palette, 1024);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.paletteTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
  }

  public render(
    settings: FractalSettings,
    pixelW: number,
    pixelH: number,
    precision: "f32" | "ds64",
    aaOverride?: 1 | 2 | 4,
  ): { ok: boolean; effectiveIter: number } {
    const gl = this.gl;
    if (!gl || this.contextLost || !this.vao || pixelW < 2 || pixelH < 2) {
      return { ok: false, effectiveIter: settings.maxIter };
    }

    if (this.canvas.width !== pixelW || this.canvas.height !== pixelH) {
      this.canvas.width = pixelW;
      this.canvas.height = pixelH;
    }

    const useDS64 = precision === "ds64" && canUseDS64(settings) && !this.ds64Failed;
    let prog = this.getProgram(useDS64 ? "ds64" : "f32");
    if (!prog && useDS64) {
      prog = this.getProgram("f32");
    }
    if (!prog) return { ok: false, effectiveIter: settings.maxIter };

    this.syncPaletteTexture(settings);

    const effectiveIter = computeAutoIterations(
      settings.maxIter,
      settings.camera.zoom,
      settings.autoIter,
    );
    const scale = complexSpanPerPixel(pixelH, settings.camera.zoom);
    const cosR = Math.cos(settings.camera.rotation);
    const sinR = Math.sin(settings.camera.rotation);
    const intCol = hexToRgb01(settings.interiorColor);

    const az = (settings.lighting.azimuth * Math.PI) / 180;
    const el = (settings.lighting.elevation * Math.PI) / 180;
    const lx = Math.cos(el) * Math.cos(az);
    const ly = Math.cos(el) * Math.sin(az);
    const lz = Math.sin(el);

    const u = prog.uniforms;
    gl.viewport(0, 0, pixelW, pixelH);
    gl.useProgram(prog.program);
    gl.bindVertexArray(this.vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.paletteTex);
    gl.uniform1i(u.u_palette, 0);

    gl.uniform2f(u.u_resolution, pixelW, pixelH);
    gl.uniform1i(u.u_formula, formulaIdToIndex(settings.family));
    gl.uniform1i(u.u_isJulia, settings.isJulia ? 1 : 0);
    gl.uniform1f(u.u_power, settings.power);
    gl.uniform1f(u.u_paramP, settings.paramP);
    gl.uniform1i(u.u_maxIter, Math.min(4096, effectiveIter));
    gl.uniform1f(u.u_bailout, Math.max(16, settings.bailout));
    gl.uniform1i(u.u_coloring, coloringModeToIndex(settings.coloring));
    gl.uniform1i(u.u_interior, interiorModeToIndex(settings.interior));
    gl.uniform3f(u.u_interiorColor, intCol[0], intCol[1], intCol[2]);
    gl.uniform1i(u.u_transfer, transferScaleToIndex(settings.transfer));
    gl.uniform1f(u.u_paletteScale, settings.paletteScale);
    gl.uniform1f(u.u_paletteOffset, settings.paletteOffset);
    gl.uniform1f(u.u_stripeDensity, settings.stripeDensity);
    gl.uniform3f(u.u_trap, settings.trap.x, settings.trap.y, settings.trap.radius);
    gl.uniform1i(u.u_lightEnabled, settings.lighting.enabled ? 1 : 0);
    gl.uniform3f(u.u_lightDir, lx, ly, lz);
    gl.uniform1f(u.u_lightStrength, settings.lighting.strength);
    gl.uniform1f(u.u_lightSpecular, settings.lighting.specular);
    gl.uniform1i(u.u_aa, aaOverride ?? settings.aa);

    if (useDS64 && prog === this.progDS64) {
      gl.uniform1f(u.u_one, 1.0);
      gl.uniform1f(u.u_split, 4097.0);
      const [cxH, cxL] = splitFloat64(settings.camera.centerX);
      const [cyH, cyL] = splitFloat64(settings.camera.centerY);
      const [scH, scL] = splitFloat64(scale);
      const [jxH, jxL] = splitFloat64(settings.juliaCx);
      const [jyH, jyL] = splitFloat64(settings.juliaCy);
      const [crH, crL] = splitFloat64(cosR);
      const [srH, srL] = splitFloat64(sinR);
      gl.uniform2f(u.u_centerX_ds, cxH, cxL);
      gl.uniform2f(u.u_centerY_ds, cyH, cyL);
      gl.uniform2f(u.u_scale_ds, scH, scL);
      gl.uniform2f(u.u_juliaCx_ds, jxH, jxL);
      gl.uniform2f(u.u_juliaCy_ds, jyH, jyL);
      gl.uniform2f(u.u_cosR_ds, crH, crL);
      gl.uniform2f(u.u_sinR_ds, srH, srL);
    } else {
      gl.uniform2f(u.u_center, settings.camera.centerX, settings.camera.centerY);
      gl.uniform1f(u.u_scale, scale);
      gl.uniform2f(u.u_juliaC, settings.juliaCx, settings.juliaCy);
      gl.uniform1f(u.u_cosR, cosR);
      gl.uniform1f(u.u_sinR, sinR);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
    return { ok: true, effectiveIter };
  }

  public dispose(): void {
    this.canvas.removeEventListener("webglcontextlost", this.handleLost);
    this.canvas.removeEventListener("webglcontextrestored", this.handleRestored);
    const gl = this.gl;
    if (!gl) return;
    if (this.progF32) gl.deleteProgram(this.progF32.program);
    if (this.progDS64) gl.deleteProgram(this.progDS64.program);
    if (this.paletteTex) gl.deleteTexture(this.paletteTex);
    if (this.vbo) gl.deleteBuffer(this.vbo);
    if (this.vao) gl.deleteVertexArray(this.vao);
    this.progF32 = null;
    this.progDS64 = null;
    this.paletteTex = null;
    this.vbo = null;
    this.vao = null;
    this.gl = null;
  }
}
