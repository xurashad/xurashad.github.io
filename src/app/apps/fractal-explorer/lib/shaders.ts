export const VERTEX_SHADER_SRC = `#version 300 es
precision highp float;
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const COMMON_UNIFORMS_AND_HELPERS = `
uniform vec2 u_resolution;
uniform int u_formula;      // 0:Mandelbrot 1:BurningShip 2:Tricorn 3:Celtic 4:Buffalo 5:Phoenix 6:Newton 7:Nova 8:Magnet1 9:Lambda
uniform int u_isJulia;
uniform float u_power;
uniform float u_paramP;
uniform int u_maxIter;
uniform float u_bailout;
uniform int u_coloring;     // 0:smooth 1:distance 2:trap-cross 3:trap-ring 4:trap-point 5:stripe 6:decomp 7:orbit-avg
uniform int u_interior;     // 0:solid 1:magnitude 2:trap 3:min-orbit
uniform vec3 u_interiorColor;
uniform int u_transfer;     // 0:linear 1:log 2:sqrt
uniform float u_paletteScale;
uniform float u_paletteOffset;
uniform float u_stripeDensity;
uniform vec3 u_trap;        // x, y, radius
uniform int u_lightEnabled;
uniform vec3 u_lightDir;    // normalized 3D light direction
uniform float u_lightStrength;
uniform float u_lightSpecular;
uniform int u_aa;           // 1, 2, 4
uniform sampler2D u_palette;

out vec4 fragColor;

vec2 cmul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 cdiv(vec2 a, vec2 b) {
  float d = max(dot(b, b), 1e-30);
  return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / d;
}

vec2 cpow(vec2 z, float p) {
  if (abs(p - 2.0) < 1e-5) {
    return vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y);
  }
  if (abs(p - 3.0) < 1e-5) {
    float x2 = z.x * z.x;
    float y2 = z.y * z.y;
    return vec2(z.x * (x2 - 3.0 * y2), z.y * (3.0 * x2 - y2));
  }
  if (abs(p - 4.0) < 1e-5) {
    float x2 = z.x * z.x;
    float y2 = z.y * z.y;
    return vec2(x2 * x2 - 6.0 * x2 * y2 + y2 * y2, 4.0 * z.x * z.y * (x2 - y2));
  }
  float r2 = dot(z, z);
  if (r2 < 1e-30) return vec2(0.0);
  float r = pow(r2, 0.5 * p);
  float ang = atan(z.y, z.x) * p;
  return vec2(r * cos(ang), r * sin(ang));
}

float applyTransfer(float val) {
  float v = max(0.0, val);
  if (u_transfer == 1) return log(1.0 + v);
  if (u_transfer == 2) return sqrt(v);
  return v;
}

vec3 samplePalette(float t) {
  return texture(u_palette, vec2(fract(t + u_paletteOffset), 0.5)).rgb;
}

