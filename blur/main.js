const img = new Image();
img.crossOrigin = "anonymous"
img.src = "./Greenland_467_(35130903436)_(cropped).jpg"

const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

img.onload = () => {
    original()
};

const cartesianToFlat = (x, y) => 4 * (y + 800 * x)

const sumUint8ClampedArrayByIndex = (data, ...indices) => {
    let r = 0;
    let g = 0;
    let b = 0;

    for (let i = 0; i < indices.length; i++) {
        r += data[indices[i] + 0]
        g += data[indices[i] + 1]
        b += data[indices[i] + 2]
    }

    r = Math.round(r / 9)
    g = Math.round(g / 9)
    b = Math.round(b / 9)

    return new Uint8Array([r, g, b])
}

const gaussianWeight = (x, y) => {
    const SIGMA = 1.85089642
    const stDevSq = Math.pow(SIGMA, 2)

    const A = (1 / (2 * Math.PI * stDevSq))
    const B = (x * x + y * y) / (2 * stDevSq)
    
    return A * Math.pow(Math.E, -B)
}

const sumUint8ClampedArrayByIndexGauss = (data, ...indices) => {
    let r = 0;
    let g = 0;
    let b = 0;

    let weightSum = 0;

    for (let i = 0; i < indices.length; i++) {
        const weight = gaussianWeight(indices[i].x, indices[i].y)
        weightSum += weight
        r += data[indices[i].pos + 0] * weight
        g += data[indices[i].pos + 1] * weight
        b += data[indices[i].pos + 2] * weight
    }

    r = Math.round(r / weightSum)
    g = Math.round(g / weightSum)
    b = Math.round(b / weightSum)

    return new Uint8Array([r, g, b])
}

// Reference: https://en.wikipedia.org/wiki/Box_blur
const boxBlur = () => {
    original()

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const start = performance.now()

    for (let x = 1; x < 800-1; x++) { // skip edges for now
        for (let y = 1; y < 800-1; y++) { // skip edges for now
            const [r, g, b] = sumUint8ClampedArrayByIndex(
                data, 
                cartesianToFlat(x - 1, y),
                cartesianToFlat(x + 1, y),
                cartesianToFlat(x, y - 1),
                cartesianToFlat(x, y + 1),
                cartesianToFlat(x - 1, y - 1),
                cartesianToFlat(x + 1, y - 1),
                cartesianToFlat(x - 1, y + 1),
                cartesianToFlat(x + 1, y + 1),
                cartesianToFlat(x, y),
            )

            const pos = cartesianToFlat(x, y)
            data[pos] = r
            data[pos+1] = g
            data[pos+2] = b
        }
    }
    const total = performance.now() - start;

    console.log("BoxBlur:", total, "ms")
    ctx.putImageData(imageData, 0, 0);
};

// https://en.wikipedia.org/wiki/Gaussian_blur
const gaussian = () => {
    original()

    const RADIUS = 2;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const start = performance.now()
    for (let x = RADIUS; x < 800-RADIUS; x++) { // skip edges for now
        for (let y = RADIUS; y < 800-RADIUS; y++) { // skip edges for now
            
            const indices = []
            for (let xx = -RADIUS; xx <= RADIUS; xx++) {
                for (let yy = -RADIUS; yy <= RADIUS; yy++) {
                    indices.push(
                        {
                            pos: cartesianToFlat(x + xx, y + yy),
                            x: xx,
                            y: yy
                        }
                    )
                }    
            }

            const [r, g, b] = sumUint8ClampedArrayByIndexGauss(
                data, 
                ...indices
            )

            const pos = cartesianToFlat(x, y)
            data[pos] = r
            data[pos+1] = g
            data[pos+2] = b
        }
    }
    const total = performance.now() - start;

    console.log("Gaussian:", total, "ms")
    ctx.putImageData(imageData, 0, 0);

};

const original = () => {
    ctx.drawImage(img, 0, 0, 3772, 3772, 0, 0, 800, 800)
};