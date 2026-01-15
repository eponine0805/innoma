
/**
 * Handwriting Recognizer (Template Matching)
 * Enhanced with Stroke Count and Higher Resolution.
 */

// Kanji Stroke Counts for filtering
const STROKE_COUNTS = {
    '水': 4, '土': 3, '風': 9, '雷': 13, '光': 6, '炎': 8, '地': 6,
    '山': 3, '海': 10, '森': 12, '林': 8, '星': 9, '病': 10,
    '天': 4, '雨': 8, '空': 8, '氷': 5, '金': 8,
    '一': 1, '二': 2, '三': 3, '四': 5, '五': 4, '六': 4, '七': 2, '八': 2, '九': 2, '十': 2
};

class HandwritingRecognizer {
    constructor(size = 64, threshold = 50) {
        this.size = size;          // Higher Res (64x64)
        this.threshold = threshold;
        this.templates = [];
    }

    /**
     * Generate templates from font rendering.
     * @param {string[]} chars - Array of characters (Kanji).
     * @param {string} font - Font stack to use.
     */
    init(chars, font = "bold 200px sans-serif") { // Sans-serif for better geometric match
        this.templates = [];
        const canvas = document.createElement('canvas');
        const dim = 300;
        canvas.width = dim;
        canvas.height = dim;
        const ctx = canvas.getContext('2d');

        chars.forEach(char => {
            // Clear
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, dim, dim);

            // Draw Centered
            ctx.fillStyle = 'black';
            ctx.font = font;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(char, dim / 2, dim / 2);

            // Normalize
            const vector = this.normalize(canvas);

            this.templates.push({
                char: char,
                vector: vector,
                strokeCount: STROKE_COUNTS[char] || 0
            });
            console.log(`Generated template for: ${char} (Strokes: ${STROKE_COUNTS[char]})`);
        });
    }

    /**
     * Normalize the input image/canvas to a fixed-size vector.
     */
    normalize(sourceCanvas) {
        const ctx = sourceCanvas.getContext('2d');
        const w = sourceCanvas.width;
        const h = sourceCanvas.height;
        let imgData = ctx.getImageData(0, 0, w, h);
        let data = imgData.data;

        // 1. Scan for BBox
        let minX = w, maxX = 0, minY = h, maxY = 0;
        let hasPixels = false;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4;
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;

                if (gray < 200) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                    hasPixels = true;
                }
            }
        }

        if (!hasPixels) {
            return new Float32Array(this.size * this.size).fill(0);
        }

        // 2. Crop
        const bboxW = maxX - minX + 1;
        const bboxH = maxY - minY + 1;

        const tempC = document.createElement('canvas');
        tempC.width = this.size;
        tempC.height = this.size;
        const tCtx = tempC.getContext('2d');

        tCtx.fillStyle = 'white';
        tCtx.fillRect(0, 0, this.size, this.size);

        // Aspect Ratio Preserving Scale
        const padding = this.size * 0.1;
        const targetSize = this.size - (padding * 2);

        let scale = 1;
        if (bboxW > bboxH) {
            scale = targetSize / bboxW;
        } else {
            scale = targetSize / bboxH;
        }

        const drawW = bboxW * scale;
        const drawH = bboxH * scale;

        const dx = (this.size - drawW) / 2;
        const dy = (this.size - drawH) / 2;

        tCtx.drawImage(
            sourceCanvas,
            minX, minY, bboxW, bboxH,
            dx, dy, drawW, drawH
        );

        // 3. Vectorize
        const finalImg = tCtx.getImageData(0, 0, this.size, this.size);
        const fData = finalImg.data;
        const vector = new Float32Array(this.size * this.size);

        for (let i = 0; i < vector.length; i++) {
            const idx = i * 4;
            const avg = (fData[idx] + fData[idx + 1] + fData[idx + 2]) / 3;
            vector[i] = 1.0 - (avg / 255.0);
        }

        return vector;
    }

    /**
     * Find best matching template.
     */
    recognize(inputCanvas, inputStrokeCount) {
        if (this.templates.length === 0) return null;

        const inputVec = this.normalize(inputCanvas);

        let bestChar = null;
        let maxScore = -Infinity;

        // Nearest Neighbor with Penalty
        for (const tmpl of this.templates) {
            const dist = this.distance(inputVec, tmpl.vector);

            // Base Score from Distance (0 to 100)
            // L2 max ~ sqrt(64*64) = 64. Realistically 10-20.
            // 64x64 grid -> 4096 pixels. Max distance sqrt(4096) = 64.
            // 100 - dist * 2 seems okay.
            let score = 100 - (dist * 2);

            // PENALTY: Stroke Count
            if (inputStrokeCount !== undefined && inputStrokeCount > 0 && tmpl.strokeCount > 0) {
                const diff = Math.abs(tmpl.strokeCount - inputStrokeCount);
                if (diff > 1) { // Allow +/- 1 stroke error
                    score -= (diff * 15); // Heavy penalty
                }
            }

            console.log(`Char: ${tmpl.char}, Dist: ${dist.toFixed(2)}, Strokes: ${tmpl.strokeCount}/${inputStrokeCount}, Score: ${score.toFixed(2)}`);

            if (score > maxScore) {
                maxScore = score;
                bestChar = tmpl.char;
            }
        }

        return {
            char: bestChar,
            dist: 100 - maxScore, // Inverse
            score: Math.floor(Math.max(0, maxScore))
        };
    }

    distance(v1, v2) {
        let sum = 0;
        for (let i = 0; i < v1.length; i++) {
            const d = v1[i] - v2[i];
            sum += d * d;
        }
        return Math.sqrt(sum);
    }
}