vec3 shadeColor(
  float primaryVal,
  int modeFlag,
  vec2 analyticGrad,
  vec2 heightGrad,
  bool hasAnalytic
) {
  vec3 baseCol;
  float h = primaryVal;

  if (modeFlag == -2) {
    // Interior
    if (u_interior == 0) {
      return u_interiorColor;
    }
    float t = applyTransfer(primaryVal) * u_paletteScale * 2.2;
    baseCol = mix(u_interiorColor, samplePalette(t), 0.88);
  } else if (modeFlag >= 100) {
    // Newton / Nova root basin coloring
    int rootIdx = modeFlag - 100;
    float rootShift = float(rootIdx) / max(2.0, floor(u_power + 0.5));
    float t = applyTransfer(primaryVal) * u_paletteScale * 1.4 + rootShift;
    baseCol = samplePalette(t);
  } else if (u_coloring == 6) {
    // Domain Decomposition: primaryVal carries smooth iter + angle bit
    float sIter = floor(primaryVal);
    float sector = fract(primaryVal);
    float t = applyTransfer(sIter) * u_paletteScale;
    baseCol = samplePalette(t);
    float edgeMask = 0.65 + 0.35 * sector;
    baseCol *= edgeMask;
  } else {
    float t = applyTransfer(primaryVal) * u_paletteScale;
    baseCol = samplePalette(t);
  }

  if (u_lightEnabled == 0 || modeFlag == -2) {
    return baseCol;
  }

  // Construct 3D surface normal from analytical normal & screen-space height gradient
  vec2 gScreen = heightGrad;
  float gLen = length(gScreen);
  if (gLen > 4.0) gScreen *= (4.0 / gLen);

  vec2 n2 = -gScreen * 1.35;
  if (hasAnalytic && (u_coloring == 0 || u_coloring == 1)) {
    float aLen = length(analyticGrad);
    if (aLen > 1e-6) {
      vec2 aNorm = analyticGrad / aLen;
      n2 = mix(n2, aNorm * 0.9, 0.55);
    }
  }

  vec3 N = normalize(vec3(n2, 1.0));
  vec3 L = normalize(u_lightDir);
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 H = normalize(L + V);

  float diff = max(dot(N, L), 0.0);
  float spec = pow(max(dot(N, H), 0.0), 36.0) * u_lightSpecular;
  float ambient = 1.0 - 0.65 * u_lightStrength;
  float lit = ambient + (1.05 * u_lightStrength) * diff;
  return clamp(baseCol * lit + vec3(spec * u_lightStrength), 0.0, 1.0);
}

vec2 getAaOffset(int idx, int aa) {
  if (aa == 2) {
    // 2x2 Rotated Grid Supersampling (RGSS)
    if (idx == 0) return vec2(-0.375, -0.125);
    if (idx == 1) return vec2(0.125, -0.375);
    if (idx == 2) return vec2(0.375, 0.125);
    return vec2(-0.125, 0.375);
  }
  int gx = idx % 4;
  int gy = idx / 4;
  return vec2((float(gx) + 0.5) * 0.25 - 0.5, (float(gy) + 0.5) * 0.25 - 0.5);
}
`;

export function buildFragmentShaderF32(): string {
  return `#version 300 es
precision highp float;

uniform vec2 u_center;
uniform float u_scale;
uniform vec2 u_juliaC;
uniform float u_cosR;
uniform float u_sinR;

${COMMON_UNIFORMS_AND_HELPERS}

