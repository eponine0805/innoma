
/**
 * Handwriting Recognizer (Template Matching V2)
 * Meets new specification: No ML, Multi-template, Visual Effects.
 */

// Kanji Stroke Counts (Reference only, not primary filter now)
const STROKE_COUNTS = {
    '火': 4, '炎': 8, '水': 4, '氷': 5, '土': 3, '金': 8, '鉄': 13, '毒': 8,
    '山': 3, '星': 9, '闘': 18, '全': 6,
    '風': 9, '雷': 13, '光': 6,
    '地': 6, '海': 10, '森': 12, '林': 8,
    '破': 10, '斬': 11, '武': 8,
    '強': 11, '速': 11, '軽': 12, '守': 6, '生': 5,
    '弱': 10, '遅': 12, '重': 9, '病': 10, '危': 6, '止': 4
};

class HandwritingRecognizer {
    constructor(size = 64) {
        this.size = size;
        this.templates = [];
        this.debug = false; // Set true to see generated templates in console/canvas
    }

    /**
     * Initialize and generate templates.
     * @param {string[]} chars - Array of Kanji characters.
     */
    init(chars) {
        this.templates = [];
        console.log("Initializing Recognizer with V2 Logic...");

        const fonts = [
            "bold 200px 'Yuji Syuku', serif", // Calligraphic 1
            "bold 200px 'Yuji Boku', serif",  // Calligraphic 2
            "bold 200px sans-serif"           // Geometric fallback
        ];

        // Styles: Fill and Stroke (Outline)
        // Stroke helps recognizing thin handwritten lines against thick fonts
        const styles = ['fill', 'stroke'];

        chars.forEach(char => {
            fonts.forEach(font => {
                styles.forEach(style => {
                    const vectorData = this.generateTemplateVector(char, font, style);
                    if (vectorData) {
                        this.templates.push({
                            char: char,
                            vector: vectorData.vector, // Pixel data
                            edge: vectorData.edge,     // Edge data
                            dir: vectorData.dir,       // Directional data
                            density: vectorData.density // Ink density
                        });
                    }
                });
            });
        });

        console.log(`Recognizer Initialized. Total Templates: ${this.templates.length}`);
    }

    generateTemplateVector(char, font, style) {
        // Create a large canvas for high-res rendering
        const dim = 300;
        const cvs = document.createElement('canvas');
        cvs.width = dim;
        cvs.height = dim;
        const ctx = cvs.getContext('2d');

        // Draw background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, dim, dim);

        // Draw Text
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 15; // Thick stroke for outline style
        ctx.font = font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (style === 'fill') {
            ctx.fillText(char, dim / 2, dim / 2);
        } else {
            ctx.strokeText(char, dim / 2, dim / 2);
        }

        return this.processImage(cvs);
    }