void evalFractalF32(
  vec2 pCoord,
  out float outPrimary,
  out int outFlag,
  out vec2 outAnalytic,
  out bool outHasAnalytic
) {
  vec2 z = vec2(0.0);
  vec2 c = pCoord;
  vec2 dz = vec2(0.0);
  vec2 zPrev = vec2(0.0);

  if (u_formula == 6) {
    // Newton
    z = pCoord;
    c = vec2(0.0);
    dz = vec2(1.0, 0.0);
  } else if (u_isJulia == 1) {
    z = pCoord;
    c = u_juliaC;
    dz = vec2(1.0, 0.0);
  } else if (u_formula == 7) {
    // Nova parameter space starts at critical point z0 = 1
    z = vec2(1.0, 0.0);
    dz = vec2(0.0, 0.0);
  } else if (u_formula == 9) {
    // Lambda parameter space starts at critical point z0 = 0.5
    z = vec2(0.5, 0.0);
    dz = vec2(0.0, 0.0);
  }

  float bail2 = max(16.0, u_bailout);
  float minTrap = 1e9;
  float minOrbit = 1e9;
  float stripeSum = 0.0;
  float stripePrev = 0.0;
  float curvSum = 0.0;
  vec2 prevStep = vec2(1.0, 0.0);

  bool escaped = false;
  bool converged = false;
  int convRoot = 0;
  int finalIter = u_maxIter;
  float prevDelta2 = 1.0;
  float lastDelta2 = 1.0;
  float kDeg = clamp(floor(u_power + 0.5), 2.0, 8.0);
  bool holomorphic = (u_formula == 0 || u_formula == 5 || u_formula == 7 || u_formula == 8 || u_formula == 9);
  outHasAnalytic = holomorphic;

  for (int iter = 0; iter < 4096; iter++) {
    if (iter >= u_maxIter) break;

    vec2 nextZ = z;
    vec2 nextDz = dz;

    if (u_formula == 0) {
      // Mandelbrot / Multibrot
      vec2 zpm1 = cpow(z, u_power - 1.0);
      vec2 zp = cmul(zpm1, z);
      nextZ = zp + c;
      nextDz = u_power * cmul(zpm1, dz) + (u_isJulia == 1 ? vec2(0.0) : vec2(1.0, 0.0));
    } else if (u_formula == 1) {
      // Burning Ship
      vec2 az = vec2(abs(z.x), -abs(z.y));
      nextZ = cpow(az, u_power) + c;
    } else if (u_formula == 2) {
      // Tricorn
      vec2 cz = vec2(z.x, -z.y);
      nextZ = cpow(cz, u_power) + c;
    } else if (u_formula == 3) {
      // Celtic
      vec2 zp = cpow(z, u_power);
      nextZ = vec2(abs(zp.x), zp.y) + c;
    } else if (u_formula == 4) {
      // Buffalo
      vec2 zp = cpow(z, u_power);
      nextZ = vec2(abs(zp.x), -abs(zp.y)) + c;
    } else if (u_formula == 5) {
      // Phoenix
      vec2 zpm1 = cpow(z, u_power - 1.0);
      vec2 zp = cmul(zpm1, z);
      nextZ = zp + c + u_paramP * zPrev;
      nextDz = u_power * cmul(zpm1, dz) + (u_isJulia == 1 ? vec2(0.0) : vec2(1.0, 0.0));
    } else if (u_formula == 6 || u_formula == 7) {
      // Newton / Nova
      vec2 zkm1 = cpow(z, kDeg - 1.0);
      vec2 zk = cmul(zkm1, z);
      vec2 stepRatio = cdiv(zk - vec2(1.0, 0.0), kDeg * zkm1);
      vec2 addC = (u_formula == 7) ? c : vec2(0.0);
      nextZ = z - u_paramP * stepRatio + addC;
      // Approximate derivative for Nova relief
      nextDz = dz * 0.5 + vec2(1.0, 0.0);
    } else if (u_formula == 8) {
      // Magnet Type I
      vec2 z2 = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y);
      vec2 num = z2 + c - vec2(1.0, 0.0);
      vec2 den = 2.0 * z + c - vec2(2.0, 0.0);
      vec2 u = cdiv(num, den);
      nextZ = cmul(u, u);
      vec2 dnum = 2.0 * cmul(z, dz) + (u_isJulia == 1 ? vec2(0.0) : vec2(1.0, 0.0));
      vec2 dden = 2.0 * dz + (u_isJulia == 1 ? vec2(0.0) : vec2(1.0, 0.0));
      vec2 du = cdiv(cmul(dnum, den) - cmul(num, dden), cmul(den, den));
      nextDz = 2.0 * cmul(u, du);
    } else if (u_formula == 9) {
      // Complex Logistic (Lambda)
      vec2 omz = vec2(1.0 - z.x, -z.y);
      vec2 z1mz = cmul(z, omz);
      nextZ = cmul(c, z1mz);
      vec2 d1m2z = vec2(1.0 - 2.0 * z.x, -2.0 * z.y);
      nextDz = cmul(c, cmul(d1m2z, dz)) + (u_isJulia == 1 ? vec2(0.0) : z1mz);
    }

    vec2 deltaZ = nextZ - z;
    zPrev = z;
    z = nextZ;
    dz = nextDz;

    float r2 = dot(z, z);
    float mag = sqrt(max(r2, 1e-30));
    minOrbit = min(minOrbit, mag);

    // Orbit traps
    if (u_coloring == 2 || u_interior == 2) {
      float tx = abs(z.x - u_trap.x);
      float ty = abs(z.y - u_trap.y);
      minTrap = min(minTrap, min(tx, ty));
    } else if (u_coloring == 3) {
      float dRing = abs(length(z - u_trap.xy) - u_trap.z);
      minTrap = min(minTrap, dRing);
    } else if (u_coloring == 4) {
      float dPt = length(z - u_trap.xy);
      minTrap = min(minTrap, dPt);
    }

    // Stripe average accumulation
    if (u_coloring == 5) {
      stripePrev = stripeSum;
      float angZ = (r2 > 1e-30) ? atan(z.y, z.x) : 0.0;
      float sVal = 0.5 + 0.5 * sin(u_stripeDensity * angZ);
      stripeSum += sVal;
    }

    // Orbit curvature accumulation
    if (u_coloring == 7) {
      float stepLen = length(deltaZ);
      float prevLen = length(prevStep);
      if (stepLen > 1e-9 && prevLen > 1e-9) {
        float cosA = clamp(dot(deltaZ, prevStep) / (stepLen * prevLen), -0.999999, 0.999999);
        curvSum += acos(cosA);
      }
      prevStep = deltaZ;
    }

    if (u_formula == 6 || u_formula == 7) {
      float d2 = dot(deltaZ, deltaZ);
      if (d2 < 1e-10) {
        converged = true;
        lastDelta2 = d2;
        finalIter = iter + 1;
        float ang = (r2 > 1e-30) ? atan(z.y, z.x) : 0.0;
        if (ang < 0.0) ang += 6.28318530718;
        convRoot = int(mod(floor((ang / 6.28318530718) * kDeg + 0.5), kDeg));
        break;
      }
      prevDelta2 = d2;
    } else {
      if (r2 > bail2) {
        escaped = true;
        finalIter = iter + 1;
        break;
      }
    }
  }

  if (converged) {
    float ld = max(sqrt(lastDelta2), 1e-14);
    float pd = max(sqrt(prevDelta2), 1e-5);
    float frac = clamp(log(pd / 1e-5) / max(log(pd / ld), 1e-6), 0.0, 1.0);
    float nSmooth = float(finalIter - 1) + frac;
    outFlag = 100 + convRoot;
    outPrimary = nSmooth;
    outAnalytic = vec2(0.0);
    return;
  }

  if (!escaped) {
    outFlag = -2;
    outAnalytic = vec2(0.0);
    if (u_interior == 1) outPrimary = length(z);
    else if (u_interior == 2) outPrimary = minTrap;
    else if (u_interior == 3) outPrimary = minOrbit;
    else outPrimary = 0.0;
    return;
  }

  // Smooth renormalized iteration count
  float pSafe = max(1.5, (u_formula == 8 || u_formula == 9) ? 2.0 : u_power);
  float r2 = max(dot(z, z), 1e-20);
  float logZn = 0.5 * log(r2);
  float nu = log(max(logZn / log(2.0), 1e-8)) / log(pSafe);
  float smoothIter = max(0.0, float(finalIter) + 1.0 - nu);
  float frac = clamp(1.0 - nu, 0.0, 1.0);

  outFlag = 0;
  outAnalytic = holomorphic ? cdiv(z, dz) : vec2(0.0);

  if (u_coloring == 0) {
    outPrimary = smoothIter;
  } else if (u_coloring == 1) {
    // Analytical Distance Estimation (DEM)
    float r = sqrt(r2);
    float dzMag = max(length(dz), 1e-20);
    float dist = (holomorphic ? (r * log(r) / dzMag) : (smoothIter * u_scale));
    float normDist = log(1.0 + max(dist / max(u_scale, 1e-20), 1e-6));
    outPrimary = normDist * 8.0;
  } else if (u_coloring == 2 || u_coloring == 3 || u_coloring == 4) {
    outPrimary = minTrap * 18.0;
  } else if (u_coloring == 5) {
    float n = max(1.0, float(finalIter));
    float avgCur = stripeSum / n;
    float avgPrev = (finalIter > 1) ? (stripePrev / float(finalIter - 1)) : avgCur;
    float blended = mix(avgPrev, avgCur, frac);
    outPrimary = blended * 24.0 + smoothIter * 0.25;
  } else if (u_coloring == 6) {
    float binaryAng = (z.y >= 0.0) ? 0.85 : 0.15;
    outPrimary = floor(smoothIter) + binaryAng;
  } else {
    float avgCurv = curvSum / max(1.0, float(finalIter));
    outPrimary = avgCurv * 14.0 + smoothIter * 0.2;
  }
}

void main() {
  int totalSamples = (u_aa == 4) ? 16 : (u_aa == 2 ? 4 : 1);

  float basePrimary = 0.0;
  int baseFlag = 0;
  vec2 baseAnalytic = vec2(0.0);
  bool baseHasAnalytic = false;

  // Evaluate center sample unconditionally so dFdx/dFdy execute in uniform control flow
  {
    vec2 d = (gl_FragCoord.xy - 0.5 * u_resolution) * u_scale;
    vec2 pCoord = u_center + vec2(d.x * u_cosR - d.y * u_sinR, d.x * u_sinR + d.y * u_cosR);
    evalFractalF32(pCoord, basePrimary, baseFlag, baseAnalytic, baseHasAnalytic);
  }

  float gradSource = (baseFlag == -2) ? 0.0 : applyTransfer(basePrimary);
  vec2 heightGrad = vec2(dFdx(gradSource), dFdy(gradSource));

  if (totalSamples == 1) {
    vec3 col = shadeColor(basePrimary, baseFlag, baseAnalytic, heightGrad, baseHasAnalytic);
    fragColor = vec4(col, 1.0);
    return;
  }

  vec3 accum = vec3(0.0);
  for (int s = 0; s < 16; s++) {
    if (s >= totalSamples) break;
    vec2 off = getAaOffset(s, u_aa);
    vec2 d = (gl_FragCoord.xy + off - 0.5 * u_resolution) * u_scale;
    vec2 pCoord = u_center + vec2(d.x * u_cosR - d.y * u_sinR, d.x * u_sinR + d.y * u_cosR);
    float prim;
    int flg;
    vec2 ana;
    bool hasA;
    evalFractalF32(pCoord, prim, flg, ana, hasA);
    accum += shadeColor(prim, flg, ana, heightGrad, hasA);
  }

  fragColor = vec4(accum / float(totalSamples), 1.0);
}
`;
}

export function buildFragmentShaderDS64(): string {
  return `#version 300 es