    /**
     * Create features from an image source (Canvas).
     * Pipeline: Grayscale -> Adaptive Binary -> Crop -> Resize(64) -> Centroid -> Edges
     */
    processImage(sourceCanvas) {
        // 1. Grayscale & Binarize (Adaptive)
        const rawCtx = sourceCanvas.getContext('2d');
        const rawW = sourceCanvas.width;
        const rawH = sourceCanvas.height;
        const rawData = rawCtx.getImageData(0, 0, rawW, rawH).data;

        // Calculate average brightness for adaptive threshold
        let totalBright = 0;
        let pCount = 0;
        for (let i = 0; i < rawData.length; i += 4) {
            totalBright += (rawData[i] + rawData[i + 1] + rawData[i + 2]) / 3;
            pCount++;
        }
        const avgBright = totalBright / pCount;
        const threshold = avgBright - 30; // Adaptive offset

        // 2. Find Bounding Box & Binarize in one pass logic (conceptually)
        // We actully need to find bounds first based on threshold
        let minX = rawW, maxX = 0, minY = rawH, maxY = 0;
        let hasInk = false;

        for (let y = 0; y < rawH; y++) {
            for (let x = 0; x < rawW; x++) {
                const i = (y * rawW + x) * 4;
                const brightness = (rawData[i] + rawData[i + 1] + rawData[i + 2]) / 3;

                if (brightness < threshold) { // Darker than threshold = INK
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                    hasInk = true;
                }
            }
        }

        // 3. Fallback for empty input (return "blank" features)
        if (!hasInk) {
            const sizeSq = this.size * this.size;
            return {
                vector: new Float32Array(sizeSq).fill(0),
                edge: new Float32Array(sizeSq).fill(0),
                density: 0
            };
        }

        // 4. Crop & Scale to 64x64
        const bboxW = maxX - minX + 1;
        const bboxH = maxY - minY + 1;
        const maxSide = Math.max(bboxW, bboxH);

        // Create 64x64 canvas
        const featCvs = document.createElement('canvas');
        featCvs.width = this.size;
        featCvs.height = this.size;
        const fCtx = featCvs.getContext('2d');
        fCtx.fillStyle = 'white';
        fCtx.fillRect(0, 0, this.size, this.size);

        // Scale to fit (leaving padding)
        const padding = 4; // 64x64 pixels
        const targetSize = this.size - (padding * 2);
        const scale = targetSize / maxSide;

        const drawW = bboxW * scale;
        const drawH = bboxH * scale;

        // Draw centered initially
        const dx = (this.size - drawW) / 2;
        const dy = (this.size - drawH) / 2;

        fCtx.drawImage(
            sourceCanvas,
            minX, minY, bboxW, bboxH,
            dx, dy, drawW, drawH
        );

        // 5. Centroid Alignment (Center of Mass)
        // Get data from 64x64 canvas
        const fImg = fCtx.getImageData(0, 0, this.size, this.size);
        const fData = fImg.data;

        let cx = 0, cy = 0, mass = 0;
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const i = (y * this.size + x) * 4;
                const val = (fData[i] + fData[i + 1] + fData[i + 2]) / 3;
                if (val < 200) { // Ink
                    cx += x;
                    cy += y;
                    mass++;
                }
            }
        }

        if (mass > 0) {
            cx /= mass;
            cy /= mass;
            const shiftX = (this.size / 2) - cx;
            const shiftY = (this.size / 2) - cy;

            // Only shift if significant
            if (Math.abs(shiftX) > 1 || Math.abs(shiftY) > 1) {
                // To apply shift, we need to redraw.
                // Create temp canvas to hold current state
                const tempC = document.createElement('canvas');
                tempC.width = this.size;
                tempC.height = this.size;
                tempC.getContext('2d').putImageData(fImg, 0, 0);

                // Clear and redraw shifted
                fCtx.fillStyle = 'white';
                fCtx.fillRect(0, 0, this.size, this.size);
                fCtx.drawImage(tempC, shiftX, shiftY);
            }
        }

        // 6. Feature Extraction (Pixels, Edge, Directional/HOG-Lite)
        const finalImg = fCtx.getImageData(0, 0, this.size, this.size);
        const finalData = finalImg.data;
        const vector = new Float32Array(this.size * this.size);
        const edge = new Float32Array(this.size * this.size);
        let inkPixels = 0;

        // Pixel Feature
        for (let i = 0; i < vector.length; i++) {
            const idx = i * 4;
            // Invert: 0=White, 1=Black
            vector[i] = 1.0 - ((finalData[idx] + finalData[idx + 1] + finalData[idx + 2]) / 3.0 / 255.0);
            if (vector[i] > 0.5) inkPixels++;
        }

        // Edge Extraction & Directional Features
        // 4x4 Grid for Directions (16 cells, each cell has 2 values: Horz, Vert) -> 32 features
        const gridSize = 4;
        const cellSize = this.size / gridSize; // 64 / 4 = 16
        const dirFeatures = new Float32Array(gridSize * gridSize * 2).fill(0);

        for (let y = 1; y < this.size - 1; y++) {
            for (let x = 1; x < this.size - 1; x++) {
                const idx = y * this.size + x;
                const v = vector[idx];

                // Neighbors
                const top = vector[idx - this.size];
                const bottom = vector[idx + this.size];
                const left = vector[idx - 1];
                const right = vector[idx + 1];

                // Simple Gradient
                const dy = Math.abs(top - bottom);
                const dx = Math.abs(left - right);

                // Edge Magnitude
                const grad = dy + dx;
                edge[idx] = grad > 0.5 ? 1.0 : 0.0;

                // Accumulate Directional Info if it's an edge
                if (grad > 0.3) {
                    const gridX = Math.floor(x / cellSize);
                    const gridY = Math.floor(y / cellSize);
                    if (gridX < gridSize && gridY < gridSize) {
                        const featIdx = (gridY * gridSize + gridX) * 2;
                        // If dx > dy, it's a Vertical Image Gradient (changes horizontally) -> Vertical Edge
                        // Wait, gradient X means change in X... horizontal change.
                        // Ideally: 
                        // Vertical Line: Left/Right change is high (dx high), Top/Bottom change is low (dy low).
                        // Horizontal Line: Top/Bottom change is high (dy high), Left/Right change is low (dx low).

                        // Feature 0: Vertical Strength (dx)
                        // Feature 1: Horizontal Strength (dy)

                        dirFeatures[featIdx] += dx;     // Vertical Edge strength
                        dirFeatures[featIdx + 1] += dy; // Horizontal Edge strength
                    }
                }
            }
        }

        // Normalize Directional Features
        for (let i = 0; i < dirFeatures.length; i++) {
            dirFeatures[i] = Math.min(1.0, dirFeatures[i] / (cellSize * cellSize * 0.5));
        }

        return {
            vector: vector,
            edge: edge,
            dir: dirFeatures,
            density: inkPixels / (this.size * this.size)
        };
    }

    /**
     * Recognize the input from canvas using Weighted k-NN.
     * @param {HTMLCanvasElement} inputCanvas
     * @param {number} inputStrokes - Number of strokes detected
     */
    recognize(inputCanvas, inputStrokes = 0) {
        if (this.templates.length === 0) {
            console.error("Templates not initialized!");
            return null;
        }

        const features = this.processImage(inputCanvas);

        // Calculate scores for ALL templates
        const candidates = this.templates.map(tmpl => {
            // 1. Pixel Diff (L2) - Weight: 0.5
            let pixelDist = 0;
            for (let i = 0; i < features.vector.length; i++) {
                const d = features.vector[i] - tmpl.vector[i];
                pixelDist += d * d;
            }

            // 2. Edge Diff (L2) - Weight: 0.3
            let edgeDist = 0;
            for (let i = 0; i < features.edge.length; i++) {
                const d = features.edge[i] - tmpl.edge[i];
                edgeDist += d * d;
            }

            // 3. Directional Diff (L2) - Weight: 0.4 (Increased importance for shape)
            let dirDist = 0;
            if (tmpl.dir) {
                for (let i = 0; i < features.dir.length; i++) {
                    const d = features.dir[i] - tmpl.dir[i];
                    dirDist += d * d;
                }
            }

            // 4. Density Diff - Weight: 0.1
            const densDist = Math.abs(features.density - tmpl.density);

            // WEIGHTED SCORE (Lower is better)
            // Increased edge and directional importance for better shape matching
            let score = (0.35 * pixelDist) + (0.35 * edgeDist) + (0.50 * dirDist * 100) + (0.05 * densDist * 1000);

            // 5. STROKE COUNT PENALTY (Reduced importance - user may write differently)
            if (inputStrokes > 0 && STROKE_COUNTS[tmpl.char]) {
                const targetStrokes = STROKE_COUNTS[tmpl.char];
                const diff = Math.abs(inputStrokes - targetStrokes);

                // Softer penalty
                if (diff > 4) {
                    score += diff * 200; // Penalty for very different stroke count
                } else if (diff > 2) {
                    score += diff * 30; // Moderate penalty
                }
            }

            return { char: tmpl.char, score: score };
        });

        // Sort by score (ascending: lower distance is better)
        candidates.sort((a, b) => a.score - b.score);

        // k-NN Voting (k=3)
        // If the top 1 is very strong (low score), take it.
        // If the top few are close, let them vote (sum of scores or simple count)
        // With template matching, "sum of inverse score" or just "best avg distance to class" is good
        // Here we just take top 1 for now, BUT we rely on the candidates list for potential k-NN expansion

        // For strict robustness requested by user ("Recently neighbor is off"), 
        // we can look at top 3. If top 1 is 'Earth' but #2 and #3 are 'Five' and 'Five', maybe 'Five' is better?
        // But we only have ~1 template per char usually unless we generated multiples.
        // We generated 3 fonts per char. So we DO have multiple templates per char.

        // Group by Character
        const votes = {};
        const k = 5; // Look at top 5 matches
        const topK = candidates.slice(0, k);

        topK.forEach(c => {
            if (!votes[c.char]) votes[c.char] = 0;
            // Vote weight = 1 / (score + epsilon)
            // Or just simple count? Let's use weighted vote.
            // Be careful with 0 score (perfect match)
            votes[c.char] += 1.0 / (c.score + 0.1);
        });

        // Find character with highest vote
        let bestChar = null;
        let maxVote = -1;

        for (const char in votes) {
            if (votes[char] > maxVote) {
                maxVote = votes[char];
                bestChar = char;
            }
        }

        // Fallback to top 1 if voting fails
        if (!bestChar && topK.length > 0) bestChar = topK[0].char;

        const bestScore = candidates[0].score; // Keep tracking raw best score for debug

        return {
            char: bestChar,
            score: bestScore
        };
    }
}