precision highp float;

// Dynamic uniforms prevent ANGLE / HLSL constant-folding of Dekker / Knuth error terms
uniform float u_one;
uniform float u_split;

uniform vec2 u_centerX_ds;
uniform vec2 u_centerY_ds;
uniform vec2 u_scale_ds;
uniform vec2 u_juliaCx_ds;
uniform vec2 u_juliaCy_ds;
uniform vec2 u_cosR_ds;
uniform vec2 u_sinR_ds;

${COMMON_UNIFORMS_AND_HELPERS}

vec2 quickTwoSum(float a, float b) {
  float s = a + b;
  float e = b - (s - a) * u_one;
  return vec2(s, e);
}

vec2 twoSum(float a, float b) {
  float s = a + b;
  float v = s - a * u_one;
  float e = (a - (s - v) * u_one) + (b - v);
  return vec2(s, e);
}

vec2 splitF(float a) {
  float c = u_split * a;
  float abig = c - a;
  float ahi = c - abig;
  float alo = a - ahi;
  return vec2(ahi, alo);
}

vec2 twoProd(float a, float b) {
  float p = a * b;
  vec2 sa = splitF(a);
  vec2 sb = splitF(b);
  float err = ((sa.x * sb.x - p) + sa.x * sb.y + sa.y * sb.x) + sa.y * sb.y;
  return vec2(p, err);
}

vec2 ds_add(vec2 a, vec2 b) {
  vec2 s = twoSum(a.x, b.x);
  s.y += a.y + b.y;
  return quickTwoSum(s.x, s.y);
}

vec2 ds_sub(vec2 a, vec2 b) {
  return ds_add(a, -b);
}

vec2 ds_mul(vec2 a, vec2 b) {
  vec2 p = twoProd(a.x, b.x);
  p.y += a.x * b.y + a.y * b.x;
  return quickTwoSum(p.x, p.y);
}

vec2 ds_sqr(vec2 a) {
  vec2 p = twoProd(a.x, a.x);
  p.y += 2.0 * a.x * a.y;
  return quickTwoSum(p.x, p.y);
}

vec2 ds_abs(vec2 a) {
  return (a.x < 0.0 || (a.x == 0.0 && a.y < 0.0)) ? -a : a;
}

vec2 ds_neg(vec2 a) {
  return -a;
}

void evalFractalDS64(
  vec2 fragXY,
  out float outPrimary,
  out int outFlag,
  out vec2 outAnalytic,
  out bool outHasAnalytic
) {
  vec2 dx = ds_mul(vec2(fragXY.x - 0.5 * u_resolution.x, 0.0), u_scale_ds);
  vec2 dy = ds_mul(vec2(fragXY.y - 0.5 * u_resolution.y, 0.0), u_scale_ds);

  vec2 rotX = ds_sub(ds_mul(dx, u_cosR_ds), ds_mul(dy, u_sinR_ds));
  vec2 rotY = ds_add(ds_mul(dx, u_sinR_ds), ds_mul(dy, u_cosR_ds));

  vec2 px = ds_add(u_centerX_ds, rotX);
  vec2 py = ds_add(u_centerY_ds, rotY);

  vec2 zx = vec2(0.0);
  vec2 zy = vec2(0.0);
  vec2 cx = px;
  vec2 cy = py;
  vec2 zPrevX = vec2(0.0);
  vec2 zPrevY = vec2(0.0);
  vec2 dz = vec2(0.0);

  if (u_isJulia == 1) {
    zx = px;
    zy = py;
    cx = u_juliaCx_ds;
    cy = u_juliaCy_ds;
    dz = vec2(1.0, 0.0);
  } else if (u_formula == 9) {
    zx = vec2(0.5, 0.0);
    zy = vec2(0.0);
  }

  float bail2 = max(16.0, u_bailout);
  float minTrap = 1e9;
  float minOrbit = 1e9;
  float stripeSum = 0.0;
  float stripePrev = 0.0;
  float curvSum = 0.0;
  vec2 prevStep = vec2(1.0, 0.0);
  bool escaped = false;
  int finalIter = u_maxIter;
  bool holomorphic = (u_formula == 0 || u_formula == 5 || u_formula == 9);
  outHasAnalytic = holomorphic;

  for (int iter = 0; iter < 4096; iter++) {
    if (iter >= u_maxIter) break;

    float zxF = zx.x + zx.y;
    float zyF = zy.x + zy.y;
    float cxF = cx.x + cx.y;
    float cyF = cy.x + cy.y;

    vec2 nextZx;
    vec2 nextZy;

    if (u_formula == 0) {
      // Mandelbrot
      vec2 x2 = ds_sqr(zx);
      vec2 y2 = ds_sqr(zy);
      vec2 twoxy = ds_mul(zx, zy);
      twoxy *= 2.0;
      nextZx = ds_add(ds_sub(x2, y2), cx);
      nextZy = ds_add(twoxy, cy);
      dz = 2.0 * cmul(vec2(zxF, zyF), dz) + (u_isJulia == 1 ? vec2(0.0) : vec2(1.0, 0.0));
    } else if (u_formula == 1) {
      // Burning Ship
      vec2 ax = ds_abs(zx);
      vec2 ay = ds_neg(ds_abs(zy));
      vec2 x2 = ds_sqr(ax);
      vec2 y2 = ds_sqr(ay);
      vec2 twoxy = ds_mul(ax, ay) * 2.0;
      nextZx = ds_add(ds_sub(x2, y2), cx);
      nextZy = ds_add(twoxy, cy);
    } else if (u_formula == 2) {
      // Tricorn
      vec2 x2 = ds_sqr(zx);
      vec2 y2 = ds_sqr(zy);
      vec2 twoxy = ds_mul(zx, zy) * -2.0;
      nextZx = ds_add(ds_sub(x2, y2), cx);
      nextZy = ds_add(twoxy, cy);
    } else if (u_formula == 3) {
      // Celtic
      vec2 x2 = ds_sqr(zx);
      vec2 y2 = ds_sqr(zy);
      vec2 twoxy = ds_mul(zx, zy) * 2.0;
      nextZx = ds_add(ds_abs(ds_sub(x2, y2)), cx);
      nextZy = ds_add(twoxy, cy);
    } else if (u_formula == 4) {
      // Buffalo
      vec2 x2 = ds_sqr(zx);
      vec2 y2 = ds_sqr(zy);
      vec2 twoxy = ds_mul(zx, zy) * 2.0;
      nextZx = ds_add(ds_abs(ds_sub(x2, y2)), cx);
      nextZy = ds_add(ds_neg(ds_abs(twoxy)), cy);
    } else if (u_formula == 5) {
      // Phoenix
      vec2 x2 = ds_sqr(zx);
      vec2 y2 = ds_sqr(zy);
      vec2 twoxy = ds_mul(zx, zy) * 2.0;
      vec2 pTermX = ds_mul(vec2(u_paramP, 0.0), zPrevX);
      vec2 pTermY = ds_mul(vec2(u_paramP, 0.0), zPrevY);
      nextZx = ds_add(ds_add(ds_sub(x2, y2), cx), pTermX);
      nextZy = ds_add(ds_add(twoxy, cy), pTermY);
      dz = 2.0 * cmul(vec2(zxF, zyF), dz) + (u_isJulia == 1 ? vec2(0.0) : vec2(1.0, 0.0));
    } else {
      // Lambda: c * z * (1 - z)
      vec2 omzx = ds_sub(vec2(1.0, 0.0), zx);
      vec2 omzy = ds_neg(zy);
      vec2 p1x = ds_sub(ds_mul(zx, omzx), ds_mul(zy, omzy));
      vec2 p1y = ds_add(ds_mul(zx, omzy), ds_mul(zy, omzx));
      nextZx = ds_sub(ds_mul(cx, p1x), ds_mul(cy, p1y));
      nextZy = ds_add(ds_mul(cx, p1y), ds_mul(cy, p1x));
      vec2 z1mzF = vec2(p1x.x + p1x.y, p1y.x + p1y.y);
      vec2 d1m2z = vec2(1.0 - 2.0 * zxF, -2.0 * zyF);
      dz = cmul(vec2(cxF, cyF), cmul(d1m2z, dz)) + (u_isJulia == 1 ? vec2(0.0) : z1mzF);
    }

    vec2 zNewF = vec2(nextZx.x + nextZx.y, nextZy.x + nextZy.y);
    vec2 deltaZ = zNewF - vec2(zxF, zyF);
    zPrevX = zx;
    zPrevY = zy;
    zx = nextZx;
    zy = nextZy;

    float r2 = dot(zNewF, zNewF);
    minOrbit = min(minOrbit, sqrt(max(r2, 1e-30)));

    if (u_coloring == 2 || u_interior == 2) {
      minTrap = min(minTrap, min(abs(zNewF.x - u_trap.x), abs(zNewF.y - u_trap.y)));
    } else if (u_coloring == 3) {
      minTrap = min(minTrap, abs(length(zNewF - u_trap.xy) - u_trap.z));
    } else if (u_coloring == 4) {
      minTrap = min(minTrap, length(zNewF - u_trap.xy));
    }

    if (u_coloring == 5) {
      stripePrev = stripeSum;
      float angZ = (r2 > 1e-30) ? atan(zNewF.y, zNewF.x) : 0.0;
      stripeSum += 0.5 + 0.5 * sin(u_stripeDensity * angZ);
    }

    if (u_coloring == 7) {
      float stepLen = length(deltaZ);
      float prevLen = length(prevStep);
      if (stepLen > 1e-9 && prevLen > 1e-9) {
        float cosA = clamp(dot(deltaZ, prevStep) / (stepLen * prevLen), -0.999999, 0.999999);
        curvSum += acos(cosA);
      }
      prevStep = deltaZ;
    }

    if (r2 > bail2) {
      escaped = true;
      finalIter = iter + 1;
      break;
    }
  }

  vec2 zF = vec2(zx.x + zx.y, zy.x + zy.y);
  if (!escaped) {
    outFlag = -2;
    outAnalytic = vec2(0.0);
    if (u_interior == 1) outPrimary = length(zF);
    else if (u_interior == 2) outPrimary = minTrap;
    else if (u_interior == 3) outPrimary = minOrbit;
    else outPrimary = 0.0;
    return;
  }

  float r2 = max(dot(zF, zF), 1e-20);
  float logZn = 0.5 * log(r2);
  float nu = log(max(logZn / log(2.0), 1e-8)) / log(2.0);
  float smoothIter = max(0.0, float(finalIter) + 1.0 - nu);
  float frac = clamp(1.0 - nu, 0.0, 1.0);
  float scaleF = u_scale_ds.x + u_scale_ds.y;

  outFlag = 0;
  outAnalytic = holomorphic ? cdiv(zF, dz) : vec2(0.0);

  if (u_coloring == 0) {
    outPrimary = smoothIter;
  } else if (u_coloring == 1) {
    float r = sqrt(r2);
    float dzMag = max(length(dz), 1e-20);
    float dist = holomorphic ? (r * log(r) / dzMag) : (smoothIter * scaleF);
    outPrimary = log(1.0 + max(dist / max(scaleF, 1e-20), 1e-6)) * 8.0;
  } else if (u_coloring == 2 || u_coloring == 3 || u_coloring == 4) {
    outPrimary = minTrap * 18.0;
  } else if (u_coloring == 5) {
    float n = max(1.0, float(finalIter));
    float avgCur = stripeSum / n;
    float avgPrev = (finalIter > 1) ? (stripePrev / float(finalIter - 1)) : avgCur;
    outPrimary = mix(avgPrev, avgCur, frac) * 24.0 + smoothIter * 0.25;
  } else if (u_coloring == 6) {
    float binaryAng = (zF.y >= 0.0) ? 0.85 : 0.15;
    outPrimary = floor(smoothIter) + binaryAng;
  } else {
    float avgCurv = curvSum / max(1.0, float(finalIter));
    outPrimary = avgCurv * 14.0 + smoothIter * 0.2;
  }
}

void main() {
  int totalSamples = (u_aa == 4) ? 16 : (u_aa == 2 ? 4 : 1);

  float basePrimary = 0.0;
  int baseFlag = 0;
  vec2 baseAnalytic = vec2(0.0);
  bool baseHasAnalytic = false;

  evalFractalDS64(gl_FragCoord.xy, basePrimary, baseFlag, baseAnalytic, baseHasAnalytic);

  float gradSource = (baseFlag == -2) ? 0.0 : applyTransfer(basePrimary);
  vec2 heightGrad = vec2(dFdx(gradSource), dFdy(gradSource));

  if (totalSamples == 1) {
    vec3 col = shadeColor(basePrimary, baseFlag, baseAnalytic, heightGrad, baseHasAnalytic);
    fragColor = vec4(col, 1.0);
    return;
  }

  vec3 accum = vec3(0.0);
  for (int s = 0; s < 16; s++) {
    if (s >= totalSamples) break;
    vec2 off = getAaOffset(s, u_aa);
    float prim;
    int flg;
    vec2 ana;
    bool hasA;
    evalFractalDS64(gl_FragCoord.xy + off, prim, flg, ana, hasA);
    accum += shadeColor(prim, flg, ana, heightGrad, hasA);
  }

  fragColor = vec4(accum / float(totalSamples), 1.0);
}
`;
}
